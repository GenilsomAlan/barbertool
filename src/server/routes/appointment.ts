import { Express, Request, Response } from "express";
import { authenticate, AuthRequest } from "../auth.ts";
import { db } from "../db.ts";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { createNotification } from "./notification.ts";

const appointmentSchema = z.object({
  serviceId: z.string().uuid(),
  userId: z.string().uuid().optional(),
  customerName: z.string().min(2),
  customerPhone: z.string().min(8),
  date: z.string(), // ISO string
});

export function setupAppointmentRoutes(app: Express) {
  // List appointments for the current barbershop
  app.get("/api/appointments", authenticate, async (req: AuthRequest, res: Response) => {
    try {
      const { start, end } = req.query;
      const barbershopId = req.user?.barbershopId!;
      
      let queryRef: any = db.collection("barbershops")
        .doc(barbershopId)
        .collection("appointments");

      if (start && end) {
        queryRef = queryRef.where("date", ">=", start).where("date", "<=", end);
      }

      const snapshot = await queryRef.orderBy("date", "asc").get();
      const appointments = snapshot.docs.map(doc => doc.data());

      // Pre-fetch services to ensure price is populated for legacy entries in reports and frontend UI
      const servicesSnapshot = await db.collection("barbershops")
        .doc(barbershopId)
        .collection("services")
        .get();
      const servicesMap = new Map();
      servicesSnapshot.docs.forEach(doc => {
        servicesMap.set(doc.id, doc.data());
      });

      const updatedAppointments = appointments.map(appt => {
        const matchingService = servicesMap.get(appt.serviceId);
        const resolvedPrice = appt.price !== undefined ? appt.price : (appt.servicePrice !== undefined ? appt.servicePrice : (matchingService?.price || 0));
        return {
          ...appt,
          price: resolvedPrice,
          servicePrice: resolvedPrice
        };
      });
      
      res.json(updatedAppointments);
    } catch (err) {
      console.error("Error listing appointments:", err);
      res.status(500).json({ error: "Failed to list appointments" });
    }
  });

  // Create appointment
  app.post("/api/appointments", authenticate, async (req: AuthRequest, res: Response) => {
    try {
      const { serviceId, userId, customerName, customerPhone, date } = appointmentSchema.parse(req.body);
      const id = uuidv4();
      const barberId = userId || req.user?.id;
      const barbershopId = req.user?.barbershopId!;

      const shopDoc = await db.collection("barbershops").doc(barbershopId).get();
      if (!shopDoc.exists) {
        return res.status(404).json({ error: "Barbearia não encontrada." });
      }
      const shop = shopDoc.data();

      // Get service details
      const serviceDoc = await db.collection("barbershops").doc(barbershopId).collection("services").doc(serviceId).get();
      if (!serviceDoc.exists) {
        return res.status(400).json({ error: "Serviço não encontrado." });
      }
      const service = serviceDoc.data();
      
      const schedulingType = shop?.schedulingType || 'fixed';
      const duration = schedulingType === 'dynamic' ? (Number(service?.duration) || 30) : (Number(shop?.slotDuration) || 30);

      // Conflict check (Overlap) in JS
      const startDateTime = new Date(date).getTime();
      const endDateTime = startDateTime + (duration * 60 * 1000);

      // We fetch appointments for that day to check conflicts
      const dayStart = new Date(date);
      dayStart.setHours(0,0,0,0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23,59,59,999);

      const conflictsSnapshot = await db.collection("barbershops")
        .doc(barbershopId)
        .collection("appointments")
        .where("userId", "==", barberId)
        .where("status", "!=", "cancelled")
        .where("date", ">=", dayStart.toISOString())
        .where("date", "<=", dayEnd.toISOString())
        .get();

      const hasConflict = conflictsSnapshot.docs.some(doc => {
        const appt = doc.data();
        const apptStart = new Date(appt.date).getTime();
        const apptEnd = apptStart + ((appt.duration || 30) * 60 * 1000);
        
        // Overlap: start1 < end2 AND start2 < end1
        return startDateTime < apptEnd && apptStart < endDateTime;
      });

      if (hasConflict) {
        return res.status(409).json({ error: "Este horário já está ocupado ou conflita com outro agendamento." });
      }

      // Get barber name
      const barberDoc = await db.collection("users").doc(barberId!).get();
      const barberName = barberDoc.exists ? barberDoc.data()?.name : "Professional";

      // Create appointment
      const appointmentData = {
        id,
        barbershopId,
        userId: barberId,
        serviceId,
        serviceName: service?.name,
        servicePrice: service?.price || 0,
        price: service?.price || 0,
        barberName,
        customerName,
        customerPhone,
        date,
        duration,
        status: "confirmed",
        createdAt: new Date().toISOString()
      };

      await db.collection("barbershops")
        .doc(barbershopId)
        .collection("appointments")
        .doc(id)
        .set(appointmentData);

      // Upsert customer (Manual)
      const customersRef = db.collection("barbershops").doc(barbershopId).collection("customers");
      const customerSnapshot = await customersRef.where("phone", "==", customerPhone).get();

      if (!customerSnapshot.empty) {
        const cDoc = customerSnapshot.docs[0];
        const cData = cDoc.data();
        await cDoc.ref.update({
          name: customerName,
          lastVisit: date,
          appointmentsCount: (cData.appointmentsCount || 0) + 1,
          totalSpent: (cData.totalSpent || 0) + (service?.price || 0)
        });
      } else {
        const customerId = uuidv4();
        await customersRef.doc(customerId).set({
          id: customerId,
          barbershopId,
          name: customerName,
          phone: customerPhone,
          lastVisit: date,
          appointmentsCount: 1,
          totalSpent: service?.price || 0,
          createdAt: new Date().toISOString()
        });
      }

      // Create Notification
      createNotification(
        barbershopId,
        "Agendamento Interno",
        `${customerName} foi agendado para ${new Date(date).toLocaleString('pt-BR')}`,
        "appointment_new"
      );

      res.status(201).json({ id, status: 'confirmed' });
    } catch (err: any) {
      console.error(err);
      res.status(400).json({ error: err.message || "Failed to create appointment" });
    }
  });

  // Update status
  app.patch("/api/appointments/:id/status", authenticate, async (req: AuthRequest, res: Response) => {
    try {
      const { status } = req.body;
      const barbershopId = req.user?.barbershopId!;
      
      if (!['pending', 'confirmed', 'completed', 'cancelled'].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }

      const appointmentRef = db.collection("barbershops")
        .doc(barbershopId)
        .collection("appointments")
        .doc(req.params.id);

      const apptDoc = await appointmentRef.get();
      if (!apptDoc.exists) {
        return res.status(404).json({ error: "Appointment not found" });
      }

      await appointmentRef.update({ status });

      if (status === 'cancelled') {
        const appt = apptDoc.data();
        createNotification(
          barbershopId,
          "Agendamento Cancelado",
          `${appt?.customerName} - ${new Date(appt?.date).toLocaleString('pt-BR')}`,
          "appointment_cancelled"
        );
      }

      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to update status" });
    }
  });

  // Update appointment details (Date/Time/Service and Customer)
  app.patch("/api/appointments/:id", authenticate, async (req: AuthRequest, res: Response) => {
    try {
      const { date, serviceId, customerName, customerPhone } = req.body;
      const barbershopId = req.user?.barbershopId!;

      if (!date && !serviceId && !customerName && !customerPhone) {
        return res.status(400).json({ error: "No fields to update provided." });
      }

      const appointmentRef = db.collection("barbershops")
        .doc(barbershopId)
        .collection("appointments")
        .doc(req.params.id);

      const apptDoc = await appointmentRef.get();
      if (!apptDoc.exists) {
        return res.status(404).json({ error: "Appointment not found" });
      }
      const appt = apptDoc.data();

      const targetDate = date || appt?.date;
      const targetServiceId = serviceId || appt?.serviceId;
      
      const shopDoc = await db.collection("barbershops").doc(barbershopId).get();
      const shop = shopDoc.exists ? shopDoc.data() : null;

      // Get service details for duration
      const serviceDoc = await db.collection("barbershops").doc(barbershopId).collection("services").doc(targetServiceId).get();
      if (!serviceDoc.exists) {
        return res.status(400).json({ error: "Serviço não encontrado." });
      }
      const service = serviceDoc.data();
      
      const schedulingType = shop?.schedulingType || 'fixed';
      const duration = schedulingType === 'dynamic' ? (Number(service?.duration) || 30) : (Number(shop?.slotDuration) || 30);

      // Conflict check
      const startDateTime = new Date(targetDate).getTime();
      const endDateTime = startDateTime + (duration * 60 * 1000);

      const dayStart = new Date(targetDate);
      dayStart.setHours(0,0,0,0);
      const dayEnd = new Date(targetDate);
      dayEnd.setHours(23,59,59,999);

      const conflictsSnapshot = await db.collection("barbershops")
        .doc(barbershopId)
        .collection("appointments")
        .where("userId", "==", appt?.userId)
        .where("status", "!=", "cancelled")
        .where("date", ">=", dayStart.toISOString())
        .where("date", "<=", dayEnd.toISOString())
        .get();

      const hasConflict = conflictsSnapshot.docs.some(doc => {
        if (doc.id === req.params.id) return false;
        const a = doc.data();
        const apptStart = new Date(a.date).getTime();
        const apptEnd = apptStart + ((a.duration || 30) * 60 * 1000);
        return startDateTime < apptEnd && apptStart < endDateTime;
      });

      if (hasConflict) {
        return res.status(409).json({ error: "Este horário conflita com outro agendamento já existente." });
      }

      const updateData: any = {
        date: targetDate,
        serviceId: targetServiceId,
        serviceName: service?.name,
        duration: duration
      };

      if (customerName) {
        updateData.customerName = customerName;
      }
      if (customerPhone) {
        updateData.customerPhone = customerPhone;
      }

      await appointmentRef.update(updateData);

      // Handle customer subcollection updates
      if (customerName || customerPhone) {
        const customersRef = db.collection("barbershops").doc(barbershopId).collection("customers");
        const oldPhone = appt?.customerPhone;
        
        if (oldPhone) {
          const customerSnapshot = await customersRef.where("phone", "==", oldPhone).get();
          if (!customerSnapshot.empty) {
            const cDoc = customerSnapshot.docs[0];
            const updateCustomerData: any = {};
            if (customerName) updateCustomerData.name = customerName;
            if (customerPhone) updateCustomerData.phone = customerPhone;
            await cDoc.ref.update(updateCustomerData);
          } else if (customerPhone) {
            const newPhoneSnapshot = await customersRef.where("phone", "==", customerPhone).get();
            if (newPhoneSnapshot.empty) {
              const customerId = uuidv4();
              await customersRef.doc(customerId).set({
                id: customerId,
                barbershopId,
                name: customerName || appt?.customerName || "",
                phone: customerPhone,
                lastVisit: targetDate,
                appointmentsCount: 1,
                totalSpent: service?.price || appt?.price || 0,
                createdAt: new Date().toISOString()
              });
            } else {
              const cDoc = newPhoneSnapshot.docs[0];
              const updateCustomerData: any = {};
              if (customerName) updateCustomerData.name = customerName;
              await cDoc.ref.update(updateCustomerData);
            }
          }
        }
      }

      if (date && date !== appt?.date) {
        createNotification(
          barbershopId,
          "Agendamento Reagendado",
          `${appt?.customerName} - De ${new Date(appt?.date).toLocaleString('pt-BR')} para ${new Date(date).toLocaleString('pt-BR')}`,
          "appointment_updated"
        );
      }

      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to update appointment" });
    }
  });

  // Delete cancelled appointment
  app.delete("/api/appointments/:id", authenticate, async (req: AuthRequest, res: Response) => {
    try {
      const barbershopId = req.user?.barbershopId!;
      const appointmentRef = db.collection("barbershops")
        .doc(barbershopId)
        .collection("appointments")
        .doc(req.params.id);

      const apptDoc = await appointmentRef.get();
      if (!apptDoc.exists) {
        return res.status(404).json({ error: "Agendamento não encontrado." });
      }

      const appt = apptDoc.data();
      if (appt?.status !== "cancelled") {
        return res.status(400).json({ error: "Apenas agendamentos cancelados podem ser excluídos." });
      }

      await appointmentRef.delete();
      res.json({ success: true });
    } catch (err) {
      console.error("Error deleting appointment:", err);
      res.status(500).json({ error: "Erro ao excluir agendamento." });
    }
  });
}


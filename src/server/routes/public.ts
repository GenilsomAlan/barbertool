import { Express, Request, Response } from "express";
import { db } from "../db.ts";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { createNotification } from "./notification.ts";

const createPublicAppointmentSchema = z.object({
  serviceId: z.string().uuid(),
  customerName: z.string().min(2),
  customerPhone: z.string().min(8),
  date: z.string(), // ISO string
});

function generateSlots(openTime: string, closeTime: string, slotDuration: number, lunchStartTime?: string, lunchEndTime?: string) {
  const [openH, openM] = openTime.split(":").map(Number);
  const [closeH, closeM] = closeTime.split(":").map(Number);
  
  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;

  let lunchStartMin = -1;
  let lunchEndMin = -1;

  if (lunchStartTime && lunchEndTime) {
    const [lsH, lsM] = lunchStartTime.split(":").map(Number);
    const [leH, leM] = lunchEndTime.split(":").map(Number);
    lunchStartMin = lsH * 60 + lsM;
    lunchEndMin = leH * 60 + leM;
  }
  
  const slots: string[] = [];
  let current = openMinutes;
  
  while (current + slotDuration <= closeMinutes) {
    // Skip if slot starts during lunch OR if lunch starts during slot
    const isDuringLunch = lunchStartMin !== -1 && (
        (current >= lunchStartMin && current < lunchEndMin) || // Starts during lunch
        (current + slotDuration > lunchStartMin && current + slotDuration <= lunchEndMin) || // Ends during lunch
        (current < lunchStartMin && current + slotDuration > lunchEndMin) // Spans across lunch
    );

    if (!isDuringLunch) {
      const h = Math.floor(current / 60);
      const m = current % 60;
      slots.push(`${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`);
    }
    current += slotDuration;
  }
  
  return slots;
}

export function setupPublicRoutes(app: Express) {
  app.get("/api/public/barber/:bookingToken", async (req: Request, res: Response) => {
    try {
      const { bookingToken } = req.params;
      
      const usersRef = db.collection("users");
      const userSnapshot = await usersRef.where("bookingToken", "==", bookingToken).get();
      
      if (userSnapshot.empty) {
        return res.status(404).json({ error: "Profissional não encontrado ou link inválido" });
      }

      const user = userSnapshot.docs[0].data();
      
      if (!user.barbershopId) {
        console.error(`User ${user.id} found by token ${bookingToken} but has no barbershopId`);
        return res.status(404).json({ error: "Configuração da barbearia incompleta. Contate o suporte." });
      }

      const shopDoc = await db.collection("barbershops").doc(user.barbershopId).get();
      if (!shopDoc.exists) {
        console.error(`Barbershop ${user.barbershopId} not found for user ${user.id}`);
        return res.status(404).json({ error: "Barbearia não encontrada ou desativada" });
      }
      const barbershop = shopDoc.data();

      if (barbershop?.subscriptionStatus === 'free_restricted') {
        return res.status(403).json({ error: "Agendamentos online desativados para esta barbearia por falta de pagamento." });
      }
      
      const servicesSnapshot = await db.collection("barbershops")
        .doc(user.barbershopId)
        .collection("services")
        .orderBy("name", "asc")
        .get();
      
      const services = servicesSnapshot.docs.map(doc => doc.data());
      
      // Merge for frontend
      const barber = {
        ...user,
        barbershopId: user.barbershopId,
        barbershopName: barbershop?.name,
        slug: barbershop?.slug,
        address: barbershop?.address,
        description: barbershop?.description,
        openTime: barbershop?.openTime,
        closeTime: barbershop?.closeTime,
        slotDuration: barbershop?.slotDuration,
        lunchStartTime: barbershop?.lunchStartTime,
        lunchEndTime: barbershop?.lunchEndTime,
        workingDays: barbershop?.workingDays,
        primaryColor: barbershop?.primaryColor,
        secondaryColor: barbershop?.secondaryColor,
        logoUrl: barbershop?.logoUrl,
        instagram: barbershop?.instagram,
        tiktok: barbershop?.tiktok,
        facebook: barbershop?.facebook,
        subscriptionStatus: barbershop?.subscriptionStatus
      };

      res.json({ barber, services });
    } catch (err) {
      console.error("Public barber fetch error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/public/barber/:bookingToken/slots", async (req: Request, res: Response) => {
    try {
      const { bookingToken } = req.params;
      const { date, serviceId } = req.query;
      
      if (!date || !serviceId) {
        return res.status(400).json({ error: "Missing date or serviceId" });
      }
      
      const userSnapshot = await db.collection("users").where("bookingToken", "==", bookingToken).get();
      if (userSnapshot.empty) {
        return res.status(404).json({ error: "Profissional não encontrado ou link inválido" });
      }
      const barber = userSnapshot.docs[0].data();

      if (!barber.barbershopId) {
        return res.status(404).json({ error: "Barbearia não configurada para este profissional" });
      }
      const shopDoc = await db.collection("barbershops").doc(barber.barbershopId).get();
      if (!shopDoc.exists) {
        return res.status(404).json({ error: "Barbearia não encontrada" });
      }
      const shop = shopDoc.data();
      
      // Check if it's a working day
      const dayOfWeek = new Date(date as string).getDay();
      const workingDays = (shop?.workingDays || '1,2,3,4,5,6').split(',').map(Number);
      if (!workingDays.includes(dayOfWeek)) {
        return res.json({ slots: [], closed: true });
      }
      
      const serviceDoc = await db.collection("barbershops")
        .doc(barber.barbershopId)
        .collection("services")
        .doc(serviceId as string)
        .get();

      if (!serviceDoc.exists) {
        return res.status(404).json({ error: "Service not found" });
      }
      const service = serviceDoc.data();
      const schedulingType = shop?.schedulingType || 'fixed';
      const serviceDuration = Number(service?.duration) || 30;
      const shopSlotDuration = Number(shop?.slotDuration) || 30;
      const effectiveDuration = schedulingType === 'dynamic' ? serviceDuration : shopSlotDuration;
      
      const allSlots = generateSlots(
        shop?.openTime || '08:00', 
        shop?.closeTime || '18:00', 
        shopSlotDuration, 
        shop?.lunchStartTime, 
        shop?.lunchEndTime
      );
      
      // Get appointments for the day
      const dateStr = date as string;
      const dayStart = `${dateStr}T00:00:00`;
      const dayEnd = `${dateStr}T23:59:59`;
      
      const appointmentsSnapshot = await db.collection("barbershops")
        .doc(barber.barbershopId)
        .collection("appointments")
        .where("userId", "==", barber.id)
        .where("status", "!=", "cancelled")
        .where("date", ">=", dayStart)
        .where("date", "<=", dayEnd)
        .get();

      const appointments = appointmentsSnapshot.docs.map(doc => doc.data());
      
      const occupiedMinutes = new Set<number>();
      for (const appt of appointments) {
        const normalizedDate = (appt.date || "").endsWith('Z') ? appt.date.slice(0, -1) : appt.date;
        const apptDate = new Date(normalizedDate);
        const start = apptDate.getHours() * 60 + apptDate.getMinutes();
        const duration = appt.duration || 30;
        for (let i = 0; i < duration; i++) {
          occupiedMinutes.add(start + i);
        }
      }
      
      const now = new Date();
      const isToday = dateStr === now.toISOString().split("T")[0];
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      
      const availableSlots = allSlots.filter(slot => {
        const [h, m] = slot.split(":").map(Number);
        const slotMinutes = h * 60 + m;
        
        if (isToday && slotMinutes <= currentMinutes) return false;
        
        for (let i = 0; i < effectiveDuration; i++) {
          if (occupiedMinutes.has(slotMinutes + i)) return false;
        }
        
        const [closeH, closeM] = (shop?.closeTime || '18:00').split(":").map(Number);
        const closeMinutes = closeH * 60 + closeM;
        if (slotMinutes + effectiveDuration > closeMinutes) return false;
        
        return true;
      });
      
      res.json({ slots: availableSlots, slotDuration: shop?.slotDuration || 30 });
    } catch (err) {
      console.error("Slots fetch error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/public/barber/:bookingToken/appointments", async (req: Request, res: Response) => {
    try {
      const { bookingToken } = req.params;
      const { serviceId, customerName, customerPhone, date } = createPublicAppointmentSchema.parse(req.body);
      
      const usersRef = db.collection("users");
      const userSnapshot = await usersRef.where("bookingToken", "==", bookingToken).get();
      
      if (userSnapshot.empty) {
        return res.status(404).json({ error: "Profissional não encontrado ou link inválido" });
      }
      const barber = userSnapshot.docs[0].data();

      if (!barber.barbershopId) {
        return res.status(404).json({ error: "Barbearia não configurada para este profissional" });
      }
      const shopDoc = await db.collection("barbershops").doc(barber.barbershopId).get();
      if (!shopDoc.exists) {
        return res.status(404).json({ error: "Barbearia não encontrada" });
      }
      const shop = shopDoc.data();

      if (shop?.subscriptionStatus === 'free_restricted') {
        return res.status(403).json({ error: "Agendamentos online desativados para esta barbearia por falta de pagamento." });
      }
      
      const serviceDoc = await db.collection("barbershops")
        .doc(barber.barbershopId)
        .collection("services")
        .doc(serviceId)
        .get();

      if (!serviceDoc.exists) {
        return res.status(400).json({ error: "Service not found" });
      }
      const service = serviceDoc.data();
      const schedulingType = shop?.schedulingType || 'fixed';
      const serviceDuration = Number(service?.duration) || 30;
      const shopSlotDuration = Number(shop?.slotDuration) || 30;
      const effectiveDuration = schedulingType === 'dynamic' ? serviceDuration : shopSlotDuration;
      
      const appointmentId = uuidv4();
      
      // Conflict check (Simplified Overlap check in JS)
      const startDateTime = new Date(date).getTime();
      const endDateTime = startDateTime + (effectiveDuration * 60 * 1000);
      
      const dayStart = new Date(date);
      dayStart.setHours(0,0,0,0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23,59,59,999);

      const conflictsSnapshot = await db.collection("barbershops")
        .doc(barber.barbershopId)
        .collection("appointments")
        .where("userId", "==", barber.id)
        .where("status", "!=", "cancelled")
        .where("date", ">=", dayStart.toISOString())
        .where("date", "<=", dayEnd.toISOString())
        .get();

      const hasConflict = conflictsSnapshot.docs.some(doc => {
        const appt = doc.data();
        const apptStart = new Date(appt.date).getTime();
        const apptEnd = apptStart + ((appt.duration || 30) * 60 * 1000);
        return startDateTime < apptEnd && apptStart < endDateTime;
      });

      if (hasConflict) {
        return res.status(409).json({ error: "Horário já ocupado ou em conflito com outro agendamento" });
      }
      
      const appointmentData = {
        id: appointmentId,
        barbershopId: barber.barbershopId,
        userId: barber.id,
        barberName: barber.name,
        serviceId,
        serviceName: service?.name,
        customerName,
        customerPhone,
        date,
        duration: effectiveDuration,
        status: "confirmed",
        createdAt: new Date().toISOString()
      };

      await db.collection("barbershops")
        .doc(barber.barbershopId)
        .collection("appointments")
        .doc(appointmentId)
        .set(appointmentData);

      // Upsert Customer
      const customersRef = db.collection("barbershops").doc(barber.barbershopId).collection("customers");
      const customerSnapshot = await customersRef.where("phone", "==", customerPhone).get();

      if (!customerSnapshot.empty) {
        const cDoc = customerSnapshot.docs[0];
        const cData = cDoc.data();
        await cDoc.ref.update({
          appointmentsCount: (cData.appointmentsCount || 0) + 1,
          totalSpent: (cData.totalSpent || 0) + (service?.price || 0),
          lastVisit: date
        });
      } else {
        const cId = uuidv4();
        await customersRef.doc(cId).set({
          id: cId,
          barbershopId: barber.barbershopId,
          name: customerName,
          phone: customerPhone,
          appointmentsCount: 1,
          totalSpent: service?.price || 0,
          lastVisit: date,
          createdAt: new Date().toISOString()
        });
      }

      // Create Notification
      createNotification(
        barber.barbershopId,
        "Novo Agendamento Online",
        `${customerName} agendou ${service?.name} para ${new Date(date).toLocaleString('pt-BR')}`,
        "appointment_new"
      );
      
      // WhatsApp links
      const cleanPhoneUrl = (p: string) => {
        const cleaned = p.replace(/\D/g, "");
        if (cleaned.length >= 10 && cleaned.length <= 11) return `55${cleaned}`;
        return cleaned;
      };

      const formattedDate = new Date(date).toLocaleString("pt-BR", { 
        day: "2-digit", month: "2-digit", year: "numeric", 
        hour: "2-digit", minute: "2-digit" 
      });
      const formattedPrice = (service?.price || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
      
      const msgClient = `Olá ${barber.name}, acabei de agendar um serviço na ${shop?.name}!\n\nServiço: ${service?.name}\nData: ${formattedDate}\nValor: ${formattedPrice}`;
      const msgBarber = `Novo agendamento!\n\nCliente: ${customerName}\nTelefone: ${customerPhone}\nServiço: ${service?.name}\nData: ${formattedDate}\nValor: ${formattedPrice}`;
      
      const barberWaPhone = cleanPhoneUrl(barber.phone || shop?.phone || "");
      const waClient = `https://wa.me/${barberWaPhone}?text=${encodeURIComponent(msgClient)}`;
      const waBarber = (barber.phone || shop?.phone) ? `https://wa.me/${barberWaPhone}?text=${encodeURIComponent(msgBarber)}` : null;
      
      res.status(201).json({ 
        id: appointmentId, 
        status: "confirmed",
        whatsapp: { client: waClient, barber: waBarber }
      });
      
    } catch (err: any) {
      console.error(err);
      res.status(400).json({ error: err.errors || err.message || "Failed to create appointment" });
    }
  });
}


import { Express, Request, Response } from "express";
import { authenticate, AuthRequest } from "../auth.ts";
import { db } from "../db.ts";

export function setupCustomerRoutes(app: Express) {
  // List all customers for the current barbershop
  app.get("/api/customers", authenticate, async (req: AuthRequest, res: Response) => {
    try {
      const customersSnapshot = await db.collection("barbershops")
        .doc(req.user?.barbershopId!)
        .collection("customers")
        .orderBy("lastVisit", "desc")
        .get();
      
      const customers = customersSnapshot.docs.map(doc => doc.data());
      res.json(customers);
    } catch (err) {
      console.error("Error listing customers:", err);
      res.status(500).json({ error: "Failed to list customers" });
    }
  });

  // Get specific customer history
  app.get("/api/customers/:id/history", authenticate, async (req: AuthRequest, res: Response) => {
    try {
      const barbershopId = req.user?.barbershopId!;
      const customerDoc = await db.collection("barbershops")
        .doc(barbershopId)
        .collection("customers")
        .doc(req.params.id)
        .get();

      if (!customerDoc.exists) return res.status(404).json({ error: "Customer not found" });
      const customer = customerDoc.data();

      // Manual JOIN for history
      const historySnapshot = await db.collection("barbershops")
        .doc(barbershopId)
        .collection("appointments")
        .where("customerPhone", "==", customer?.phone)
        .orderBy("date", "desc")
        .get();

      const history = historySnapshot.docs.map(doc => doc.data());

      res.json({ customer, history });
    } catch (err) {
      console.error("Error fetching history:", err);
      res.status(500).json({ error: "Failed to fetch customer history" });
    }
  });

  // Update customer
  app.patch("/api/customers/:id", authenticate, async (req: AuthRequest, res: Response) => {
    const { name, phone, email } = req.body;
    const barbershopId = req.user?.barbershopId!;

    try {
      const customerRef = db.collection("barbershops")
        .doc(barbershopId)
        .collection("customers")
        .doc(req.params.id);
      
      const customerDoc = await customerRef.get();
      if (!customerDoc.exists) {
        return res.status(404).json({ error: "Customer not found" });
      }

      const customer = customerDoc.data();
      const oldPhone = customer?.phone;

      // Update data
      const updateData: any = {};
      if (name) updateData.name = name;
      if (phone) updateData.phone = phone;
      if (email !== undefined) updateData.email = email || null;

      await customerRef.update(updateData);

      // If phone changed, update appointments to maintain history link (Manual Batch Update)
      if (phone && phone !== oldPhone) {
        const appointmentsSnapshot = await db.collection("barbershops")
          .doc(barbershopId)
          .collection("appointments")
          .where("customerPhone", "==", oldPhone)
          .get();

        const batch = db.batch();
        appointmentsSnapshot.docs.forEach(doc => {
          batch.update(doc.ref, { customerPhone: phone });
        });
        await batch.commit();
      }

      res.json({ success: true });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: "Failed to update customer" });
    }
  });

  // Delete customer
  app.delete("/api/customers/:id", authenticate, async (req: AuthRequest, res: Response) => {
    try {
      const barbershopId = req.user?.barbershopId!;
      const customerRef = db.collection("barbershops")
        .doc(barbershopId)
        .collection("customers")
        .doc(req.params.id);

      const customerDoc = await customerRef.get();
      if (!customerDoc.exists) {
        return res.status(404).json({ error: "Cliente não encontrado." });
      }

      await customerRef.delete();
      res.json({ success: true });
    } catch (err) {
      console.error("Error deleting customer:", err);
      res.status(500).json({ error: "Erro ao excluir cliente." });
    }
  });
}


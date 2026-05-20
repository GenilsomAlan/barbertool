import { Express, Request, Response } from "express";
import { authenticate, AuthRequest } from "../auth.ts";
import { db } from "../db.ts";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";

const serviceSchema = z.object({
  name: z.string().min(2),
  price: z.number().min(0),
  duration: z.number().min(1),
});

export function setupServiceRoutes(app: Express) {
  // List all services for the current barbershop
  app.get("/api/services", authenticate, async (req: AuthRequest, res: Response) => {
    try {
      const servicesSnapshot = await db.collection("barbershops")
        .doc(req.user?.barbershopId!)
        .collection("services")
        .orderBy("name", "asc")
        .get();
      
      const services = servicesSnapshot.docs.map(doc => doc.data());
      res.json(services);
    } catch (err) {
      console.error("Error listing services:", err);
      res.status(500).json({ error: "Failed to list services" });
    }
  });

  // Create a new service
  app.post("/api/services", authenticate, async (req: AuthRequest, res: Response) => {
    try {
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ error: "Only admins can manage services" });
      }

      const { name, price, duration } = serviceSchema.parse(req.body);
      const id = uuidv4();

      const serviceData = {
        id,
        barbershopId: req.user.barbershopId,
        name,
        price,
        duration,
        createdAt: new Date().toISOString()
      };

      await db.collection("barbershops")
        .doc(req.user.barbershopId)
        .collection("services")
        .doc(id)
        .set(serviceData);

      res.status(201).json(serviceData);
    } catch (err: any) {
      res.status(400).json({ error: err.errors || "Failed to create service" });
    }
  });

  // Delete a service
  app.delete("/api/services/:id", authenticate, async (req: AuthRequest, res: Response) => {
    try {
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ error: "Only admins can manage services" });
      }

      await db.collection("barbershops")
        .doc(req.user?.barbershopId!)
        .collection("services")
        .doc(req.params.id)
        .delete();
      
      res.status(204).send();
    } catch (err) {
      console.error("Error deleting service:", err);
      res.status(500).json({ error: "Failed to delete service" });
    }
  });
}


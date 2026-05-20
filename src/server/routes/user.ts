import { Express, Response } from "express";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { db } from "../db.ts";
import { authenticate, AuthRequest } from "../auth.ts";
import { z } from "zod";

const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["admin", "barber"]),
  phone: z.string().optional(),
  avatarUrl: z.string().url().optional().or(z.literal("")),
});

const updatePasswordSchema = z.object({
  newPassword: z.string().min(6),
});

export function setupUserRoutes(app: Express) {
  app.get("/api/users", authenticate, async (req: AuthRequest, res: Response) => {
    try {
      const usersSnapshot = await db.collection("users")
        .where("barbershopId", "==", req.user?.barbershopId)
        .orderBy("createdAt", "desc")
        .get();
      
      const users = await Promise.all(usersSnapshot.docs.map(async doc => {
        const data = doc.data();
        if (!data.bookingToken) {
          data.bookingToken = uuidv4();
          await doc.ref.update({ bookingToken: data.bookingToken });
        }
        delete data.passwordHash;
        return data;
      }));
      res.json(users);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.post("/api/users", authenticate, async (req: AuthRequest, res: Response) => {
    try {
      if (req.user?.role !== "admin") {
        return res.status(403).json({ error: "Only admins can manage users" });
      }

      const { name, email, password, role, phone, avatarUrl } = createUserSchema.parse(req.body);

      const existingSnapshot = await db.collection("users").where("email", "==", email).get();
      if (!existingSnapshot.empty) {
        return res.status(400).json({ error: "Email already in use" });
      }

      const id = uuidv4();
      const bookingToken = uuidv4();
      const passwordHash = await bcrypt.hash(password, 10);

      const userData = {
        id,
        barbershopId: req.user?.barbershopId,
        name,
        email,
        passwordHash,
        role,
        phone: phone || null,
        bookingToken,
        avatarUrl: avatarUrl || null,
        createdAt: new Date().toISOString()
      };

      await db.collection("users").doc(id).set(userData);

      const result = { ...userData };
      delete result.passwordHash;
      res.status(201).json(result);
    } catch (err: any) {
      console.error(err);
      res.status(400).json({ error: err.errors || "Failed to create user" });
    }
  });

  app.delete("/api/users/:id", authenticate, async (req: AuthRequest, res: Response) => {
    try {
      if (req.user?.role !== "admin") {
        return res.status(403).json({ error: "Only admins can manage users" });
      }

      const { id } = req.params;

      if (id === req.user?.id) {
        return res.status(400).json({ error: "You cannot delete your own account" });
      }

      const userRef = db.collection("users").doc(id);
      const userDoc = await userRef.get();
      
      if (!userDoc.exists || userDoc.data()?.barbershopId !== req.user?.barbershopId) {
        return res.status(404).json({ error: "User not found" });
      }

      await userRef.delete();

      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  app.patch("/api/users/:id", authenticate, async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { avatarUrl, name, phone } = req.body;
      
      if (req.user?.role !== 'admin' && req.user?.id !== id) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const userRef = db.collection("users").doc(id);
      const userDoc = await userRef.get();
      if (!userDoc.exists || userDoc.data()?.barbershopId !== req.user?.barbershopId) {
        return res.status(404).json({ error: "User not found" });
      }

      const updateData: any = {};
      if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl || null;
      if (name !== undefined) updateData.name = name;
      if (phone !== undefined) updateData.phone = phone || null;

      await userRef.update(updateData);

      const updatedDoc = await userRef.get();
      const updated = updatedDoc.data();
      delete updated?.passwordHash;
      res.json(updated);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  app.patch("/api/users/:id/password", authenticate, async (req: AuthRequest, res: Response) => {
    try {
      if (req.user?.role !== "admin") {
        return res.status(403).json({ error: "Only admins can change passwords" });
      }

      const { id } = req.params;
      const { newPassword } = updatePasswordSchema.parse(req.body);

      const userRef = db.collection("users").doc(id);
      const userDoc = await userRef.get();
      if (!userDoc.exists || userDoc.data()?.barbershopId !== req.user?.barbershopId) {
        return res.status(404).json({ error: "User not found" });
      }

      const passwordHash = await bcrypt.hash(newPassword, 10);
      await userRef.update({ passwordHash });

      res.json({ success: true });
    } catch (err: any) {
      console.error(err);
      res.status(400).json({ error: err.errors || "Failed to update password" });
    }
  });

  app.post("/api/users/:id/regenerate-token", authenticate, async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      
      if (req.user?.role !== 'admin' && req.user?.id !== id) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const bookingToken = uuidv4();
      const userRef = db.collection("users").doc(id);
      const userDoc = await userRef.get();
      if (!userDoc.exists || userDoc.data()?.barbershopId !== req.user?.barbershopId) {
        return res.status(404).json({ error: "User not found" });
      }

      await userRef.update({ bookingToken });

      res.json({ bookingToken });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to regenerate token" });
    }
  });
}


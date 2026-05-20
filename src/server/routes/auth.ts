import { Express, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { db, generateSlug } from "../db.ts";
import { signToken } from "../auth.ts";
import { z } from "zod";

const registerSchema = z.object({
  barbershopName: z.string().min(2),
  adminName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export function setupAuthRoutes(app: Express) {
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { barbershopName, adminName, email, password, phone } = registerSchema.parse(req.body);

      // Check if email already exists
      const usersRef = db.collection("users");
      const existingUserSnapshot = await usersRef.where("email", "==", email).get();
      if (!existingUserSnapshot.empty) {
        return res.status(400).json({ error: "Email already registered" });
      }

      const barbershopId = uuidv4();
      const userId = uuidv4();
      const bookingToken = uuidv4();
      const passwordHash = await bcrypt.hash(password, 10);
      
      let baseSlug = generateSlug(barbershopName);
      let finalSlug = baseSlug;
      let counter = 1;
      
      // Ensure unique slug (sequential check - in real app, indexes or different structures are better)
      const shopsRef = db.collection("barbershops");
      while (true) {
        const slugQuery = await shopsRef.where("slug", "==", finalSlug).get();
        if (slugQuery.empty) break;
        finalSlug = `${baseSlug}-${counter}`;
        counter++;
      }

      const now = new Date();
      const trialEndsAt = new Date();
      trialEndsAt.setDate(now.getDate() + 21);

      const barbershopData = {
        id: barbershopId,
        name: barbershopName,
        slug: finalSlug,
        phone: phone || null,
        email,
        subscriptionStatus: "trial",
        trialEndsAt: trialEndsAt.toISOString(),
        createdAt: now.toISOString(),
        primaryColor: "#000000",
        secondaryColor: "#ffffff"
      };

      const userData = {
        id: userId,
        barbershopId: barbershopId,
        name: adminName,
        email,
        passwordHash,
        role: "admin",
        bookingToken,
        createdAt: now.toISOString()
      };

      // Create in Firestore
      await shopsRef.doc(barbershopId).set(barbershopData);
      await usersRef.doc(userId).set(userData);

      const token = signToken({
        id: userId,
        email,
        role: "admin",
        barbershopId: barbershopId
      });

      res.status(201).json({
        token,
        user: { id: userId, name: adminName, email, role: "admin" },
        barbershop: { id: barbershopId, name: barbershopName, slug: finalSlug }
      });
    } catch (err: any) {
      console.error(err);
      res.status(400).json({ error: err.errors || "Failed to register" });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = loginSchema.parse(req.body);

      const usersRef = db.collection("users");
      const userSnapshot = await usersRef.where("email", "==", email).get();

      if (userSnapshot.empty) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const userDoc = userSnapshot.docs[0];
      const user = userDoc.data();

      if (!(await bcrypt.compare(password, user.passwordHash))) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Proactive Fix: generate bookingToken if missing
      if (!user.bookingToken) {
        user.bookingToken = uuidv4();
        await userDoc.ref.update({ bookingToken: user.bookingToken });
      }

      // Fetch barbershop info for the slug and name (Manual JOIN)
      const shopDoc = await db.collection("barbershops").doc(user.barbershopId).get();
      const shop = shopDoc.exists ? shopDoc.data() : { name: "Barbearia", slug: "" };

      const token = signToken({
        id: user.id,
        email: user.email,
        role: user.role,
        barbershopId: user.barbershopId
      });

      res.json({
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
        barbershop: { id: user.barbershopId, name: shop?.name, slug: shop?.slug }
      });
    } catch (err: any) {
      console.error("Login error full details:", JSON.stringify(err, Object.getOwnPropertyNames(err)));
      res.status(400).json({ error: "Invalid login attempt" });
    }
  });
}


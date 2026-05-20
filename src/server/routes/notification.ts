import { Express, Response } from "express";
import { authenticate, AuthRequest } from "../auth.ts";
import { db } from "../db.ts";
import { v4 as uuidv4 } from "uuid";

export function setupNotificationRoutes(app: Express) {
  // List notifications
  app.get("/api/notifications", authenticate, async (req: AuthRequest, res: Response) => {
    try {
      const snapshot = await db.collection("barbershops")
        .doc(req.user?.barbershopId!)
        .collection("notifications")
        .orderBy("createdAt", "desc")
        .limit(50)
        .get();
      
      const notifications = snapshot.docs.map(doc => doc.data());
      res.json(notifications);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  // Mark all as read
  app.post("/api/notifications/read-all", authenticate, async (req: AuthRequest, res: Response) => {
    try {
      const snapshot = await db.collection("barbershops")
        .doc(req.user?.barbershopId!)
        .collection("notifications")
        .where("isRead", "==", false)
        .get();

      const batch = db.batch();
      snapshot.docs.forEach(doc => {
        batch.update(doc.ref, { isRead: true });
      });
      await batch.commit();

      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to update notifications" });
    }
  });

  // Delete all notifications
  app.delete("/api/notifications/all", authenticate, async (req: AuthRequest, res: Response) => {
    try {
      const snapshot = await db.collection("barbershops")
        .doc(req.user?.barbershopId!)
        .collection("notifications")
        .get();

      const batch = db.batch();
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();

      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to delete notifications" });
    }
  });
}

export async function createNotification(barbershopId: string, title: string, message: string, type: string) {
  try {
    const id = uuidv4();
    await db.collection("barbershops")
      .doc(barbershopId)
      .collection("notifications")
      .doc(id)
      .set({
        id,
        barbershopId,
        title,
        message,
        type,
        isRead: false,
        createdAt: new Date().toISOString()
      });
  } catch (err) {
    console.error("Failed to create notification:", err);
  }
}


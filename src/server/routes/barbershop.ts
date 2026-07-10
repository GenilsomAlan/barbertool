import { Express, Response } from "express";
import { authenticate, AuthRequest } from "../auth.ts";
import { db } from "../db.ts";

const VALID_COUPONS: Record<string, number> = {
  "DESCONTO10": 10,
  "BARBER30": 30,
  "VIP50": 50,
  "FREE100": 100,
  "MESTRE20": 20,
  "FREEFV": 100,
};

export function setupBarbershopRoutes(app: Express) {
  app.get("/api/barbershop/me", authenticate, async (req: AuthRequest, res: Response) => {
    try {
      const doc = await db.collection("barbershops").doc(req.user?.barbershopId!).get();
      if (!doc.exists) {
        return res.status(404).json({ error: "Barbershop not found" });
      }
      res.json(doc.data());
    } catch (err) {
      console.error("Error fetching barbershop:", err);
      res.status(500).json({ error: "Error retrieving barbershop data" });
    }
  });

  app.patch("/api/barbershop", authenticate, async (req: AuthRequest, res: Response) => {
    const { name, address, description, phone, openTime, closeTime, slotDuration, lunchStartTime, lunchEndTime, workingDays, primaryColor, secondaryColor, logoUrl, instagram, tiktok, facebook, schedulingType, couponCode } = req.body;
    
    try {
      const barbershopRef = db.collection("barbershops").doc(req.user?.barbershopId!);
      
      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (address !== undefined) updateData.address = address;
      if (description !== undefined) updateData.description = description;
      if (phone !== undefined) updateData.phone = phone || null;
      if (openTime !== undefined) updateData.openTime = openTime || '08:00';
      if (closeTime !== undefined) updateData.closeTime = closeTime || '18:00';
      if (slotDuration !== undefined) updateData.slotDuration = Number(slotDuration) || 30;
      if (lunchStartTime !== undefined) updateData.lunchStartTime = lunchStartTime || null;
      if (lunchEndTime !== undefined) updateData.lunchEndTime = lunchEndTime || null;
      if (workingDays !== undefined) updateData.workingDays = workingDays || '1,2,3,4,5,6';
      if (primaryColor !== undefined) updateData.primaryColor = primaryColor || '#000000';
      if (secondaryColor !== undefined) updateData.secondaryColor = secondaryColor || '#ffffff';
      if (logoUrl !== undefined) updateData.logoUrl = logoUrl || null;
      if (instagram !== undefined) updateData.instagram = instagram || null;
      if (tiktok !== undefined) updateData.tiktok = tiktok || null;
      if (facebook !== undefined) updateData.facebook = facebook || null;
      if (schedulingType !== undefined) updateData.schedulingType = schedulingType || 'fixed';

      if (couponCode !== undefined) {
        if (couponCode === null || couponCode === "") {
          updateData.appliedCoupon = null;
          updateData.discountPercent = null;
        } else {
          const upperCode = couponCode.trim().toUpperCase();
          const couponDoc = await db.collection("coupons").doc(upperCode).get();
          if (couponDoc.exists) {
            updateData.appliedCoupon = upperCode;
            updateData.discountPercent = couponDoc.data()?.discountPercent;
          } else if (VALID_COUPONS[upperCode] !== undefined) {
            updateData.appliedCoupon = upperCode;
            updateData.discountPercent = VALID_COUPONS[upperCode];
          } else {
            return res.status(400).json({ error: "Cupom inválido ou expirado." });
          }

          if (upperCode === "FREEFV") {
            updateData.subscriptionStatus = "premium";
          }
        }
      }

      await barbershopRef.update(updateData);
      
      const updatedDoc = await barbershopRef.get();
      res.json(updatedDoc.data());
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to update barbershop" });
    }
  });
}


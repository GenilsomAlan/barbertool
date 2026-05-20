import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { db } from "./db.ts";

const getSecret = () => process.env.JWT_SECRET || "super-secret-key-change-me";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    barbershopId: string;
    subscriptionStatus?: string;
  };
}

export async function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, getSecret()) as any;
    
    // Verify barbershop still exists 
    const shopRef = db.collection("barbershops").doc(decoded.barbershopId);
    const shopDoc = await shopRef.get();
    if (!shopDoc.exists) {
      return res.status(401).json({ error: "Sessão inválida: Barbearia não encontrada" });
    }

    const barbershop = shopDoc.data();
    let currentStatus = barbershop?.subscriptionStatus;

    // Auto-update status if trial expired
    if (currentStatus === 'trial' && barbershop?.trialEndsAt) {
      const now = new Date();
      const trialEnd = new Date(barbershop.trialEndsAt);
      
      if (now > trialEnd) {
        await shopRef.update({ subscriptionStatus: 'free_restricted' });
        currentStatus = 'free_restricted';
      }
    }
    
    req.user = {
      ...decoded,
      subscriptionStatus: currentStatus
    };
    next();
  } catch (err: any) {
    console.error("JWT Verification failed:", err.message);
    res.status(401).json({ error: "Invalid token" });
  }
}


export function signToken(payload: any) {
  return jwt.sign(payload, getSecret(), { expiresIn: "7d" });
}

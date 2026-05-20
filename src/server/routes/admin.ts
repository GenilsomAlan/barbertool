import { Express, Request, Response } from "express";
import { db } from "../db.ts";

export function setupAdminRoutes(app: Express) {
  app.get("/api/admin/global-metrics", async (req: Request, res: Response) => {
    try {
      // In Firestore, global counts are expensive without counter documents.
      // For this app, we'll fetch them.
      const usersSnapshot = await db.collection("users").get();
      const totalUsers = usersSnapshot.size;
      const premiumUsers = usersSnapshot.docs.filter(d => d.data().plan === 'premium').length;
      
      const shopsSnapshot = await db.collection("barbershops").get();
      
      // Counting appointments and customers is harder because they are subcollections.
      // We'll skip complex global subcollection counting for now or use a simpler metric.
      
      res.json({
        total_usuarios: totalUsers,
        usuarios_premium: premiumUsers,
        usuarios_gratuitos: totalUsers - premiumUsers,
        media_clientes_por_usuario: "0.00", // Simplified
        agendamentos_diarios: 0,
        agendamentos_semanais: 0,
        agendamentos_mensais: 0
      });
    } catch (err) {
      console.error("Failed to fetch global metrics:", err);
      res.status(500).json({ error: "Erro ao buscar métricas globais" });
    }
  });
}


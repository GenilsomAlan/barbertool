import { Express, Request, Response } from "express";
import { db } from "../db.ts";

function authenticateAdmin(req: Request, res: Response, next: () => void) {
  const expectedKey = process.env.ADMIN_API_KEY || "barbertool_fallback_key_2026";
  let providedKey = "";
  
  // 1. Check X-API-Key header
  const headerApiKey = req.headers["x-api-key"];
  if (typeof headerApiKey === "string") {
    providedKey = headerApiKey;
  }
  
  // 2. Check Authorization: Bearer <key>
  const authHeader = req.headers.authorization;
  if (!providedKey && authHeader && authHeader.startsWith("Bearer ")) {
    providedKey = authHeader.substring(7);
  }
  
  // 3. Check query parameters (?api_key=... or ?key=...)
  if (!providedKey && req.query.api_key && typeof req.query.api_key === "string") {
    providedKey = req.query.api_key;
  }
  if (!providedKey && req.query.key && typeof req.query.key === "string") {
    providedKey = req.query.key;
  }

  if (!providedKey || providedKey !== expectedKey) {
    return res.status(401).json({
      error: "Acesso não autorizado. Chave de API inválida ou não fornecida. Passe-a no cabeçalho 'X-API-Key', 'Authorization: Bearer <key>' ou como parâmetro 'api_key' na URL."
    });
  }

  next();
}

export function setupAdminRoutes(app: Express) {
  app.get("/api/admin/global-metrics", authenticateAdmin, async (req: Request, res: Response) => {
    try {
      // Fetch users and barbershops
      const usersSnapshot = await db.collection("users").get();
      const shopsSnapshot = await db.collection("barbershops").get();

      const totalUsers = usersSnapshot.size;
      const shopsMap = new Map();
      shopsSnapshot.docs.forEach(doc => {
        shopsMap.set(doc.id, doc.data());
      });

      let freeUsers = 0;
      let trialUsers = 0;
      let premiumUsers = 0;

      usersSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const shop = shopsMap.get(data.barbershopId);
        if (!shop) {
          freeUsers++;
          return;
        }
        
        const status = shop.subscriptionStatus;
        if (status === "premium" || status === "active" || data.plan === "premium") {
          premiumUsers++;
        } else if (status === "trial") {
          trialUsers++;
        } else {
          freeUsers++;
        }
      });

      // Calculate time-based appointments and clients metrics
      let dailyAppointments = 0;
      let weeklyAppointments = 0;
      let monthlyAppointments = 0;
      let totalCustomers = 0;

      const now = new Date();
      
      const startOfToday = new Date(now);
      startOfToday.setHours(0, 0, 0, 0);

      const startOfWeek = new Date(now);
      // Let's set the start of the current week (Sunday)
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      startOfMonth.setHours(0, 0, 0, 0);

      try {
        // Try CollectionGroup approach (highly efficient if indexed)
        const appointmentsSnapshot = await db.collectionGroup("appointments").get();
        appointmentsSnapshot.docs.forEach(doc => {
          const appt = doc.data();
          if (!appt.date) return;
          const apptDate = new Date(appt.date);

          if (apptDate >= startOfToday) {
            dailyAppointments++;
          }
          if (apptDate >= startOfWeek) {
            weeklyAppointments++;
          }
          if (apptDate >= startOfMonth) {
            monthlyAppointments++;
          }
        });

        const customersSnapshot = await db.collectionGroup("customers").get();
        totalCustomers = customersSnapshot.size;
      } catch (cgErr) {
        console.warn("Collection Group query failed or unindexed, falling back to manual traversal:", cgErr);
        dailyAppointments = 0;
        weeklyAppointments = 0;
        monthlyAppointments = 0;
        totalCustomers = 0;

        // Fallback: traverse all barbershops to fetch subcollections
        for (const shopDoc of shopsSnapshot.docs) {
          const shopId = shopDoc.id;

          const apptsSnap = await db.collection("barbershops").doc(shopId).collection("appointments").get();
          apptsSnap.docs.forEach(doc => {
            const appt = doc.data();
            if (!appt.date) return;
            const apptDate = new Date(appt.date);

            if (apptDate >= startOfToday) {
              dailyAppointments++;
            }
            if (apptDate >= startOfWeek) {
              weeklyAppointments++;
            }
            if (apptDate >= startOfMonth) {
              monthlyAppointments++;
            }
          });

          const custsSnap = await db.collection("barbershops").doc(shopId).collection("customers").get();
          totalCustomers += custsSnap.size;
        }
      }

      const averageCustomersPerUser = totalUsers > 0 ? (totalCustomers / totalUsers).toFixed(2) : "0.00";

      res.json({
        total_usuarios: totalUsers,
        total_usuarios_plano_free: freeUsers,
        total_usuarios_teste_gratis: trialUsers,
        total_usuarios_plano_premium: premiumUsers,
        quantidade_agendamentos_diarios: dailyAppointments,
        agendamentos_semanais: weeklyAppointments,
        agendamentos_mensais: monthlyAppointments,
        media_clientes_por_usuario: parseFloat(averageCustomersPerUser)
      });
    } catch (err) {
      console.error("Failed to fetch global metrics:", err);
      res.status(500).json({ error: "Erro ao buscar métricas globais" });
    }
  });

  // 1. List Dynamic Coupons
  app.get("/api/admin/coupons", authenticateAdmin, async (req: Request, res: Response) => {
    try {
      const couponsSnapshot = await db.collection("coupons").get();
      const barbershopsSnapshot = await db.collection("barbershops").get();

      // Build a map of coupon usage counts
      const usageCounts: Record<string, number> = {};
      barbershopsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data && typeof data.appliedCoupon === "string" && data.appliedCoupon.trim()) {
          const couponCode = data.appliedCoupon.trim().toUpperCase();
          usageCounts[couponCode] = (usageCounts[couponCode] || 0) + 1;
        }
      });

      const coupons = couponsSnapshot.docs.map(doc => {
        const code = doc.id.toUpperCase();
        return {
          code,
          ...doc.data(),
          usageCount: usageCounts[code] || 0
        };
      });
      res.json({ coupons });
    } catch (err: any) {
      console.error("Failed to list coupons:", err);
      res.status(500).json({ error: "Erro ao listar cupons." });
    }
  });

  // 2. Create/Update Coupon
  app.post("/api/admin/coupons", authenticateAdmin, async (req: Request, res: Response) => {
    try {
      const { code, discountPercent } = req.body;

      if (!code || typeof code !== "string" || !code.trim()) {
        return res.status(400).json({ error: "O campo 'code' é obrigatório e deve ser uma string." });
      }

      if (discountPercent === undefined || typeof discountPercent !== "number" || discountPercent < 1 || discountPercent > 100) {
        return res.status(400).json({ error: "O campo 'discountPercent' é obrigatório e deve ser um número entre 1 e 100." });
      }

      const upperCode = code.trim().toUpperCase();
      const couponRef = db.collection("coupons").doc(upperCode);

      const couponData = {
        discountPercent,
        updatedAt: new Date().toISOString()
      };

      await couponRef.set(couponData, { merge: true });

      res.status(201).json({
        success: true,
        message: `Cupom ${upperCode} gravado/atualizado com sucesso.`,
        coupon: {
          code: upperCode,
          discountPercent
        }
      });
    } catch (err: any) {
      console.error("Failed to create/update coupon:", err);
      res.status(500).json({ error: "Erro interno ao criar ou atualizar o cupom." });
    }
  });

  // 3. Delete Coupon
  app.delete("/api/admin/coupons/:code", authenticateAdmin, async (req: Request, res: Response) => {
    try {
      const code = req.params.code.trim().toUpperCase();
      if (!code) {
        return res.status(400).json({ error: "O parâmetro 'code' é obrigatório." });
      }

      const couponRef = db.collection("coupons").doc(code);
      const couponDoc = await couponRef.get();

      if (!couponDoc.exists) {
        return res.status(404).json({ error: "Cupom não encontrado." });
      }

      await couponRef.delete();

      res.json({
        success: true,
        message: `Cupom ${code} excluído com sucesso.`
      });
    } catch (err: any) {
      console.error("Failed to delete coupon:", err);
      res.status(500).json({ error: "Erro interno ao excluir o cupom." });
    }
  });
}


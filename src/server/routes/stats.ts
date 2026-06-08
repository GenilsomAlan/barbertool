import { Express, Response } from "express";
import { authenticate, AuthRequest } from "../auth.ts";
import { db } from "../db.ts";

export function setupStatsRoutes(app: Express) {
  app.get("/api/stats", authenticate, async (req: AuthRequest, res: Response) => {
    try {
      const barbershopId = req.user?.barbershopId!;
      const subscriptionStatus = req.user?.subscriptionStatus;
      
      if (subscriptionStatus === 'free_restricted') {
        return res.status(403).json({ error: "Funcionalidade disponível apenas no plano Premium." });
      }

      const dateQuery = (req.query.date as string) || new Date().toISOString().split('T')[0];
      const today = new Date(dateQuery);
      today.setHours(0,0,0,0);
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);

      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      const yesterdayStart = new Date(yesterday);
      yesterdayStart.setHours(0,0,0,0);

      // Fetch appointments for today and yesterday (Simplified)
      const apptsSnapshot = await db.collection("barbershops")
        .doc(barbershopId)
        .collection("appointments")
        .where("status", "!=", "cancelled")
        .where("date", ">=", yesterdayStart.toISOString())
        .where("date", "<", tomorrow.toISOString())
        .get();

      const appts = apptsSnapshot.docs.map(doc => doc.data());
      
      const todayAppts = appts.filter(a => a.date >= today.toISOString() && a.date < tomorrow.toISOString());
      const yesterdayAppts = appts.filter(a => a.date >= yesterdayStart.toISOString() && a.date < today.toISOString());

      // Get services mapping to fall back for missing prices in older database documents
      const servicesSnapshot = await db.collection("barbershops")
        .doc(barbershopId)
        .collection("services")
        .get();
      const servicesMap = new Map();
      servicesSnapshot.docs.forEach(doc => {
        servicesMap.set(doc.id, doc.data());
      });

      const getApptPrice = (a: any) => {
        if (a.price !== undefined && a.price !== null) return Number(a.price) || 0;
        if (a.servicePrice !== undefined && a.servicePrice !== null) return Number(a.servicePrice) || 0;
        const matchingService = servicesMap.get(a.serviceId);
        return Number(matchingService?.price) || 0;
      };

      const todayRevenue = todayAppts.reduce((sum, a) => sum + getApptPrice(a), 0);
      const yesterdayRevenue = yesterdayAppts.reduce((sum, a) => sum + getApptPrice(a), 0);

      // New Customers
      const customersSnapshot = await db.collection("barbershops")
        .doc(barbershopId)
        .collection("customers")
        .where("createdAt", ">=", yesterdayStart.toISOString())
        .get();
      
      const customers = customersSnapshot.docs.map(doc => doc.data());
      const todayNewCustomers = customers.filter(c => c.createdAt >= today.toISOString()).length;
      const yesterdayNewCustomers = customers.filter(c => c.createdAt >= yesterdayStart.toISOString() && c.createdAt < today.toISOString()).length;

      const calculateTrend = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
      };

      // Chart Data (Last 7 days - simplified to fetch last 50 appts or similar)
      const last7DaysStart = new Date(today);
      last7DaysStart.setDate(today.getDate() - 6);
      
      const chartSnapshot = await db.collection("barbershops")
        .doc(barbershopId)
        .collection("appointments")
        .where("status", "!=", "cancelled")
        .where("date", ">=", last7DaysStart.toISOString())
        .get();
      
      const chartAppts = chartSnapshot.docs.map(doc => doc.data());
      
      const chartData: any[] = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(last7DaysStart);
        d.setDate(last7DaysStart.getDate() + i);
        const dayStr = d.toISOString().split('T')[0];
        const count = chartAppts.filter(a => a.date.startsWith(dayStr)).length;
        chartData.push({
          date: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
          value: count
        });
      }

      // Next Appointment
      const now = new Date().toISOString();
      const nextApptSnapshot = await db.collection("barbershops")
        .doc(barbershopId)
        .collection("appointments")
        .where("status", "==", "confirmed")
        .where("date", ">", now)
        .orderBy("date", "asc")
        .limit(1)
        .get();

      const nextAppointment = nextApptSnapshot.empty ? null : nextApptSnapshot.docs[0].data();

      // Logo
      const shopDoc = await db.collection("barbershops").doc(barbershopId).get();
      const logoUrl = shopDoc.data()?.logoUrl;

      res.json({
        appointmentsCount: todayAppts.length,
        appointmentsTrend: calculateTrend(todayAppts.length, yesterdayAppts.length),
        estimatedRevenue: todayRevenue,
        revenueTrend: calculateTrend(todayRevenue, yesterdayRevenue),
        newCustomersCount: todayNewCustomers,
        customersTrend: calculateTrend(todayNewCustomers, yesterdayNewCustomers),
        barbershopLogo: logoUrl,
        nextAppointment,
        chartData
      });
    } catch (err) {
      console.error("Stats error:", err);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });
}


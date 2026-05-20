import express from "express";
import "dotenv/config";
import path from "path";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import { setupAuthRoutes } from "./src/server/routes/auth.ts";
import { setupBarbershopRoutes } from "./src/server/routes/barbershop.ts";
import { setupUserRoutes } from "./src/server/routes/user.ts";
import { setupServiceRoutes } from "./src/server/routes/service.ts";
import { setupAppointmentRoutes } from "./src/server/routes/appointment.ts";
import { setupCustomerRoutes } from "./src/server/routes/customer.ts";
import { setupStatsRoutes } from "./src/server/routes/stats.ts";
import { setupPublicRoutes } from "./src/server/routes/public.ts";
import { setupNotificationRoutes } from "./src/server/routes/notification.ts";
import { setupPaymentRoutes } from "./src/server/routes/payment.ts";
import { setupAdminRoutes } from "./src/server/routes/admin.ts";
import { initDb } from "./src/server/db.ts";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize DB
  await initDb();

  if (!process.env.JWT_SECRET) {
    console.warn("WARNING: JWT_SECRET is not set in environment variables. Using a fallback secret is not recommended for production.");
  }

  app.use(cors());
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // API Routes
  setupPublicRoutes(app);
  setupAuthRoutes(app);
  setupBarbershopRoutes(app);
  setupUserRoutes(app);
  setupServiceRoutes(app);
  setupAppointmentRoutes(app);
  setupCustomerRoutes(app);
  setupStatsRoutes(app);
  setupNotificationRoutes(app);
  setupPaymentRoutes(app);
  setupAdminRoutes(app);

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
  process.exit(1);
});

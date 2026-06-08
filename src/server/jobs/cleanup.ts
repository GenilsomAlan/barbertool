import { db } from "../db.ts";
import { deleteUserAccountAndData } from "../utils/deleteAccount.ts";

/**
 * Sweeps the entire users collection and purges any user profiles (and associated barbershop databases, if they are admins)
 * that have been completely inactive (missing/stale lastActiveAt and old createdAt) for longer than 60 days (2 months).
 */
export async function runInactivityCleanup(): Promise<void> {
  console.log("[Inactivity Cleanup] Starting database sweep...");
  try {
    const usersSnapshot = await db.collection("users").get();
    
    const now = new Date();
    const INACTIVITY_LIMIT_DAYS = 60; // 2 months
    const thresholdDate = new Date();
    thresholdDate.setDate(now.getDate() - INACTIVITY_LIMIT_DAYS);

    let purgedCount = 0;

    for (const doc of usersSnapshot.docs) {
      const user = doc.data();
      if (!user) continue;

      let lastActivity: Date | null = null;
      if (user.lastActiveAt) {
        lastActivity = new Date(user.lastActiveAt);
      } else if (user.createdAt) {
        lastActivity = new Date(user.createdAt);
      }

      if (lastActivity && lastActivity < thresholdDate) {
        console.log(`[Inactivity Cleanup] Found inactive account: ${user.name} (${user.email}, ID: ${user.id}). Last active: ${lastActivity.toISOString()}`);
        
        await deleteUserAccountAndData(user.id, user.role, user.barbershopId);
        purgedCount++;
      }
    }

    console.log(`[Inactivity Cleanup] Sweep completed. Total inactive accounts purged: ${purgedCount}`);
  } catch (err) {
    console.error("[Inactivity Cleanup] Fatal error running sweep:", err);
  }
}

/**
 * Spawns the background inactivity daemon. Run once on boot and schedule execution every 24 hours.
 */
export function startInactivityCleanupJob() {
  console.log("[Inactivity Daemon] Registering cleanup cron intervals...");
  
  // 1. Fire-and-forget on boot (after a short delay to let database settle)
  setTimeout(() => {
    runInactivityCleanup().catch(err => console.error("[Inactivity Daemon] Sweep error on boot:", err));
  }, 10 * 1000); // 10 seconds post-boot

  // 2. Schedule to repeat every 24 hours
  const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
  setInterval(() => {
    console.log("[Inactivity Daemon] Triggering scheduled periodic sweep...");
    runInactivityCleanup().catch(err => console.error("[Inactivity Daemon] Periodic sweep error:", err));
  }, TWENTY_FOUR_HOURS_MS);
}

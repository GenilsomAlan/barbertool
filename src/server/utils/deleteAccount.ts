import { db } from "../db.ts";

/**
 * Robustly deletes a user account.
 * If the user's role is 'admin', it performs a complete cascade deletion:
 * - Deletes all subcollections of the associated barbershop (services, appointments, customers, notifications).
 * - Deletes all users belonging to that barbershop.
 * - Deletes the barbershop document itself.
 * 
 * If the user is a standard 'barber', it deletes only their individual user document.
 */
export async function deleteUserAccountAndData(userId: string, role: string, barbershopId: string): Promise<void> {
  console.log(`[Account Deletion] Initiating deletion for User ID ${userId} (Role: ${role}, Barbershop ID: ${barbershopId})`);
  
  if (role === 'admin') {
    // 1. Delete all appointments under the barbershop
    try {
      const appointmentsSnap = await db.collection("barbershops").doc(barbershopId).collection("appointments").get();
      console.log(`[Account Deletion] Deleting ${appointmentsSnap.size} appointments...`);
      for (const doc of appointmentsSnap.docs) {
        await doc.ref.delete();
      }
    } catch (err) {
      console.error(`[Account Deletion] Error deleting appointments for ${barbershopId}:`, err);
    }

    // 2. Delete all services under the barbershop
    try {
      const servicesSnap = await db.collection("barbershops").doc(barbershopId).collection("services").get();
      console.log(`[Account Deletion] Deleting ${servicesSnap.size} services...`);
      for (const doc of servicesSnap.docs) {
        await doc.ref.delete();
      }
    } catch (err) {
      console.error(`[Account Deletion] Error deleting services for ${barbershopId}:`, err);
    }

    // 3. Delete all customers under the barbershop
    try {
      const customersSnap = await db.collection("barbershops").doc(barbershopId).collection("customers").get();
      console.log(`[Account Deletion] Deleting ${customersSnap.size} customers...`);
      for (const doc of customersSnap.docs) {
        await doc.ref.delete();
      }
    } catch (err) {
      console.error(`[Account Deletion] Error deleting customers for ${barbershopId}:`, err);
    }

    // 4. Delete all notifications under the barbershop
    try {
      const notificationsSnap = await db.collection("barbershops").doc(barbershopId).collection("notifications").get();
      console.log(`[Account Deletion] Deleting ${notificationsSnap.size} notifications...`);
      for (const doc of notificationsSnap.docs) {
        await doc.ref.delete();
      }
    } catch (err) {
      console.error(`[Account Deletion] Error deleting notifications for ${barbershopId}:`, err);
    }

    // 5. Delete all users belonging to this barbershop
    try {
      const staffSnap = await db.collection("users").where("barbershopId", "==", barbershopId).get();
      console.log(`[Account Deletion] Deleting ${staffSnap.size} associated users/staff...`);
      for (const doc of staffSnap.docs) {
        await doc.ref.delete();
      }
    } catch (err) {
      console.error(`[Account Deletion] Error deleting users belonging to ${barbershopId}:`, err);
    }

    // 6. Delete the barbershop document itself
    try {
      await db.collection("barbershops").doc(barbershopId).delete();
      console.log(`[Account Deletion] Barbershop ${barbershopId} deleted successfully.`);
    } catch (err) {
      console.error(`[Account Deletion] Error deleting barbershop document ${barbershopId}:`, err);
    }
  } else {
    // Standard barber user, only delete the individual's user profile document
    try {
      await db.collection("users").doc(userId).delete();
      console.log(`[Account Deletion] Barber user ${userId} deleted successfully.`);
    } catch (err) {
      console.error(`[Account Deletion] Error deleting user document ${userId}:`, err);
      throw err;
    }
  }
}

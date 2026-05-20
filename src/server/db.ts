import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import firebaseConfig from "../../firebase-applet-config.json";
import fs from "fs";
import path from "path";

const distRoot = process.cwd();

// Initialize Firebase Admin
if (!admin.apps.length) {
  // Try to use provided service account for admin privileges
  try {
    const saPath = path.join(distRoot, "service-account.json");
    if (fs.existsSync(saPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(saPath, "utf8"));
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log("Firebase Admin initialized with service account key.");
    } else {
      throw new Error("Service account file not found");
    }
  } catch (err) {
    // Fallback to application default
    admin.initializeApp({
      projectId: firebaseConfig.projectId,
      credential: admin.credential.applicationDefault(),
    });
    console.log("Firebase Admin initialized with application default credentials.");
  }
}

// Access the specific database
export const db = getFirestore(firebaseConfig.firestoreDatabaseId);
db.settings({ ignoreUndefinedProperties: true });


export async function initDb() {
  console.log("Firestore initialized for project:", firebaseConfig.projectId);
  console.log("Database ID:", firebaseConfig.firestoreDatabaseId);
  
  try {
    // Basic connectivity test
    await db.collection("_health").doc("check").set({ lastPing: new Date().toISOString() });
    console.log("Firestore connectivity test successful.");
  } catch (err) {
    console.error("Firestore connectivity test failed:", err);
  }
}

export function generateSlug(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}


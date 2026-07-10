import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection as fsCollection, 
  collectionGroup as fsCollectionGroup,
  doc as fsDoc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query as fsQuery, 
  where as fsWhere, 
  orderBy as fsOrderBy, 
  limit as fsLimit, 
  writeBatch,
  runTransaction as fsRunTransaction,
  deleteField,
  DocumentReference as FsDocRef,
  CollectionReference as FsCollRef,
  QueryConstraint
} from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

// Initialize Firebase JS SDK using modular mode
const webConfig = {
  apiKey: firebaseConfig.apiKey,
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  storageBucket: firebaseConfig.storageBucket,
  messagingSenderId: firebaseConfig.messagingSenderId,
  appId: firebaseConfig.appId,
};

const app = initializeApp(webConfig);
const rawDb = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export class DocumentSnapshotWrapper {
  constructor(public rawSnap: any) {}
  get id(): string { return this.rawSnap.id; }
  get exists(): boolean { return this.rawSnap.exists(); }
  get ref(): DocumentReferenceWrapper { return new DocumentReferenceWrapper(this.rawSnap.ref); }
  data(): any { return this.rawSnap.data(); }
}

export class DocumentReferenceWrapper {
  constructor(public rawRef: FsDocRef) {}
  get id(): string { return this.rawRef.id; }
  get path(): string { return this.rawRef.path; }

  collection(subpath: string): CollectionReferenceWrapper {
    return new CollectionReferenceWrapper(fsCollection(this.rawRef, subpath));
  }

  async get(): Promise<DocumentSnapshotWrapper> {
    const snap = await getDoc(this.rawRef);
    return new DocumentSnapshotWrapper(snap);
  }

  async set(data: any, options?: { merge?: boolean }): Promise<void> {
    await setDoc(this.rawRef, data, options || {});
  }

  async update(data: any): Promise<void> {
    await updateDoc(this.rawRef, data);
  }

  async delete(): Promise<void> {
    await deleteDoc(this.rawRef);
  }
}

export class QuerySnapshotWrapper {
  constructor(public rawSnap: any) {}
  get size(): number { return this.rawSnap.size; }
  get empty(): boolean { return this.rawSnap.empty; }
  get docs(): DocumentSnapshotWrapper[] {
    return this.rawSnap.docs.map((doc: any) => new DocumentSnapshotWrapper(doc));
  }
}

export class QueryWrapper {
  constructor(public rawRef: any, public constraints: QueryConstraint[]) {}

  where(fieldPath: string, opStr: any, value: any): QueryWrapper {
    return new QueryWrapper(this.rawRef, [...this.constraints, fsWhere(fieldPath, opStr, value)]);
  }

  orderBy(fieldPath: string, directionStr?: "asc" | "desc"): QueryWrapper {
    return new QueryWrapper(this.rawRef, [...this.constraints, fsOrderBy(fieldPath, directionStr || "asc")]);
  }

  limit(limitNum: number): QueryWrapper {
    return new QueryWrapper(this.rawRef, [...this.constraints, fsLimit(limitNum)]);
  }

  async get(): Promise<QuerySnapshotWrapper> {
    const q = fsQuery(this.rawRef, ...this.constraints);
    const snap = await getDocs(q);
    return new QuerySnapshotWrapper(snap);
  }
}

export class CollectionReferenceWrapper {
  constructor(public rawRef: FsCollRef) {}
  get id(): string { return this.rawRef.id; }

  doc(id?: string): DocumentReferenceWrapper {
    const ref = id ? fsDoc(this.rawRef, id) : fsDoc(this.rawRef);
    return new DocumentReferenceWrapper(ref);
  }

  async add(data: any): Promise<DocumentReferenceWrapper> {
    const ref = await addDoc(this.rawRef, data);
    return new DocumentReferenceWrapper(ref);
  }

  where(fieldPath: string, opStr: any, value: any): QueryWrapper {
    return new QueryWrapper(this.rawRef, [fsWhere(fieldPath, opStr, value)]);
  }

  orderBy(fieldPath: string, directionStr?: "asc" | "desc"): QueryWrapper {
    return new QueryWrapper(this.rawRef, [fsOrderBy(fieldPath, directionStr || "asc")]);
  }

  limit(limitNum: number): QueryWrapper {
    return new QueryWrapper(this.rawRef, [fsLimit(limitNum)]);
  }

  async get(): Promise<QuerySnapshotWrapper> {
    const snap = await getDocs(this.rawRef);
    return new QuerySnapshotWrapper(snap);
  }
}

export class WriteBatchWrapper {
  constructor(public rawBatch: any) {}
  set(docRef: DocumentReferenceWrapper, data: any, options?: any) {
    this.rawBatch.set(docRef.rawRef, data, options || {});
    return this;
  }
  update(docRef: DocumentReferenceWrapper, data: any) {
    this.rawBatch.update(docRef.rawRef, data);
    return this;
  }
  delete(docRef: DocumentReferenceWrapper) {
    this.rawBatch.delete(docRef.rawRef);
    return this;
  }
  async commit(): Promise<void> {
    await this.rawBatch.commit();
  }
}

// Isomorphic database interface matching compat mode
export const db = {
  collection(path: string): CollectionReferenceWrapper {
    return new CollectionReferenceWrapper(fsCollection(rawDb, path));
  },
  collectionGroup(id: string): QueryWrapper {
    return new QueryWrapper(fsCollectionGroup(rawDb, id), []);
  },
  batch(): WriteBatchWrapper {
    return new WriteBatchWrapper(writeBatch(rawDb));
  },
  async runTransaction<T>(updateFunction: (transaction: any) => Promise<T>): Promise<T> {
    return await fsRunTransaction(rawDb, async (fsTransaction) => {
      const transactionWrapper = {
        async get(docRef: DocumentReferenceWrapper): Promise<DocumentSnapshotWrapper> {
          const snap = await fsTransaction.get(docRef.rawRef);
          return new DocumentSnapshotWrapper(snap);
        },
        set(docRef: DocumentReferenceWrapper, data: any, options?: { merge?: boolean }) {
          if (options?.merge) {
            fsTransaction.set(docRef.rawRef, data, { merge: true });
          } else {
            fsTransaction.set(docRef.rawRef, data);
          }
          return this;
        },
        update(docRef: DocumentReferenceWrapper, data: any) {
          fsTransaction.update(docRef.rawRef, data);
          return this;
        },
        delete(docRef: DocumentReferenceWrapper) {
          fsTransaction.delete(docRef.rawRef);
          return this;
        }
      };
      return await updateFunction(transactionWrapper as any);
    });
  }
};

export const FieldValue = {
  delete: () => deleteField()
};

export async function initDb() {
  console.log("Firestore (isomorphic modular wrapper) initialized for project:", firebaseConfig.projectId);
  console.log("Database ID:", firebaseConfig.firestoreDatabaseId);
  
  try {
    await db.collection("_health").doc("check").set({ lastPing: new Date().toISOString() });
    console.log("Firestore connectivity test successful.");

    // Proactively find and upgrade any existing shops that registered with the "FREEFV" coupon
    const shopsWithCoupon = await db.collection("barbershops")
      .where("appliedCoupon", "==", "FREEFV")
      .get();
    
    for (const shopDoc of shopsWithCoupon.docs) {
      const data = shopDoc.data();
      if (data?.subscriptionStatus !== "premium") {
        console.info(`[Migration] Proactively upgrading barbershop ID: ${shopDoc.id} (${data?.name || "unnamed"}) to 'premium' due to lifetime FREEFV coupon.`);
        await shopDoc.ref.update({ subscriptionStatus: "premium" });
      }
    }
  } catch (err) {
    console.error("Firestore connectivity test / proactive migration failed:", err);
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

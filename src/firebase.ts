import { initializeApp } from 'firebase/app';
import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  getDocs,
  writeBatch,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  query,
  orderBy,
  limit
} from 'firebase/firestore';
import config from '../firebase-applet-config.json';
import { INITIAL_CLIENTS, PRELOADED_PIECES, PRELOADED_TASKS, INITIAL_BUDGETS, INITIAL_PROJECTS } from './initialData';
import { ChatMessage } from './types';

const app = initializeApp({
  apiKey: config.apiKey,
  authDomain: config.authDomain,
  projectId: config.projectId,
  storageBucket: config.storageBucket,
  messagingSenderId: config.messagingSenderId,
  appId: config.appId
});

const cacheSettings = {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  }),
  ignoreUndefinedProperties: true
};

export const db = config.firestoreDatabaseId 
  ? initializeFirestore(app, cacheSettings, config.firestoreDatabaseId) 
  : initializeFirestore(app, cacheSettings);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
      emailVerified: null,
      isAnonymous: null,
      tenantId: null,
      providerInfo: []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Sync subscription helper
export function subscribeToCollection<T>(
  col: string, 
  onData: (items: T[]) => void,
  onError?: (err: Error) => void
) {
  const q = collection(db, col);
  return onSnapshot(q, (snapshot) => {
    const items: T[] = [];
    snapshot.forEach((docSnap) => {
      items.push({ id: docSnap.id, ...docSnap.data() } as T);
    });
    onData(items);
  }, (err) => {
    console.error(`Error in firebase subscription for ${col}:`, err);
    if (onError) {
      onError(err);
    } else {
      handleFirestoreError(err, OperationType.GET, col);
    }
  });
}

// Optimized real-time chat subscription (fetches last 50 messages sorted descending and reverses them)
export function subscribeToRecentMessages(
  onData: (items: ChatMessage[]) => void,
  onError?: (err: Error) => void
) {
  const colRef = collection(db, 'messages');
  const q = query(colRef, orderBy('timestamp', 'desc'), limit(50));
  
  return onSnapshot(q, (snapshot) => {
    const items: ChatMessage[] = [];
    snapshot.forEach((docSnap) => {
      items.push({ id: docSnap.id, ...docSnap.data() } as ChatMessage);
    });
    // Reverse to present ascending chronologically
    onData(items.reverse());
  }, (err) => {
    console.error("Error in real-time chat subscription:", err);
    if (onError) {
      onError(err);
    }
  });
}

// Write/Edit document
export async function saveDocument(col: string, id: string, data: any) {
  try {
    const docRef = doc(db, col, id);
    await setDoc(docRef, data, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, col);
  }
}

// Delete document
export async function deleteDocument(col: string, id: string) {
  try {
    const docRef = doc(db, col, id);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, col);
  }
}

// Auto-seed Firestore if clean (Optimized with Promise.all for speed and concurrency)
export async function seedDatabaseIfEmpty() {
  try {
    const [clientsSnap, piecesSnap, tasksSnap, budgetsSnap, projectsSnap] = await Promise.all([
      getDocs(collection(db, 'clients')),
      getDocs(collection(db, 'pieces')),
      getDocs(collection(db, 'tasks')),
      getDocs(collection(db, 'budgets')),
      getDocs(collection(db, 'projects'))
    ]);

    const saveJobs: Promise<any>[] = [];

    if (clientsSnap.empty) {
      console.log('Seeding default clients in parallel...');
      INITIAL_CLIENTS.forEach(item => {
        saveJobs.push(saveDocument('clients', item.id, {
          ...item,
          createdBy: 'Sistema',
          updatedBy: 'Sistema',
          updatedAt: new Date().toISOString()
        }));
      });
    }

    if (piecesSnap.empty) {
      console.log('Seeding default catalog pieces in parallel...');
      PRELOADED_PIECES.forEach(item => {
        saveJobs.push(saveDocument('pieces', item.id, {
          ...item,
          createdBy: 'Sistema',
          updatedBy: 'Sistema',
          updatedAt: new Date().toISOString()
        }));
      });
    }

    if (tasksSnap.empty) {
      console.log('Seeding default tasks in parallel...');
      PRELOADED_TASKS.forEach(item => {
        saveJobs.push(saveDocument('tasks', item.id, {
          ...item,
          createdBy: 'Sistema',
          updatedBy: 'Sistema',
          updatedAt: new Date().toISOString()
        }));
      });
    }

    if (budgetsSnap.empty) {
      console.log('Seeding default budgets in parallel...');
      INITIAL_BUDGETS.forEach(item => {
        saveJobs.push(saveDocument('budgets', item.id, {
          ...item,
          createdBy: 'Sistema',
          updatedBy: 'Sistema',
          updatedAt: new Date().toISOString()
        }));
      });
    }

    if (projectsSnap.empty) {
      console.log('Seeding default projects in parallel...');
      INITIAL_PROJECTS.forEach(item => {
        saveJobs.push(saveDocument('projects', item.id, {
          ...item,
          createdBy: 'Sistema',
          updatedBy: 'Sistema',
          updatedAt: new Date().toISOString()
        }));
      });
    }

    if (saveJobs.length > 0) {
      await Promise.all(saveJobs);
      console.log('Seeding completed successfully.');
    }
  } catch (error) {
    console.error('Failed to seed cloud database:', error);
  }
}

// Manually force sync/reseed the entire official catalog of pieces and tasks in Firestore
export async function forceSeedDatabase() {
  console.log('Force-seeding official catalog to Firestore...');
  await Promise.all(PRELOADED_PIECES.map(item => 
    saveDocument('pieces', item.id, {
      ...item,
      createdBy: 'Sistema',
      updatedBy: 'Sistema',
      updatedAt: new Date().toISOString()
    })
  ));
  await Promise.all(PRELOADED_TASKS.map(item => 
    saveDocument('tasks', item.id, {
      ...item,
      createdBy: 'Sistema',
      updatedBy: 'Sistema',
      updatedAt: new Date().toISOString()
    })
  ));
}


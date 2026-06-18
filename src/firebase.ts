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
  persistentMultipleTabManager
} from 'firebase/firestore';
import config from '../firebase-applet-config.json';
import { INITIAL_CLIENTS, PRELOADED_PIECES, PRELOADED_TASKS, INITIAL_BUDGETS, INITIAL_PROJECTS } from './initialData';

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
      items.push({ ...docSnap.data() } as T);
    });
    onData(items);
  }, (err) => {
    console.error(`Error in firebase subscription for ${col}:`, err);
    if (onError) onError(err);
  });
}

// Write/Edit document
export async function saveDocument(col: string, id: string, data: any) {
  const docRef = doc(db, col, id);
  await setDoc(docRef, data, { merge: true });
}

// Delete document
export async function deleteDocument(col: string, id: string) {
  const docRef = doc(db, col, id);
  await deleteDoc(docRef);
}

// Auto-seed Firestore if clean
export async function seedDatabaseIfEmpty() {
  try {
    // Clients
    const clientsSnap = await getDocs(collection(db, 'clients'));
    if (clientsSnap.empty) {
      console.log('Seeding default clients...');
      await Promise.all(INITIAL_CLIENTS.map(item => 
        saveDocument('clients', item.id, {
          ...item,
          createdBy: 'Sistema',
          updatedBy: 'Sistema',
          updatedAt: new Date().toISOString()
        })
      ));
    }

    // Design pieces (Catalog)
    const piecesSnap = await getDocs(collection(db, 'pieces'));
    if (piecesSnap.empty) {
      console.log('Seeding default catalog pieces...');
      await Promise.all(PRELOADED_PIECES.map(item => 
        saveDocument('pieces', item.id, {
          ...item,
          createdBy: 'Sistema',
          updatedBy: 'Sistema',
          updatedAt: new Date().toISOString()
        })
      ));
    }

    // Preloaded tasks (Global checklists)
    const tasksSnap = await getDocs(collection(db, 'tasks'));
    if (tasksSnap.empty) {
      console.log('Seeding default tasks...');
      await Promise.all(PRELOADED_TASKS.map(item => 
        saveDocument('tasks', item.id, {
          ...item,
          createdBy: 'Sistema',
          updatedBy: 'Sistema',
          updatedAt: new Date().toISOString()
        })
      ));
    }

    // Budgets
    const budgetsSnap = await getDocs(collection(db, 'budgets'));
    if (budgetsSnap.empty) {
      console.log('Seeding default budgets...');
      await Promise.all(INITIAL_BUDGETS.map(item => 
        saveDocument('budgets', item.id, {
          ...item,
          createdBy: 'Sistema',
          updatedBy: 'Sistema',
          updatedAt: new Date().toISOString()
        })
      ));
    }

    // Projects
    const projectsSnap = await getDocs(collection(db, 'projects'));
    if (projectsSnap.empty) {
      console.log('Seeding default projects...');
      await Promise.all(INITIAL_PROJECTS.map(item => 
        saveDocument('projects', item.id, {
          ...item,
          createdBy: 'Sistema',
          updatedBy: 'Sistema',
          updatedAt: new Date().toISOString()
        })
      ));
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


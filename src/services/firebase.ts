import { initializeApp } from 'firebase/app';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, getFirestore, collection, doc } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// Support both JSON file (for AI Studio) and Environment Variables (for Render/GitHub)
let aiStudioConfig: any = {};
try {
  // @ts-ignore - Vite specific glob
  const configs = import.meta.glob('../../firebase-applet-config.json', { eager: true });
  // Find the config file in the glob results
  const configKey = Object.keys(configs).find(k => k.includes('firebase-applet-config.json'));
  if (configKey) {
    aiStudioConfig = (configs[configKey] as any)?.default || configs[configKey] || {};
  }
} catch (e) {
  console.warn('Firebase config file not found or failed to load. Falling back to env vars.');
}

// Support runtime fallback from the server's environment variables (e.g. Render.com dynamic updates)
let serverConfig: any = {};
if (typeof window !== 'undefined') {
  try {
    const xhr = new XMLHttpRequest();
    // Synchronous request blocks just long enough to capture runtime settings before SDK init
    xhr.open('GET', '/api/firebase-config', false);
    xhr.send(null);
    if (xhr.status === 200 && xhr.responseText && xhr.responseText.trim().startsWith('{')) {
      serverConfig = JSON.parse(xhr.responseText);
      console.log('[FIREBASE] Loaded live runtime configuration from server successfully.');
    }
  } catch (err) {
    console.warn('[FIREBASE] Failed to fetch server config; falling back to static env.', err);
  }
}

const firebaseConfig = {
  apiKey: serverConfig.apiKey || import.meta.env.VITE_FIREBASE_API_KEY || aiStudioConfig.apiKey,
  authDomain: serverConfig.authDomain || import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || aiStudioConfig.authDomain,
  projectId: serverConfig.projectId || import.meta.env.VITE_FIREBASE_PROJECT_ID || aiStudioConfig.projectId,
  storageBucket: serverConfig.storageBucket || import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || aiStudioConfig.storageBucket,
  messagingSenderId: serverConfig.messagingSenderId || import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || aiStudioConfig.messagingSenderId,
  appId: serverConfig.appId || import.meta.env.VITE_FIREBASE_APP_ID || aiStudioConfig.appId,
  measurementId: serverConfig.measurementId || import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || aiStudioConfig.measurementId,
  firestoreDatabaseId: serverConfig.firestoreDatabaseId || import.meta.env.VITE_FIREBASE_DATABASE_ID || aiStudioConfig.firestoreDatabaseId || '(default)'
};

// Only initialize if we have at least a Project ID
const hasConfig = !!firebaseConfig.projectId;

const app = hasConfig ? initializeApp(firebaseConfig) : null;
const analytics = (hasConfig && typeof window !== 'undefined') ? getAnalytics(app!) : null;
const auth = hasConfig ? getAuth(app!) : null as any;

const googleProvider = new GoogleAuthProvider();

const db = hasConfig 
  ? initializeFirestore(app!, { 
      experimentalForceLongPolling: true,
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      })
    }, firebaseConfig.firestoreDatabaseId || '(default)')
  : null as any;

const dbInstances: Record<string, any> = {};
const failedDatabases = new Set<string>();

export function markDatabaseAsFailed(storeId: string) {
  if (!storeId || storeId === 'default' || storeId === '(default)') return;
  if (!failedDatabases.has(storeId)) {
    failedDatabases.add(storeId);
    console.warn(`[FIREBASE] Separate database for store "${storeId}" marked as failed/unavailable. Using default database fallback.`);
  }
}

export function isDatabaseFailed(storeId: string) {
  return failedDatabases.has(storeId);
}

export function getDbForStore(storeId: string) {
  if (!hasConfig || !app) return null as any;

  // If storeId is empty, default, or has been marked as failed, use primary db
  if (!storeId || storeId === 'default' || storeId === '(default)' || failedDatabases.has(storeId)) {
    return db;
  }

  // Sanitize storeId to be a valid Firestore database ID:
  // Must be 4-63 characters, start with a lowercase letter, and contain only lowercase letters, numbers, and hyphens.
  let dbId = storeId.toLowerCase().replace(/[^a-z0-9-]/g, '');
  if (!/^[a-z]/.test(dbId)) {
    dbId = 'store-' + dbId;
  }
  if (dbId.length < 4) {
    dbId = dbId + '-db';
  }
  dbId = dbId.substring(0, 63);

  if (!dbInstances[dbId]) {
    try {
      dbInstances[dbId] = initializeFirestore(app!, {
        experimentalForceLongPolling: true,
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager()
        })
      }, dbId);
      console.log(`[FIREBASE] Initialized separate Firestore database for store: "${storeId}" with Database ID: "${dbId}"`);
    } catch (e: any) {
      // If already initialized, get the existing instance using getFirestore
      try {
        dbInstances[dbId] = getFirestore(app!, dbId);
      } catch (err) {
        console.warn(`[FIREBASE] Failed to retrieve initialized Firestore instance for "${dbId}", falling back to default db.`, err);
        return db;
      }
    }
  }

  return dbInstances[dbId];
}

export function getStoreCollectionRef(storeId: string, collectionName: string) {
  if (!storeId || storeId === 'default' || storeId === '(default)' || failedDatabases.has(storeId)) {
    return collection(db, 'stores', storeId || 'default', collectionName);
  }
  const storeDb = getDbForStore(storeId);
  if (storeDb === db) {
    return collection(db, 'stores', storeId, collectionName);
  }
  return collection(storeDb, collectionName);
}

export function getStoreDocRef(storeId: string, collectionName: string, docId: string) {
  if (!storeId || storeId === 'default' || storeId === '(default)' || failedDatabases.has(storeId)) {
    return doc(db, 'stores', storeId || 'default', collectionName, docId);
  }
  const storeDb = getDbForStore(storeId);
  if (storeDb === db) {
    return doc(db, 'stores', storeId, collectionName, docId);
  }
  return doc(storeDb, collectionName, docId);
}

export { db, analytics, auth, googleProvider };

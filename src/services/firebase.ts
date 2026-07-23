import { initializeApp } from 'firebase/app';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, getFirestore, collection, doc } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import appletConfigRaw from '../../firebase-applet-config.json';

// Support both JSON file (for AI Studio & static builds) and Environment Variables (for Render/GitHub)
let aiStudioConfig: any = appletConfigRaw || {};

let windowConfig: any = (typeof window !== 'undefined' && (window as any).__FIREBASE_CONFIG__) || {};

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || windowConfig.apiKey || aiStudioConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || windowConfig.authDomain || aiStudioConfig.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || windowConfig.projectId || aiStudioConfig.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || windowConfig.storageBucket || aiStudioConfig.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || windowConfig.messagingSenderId || aiStudioConfig.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || windowConfig.appId || aiStudioConfig.appId,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || windowConfig.measurementId || aiStudioConfig.measurementId,
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID || windowConfig.firestoreDatabaseId || aiStudioConfig.firestoreDatabaseId || '(default)'
};

// Async runtime loader if window config wasn't pre-injected
if (typeof window !== 'undefined' && !firebaseConfig.projectId) {
  fetch('/api/firebase-config')
    .then(res => res.json())
    .then(cfg => {
      if (cfg && cfg.projectId) {
        Object.assign(firebaseConfig, cfg);
        console.log('[FIREBASE] Dynamically populated runtime configuration.');
      }
    })
    .catch(err => console.warn('[FIREBASE] Optional runtime config fetch deferred:', err));
}

// Only initialize if we have at least a Project ID
const hasConfig = !!firebaseConfig.projectId;

const app = hasConfig ? initializeApp(firebaseConfig) : null;
const analytics = (hasConfig && typeof window !== 'undefined') ? getAnalytics(app!) : null;
const auth = hasConfig ? getAuth(app!) : null as any;

const googleProvider = new GoogleAuthProvider();

let db: any = null;
if (hasConfig && app) {
  try {
    db = initializeFirestore(app, { 
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      })
    }, firebaseConfig.firestoreDatabaseId || '(default)');
  } catch (err1) {
    console.warn('[FIREBASE] Persistent cache initialization failed (e.g. Private Browsing/Webview), falling back to standard memory cache:', err1);
    try {
      db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');
    } catch (err2) {
      console.error('[FIREBASE] Failed to initialize Firestore:', err2);
      db = null;
    }
  }
}

const dbInstances: Record<string, any> = {};
const failedDatabases = new Set<string>();

export function markDatabaseAsFailed(storeId: string) {
  // No-op for single database architecture
}

export function isDatabaseFailed(storeId: string) {
  return false;
}

export function getDbForStore(storeId: string) {
  return db;
}

export function getStoreCollectionRef(storeId: string, collectionName: string) {
  const targetStoreId = storeId || 'default';
  return collection(db, 'stores', targetStoreId, collectionName);
}

export function getStoreDocRef(storeId: string, collectionName: string, docId: string) {
  const targetStoreId = storeId || 'default';
  const safeDocId = (docId || '').trim().replace(/\//g, '_');
  return doc(db, 'stores', targetStoreId, collectionName, safeDocId);
}

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
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
      tenantId: auth?.currentUser?.tenantId,
      providerInfo: auth?.currentUser?.providerData?.map((provider: any) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  return errInfo;
}

export { db, analytics, auth, googleProvider };

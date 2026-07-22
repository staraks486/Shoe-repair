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
  return doc(db, 'stores', targetStoreId, collectionName, docId);
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

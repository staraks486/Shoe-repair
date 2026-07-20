import { initializeApp } from 'firebase/app';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
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

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || aiStudioConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || aiStudioConfig.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || aiStudioConfig.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || aiStudioConfig.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || aiStudioConfig.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || aiStudioConfig.appId,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || aiStudioConfig.measurementId,
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID || aiStudioConfig.firestoreDatabaseId || '(default)'
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

export { db, analytics, auth, googleProvider };

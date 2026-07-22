import { useEffect } from 'react';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { auth } from '../services/firebase';
import { useAppStore } from '../store';

export default function AuthObserver() {
  const setUser = useAppStore((state) => state.setUser);

  useEffect(() => {
    if (!auth) return;

    // Seamlessly ensure there is a Firebase Auth session (anonymous login)
    // so that Firestore security rules are satisfied (request.auth != null)
    // while keeping the custom UI credentials active.
    const ensureFirebaseAuth = async () => {
      if (!auth.currentUser) {
        try {
          console.log("Establishing safe anonymous auth session for cloud sync...");
          await signInAnonymously(auth);
        } catch (err) {
          console.warn("Could not establish anonymous auth session. Proceeding in local-only mode.", err);
        }
      }
    };

    ensureFirebaseAuth();
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      const currentUserProfile = useAppStore.getState().userProfile;
      
      if (user) {
        console.log("[FIREBASE] Authenticated session established:", user.uid);
        // Safely trigger real-time sync subscription now that we have a valid auth session
        useAppStore.getState().fetchFromFirestore();
        // Immediately push any offline writes that were queued before auth completed
        useAppStore.getState().processOfflineQueue().catch(err => {
          console.error("[FIREBASE] Failed to process offline queue after auth:", err);
        });
      }

      // Don't overwrite local mock user with a null from Firebase
      if (!user && currentUserProfile?.uid?.startsWith('mock-')) {
        return;
      }
      
      // If we got here, it's a real user or we're clearing a real user
      if (!user && !currentUserProfile?.uid?.startsWith('mock-')) {
        setUser(user);
      } else if (user) {
        // If logged into the portal with custom credentials, preserve the active portal roles
        if (currentUserProfile?.uid?.startsWith('mock-')) {
          return;
        }
        setUser(user);
      }
    });

    return () => unsubscribe();
  }, [setUser]);

  return null;
}

import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebase';
import { useAppStore } from '../store';

export default function AuthObserver() {
  const setUser = useAppStore((state) => state.setUser);

  useEffect(() => {
    if (!auth) return;
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // Don't overwrite local mock user with a null from Firebase
      const currentUserProfile = useAppStore.getState().userProfile;
      if (!user && currentUserProfile?.uid?.startsWith('mock-')) {
        return;
      }
      
      // If we got here, it's a real user or we're clearing a real user
      if (!user && !currentUserProfile?.uid?.startsWith('mock-')) {
          setUser(user);
      } else if (user) {
          setUser(user);
      }
    });

    return () => unsubscribe();
  }, [setUser]);

  return null;
}

import { useEffect, useRef } from 'react';
import { db } from '../firebase';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { useAuthStore } from '../store/useAuthStore';

const STREAK_THRESHOLD = 900; // 15 minutes in seconds
const SYNC_INTERVAL = 30000; // Sync every 30 seconds

export default function StudyTracker() {
  const { profile } = useAuthStore();
  const timeRef = useRef(0);
  const syncTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!profile?.id) return;

    // Timer to track spent time
    const interval = setInterval(() => {
      timeRef.current += 1;
      
      // Local check if we should trigger streak increment early
      // But we'll rely on the sync process for safety
    }, 1000);

    // Sync timer to periodically update Firestore
    syncTimerRef.current = setInterval(async () => {
      if (timeRef.current <= 0) return;

      const secondsToSync = timeRef.current;
      timeRef.current = 0; // Reset local counter after sync

      try {
        const userRef = doc(db, 'users', profile.id);
        const newTimeTotal = (profile.timeSpentToday || 0) + secondsToSync;
        
        const updates: any = {
          timeSpentToday: increment(secondsToSync)
        };

        // If threshold reached and not already incremented today
        if (newTimeTotal >= STREAK_THRESHOLD && !profile.streakIncrementedToday) {
          updates.streakCount = increment(1);
          updates.streakIncrementedToday = true;
        }

        await updateDoc(userRef, updates);
      } catch (error) {
        console.error("Error syncing study time:", error);
        // Put time back to try again later if sync failed
        timeRef.current += secondsToSync;
      }
    }, SYNC_INTERVAL);

    return () => {
      clearInterval(interval);
      if (syncTimerRef.current) clearInterval(syncTimerRef.current);
      
      // Final sync on unmount if there's significant time
      if (timeRef.current > 5) {
        const remaining = timeRef.current;
        const userRef = doc(db, 'users', profile.id);
        updateDoc(userRef, {
          timeSpentToday: increment(remaining)
        }).catch(err => console.error("Final sync error:", err));
      }
    };
  }, [profile?.id, profile?.timeSpentToday, profile?.streakIncrementedToday]);

  return null; // Side-effect component
}

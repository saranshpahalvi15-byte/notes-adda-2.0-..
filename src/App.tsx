/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { auth, db } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { useAuthStore } from './store/useAuthStore';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Notes from './pages/Notes';
import Bundles from './pages/Bundles';
import MindMaps from './pages/MindMaps';
import MockTests from './pages/MockTests';
import NoteDetails from './pages/NoteDetails';
import BundleDetails from './pages/BundleDetails';
import Checkout from './pages/Checkout';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import Refund from './pages/Refund';
import AudioNotes from './pages/AudioNotes';
import MockTestGenerator from './pages/MockTestGenerator';
import Giveaways from './pages/Giveaways';
import Quiz from './pages/Quiz';

import { PurchasedItemsProvider } from './hooks/usePurchasedItems';

export default function App() {
  const { setUser, setProfile, setLoading } = useAuthStore();

  useEffect(() => {
    let unsubscribeProfile: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      const currentProfile = useAuthStore.getState().profile;
      if (currentProfile?.id === 'admin-hardcoded-id') {
        setLoading(false);
        return;
      }

      setUser(firebaseUser as any);
      
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = undefined;
      }

      if (firebaseUser) {
        unsubscribeProfile = onSnapshot(
          doc(db, 'users', firebaseUser.uid),
          (userDoc) => {
            if (userDoc.exists()) {
              const data = userDoc.data() as any;
              
              // Handle role update
              if ((firebaseUser.email === 'masteradmin@vidyanotes.com' || firebaseUser.email === 'saransh1860@gmail.com') && data.role !== 'admin') {
                updateDoc(doc(db, 'users', firebaseUser.uid), { role: 'admin' });
                data.role = 'admin';
              }

              // Handle Streak Day-Reset Logic
              const today = new Date().toISOString().split('T')[0];
              const lastActivity = data.lastActivityDate;
              let newStreak = data.streakCount || 0;
              let timeConsumed = data.timeSpentToday || 0;
              let incremented = data.streakIncrementedToday || false;

              if (lastActivity !== today) {
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayStr = yesterday.toISOString().split('T')[0];

                if (lastActivity !== yesterdayStr && lastActivity) {
                  // Missed a day, reset streak
                  newStreak = 0;
                }
                
                // New day started, reset today's stats
                timeConsumed = 0;
                incremented = false;

                // Update firestore for new day
                updateDoc(doc(db, 'users', firebaseUser.uid), {
                  lastActivityDate: today,
                  timeSpentToday: 0,
                  streakIncrementedToday: false,
                  streakCount: newStreak
                });
                
                data.lastActivityDate = today;
                data.timeSpentToday = 0;
                data.streakIncrementedToday = false;
                data.streakCount = newStreak;
              }

              setProfile({ id: userDoc.id, ...data } as any);
            } else {
              setProfile(null);
            }
            setLoading(false);
          },
          (error) => {
            console.error("Error fetching user profile snapshot", error);
            setProfile(null);
            setLoading(false);
          }
        );
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) {
        unsubscribeProfile();
      }
    };
  }, [setUser, setProfile, setLoading]);

  return (
    <Router>
      <PurchasedItemsProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="login" element={<Login />} />
            <Route path="notes" element={<Notes />} />
            <Route path="notes/:id" element={<NoteDetails />} />
            <Route path="bundles" element={<Bundles />} />
            <Route path="bundles/:id" element={<BundleDetails />} />
            <Route path="mindMaps" element={<MindMaps />} />
            <Route path="mindMaps/:id" element={<NoteDetails />} />
            <Route path="mockTests" element={<MockTests />} />
            <Route path="mockTests/:id" element={<NoteDetails />} />
            <Route path="audioNotes" element={<AudioNotes />} />
            <Route path="giveaways" element={<Giveaways />} />
            <Route path="quiz/:noteId" element={<Quiz />} />
            <Route path="checkout" element={<Checkout />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="terms" element={<Terms />} />
            <Route path="privacy" element={<Privacy />} />
            <Route path="refund" element={<Refund />} />
            <Route path="admin/*" element={<Admin />} />
          </Route>
        </Routes>
      </PurchasedItemsProvider>
    </Router>
  );
}


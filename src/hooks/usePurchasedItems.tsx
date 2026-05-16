import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useAuthStore } from '../store/useAuthStore';

interface PurchasedItemsContextType {
  purchasedIds: Set<string>;
  loading: boolean;
  refreshPurchases: () => Promise<void>;
}

const PurchasedItemsContext = createContext<PurchasedItemsContextType>({
  purchasedIds: new Set(),
  loading: true,
  refreshPurchases: async () => {},
});

export function PurchasedItemsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  const [purchasedIds, setPurchasedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const fetchPurchases = async () => {
    if (!user) {
      setPurchasedIds(new Set());
      setLoading(false);
      return;
    }

    try {
      const q = query(
        collection(db, 'orders'),
        where('userId', '==', user.uid),
        where('status', '==', 'completed')
      );
      const snap = await getDocs(q);
      const ids = new Set<string>();

      // Giveaway wins
      const giveawayQ = query(
        collection(db, 'giveaways'),
        where('winnerId', '==', user.uid)
      );
      const giveawaySnap = await getDocs(giveawayQ);
      giveawaySnap.docs.forEach(doc => {
        const data = doc.data();
        if (data.noteId) ids.add(data.noteId);
      });

      const bundleIdsToFetch: string[] = [];

      snap.docs.forEach(doc => {
        const data = doc.data();
        data.items?.forEach((item: any) => {
          ids.add(item.itemId);
          if (item.type === 'bundle') {
            bundleIdsToFetch.push(item.itemId);
          }
        });
      });

      // Resolve bundle contents
      if (bundleIdsToFetch.length > 0) {
        const chunks = [];
        for (let i = 0; i < bundleIdsToFetch.length; i += 10) {
          chunks.push(bundleIdsToFetch.slice(i, i + 10));
        }

        for (const chunk of chunks) {
          const bundleQuery = query(collection(db, 'bundles'), where('__name__', 'in', chunk));
          const bundleSnap = await getDocs(bundleQuery);
          bundleSnap.docs.forEach(bDoc => {
            const bData = bDoc.data();
            (bData.noteIds || []).forEach((id: string) => ids.add(id));
            (bData.mindMapIds || []).forEach((id: string) => ids.add(id));
            (bData.mockTestIds || []).forEach((id: string) => ids.add(id));
            (bData.audioNoteIds || []).forEach((id: string) => ids.add(id));
          });
        }
      }

      setPurchasedIds(ids);
    } catch (err) {
      console.error("Error fetching purchased items:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, [user]);

  return (
    <PurchasedItemsContext.Provider value={{ purchasedIds, loading, refreshPurchases: fetchPurchases }}>
      {children}
    </PurchasedItemsContext.Provider>
  );
}

export function usePurchased() {
  return useContext(PurchasedItemsContext);
}

import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import NoteCard from '../components/NoteCard';
import { useAuthStore } from '../store/useAuthStore';

export default function Bundles() {
  const { profile } = useAuthStore();
  const [bundles, setBundles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSubject, setFilterSubject] = useState('all');

  useEffect(() => {
    const fetchBundles = async () => {
      try {
        const bundlesQuery = query(collection(db, 'bundles'), orderBy('createdAt', 'desc'));
        const bundlesSnapshot = await getDocs(bundlesQuery);
        const bundlesData = bundlesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Fetch all notes to backfill preview images for older bundles
        const notesSnapshot = await getDocs(collection(db, 'notes'));
        const allNotes = notesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];

        const enrichedBundles = bundlesData.map((bundle: any) => {
          if (!bundle.previewImages || bundle.previewImages.length === 0) {
            const matchingNote = allNotes.find(n => 
              n.classLevel === bundle.classLevel && 
              n.subject && bundle.subject && 
              n.subject.toLowerCase() === bundle.subject.toLowerCase() && 
              n.previewImages && 
              n.previewImages.length > 0
            );
            if (matchingNote) {
              bundle.previewImages = matchingNote.previewImages;
            }
          }
          return bundle;
        });
        
        setBundles(enrichedBundles);
      } catch (error) {
        console.error("Error fetching bundles:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBundles();
  }, []);

  const filteredBundles = bundles.filter(bundle => {
    if (filterSubject !== 'all' && bundle.subject !== filterSubject) return false;
    if (profile?.classLevel && bundle.classLevel !== profile.classLevel) return false;
    return true;
  });

  const subjects = ['Science', 'Math', 'Physics', 'Chemistry', 'Biology'];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Subject Bundles</h1>
        <p className="text-gray-500 mt-2">Get complete subjects at a discounted price of ₹249.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
          <select
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            <option value="all">All Subjects</option>
            {subjects.map(sub => (
              <option key={sub} value={sub}>{sub}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : filteredBundles.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredBundles.map(bundle => (
            <NoteCard
              key={bundle.id}
              id={bundle.id}
              title={bundle.title}
              subject={bundle.subject}
              classLevel={bundle.classLevel}
              price={bundle.price}
              previewImage={bundle.previewImages?.[0] || ''}
              type="bundle"
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <p className="text-gray-500">No bundles found matching your filters.</p>
        </div>
      )}
    </div>
  );
}

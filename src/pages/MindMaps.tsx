import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import NoteCard from '../components/NoteCard';
import { useAuthStore } from '../store/useAuthStore';

export default function MindMaps() {
  const { profile } = useAuthStore();
  const [mindMaps, setMindMaps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSubject, setFilterSubject] = useState('all');

  useEffect(() => {
    const fetchMindMaps = async () => {
      try {
        const queryRef = query(collection(db, 'mindMaps'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(queryRef);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        setMindMaps(data || []);
      } catch (error) {
        console.error("Error fetching mind maps:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMindMaps();
  }, []);

  const filteredMindMaps = mindMaps.filter(map => {
    if (filterSubject !== 'all' && map.subject !== filterSubject) return false;
    if (profile?.classLevel && map.classLevel !== profile.classLevel) return false;
    return true;
  });

  const subjects = ['Science', 'Math', 'Physics', 'Chemistry', 'Biology'];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Mind Maps</h1>
        <p className="text-gray-500 mt-2">Browse our collection of visual mind maps to help you revise quickly.</p>
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
      ) : filteredMindMaps.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredMindMaps.map(map => (
            <NoteCard
              key={map.id}
              id={map.id}
              title={map.title}
              subject={map.subject}
              classLevel={map.classLevel}
              price={map.price}
              previewImage={map.previewImages?.[0]}
              type="mindMap"
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <p className="text-gray-500">No mind maps found matching your filters.</p>
        </div>
      )}
    </div>
  );
}

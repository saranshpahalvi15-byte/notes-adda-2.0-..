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

  const getSubjectsByClass = (classLevel?: string) => {
    if (classLevel === '9' || classLevel === '10') {
      return ['Science', 'Math', 'Social Science', 'English'];
    } else if (classLevel === '11' || classLevel === '12' || classLevel === 'jee' || classLevel === 'neet') {
      return ['Physics', 'Chemistry', 'Biology', 'Math', 'English'];
    }
    return ['Science', 'Math', 'Physics', 'Chemistry', 'Biology'];
  };
  const subjects = getSubjectsByClass(profile?.classLevel);

  return (
    <div className="space-y-12">
      <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl p-8 md:p-12 text-white shadow-xl shadow-emerald-500/20">
        <div className="max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-black mb-6 tracking-tight">Visual Mind Maps</h1>
          <p className="text-emerald-50 text-lg md:text-xl leading-relaxed mb-8">
            Revolutionize your revision with high-impact visual summaries. Our mind maps condense 50-page chapters into single-page visual hierarchies designed for rapid recall and deep understanding.
          </p>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full text-sm font-bold border border-white/10">
              <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
              Recall Boosters
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full text-sm font-bold border border-white/10">
              <span className="w-2 h-2 rounded-full bg-white animate-bounce" />
              Science-Backed
            </div>
          </div>
        </div>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="p-8 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
          <h3 className="font-bold text-xl">The Power of Dual Coding</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
            By combining text with visual imagery, our mind maps leverage "Dual Coding Theory." This means your brain stores information in two different pathways—visual and verbal—making it significantly easier to retrieve during exams.
          </p>
          <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
            Perfect for complex biological systems, historical timelines, and mathematical formula structures where relationships between concepts are key.
          </p>
        </div>
        <div className="p-8 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
          <h3 className="font-bold text-xl">Last-Minute Revision Savior</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
            Trying to read hundreds of pages the night before an exam is stressful and ineffective. Our mind maps are designed to be reviewed in under 5 minutes per chapter, giving you the confidence that you've covered all core concepts.
          </p>
          <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
            Use them alongside our Chapter Notes for a complete study experience that covers both deep learning and rapid summary.
          </p>
        </div>
      </section>

      <div className="flex flex-col sm:flex-row gap-4 bg-white dark:bg-gray-900 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
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

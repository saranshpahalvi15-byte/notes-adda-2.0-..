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
      <div className="bg-gradient-to-br from-blue-600 to-indigo-800 rounded-3xl p-8 md:p-12 text-white shadow-xl shadow-blue-500/20">
        <div className="max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-black mb-6 tracking-tight">Comprehensive Subject Bundles</h1>
          <p className="text-blue-50 text-lg md:text-xl leading-relaxed mb-8">
            Master an entire subject with our curated bundles. Each bundle contains all chapters, formula sheets, and mock tests for a complete academic session—at a fraction of the individual cost.
          </p>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full text-sm font-bold border border-white/10">
              <span className="w-2 h-2 rounded-full bg-orange-400" />
              Save up to 40%
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full text-sm font-bold border border-white/10">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              Full Session Coverage
            </div>
          </div>
        </div>
      </div>

      <section className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-8 md:p-12">
        <div className="max-w-4xl mx-auto space-y-8">
          <h2 className="text-2xl font-bold text-center">What's Inside Every Bundle?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-sm">
            <div className="flex gap-4">
              <div className="h-10 w-10 shrink-0 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center font-bold text-indigo-600">01</div>
              <div>
                <h4 className="font-bold mb-1">Detailed Chapter Notes</h4>
                <p className="text-gray-500">Every single chapter covered in depth with handwritten precision.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="h-10 w-10 shrink-0 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center font-bold text-indigo-600">02</div>
              <div>
                <h4 className="font-bold mb-1">Integrated Mind Maps</h4>
                <p className="text-gray-500">Visual summaries included for every unit to speed up your revision.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="h-10 w-10 shrink-0 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center font-bold text-indigo-600">03</div>
              <div>
                <h4 className="font-bold mb-1">Formula & Concept Sheets</h4>
                <p className="text-gray-500">Quick-reference sheets for all major numerical formulas and theories.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="h-10 w-10 shrink-0 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center font-bold text-indigo-600">04</div>
              <div>
                <h4 className="font-bold mb-1">Practice Mock Tests</h4>
                <p className="text-gray-500">Subject-wide testing to ensure you are ready for the final boards.</p>
              </div>
            </div>
          </div>
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

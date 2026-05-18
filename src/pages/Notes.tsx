import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import NoteCard from '../components/NoteCard';
import { useAuthStore } from '../store/useAuthStore';

export default function Notes() {
  const { profile } = useAuthStore();
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSubject, setFilterSubject] = useState('all');

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const notesQuery = query(collection(db, 'notes'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(notesQuery);
        const notesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        setNotes(notesData || []);
      } catch (error) {
        console.error("Error fetching notes:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotes();
  }, []);

  const filteredNotes = notes.filter(note => {
    if (filterSubject !== 'all' && note.subject !== filterSubject) return false;
    if (profile?.classLevel && note.classLevel !== profile.classLevel) return false;
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
      <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-8 md:p-12 text-white shadow-xl shadow-indigo-500/20">
        <div className="max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-black mb-6 tracking-tight">Expert Chapter-wise Notes</h1>
          <p className="text-indigo-100 text-lg md:text-xl leading-relaxed mb-8">
            Access precision-engineered study material designed for the 2026 Board curriculum. Our handwritten and digital notes focus on conceptual clarity, active recall, and exam-oriented formatting.
          </p>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full text-sm font-bold border border-white/10">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              Syllabus Aligned
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full text-sm font-bold border border-white/10">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              Expert Verified
            </div>
          </div>
        </div>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <h3 className="font-bold text-lg mb-3">Why Handwritten Notes?</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
            Studies show that handwritten content improves cognitive processing and retention. Our notes mimic this personal touch to help your brain engage more effectively with complex topics.
          </p>
        </div>
        <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <h3 className="font-bold text-lg mb-3">Exam-Ready Formatting</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
            We don't just provide theory. Every note includes previous year question (PYQ) highlights, important definitions in call-outs, and diagrammatic explanations.
          </p>
        </div>
        <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <h3 className="font-bold text-lg mb-3">Digital Portability</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
            Carry your entire library in your pocket. High-resolution PDFs optimized for tablets and smartphones ensure you can study anywhere, anytime.
          </p>
        </div>
      </section>

      <div className="flex flex-col sm:flex-row gap-4 bg-white dark:bg-gray-900 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subject</label>
          <select
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            className="w-full border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
      ) : filteredNotes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredNotes.map(note => (
            <NoteCard
              key={note.id}
              id={note.id}
              title={note.title}
              subject={note.subject}
              classLevel={note.classLevel}
              price={note.price}
              previewImage={note.previewImages?.[0]}
              type="note"
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
          <p className="text-gray-500 dark:text-gray-400">No notes found matching your filters.</p>
        </div>
      )}
    </div>
  );
}

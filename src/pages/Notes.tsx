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
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Chapter Notes</h1>
        <p className="text-gray-500 mt-2">Browse our collection of premium handwritten and printed notes.</p>
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
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <p className="text-gray-500">No notes found matching your filters.</p>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import NoteCard from '../components/NoteCard';
import { useAuthStore } from '../store/useAuthStore';

export default function MockTests() {
  const { profile } = useAuthStore();
  const [mockTests, setMockTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSubject, setFilterSubject] = useState('all');

  useEffect(() => {
    const fetchMockTests = async () => {
      try {
        const queryRef = query(collection(db, 'mockTests'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(queryRef);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        setMockTests(data || []);
      } catch (error) {
        console.error("Error fetching mock tests:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMockTests();
  }, []);

  const filteredMockTests = mockTests.filter(test => {
    if (filterSubject !== 'all' && test.subject !== filterSubject) return false;
    if (profile?.classLevel && test.classLevel !== profile.classLevel) return false;
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
        <h1 className="text-3xl font-bold text-gray-900">Mock Tests & Papers</h1>
        <p className="text-gray-500 mt-2">Practice with our collection of mock tests to ace your exams.</p>
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
      ) : filteredMockTests.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredMockTests.map(test => (
            <NoteCard
              key={test.id}
              id={test.id}
              title={test.title}
              subject={test.subject}
              classLevel={test.classLevel}
              price={test.price}
              previewImage={test.previewImages?.[0]}
              type="mockTest"
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <p className="text-gray-500">No mock tests found matching your filters.</p>
        </div>
      )}
    </div>
  );
}

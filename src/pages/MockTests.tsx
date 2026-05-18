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
    <div className="space-y-12">
      <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-3xl p-8 md:p-12 text-white shadow-xl shadow-orange-500/20">
        <div className="max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-black mb-6 tracking-tight">Mock Tests & Practice Papers</h1>
          <p className="text-orange-50 text-lg md:text-xl leading-relaxed mb-8">
            Bridge the gap between learning and performing. Our mock tests are engineered to simulate the actual board exam environment, helping you manage time, reduce anxiety, and master the exam pattern.
          </p>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full text-sm font-bold border border-white/10">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              Pattern Proof
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full text-sm font-bold border border-white/10">
              <span className="w-2 h-2 rounded-full bg-white" />
              Time-Bound Practice
            </div>
          </div>
        </div>
      </div>

      <section className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Why Practice with Mock Tests?</h2>
            <div className="space-y-4 text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
              <p>
                Knowing the syllabus is only half the battle. The other half is being able to recall that information under pressure within a strict 3-hour window. Mock tests are the ultimate physiological and psychological prep for your finals.
              </p>
              <p>
                Our tests are designed by educators who have spent years marking board papers. They know exactly where students lose marks—whether it's poor diagram labeling, lack of step-wise working in math, or failing to highlight keywords in social science.
              </p>
            </div>
          </div>
          <div className="bg-orange-50 dark:bg-orange-950/20 p-6 rounded-2xl border border-orange-100 dark:border-orange-900/40">
            <h4 className="font-bold text-orange-900 dark:text-orange-100 mb-4">Exam Day Blueprint</h4>
            <ul className="space-y-3">
              {[
                'Identify recurring question types.',
                'Master the art of answer presentation.',
                'Improve your writing speed and legibility.',
                'Build the stamina for long writing sessions.'
              ].map((tip, i) => (
                <li key={i} className="flex gap-3 text-xs text-orange-800 dark:text-orange-300">
                  <span className="font-bold text-orange-500">{i + 1}.</span>
                  {tip}
                </li>
              ))}
            </ul>
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

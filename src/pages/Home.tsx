import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Award, Zap, ArrowRight, Star } from 'lucide-react';
import { db } from '../firebase';
import { collection, query, limit, getDocs, where } from 'firebase/firestore';
import NoteCard from '../components/NoteCard';
import { useAuthStore } from '../store/useAuthStore';

export default function Home() {
  const { profile } = useAuthStore();
  const [bestSellerBundles, setBestSellerBundles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBestSellers = async () => {
      try {
        let bundlesQuery = query(collection(db, 'bundles'), limit(4));
        if (profile?.classLevel) {
          bundlesQuery = query(collection(db, 'bundles'), where('classLevel', '==', profile.classLevel), limit(4));
        }
        
        const bundlesSnapshot = await getDocs(bundlesQuery);
        const bundlesData = bundlesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        const enrichedBundles = bundlesData;

        setBestSellerBundles(enrichedBundles);
      } catch (error) {
        console.error("Error fetching best sellers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBestSellers();
  }, [profile?.classLevel]);

  return (
    <div className="flex flex-col items-center">
      {/* Hero Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-indigo-50 dark:bg-indigo-950/30 rounded-3xl mb-12 text-center px-4 transition-colors">
        <div className="max-w-3xl mx-auto space-y-6">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl text-indigo-900 dark:text-indigo-100">
            Welcome to Notes Adda
          </h1>
          <p className="text-xl text-indigo-700 dark:text-indigo-300 max-w-2xl mx-auto">
            Ace your exams with premium, high-quality, handwritten and printed PDF notes for Classes 9-12. 
            Affordable prices, and guaranteed success.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
            <Link
              to="/notes"
              className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 md:py-4 md:text-lg md:px-10 shadow-lg hover:shadow-xl transition-all"
            >
              Browse Notes
            </Link>
            <Link
              to="/bundles"
              className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/50 hover:bg-indigo-200 dark:hover:bg-indigo-900/70 md:py-4 md:text-lg md:px-10 transition-all"
            >
              View Bundles
            </Link>
          </div>
        </div>
      </section>

      {/* Best Sellers Section */}
      {!loading && bestSellerBundles.length > 0 && (
        <section className="w-full py-12 mb-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
              <Award className="h-8 w-8 text-indigo-600 dark:text-indigo-400 mr-3" />
              Best Sellers
            </h2>
            <Link to="/bundles" className="text-indigo-600 font-bold flex items-center hover:underline">
              See All <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {bestSellerBundles.map(bundle => (
              <NoteCard
                key={bundle.id}
                id={bundle.id}
                title={bundle.title}
                subject={bundle.subject}
                classLevel={bundle.classLevel}
                price={bundle.price}
                previewImage={bundle.previewImages?.[0] || ''}
                type="bundle"
                isFeatured={true}
              />
            ))}
          </div>
        </section>
      )}

      {/* Latest Study Articles Section */}
      <section className="w-full py-12 mb-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
            <BookOpen className="h-8 w-8 text-indigo-600 dark:text-indigo-400 mr-3" />
            Latest Study Guides
          </h2>
          <Link to="/articles" className="text-indigo-600 font-bold flex items-center hover:underline">
            Read Blog <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[
            {
              id: '1',
              title: 'Top 5 Study Techniques for Class 12 Boards in 2026',
              summary: 'In 2026, the exam pattern favors conceptual clarity over rote memorization. Learn how to implement Pomodoro and Active Recall effectively.'
            },
            {
              id: '2',
              title: 'Building a Revision Schedule That Actually Works',
              summary: 'Most students fail because they don\'t account for downtime. Learn how to structure your day according to your circadian rhythm.'
            }
          ].map(art => (
            <Link 
              key={art.id} 
              to={`/articles/${art.id}`}
              className="p-8 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 hover:shadow-xl hover:border-indigo-100 dark:hover:border-indigo-900 transition-all group"
            >
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 group-hover:text-indigo-600 transition-colors">{art.title}</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-6">{art.summary}</p>
              <div className="flex items-center text-indigo-600 font-bold text-sm">
                Read Full Article <ArrowRight className="ml-2 h-4 w-4" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="w-full py-12">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8 text-center">Comprehensive Study Resources</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          <Link to="/notes" className="flex flex-col items-center text-center p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md hover:border-indigo-100 dark:hover:border-indigo-900 transition-all group">
            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/50 rounded-full mb-4 group-hover:bg-indigo-200 dark:group-hover:bg-indigo-900/70 transition-colors">
              <BookOpen className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Detailed Notes</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Access high-quality handwritten and printed PDF notes specifically designed for CBSE and state board students from Class 9 to 12.</p>
          </Link>
          
          <Link to="/bundles" className="flex flex-col items-center text-center p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md hover:border-indigo-100 dark:hover:border-indigo-900 transition-all group">
            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/50 rounded-full mb-4 group-hover:bg-indigo-200 dark:group-hover:bg-indigo-900/70 transition-colors">
              <Award className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Curated Bundles</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Our subject bundles offer a complete package for entire terms or sessions, ensuring you never miss a topic while saving up to 40%.</p>
          </Link>
          
          <Link to="/mindMaps" className="flex flex-col items-center text-center p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md hover:border-indigo-100 dark:hover:border-indigo-900 transition-all group">
            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/50 rounded-full mb-4 group-hover:bg-indigo-200 dark:group-hover:bg-indigo-900/70 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-indigo-600 dark:text-indigo-400"><path d="M12 22c-5.52 0-10-4.48-10-10S6.48 2 12 2s10 4.48 10 10-4.48 10-10 10zM12 16v-4m0-4h.01"/></svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Visual Planning</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Visualize complex scientific and mathematical concepts with our hand-crafted Mind Maps designed for rapid recall and exam revision.</p>
          </Link>

          <Link to="/audioNotes" className="flex flex-col items-center text-center p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md hover:border-indigo-100 dark:hover:border-indigo-900 transition-all group">
            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/50 rounded-full mb-4 group-hover:bg-indigo-200 dark:group-hover:bg-indigo-900/70 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-indigo-600 dark:text-indigo-400"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Active Listening</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Turn your travel time into study time. Our audio summaries cover the crux of every chapter, narrated for clear understanding.</p>
          </Link>
          
          <Link to="/mockTests" className="flex flex-col items-center text-center p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md hover:border-indigo-100 dark:hover:border-indigo-900 transition-all group">
            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/50 rounded-full mb-4 group-hover:bg-indigo-200 dark:group-hover:bg-indigo-900/70 transition-colors">
              <Zap className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Exam Readiness</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Practice makes perfect. Attempt our custom-designed mock tests to identify weak areas and track your improvement over time.</p>
          </Link>
        </div>
      </section>

      {/* Informational Rich Text Section */}
      <section className="w-full py-16 px-4 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 my-12 transition-colors">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-gray-100">Why Notes Adda is the Gold Standard for Student Success</h2>
            <div className="h-1.5 w-24 bg-indigo-600 mx-auto rounded-full" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-gray-600 dark:text-gray-400 leading-relaxed">
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Quality You Can Trust</h3>
              <p>
                At Notes Adda, we believe that education should be accessible and understandable. Our notes are not just summaries; they are comprehensive guides written by subject matter experts who understand the nuances of Class 9 to 12 curricula. We focus on clarity, accuracy, and engagement.
              </p>
              <p>
                Every diagram is meticulously drawn, and every explanation is crafted to address the common doubts students face during self-study. Whether it's the complex reactions of organic chemistry or the intricate laws of physics, our notes break them down into bite-sized, digestible pieces.
              </p>
            </div>
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Designed for Retention</h3>
              <p>
                Rote learning is a thing of the past. Our multi-sensory approach—combining visual notes, audio summaries, and interactive mock tests—is designed to help you retain information longer. Our mind maps utilize spatial memory techniques, making it easier to recall facts during high-pressure exams.
              </p>
              <p>
                By providing both handwritten and printed formats, we cater to different learning styles. Handwritten notes offer a personal touch that many students find more relatable and easier to follow, while printed notes provide a crisp, structured layout for formal study.
              </p>
            </div>
          </div>

          <div className="bg-indigo-50 dark:bg-indigo-900/20 p-8 rounded-2xl space-y-6">
            <h3 className="text-2xl font-bold text-indigo-900 dark:text-indigo-100 text-center">Tips for Effective Self-Study</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="text-center space-y-2">
                <div className="text-3xl font-black text-indigo-600 mb-2">01</div>
                <h4 className="font-bold text-gray-900 dark:text-gray-100 uppercase text-sm tracking-widest">Consistency</h4>
                <p className="text-xs">Study for at least 2 hours daily using our chapter-wise notes to maintain momentum.</p>
              </div>
              <div className="text-center space-y-2">
                <div className="text-3xl font-black text-indigo-600 mb-2">02</div>
                <h4 className="font-bold text-gray-900 dark:text-gray-100 uppercase text-sm tracking-widest">Active Recall</h4>
                <p className="text-xs">Use our mock tests after finishing a chapter to test your retention immediately.</p>
              </div>
              <div className="text-center space-y-2">
                <div className="text-3xl font-black text-indigo-600 mb-2">03</div>
                <h4 className="font-bold text-gray-900 dark:text-gray-100 uppercase text-sm tracking-widest">Revision</h4>
                <p className="text-xs">Revisit the mind maps every weekend to keep the concepts fresh in your mind.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section for better crawling */}
      <section className="w-full py-16 px-4">
        <div className="max-w-3xl mx-auto space-y-8">
          <h2 className="text-center text-3xl font-bold text-gray-900 dark:text-gray-100 mb-12">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <div className="p-6 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
              <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-2">Are the notes updated according to the latest 2026 syllabus?</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Yes, all our study materials, including bundles and chapter notes, are updated annually to reflect the latest changes in the CBSE and State Board curricula.</p>
            </div>
            <div className="p-6 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
              <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-2">Can I access my purchased notes on multiple devices?</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Absolutely. Once you purchase a note or bundle, it is linked to your account and can be accessed from our dashboard on any smartphone, tablet, or computer.</p>
            </div>
            <div className="p-6 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
              <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-2">What format are the notes in?</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Our notes are provided in high-resolution PDF format. They are optimized for both screen viewing and printing.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="w-full py-16 mt-12 bg-gray-900 dark:bg-indigo-900/40 rounded-3xl text-center px-4 transition-colors">
        <h2 className="text-3xl font-bold text-white mb-4">Refer Friends, Earn Discounts</h2>
        <p className="text-gray-300 dark:text-gray-400 max-w-2xl mx-auto mb-8">
          Share your unique referral code with friends. When they sign up and make a purchase, both of you get a 20% discount!
        </p>
        <Link
          to="/login"
          className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-gray-900 bg-white hover:bg-gray-50 transition-all"
        >
          Get Started Now
          <ArrowRight className="ml-2 h-5 w-5" />
        </Link>
      </section>
    </div>
  );
}

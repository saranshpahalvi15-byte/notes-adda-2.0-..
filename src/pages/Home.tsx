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

      {/* Categories */}
      <section className="w-full py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          <Link to="/notes" className="flex flex-col items-center text-center p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md hover:border-indigo-100 dark:hover:border-indigo-900 transition-all group">
            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/50 rounded-full mb-4 group-hover:bg-indigo-200 dark:group-hover:bg-indigo-900/70 transition-colors">
              <BookOpen className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Chapter-wise Notes</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Detailed notes for specific chapters.</p>
          </Link>
          
          <Link to="/bundles" className="flex flex-col items-center text-center p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md hover:border-indigo-100 dark:hover:border-indigo-900 transition-all group">
            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/50 rounded-full mb-4 group-hover:bg-indigo-200 dark:group-hover:bg-indigo-900/70 transition-colors">
              <Award className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Subject Bundles</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Save money with complete subject bundles.</p>
          </Link>
          
          <Link to="/mindMaps" className="flex flex-col items-center text-center p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md hover:border-indigo-100 dark:hover:border-indigo-900 transition-all group">
            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/50 rounded-full mb-4 group-hover:bg-indigo-200 dark:group-hover:bg-indigo-900/70 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-indigo-600 dark:text-indigo-400"><path d="M12 22c-5.52 0-10-4.48-10-10S6.48 2 12 2s10 4.48 10 10-4.48 10-10 10zM12 16v-4m0-4h.01"/></svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Mind Maps</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Visual summaries for quick revision.</p>
          </Link>

          <Link to="/audioNotes" className="flex flex-col items-center text-center p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md hover:border-indigo-100 dark:hover:border-indigo-900 transition-all group">
            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/50 rounded-full mb-4 group-hover:bg-indigo-200 dark:group-hover:bg-indigo-900/70 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-indigo-600 dark:text-indigo-400"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Audio Notes</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Learn on the go with high-quality audio.</p>
          </Link>
          
          <Link to="/mockTests" className="flex flex-col items-center text-center p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md hover:border-indigo-100 dark:hover:border-indigo-900 transition-all group">
            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/50 rounded-full mb-4 group-hover:bg-indigo-200 dark:group-hover:bg-indigo-900/70 transition-colors">
              <Zap className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Mock Tests</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Test your knowledge with practice tests.</p>
          </Link>
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

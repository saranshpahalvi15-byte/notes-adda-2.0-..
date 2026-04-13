import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Award, Zap, ArrowRight, Star } from 'lucide-react';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../firebase';
import NoteCard from '../components/NoteCard';

export default function Home() {
  const [bestSellerBundles, setBestSellerBundles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBestSellers = async () => {
      try {
        const bundlesQ = query(collection(db, 'bundles'), limit(4));
        const bundlesSnap = await getDocs(bundlesQ);
        
        const bundlesData = bundlesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
        
        // Backfill preview images for older bundles
        const allNotesSnapshot = await getDocs(collection(db, 'notes'));
        const allNotes = allNotesSnapshot.docs.map(d => d.data());

        const enrichedBundles = bundlesData.map(bundle => {
          if (!bundle.previewImages || bundle.previewImages.length === 0) {
            const matchingNote = allNotes.find(n => 
              n.classLevel === bundle.classLevel && 
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

        setBestSellerBundles(enrichedBundles);
      } catch (error) {
        console.error("Error fetching best sellers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBestSellers();
  }, []);

  return (
    <div className="flex flex-col items-center">
      {/* Hero Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-indigo-50 rounded-3xl mb-12 text-center px-4">
        <div className="max-w-3xl mx-auto space-y-6">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl text-indigo-900">
            Ace Your Exams with Premium Notes
          </h1>
          <p className="text-xl text-indigo-700 max-w-2xl mx-auto">
            High-quality, handwritten and printed PDF notes for Classes 9-12. 
            Instant download, affordable prices, and guaranteed success.
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
              className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 md:py-4 md:text-lg md:px-10 transition-all"
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
            <h2 className="text-3xl font-bold text-gray-900 flex items-center">
              <Award className="h-8 w-8 text-indigo-600 mr-3" />
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

      {/* Features */}
      <section className="w-full py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex flex-col items-center text-center p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="p-3 bg-indigo-100 rounded-full mb-4">
              <BookOpen className="h-8 w-8 text-indigo-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Chapter-wise Notes</h3>
            <p className="text-gray-500">Get detailed notes for specific chapters at just ₹25 each. Buy only what you need.</p>
          </div>
          <div className="flex flex-col items-center text-center p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="p-3 bg-indigo-100 rounded-full mb-4">
              <Award className="h-8 w-8 text-indigo-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Full Subject Bundles</h3>
            <p className="text-gray-500">Save money with complete subject bundles for ₹249. Everything you need in one place.</p>
          </div>
          <div className="flex flex-col items-center text-center p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="p-3 bg-indigo-100 rounded-full mb-4">
              <Zap className="h-8 w-8 text-indigo-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Instant Access</h3>
            <p className="text-gray-500">Download your PDF notes instantly after secure payment. Study anytime, anywhere.</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="w-full py-16 mt-12 bg-gray-900 rounded-3xl text-center px-4">
        <h2 className="text-3xl font-bold text-white mb-4">Refer Friends, Earn Discounts</h2>
        <p className="text-gray-300 max-w-2xl mx-auto mb-8">
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

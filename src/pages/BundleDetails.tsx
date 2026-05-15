import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc, collection, query, where, getDocs, updateDoc, addDoc } from 'firebase/firestore';
import { useAuthStore } from '../store/useAuthStore';
import { getDrivePreviewUrl } from '../lib/driveUtils';
import { ShoppingCart, CheckCircle, Layers, Star, BookOpen, Mic, BrainCircuit } from 'lucide-react';
import { usePurchasedItems } from '../hooks/usePurchasedItems';

export default function BundleDetails() {
  const { id } = useParams<{ id: string }>();
  const [bundle, setBundle] = useState<any>(null);
  const [includedNotes, setIncludedNotes] = useState<any[]>([]);
  const [includedMindMaps, setIncludedMindMaps] = useState<any[]>([]);
  const [includedAudioNotes, setIncludedAudioNotes] = useState<any[]>([]);
  const [includedMockTests, setIncludedMockTests] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [hasPurchased, setHasPurchased] = useState(false);
  const navigate = useNavigate();
  const { user, profile, setNotification } = useAuthStore();
  const { purchasedIds } = usePurchasedItems();

  // Review form state
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [originalPrice, setOriginalPrice] = useState(0);
  const [discountPercent, setDiscountPercent] = useState(0);

  useEffect(() => {
    if (bundle && bundle.price) {
      const getConsistentRandom = (str: string) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
          hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        return Math.abs(hash);
      };
      const discount = bundle.discountPercent !== undefined && bundle.discountPercent !== null ? bundle.discountPercent : (20 + (getConsistentRandom(bundle.id || id || '') % 31));
      setDiscountPercent(discount);
      setOriginalPrice(Math.round((bundle.price * 100) / (100 - discount)));
    }
  }, [bundle, id]);

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile || !id) return;

    try {
      setIsSubmittingReview(true);
      const reviewData = {
        bundleId: id,
        userId: user.uid,
        userName: profile.name,
        rating,
        comment,
        createdAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, 'reviews'), reviewData);

      // Update bundle rating
      const newReviewCount = (bundle.reviewCount || 0) + 1;
      const currentTotalRating = (bundle.rating || 0) * (bundle.reviewCount || 0);
      const newRating = (currentTotalRating + rating) / newReviewCount;

      await updateDoc(doc(db, 'bundles', id), {
        rating: newRating,
        reviewCount: newReviewCount
      });

      // Refresh data locally
      setReviews([...reviews, { id: docRef.id, ...reviewData }]);
      setBundle({ ...bundle, rating: newRating, reviewCount: newReviewCount });
      setComment('');
      setRating(5);
      setNotification({ message: 'Review submitted successfully!', type: 'success' });
    } catch (error) {
      console.error("Error submitting review:", error);
      setNotification({ message: 'Failed to submit review', type: 'error' });
    } finally {
      setIsSubmittingReview(false);
    }
  };

  useEffect(() => {
    const fetchBundleAndNotes = async () => {
      if (!id) return;
      try {
        const bundleDoc = await getDoc(doc(db, 'bundles', id));
        if (!bundleDoc.exists()) throw new Error("Bundle not found");
        const bundleData = { id: bundleDoc.id, ...bundleDoc.data() } as any;
        setBundle(bundleData);

        if (bundleData.noteIds && bundleData.noteIds.length > 0) {
          const notesQuery = query(collection(db, 'notes'), where('__name__', 'in', bundleData.noteIds));
          const notesSnapshot = await getDocs(notesQuery);
          setIncludedNotes(notesSnapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        } else if (!bundleData.mindMapIds && !bundleData.audioNoteIds && !bundleData.mockTestIds) {
          // Legacy behavior: If no specific notes selected and no other item type arrays exist, 
          // fetch all notes for this class and subject
          const notesQuery = query(
            collection(db, 'notes'), 
            where('classLevel', '==', bundleData.classLevel),
            where('subject', '==', bundleData.subject)
          );
          const notesSnapshot = await getDocs(notesQuery);
          const matchingNotes = notesSnapshot.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
          
          // Sort notes by title to keep chapters in order if possible
          const class9ScienceOrder = [
            "MATTER IN OUR SURROUNDINGS",
            "IS MATTER AROUND US PURE",
            "ATOMS AND MOLECULES",
            "STRUCTURE OF THE ATOM",
            "THE FUNDAMENTAL UNIT OF LIFE",
            "TISSUES",
            "MOTION",
            "FORCE AND LAWS OF MOTION",
            "GRAVITATION",
            "WORK AND ENERGY",
            "SOUND",
            "IMPROVEMENT IN FOOD RESOURCES"
          ];

          matchingNotes.sort((a: any, b: any) => {
            if (bundleData.classLevel === '9' && bundleData.subject && bundleData.subject.toLowerCase() === 'science') {
              const aName = a.title.split(':- ')[1]?.trim().toUpperCase() || a.title.toUpperCase();
              const bName = b.title.split(':- ')[1]?.trim().toUpperCase() || b.title.toUpperCase();
              const aIndex = class9ScienceOrder.indexOf(aName);
              const bIndex = class9ScienceOrder.indexOf(bName);
              
              if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
              if (aIndex !== -1) return -1;
              if (bIndex !== -1) return 1;
            }
            return a.title.localeCompare(b.title);
          });
          
          setIncludedNotes(matchingNotes);
        }

        // Fetch other included items if their IDs exist
        if (bundleData.mindMapIds && bundleData.mindMapIds.length > 0) {
          const mindMapsQuery = query(collection(db, 'mindMaps'), where('__name__', 'in', bundleData.mindMapIds));
          const mindMapsSnapshot = await getDocs(mindMapsQuery);
          setIncludedMindMaps(mindMapsSnapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        }

        if (bundleData.audioNoteIds && bundleData.audioNoteIds.length > 0) {
          const audioNotesQuery = query(collection(db, 'audioNotes'), where('__name__', 'in', bundleData.audioNoteIds));
          const audioNotesSnapshot = await getDocs(audioNotesQuery);
          setIncludedAudioNotes(audioNotesSnapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        }

        if (bundleData.mockTestIds && bundleData.mockTestIds.length > 0) {
          const mockTestsQuery = query(collection(db, 'mockTests'), where('__name__', 'in', bundleData.mockTestIds));
          const mockTestsSnapshot = await getDocs(mockTestsQuery);
          setIncludedMockTests(mockTestsSnapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        }

        // Fetch reviews
        const reviewsQuery = query(collection(db, 'reviews'), where('bundleId', '==', id));
        const reviewsSnapshot = await getDocs(reviewsQuery);
        setReviews(reviewsSnapshot.docs.map(d => ({ id: d.id, ...d.data() })));

        // Check if user has purchased
        if (user) {
          const ordersQuery = query(
            collection(db, 'orders'),
            where('userId', '==', user.uid)
          );
          const ordersSnapshot = await getDocs(ordersQuery);
          const ordersData = ordersSnapshot.docs.map(d => d.data());
          
          const hasBought = ordersData.some((order: any) => {
            // Consider order as valid if status is 'completed' OR if status field is missing (legacy)
            if (order.status === 'completed' || !order.status) {
              return order.items && order.items.some((item: any) => item.itemId === id);
            }
            return false;
          });
          setHasPurchased(hasBought);
        }
      } catch (error) {
        console.error("Error fetching bundle:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBundleAndNotes();
  }, [id, user]);

  const handleBuy = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    navigate('/checkout', { state: { items: [{ ...bundle, type: 'bundle' }] } });
  };

  const getDirectDownloadUrl = (url: string) => {
    if (!url) return '';
    try {
      const urlObj = new URL(url);
      if (urlObj.hostname.includes('drive.google.com')) {
        const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
        if (match && match[1]) {
          return `https://drive.google.com/uc?export=download&id=${match[1]}`;
        }
        const id = urlObj.searchParams.get('id');
        if (id) {
          return `https://drive.google.com/uc?export=download&id=${id}`;
        }
      } else if (urlObj.hostname.includes('dropbox.com')) {
        urlObj.searchParams.set('dl', '1');
        return urlObj.toString();
      }
    } catch (e) {
      return url;
    }
    return url;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!bundle) {
    return <div className="text-center py-20 text-xl text-gray-600">Bundle not found</div>;
  }

  // Use bundle's preview images if available, otherwise fallback to included notes
  const allPreviewImages = bundle.previewImages && bundle.previewImages.length > 0 
    ? bundle.previewImages 
    : includedNotes.flatMap(note => note.previewImages || []).slice(0, 5);

  return (
    <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8">
        {/* Image Gallery */}
        <div className="space-y-4">
          <div className="aspect-[4/3] bg-gray-100 rounded-xl overflow-hidden border border-gray-200 flex items-center justify-center">
            {allPreviewImages.length > 0 ? (
              <img 
                src={allPreviewImages[activeImage]} 
                alt={`Preview ${activeImage + 1}`} 
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="text-gray-400 flex flex-col items-center">
                <Layers className="h-16 w-16 mb-4 opacity-50" />
                No previews available
              </div>
            )}
          </div>
          
          {allPreviewImages.length > 1 && (
            <div className="flex gap-4 overflow-x-auto pb-2">
              {allPreviewImages.map((img: string, idx: number) => (
                <button 
                  key={idx}
                  onClick={() => setActiveImage(idx)}
                  className={`flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden border-2 transition-all ${
                    activeImage === idx ? 'border-indigo-600 opacity-100' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </button>
              ))}
            </div>
          )}
          <p className="text-sm font-bold text-red-600 italic mt-2 text-center max-w-[362.5px] mx-auto">
            * Previews show limited pages. Full content is unlocked after purchase.
          </p>
        </div>

        {/* Details */}
        <div className="flex flex-col">
          <div className="mb-2 flex items-center gap-2">
            <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-semibold flex items-center">
              <Layers className="w-4 h-4 mr-1" /> Bundle
            </span>
            <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-semibold">
              Class {bundle.classLevel}
            </span>
            <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-semibold uppercase tracking-wider">
              {bundle.subject}
            </span>
          </div>
          
          <h1 className="text-3xl font-extrabold text-gray-900 mb-4">{bundle.title}</h1>
          
          <div className="prose prose-indigo text-gray-600 mb-8 flex-1">
            <p>{bundle.description}</p>
          </div>
          
          <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 mb-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Included Items ({includedNotes.length + includedMindMaps.length + includedAudioNotes.length + includedMockTests.length}):</h3>
            <ul className="space-y-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
              {includedNotes.map(note => (
                <li key={`note-${note.id}`} className="flex items-center justify-between text-gray-700 bg-white p-3 rounded-lg border border-gray-200">
                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                    <div className="flex flex-col">
                      <span className="font-medium text-xs text-indigo-700 uppercase tracking-wider">Note</span>
                      <span className="font-medium">{note.title}</span>
                    </div>
                  </div>
                  {(hasPurchased || purchasedIds.has(note.id) || profile?.role === 'admin') && (
                    <button 
                      onClick={() => navigate(`/notes/${note.id}`, { state: { autoRead: true } })}
                      className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg font-bold hover:bg-indigo-100 transition-colors"
                    >
                      Read
                    </button>
                  )}
                </li>
              ))}
              {includedMindMaps.map(item => (
                <li key={`mindmap-${item.id}`} className="flex items-center justify-between text-gray-700 bg-white p-3 rounded-lg border border-gray-200">
                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                    <div className="flex flex-col">
                      <span className="font-medium text-xs text-pink-600 uppercase tracking-wider">Mind Map</span>
                      <span className="font-medium">{item.title}</span>
                    </div>
                  </div>
                  {(hasPurchased || purchasedIds.has(item.id) || profile?.role === 'admin') && (
                    <button 
                      onClick={() => navigate(`/mindMaps/${item.id}`, { state: { autoRead: true } })}
                      className="text-xs bg-pink-50 text-pink-600 px-3 py-1.5 rounded-lg font-bold hover:bg-pink-100 transition-colors"
                    >
                      View
                    </button>
                  )}
                </li>
              ))}
              {includedAudioNotes.map(item => (
                <li key={`audio-${item.id}`} className="flex items-center justify-between text-gray-700 bg-white p-3 rounded-lg border border-gray-200">
                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                    <div className="flex flex-col">
                      <span className="font-medium text-xs text-amber-600 uppercase tracking-wider">Audio Explanation</span>
                      <span className="font-medium">{item.title}</span>
                    </div>
                  </div>
                  {(hasPurchased || purchasedIds.has(item.id) || profile?.role === 'admin') && (
                    <button 
                      onClick={() => navigate(`/audioNotes`)}
                      className="text-xs bg-amber-50 text-amber-600 px-3 py-1.5 rounded-lg font-bold hover:bg-amber-100 transition-colors"
                    >
                      Listen
                    </button>
                  )}
                </li>
              ))}
              {includedMockTests.map(item => (
                <li key={`mocktest-${item.id}`} className="flex items-center justify-between text-gray-700 bg-white p-3 rounded-lg border border-gray-200">
                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                    <div className="flex flex-col">
                      <span className="font-medium text-xs text-purple-600 uppercase tracking-wider">Mock Test</span>
                      <span className="font-medium">{item.title}</span>
                    </div>
                  </div>
                  {(hasPurchased || purchasedIds.has(item.id) || profile?.role === 'admin') && (
                    <button 
                      onClick={() => navigate(`/mockTests/${item.id}`, { state: { autoRead: true } })}
                      className="text-xs bg-purple-50 text-purple-600 px-3 py-1.5 rounded-lg font-bold hover:bg-purple-100 transition-colors"
                    >
                      Take Test
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-center justify-between mt-auto pt-6 border-t border-gray-100">
            <div>
              <p className="text-sm text-gray-500 font-medium mb-1">Bundle Price</p>
              <div className="flex items-end gap-3">
                <p className="text-4xl font-extrabold text-gray-900">₹{bundle.price}</p>
                {originalPrice > 0 && bundle.price > 0 && (
                  <div className="flex flex-col pb-1">
                    <span className="text-gray-400 line-through text-lg mt-0.5">₹{originalPrice}</span>
                    <span className="text-green-600 font-semibold text-sm">{discountPercent}% OFF</span>
                  </div>
                )}
              </div>
              {!hasPurchased && <p className="text-sm text-green-600 font-medium mt-1">Save big compared to individual chapters!</p>}
            </div>
            
            {hasPurchased ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center text-green-600 font-medium bg-green-50 px-4 py-2 rounded-lg">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Purchased
                </div>
              </div>
            ) : (
              <button
                onClick={handleBuy}
                className="flex items-center justify-center px-8 py-4 border border-transparent text-lg font-medium rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg hover:shadow-xl transition-all"
              >
                <ShoppingCart className="h-6 w-6 mr-2" />
                Buy Bundle
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mt-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center">
          <Star className="h-6 w-6 text-amber-500 mr-2 fill-amber-500" />
          Student Reviews
        </h2>

        {hasPurchased && (
          <form onSubmit={submitReview} className="mb-10 bg-gray-50 p-6 rounded-2xl border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Write a Review</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="focus:outline-none"
                  >
                    <Star className={`h-8 w-8 ${star <= rating ? 'text-amber-500 fill-amber-500' : 'text-gray-300'}`} />
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Comment</label>
              <textarea
                required
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Share your experience with this bundle..."
              ></textarea>
            </div>
            <button
              type="submit"
              disabled={isSubmittingReview}
              className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        )}

        {reviews.length > 0 ? (
          <div className="space-y-6">
            {reviews.map((review) => (
              <div key={review.id} className="border-b border-gray-100 pb-6 last:border-0 last:pb-0">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-gray-900">{review.userName}</span>
                  <span className="text-sm text-gray-500">{new Date(review.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center mb-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className={`h-4 w-4 ${star <= review.rating ? 'text-amber-500 fill-amber-500' : 'text-gray-300'}`} />
                  ))}
                </div>
                <p className="text-gray-700">{review.comment}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No reviews yet. Be the first to review!</p>
        )}
      </div>
    </div>
  );
}

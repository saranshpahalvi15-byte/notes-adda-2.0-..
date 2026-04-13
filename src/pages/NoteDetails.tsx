import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, addDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuthStore } from '../store/useAuthStore';
import { ShoppingCart, CheckCircle, Star } from 'lucide-react';

export default function NoteDetails() {
  const { id } = useParams<{ id: string }>();
  const [note, setNote] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const navigate = useNavigate();
  const { user, profile } = useAuthStore();

  // Review form state
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [hasPurchased, setHasPurchased] = useState(false);

  useEffect(() => {
    const fetchNoteAndReviews = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'notes', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setNote({ id: docSnap.id, ...docSnap.data() });
        }

        // Fetch reviews
        const reviewsQ = query(collection(db, 'reviews'), where('noteId', '==', id));
        const reviewsSnap = await getDocs(reviewsQ);
        setReviews(reviewsSnap.docs.map(d => ({ id: d.id, ...d.data() })));

        // Check if user has purchased
        if (user) {
          const ordersQ = query(
            collection(db, 'orders'), 
            where('userId', '==', user.uid),
            where('status', '==', 'completed')
          );
          const ordersSnap = await getDocs(ordersQ);
          const hasBought = ordersSnap.docs.some(doc => {
            const data = doc.data();
            return data.items && data.items.some((item: any) => item.itemId === id);
          });
          setHasPurchased(hasBought);
        }

      } catch (error) {
        console.error("Error fetching note:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNoteAndReviews();
  }, [id, user]);

  const handleBuy = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    navigate('/checkout', { state: { items: [{ ...note, type: 'note' }] } });
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile || !id) return;

    try {
      setSubmittingReview(true);
      const reviewData = {
        noteId: id,
        userId: user.uid,
        userName: profile.name,
        rating,
        comment,
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'reviews'), reviewData);

      // Update note rating
      const newReviewCount = (note.reviewCount || 0) + 1;
      const currentTotalRating = (note.rating || 0) * (note.reviewCount || 0);
      const newRating = (currentTotalRating + rating) / newReviewCount;

      await updateDoc(doc(db, 'notes', id), {
        rating: newRating,
        reviewCount: newReviewCount
      });

      // Refresh data locally
      setReviews([...reviews, reviewData]);
      setNote({ ...note, rating: newRating, reviewCount: newReviewCount });
      setComment('');
      setRating(5);
      alert("Review submitted successfully!");
    } catch (error) {
      console.error("Error submitting review:", error);
      alert("Failed to submit review");
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!note) {
    return <div className="text-center py-20 text-xl text-gray-600">Note not found</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="aspect-[4/3] bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
              {note.previewImages && note.previewImages.length > 0 ? (
                <img 
                  src={note.previewImages[activeImage]} 
                  alt={`Preview ${activeImage + 1}`} 
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">No preview available</div>
              )}
            </div>
            
            {note.previewImages && note.previewImages.length > 1 && (
              <div className="flex gap-4 overflow-x-auto pb-2">
                {note.previewImages.map((img: string, idx: number) => (
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
              <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-semibold">
                Class {note.classLevel}
              </span>
              <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-semibold uppercase tracking-wider">
                {note.subject}
              </span>
              {note.rating > 0 && (
                <div className="flex items-center text-sm font-medium text-amber-500 ml-auto">
                  <Star className="h-4 w-4 fill-amber-500 mr-1" />
                  {note.rating.toFixed(1)} ({note.reviewCount} reviews)
                </div>
              )}
            </div>
            
            <h1 className="text-3xl font-extrabold text-gray-900 mb-4">{note.title}</h1>
            
            <div className="prose prose-indigo text-gray-600 mb-8 flex-1">
              <p>{note.description}</p>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 mb-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4">What's included:</h3>
              <ul className="space-y-3">
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  High-quality PDF format
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  Instant download after purchase
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  Lifetime access
                </li>
              </ul>
            </div>

            <div className="flex items-center justify-between mt-auto pt-6 border-t border-gray-100">
              <div>
                <p className="text-sm text-gray-500 font-medium mb-1">Price</p>
                <p className="text-4xl font-extrabold text-gray-900">₹{note.price}</p>
              </div>
              <button
                onClick={handleBuy}
                className="flex items-center justify-center px-8 py-4 border border-transparent text-lg font-medium rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg hover:shadow-xl transition-all"
              >
                <ShoppingCart className="h-6 w-6 mr-2" />
                Buy Now
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
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
                placeholder="Share your experience with these notes..."
              ></textarea>
            </div>
            <button
              type="submit"
              disabled={submittingReview}
              className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {submittingReview ? 'Submitting...' : 'Submit Review'}
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

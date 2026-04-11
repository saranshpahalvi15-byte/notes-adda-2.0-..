import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Star } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../firebase';

interface NoteCardProps {
  id: string;
  title: string;
  subject: string;
  classLevel: string;
  price: number;
  previewImage: string;
  type: 'note' | 'bundle';
  isFeatured?: boolean;
  rating?: number;
  reviewCount?: number;
}

const NoteCard: React.FC<NoteCardProps> = ({ id, title, subject, classLevel, price, previewImage, type, isFeatured, rating, reviewCount }) => {
  const { user, profile, setProfile } = useAuthStore();
  
  const isWishlisted = profile?.wishlist?.includes(id) || false;

  const toggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user || !profile) {
      alert("Please login to add to wishlist");
      return;
    }

    const userRef = doc(db, 'users', user.uid);
    try {
      if (isWishlisted) {
        await updateDoc(userRef, {
          wishlist: arrayRemove(id)
        });
        setProfile({ ...profile, wishlist: (profile.wishlist || []).filter(itemId => itemId !== id) });
      } else {
        await updateDoc(userRef, {
          wishlist: arrayUnion(id)
        });
        setProfile({ ...profile, wishlist: [...(profile.wishlist || []), id] });
      }
    } catch (error) {
      console.error("Error updating wishlist", error);
    }
  };

  return (
    <div className={`bg-white rounded-2xl shadow-sm border ${isFeatured ? 'border-indigo-300 ring-1 ring-indigo-200' : 'border-gray-100'} overflow-hidden flex flex-col hover:shadow-md transition-shadow relative`}>
      {isFeatured && (
        <div className="absolute top-0 left-0 bg-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-br-lg z-10 uppercase tracking-wider">
          Featured
        </div>
      )}
      <button 
        onClick={toggleWishlist}
        className="absolute top-2 right-2 z-10 p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-colors shadow-sm"
      >
        <Heart className={`h-5 w-5 ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
      </button>
      
      <div className="aspect-video w-full bg-gray-100 relative">
        {previewImage ? (
          <img src={previewImage} alt={title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">No preview</div>
        )}
        <div className="absolute bottom-2 right-2 bg-white px-2 py-1 rounded-md text-xs font-bold text-indigo-600 shadow-sm">
          Class {classLevel}
        </div>
      </div>
      <div className="p-5 flex flex-col flex-1">
        <div className="flex justify-between items-start mb-1">
          <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold">{subject}</div>
          {rating !== undefined && rating > 0 && (
            <div className="flex items-center text-xs font-medium text-amber-500">
              <Star className="h-3 w-3 fill-amber-500 mr-1" />
              {rating.toFixed(1)} <span className="text-gray-400 ml-1">({reviewCount})</span>
            </div>
          )}
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">{title}</h3>
        <div className="mt-auto flex items-center justify-between pt-4">
          <span className="text-xl font-extrabold text-gray-900">₹{price}</span>
          <Link
            to={`/${type}s/${id}`}
            className="px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-sm font-medium transition-colors"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NoteCard;

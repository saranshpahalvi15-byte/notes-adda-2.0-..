import React from 'react';
import { Link } from 'react-router-dom';
import { Layers, Star } from 'lucide-react';

interface BundleCardProps {
  id: string;
  title: string;
  subject: string;
  classLevel: string;
  price: number;
  discountPercent?: number;
  previewImage?: string;
  rating?: number;
  reviewCount?: number;
}

const BundleCard: React.FC<BundleCardProps> = ({ id, title, subject, classLevel, price, discountPercent: itemDiscountPercent, previewImage, rating, reviewCount }) => {
  const getConsistentRandom = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
  };

  const discountPercent = itemDiscountPercent !== undefined && itemDiscountPercent !== null ? itemDiscountPercent : (20 + (getConsistentRandom(id) % 31));
  const originalPrice = Math.round((price * 100) / (100 - discountPercent));

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-100 dark:border-gray-800 flex flex-col h-full group overflow-hidden">
      <Link to={`/bundles/${id}`} className="block overflow-hidden aspect-[4/3] relative">
        <div className="absolute top-2 left-2 z-10">
          <span className="px-2 py-1 bg-amber-600 text-white text-[10px] font-black rounded-lg flex items-center shadow-lg">
            <Layers className="h-3 w-3 mr-1" />
            BUNDLE
          </span>
        </div>
        {previewImage ? (
          <img 
            src={previewImage} 
            alt={title} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full bg-indigo-50 dark:bg-indigo-900/20 flex flex-col items-center justify-center text-indigo-300 dark:text-indigo-800">
            <Layers className="h-12 w-12 mb-2" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Bundle Preview</span>
          </div>
        )}
      </Link>
      
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-black px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full uppercase">
            Class {classLevel}
          </span>
          <span className="text-[10px] font-black px-2 py-0.5 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full uppercase">
            {subject}
          </span>
          {rating && rating > 0 ? (
            <div className="flex items-center text-[10px] font-bold text-amber-500 ml-auto">
              <Star className="h-3 w-3 fill-amber-500 mr-1" />
              {rating.toFixed(1)}
            </div>
          ) : (
            <div className="flex items-center text-[10px] font-bold text-amber-500 ml-auto">
               <Star className="h-3 w-3 fill-amber-500 mr-1" />
               5.0
            </div>
          )}
        </div>
        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2 h-10 leading-tight">{title}</h3>
        
        <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-50 dark:border-gray-800">
          <div className="flex flex-col">
            <span className="text-lg font-black text-gray-900 dark:text-white">₹{price}</span>
            {originalPrice > 0 && price > 0 && (
              <div className="flex items-center gap-1.5 min-h-[14px]">
                <span className="text-[10px] text-gray-400 line-through">₹{originalPrice}</span>
                <span className="text-[10px] text-green-600 font-bold">{discountPercent}% OFF</span>
              </div>
            )}
          </div>
          <Link
            to={`/bundles/${id}`}
            className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg text-[10px] font-black transition-all shadow-md shadow-indigo-100 dark:shadow-none uppercase tracking-wider"
          >
            View Bundle
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BundleCard;

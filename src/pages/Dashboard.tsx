import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { useAuthStore } from '../store/useAuthStore';
import { forceDownload } from '../lib/downloadUtils';
import { Download, Copy, CheckCircle, Package, Heart, Star, Mic, BrainCircuit } from 'lucide-react';
import NoteCard from '../components/NoteCard';
import MockTestEvaluationModal from '../components/MockTestEvaluationModal';

export default function Dashboard() {
  const { user, profile } = useAuthStore();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [purchasedItems, setPurchasedItems] = useState<any[]>([]);
  const [wishlistItems, setWishlistItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'library' | 'wishlist'>('library');
  
  // Evaluation Modal State
  const [testToEvaluate, setTestToEvaluate] = useState<any | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchDashboardData = async () => {
      try {
        // Fetch Orders
        const ordersQuery = query(
          collection(db, 'orders'),
          where('userId', '==', user.uid),
          where('status', '==', 'completed')
        );
        const ordersSnapshot = await getDocs(ordersQuery);
        const ordersData = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        setOrders(ordersData);

        // Extract all purchased items
        const itemsList: any[] = [];

        for (const order of ordersData) {
          const orderWithItems = order as any;
          if (orderWithItems.items && Array.isArray(orderWithItems.items)) {
            for (const item of orderWithItems.items) {
              if (item.type !== 'subscription') {
                try {
                  const collectionName = item.type === 'note' ? 'notes' : item.type === 'mindMap' ? 'mindMaps' : item.type === 'mockTest' ? 'mockTests' : item.type === 'audioNote' ? 'audioNotes' : 'bundles';
                  const itemDoc = await getDoc(doc(db, collectionName, item.itemId));
                  
                  if (itemDoc.exists()) {
                    itemsList.push({ id: itemDoc.id, ...itemDoc.data(), type: item.type, orderId: order.id });
                  }
                } catch(e) {
                   console.error("Error fetching individual purchased item details", e);
                }
              }
            }
          }
        }
        setPurchasedItems(itemsList);

        // Fetch Wishlist
        const wishlistData: any[] = [];
        const downloadedNotesData: any[] = [];

        try {
          if (profile?.wishlist && profile.wishlist.length > 0) {
            const notesQuery = query(collection(db, 'notes'), where('__name__', 'in', profile.wishlist));
            const notesSnapshot = await getDocs(notesQuery);
            notesSnapshot.docs.forEach(d => wishlistData.push({ id: d.id, ...d.data(), type: 'note' }));
            
            const bundlesQuery = query(collection(db, 'bundles'), where('__name__', 'in', profile.wishlist));
            const bundlesSnapshot = await getDocs(bundlesQuery);
            bundlesSnapshot.docs.forEach(d => wishlistData.push({ id: d.id, ...d.data(), type: 'bundle' }));

            const mindMapsQuery = query(collection(db, 'mindMaps'), where('__name__', 'in', profile.wishlist));
            const mindMapsSnapshot = await getDocs(mindMapsQuery);
            mindMapsSnapshot.docs.forEach(d => wishlistData.push({ id: d.id, ...d.data(), type: 'mindMap' }));

            const mockTestsQuery = query(collection(db, 'mockTests'), where('__name__', 'in', profile.wishlist));
            const mockTestsSnapshot = await getDocs(mockTestsQuery);
            mockTestsSnapshot.docs.forEach(d => wishlistData.push({ id: d.id, ...d.data(), type: 'mockTest' }));
          }
        } catch (e) {
          console.error("Failed fetching wishlist", e);
        }
        setWishlistItems(wishlistData);

        try {
          if (profile?.downloadedNotes && profile.downloadedNotes.length > 0) {
            const downloadedNotesQuery = query(collection(db, 'notes'), where('__name__', 'in', profile.downloadedNotes));
            const downloadedNotesSnapshot = await getDocs(downloadedNotesQuery);
            downloadedNotesSnapshot.docs.forEach(d => downloadedNotesData.push({ id: d.id, ...d.data(), type: 'note', fromCredits: true }));
          }
        } catch(e) {
          console.error("Failed fetching downloaded notes", e);
        }
        


        // Combine direct purchases and credit downloads, avoiding duplicates
        const allPurchased = [...itemsList];
        for (const dn of downloadedNotesData) {
          if (!allPurchased.some(p => p.id === dn.id)) {
            allPurchased.push(dn);
          }
        }
        setPurchasedItems(allPurchased);

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user, profile?.wishlist, navigate]);

  const copyReferralCode = () => {
    if (profile?.referralCode) {
      navigator.clipboard.writeText(profile.referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Welcome, {profile?.name}</h1>
        <p className="text-gray-500 mt-2">Manage your purchased notes and referral rewards.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Referral Card */}
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white shadow-md">
          <h3 className="text-lg font-semibold mb-2 opacity-90">Your Referral Code</h3>
          <div className="flex items-center justify-between bg-white/20 rounded-lg p-3 backdrop-blur-sm">
            <span className="text-2xl font-mono font-bold tracking-wider">{profile?.referralCode}</span>
            <button 
              onClick={copyReferralCode}
              className="p-2 hover:bg-white/20 rounded-md transition-colors"
              title="Copy Code"
            >
              {copied ? <CheckCircle className="h-5 w-5 text-green-300" /> : <Copy className="h-5 w-5" />}
            </button>
          </div>
          <p className="text-sm mt-4 opacity-80">Share this code with friends. They get 20% off, and you get 20% off your next purchase!</p>
        </div>

        {/* Stats */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col justify-center">
          <div className="flex items-center text-gray-500 mb-2">
            <Package className="h-5 w-5 mr-2" />
            <h3 className="font-medium">Purchased Items</h3>
          </div>
          <p className="text-4xl font-extrabold text-gray-900">{purchasedItems.length}</p>
        </div>
        
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col justify-center">
          <div className="flex items-center text-gray-500 mb-2">
            <Heart className="h-5 w-5 mr-2 text-red-500" />
            <h3 className="font-medium">Wishlist</h3>
          </div>
          <p className="text-4xl font-extrabold text-gray-900">{profile?.wishlist?.length || 0}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('library')}
            className={`${
              activeTab === 'library'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-lg flex items-center`}
          >
            <Package className="h-5 w-5 mr-2" />
            Your Library
          </button>
          <button
            onClick={() => setActiveTab('wishlist')}
            className={`${
              activeTab === 'wishlist'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-lg flex items-center`}
          >
            <Heart className="h-5 w-5 mr-2" />
            Wishlist
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[300px]">
        {activeTab === 'library' ? (
          purchasedItems.length > 0 ? (
            <ul className="divide-y divide-gray-100">
              {purchasedItems.map((item, idx) => (
                <li key={`${item.id}-${idx}`} className="p-6 hover:bg-gray-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      {item.type === 'bundle' ? <Package className="h-8 w-8 text-indigo-600" /> : item.type === 'audioNote' ? <Mic className="h-8 w-8 text-indigo-600" /> : <Download className="h-8 w-8 text-indigo-600" />}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{item.title}</h3>
                      <p className="text-sm text-gray-500 capitalize">{item.type} • Class {item.classLevel} {item.subject ? `• ${item.subject}` : ''}</p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:items-end gap-2">
                    {item.type === 'note' ? (
                      <div className="flex flex-col gap-2">
                        <button 
                          onClick={() => forceDownload(item.pdfUrl, `${item.title || 'Note'}.pdf`)}
                          className="inline-flex items-center justify-center px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-sm font-medium transition-colors cursor-pointer"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download PDF
                        </button>
                        <button 
                          onClick={() => navigate(`/notes/${item.id}`)}
                          className="inline-flex items-center justify-center px-4 py-2 border border-amber-200 text-amber-700 hover:bg-amber-50 rounded-lg text-sm font-medium transition-colors"
                        >
                          <Star className="h-4 w-4 mr-2 text-amber-500" />
                          Rate & Review
                        </button>
                      </div>
                    ) : item.type === 'mockTest' ? (
                      <div className="flex flex-col gap-2">
                        <button 
                          onClick={() => forceDownload(item.pdfUrl, `${item.title || 'Mock Test'}.pdf`)}
                          className="inline-flex items-center justify-center px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-sm font-medium transition-colors cursor-pointer"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download Test PDF
                        </button>
                        <button 
                          onClick={() => setTestToEvaluate(item)}
                          className="inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 rounded-lg text-sm font-medium transition-colors shadow-sm"
                        >
                          <BrainCircuit className="h-4 w-4 mr-2" />
                          Get your answer checked by experts
                        </button>
                      </div>
                    ) : item.type === 'audioNote' ? (
                      <div className="flex flex-col gap-2">
                        <audio controls controlsList="nodownload" src={item.audioUrl} className="w-full max-w-xs" />
                      </div>
                    ) : item.type === 'bundle' ? (
                      <div className="flex flex-col gap-2">
                        {item.pdfUrl && (
                          <button 
                            onClick={() => forceDownload(item.pdfUrl, `${item.title || 'Bundle'}.pdf`)}
                            className="inline-flex items-center justify-center px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg text-sm font-medium transition-colors cursor-pointer"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download Bundle PDF
                          </button>
                        )}
                        <div className="flex gap-2">
                          <button 
                            onClick={() => navigate(`/bundles/${item.id}`)}
                            className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-sm font-medium transition-colors"
                          >
                            View Contents
                          </button>
                          <button 
                            onClick={() => navigate(`/bundles/${item.id}`)}
                            className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-amber-200 text-amber-700 hover:bg-amber-50 rounded-lg text-sm font-medium transition-colors"
                          >
                            <Star className="h-4 w-4 mr-2 text-amber-500" />
                            Rate
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {item.pdfUrl && (
                          <button 
                            onClick={() => forceDownload(item.pdfUrl, `${item.title || 'Mind Map'}.pdf`)}
                            className="inline-flex items-center justify-center px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg text-sm font-medium transition-colors cursor-pointer"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download Mind Map PDF
                          </button>
                        )}
                        <button 
                          onClick={() => navigate(`/mind-maps/${item.id}`)}
                          className="inline-flex items-center justify-center px-4 py-2 border border-amber-200 text-amber-700 hover:bg-amber-50 rounded-lg text-sm font-medium transition-colors"
                        >
                          <Star className="h-4 w-4 mr-2 text-amber-500" />
                          Rate & Review
                        </button>
                      </div>
                    )}
                    <span className="text-xs text-gray-400 mt-1">Order ID: {item.orderId?.substring(0, 8) ?? 'N/A'}...</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                <Package className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">Your library is empty</h3>
              <p className="text-gray-500 mb-6">Start exploring our premium notes to ace your exams.</p>
              <button 
                onClick={() => navigate('/notes')}
                className="inline-flex items-center justify-center px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Browse Notes
              </button>
            </div>
          )
        ) : activeTab === 'wishlist' ? (
          <div className="p-6">
            {wishlistItems.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {wishlistItems.map(item => (
                  <NoteCard
                    key={item.id}
                    id={item.id}
                    title={item.title}
                    subject={item.subject}
                    classLevel={item.classLevel}
                    price={item.price}
                    previewImage={item.type === 'bundle' ? (item.previewImages?.[0] || '') : item.previewImages?.[0]}
                    type={item.type}
                    rating={item.rating}
                    reviewCount={item.reviewCount}
                  />
                ))}
              </div>
            ) : (
              <div className="p-12 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50 mb-4">
                  <Heart className="h-8 w-8 text-red-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">Your wishlist is empty</h3>
                <p className="text-gray-500 mb-6">Save items you're interested in for later.</p>
                <button 
                  onClick={() => navigate('/notes')}
                  className="inline-flex items-center justify-center px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Explore Marketplace
                </button>
              </div>
            )}
          </div>
        ) : null}
      </div>

      <MockTestEvaluationModal 
        isOpen={!!testToEvaluate} 
        onClose={() => setTestToEvaluate(null)} 
        mockTest={testToEvaluate} 
      />
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { useAuthStore } from '../store/useAuthStore';
import { getDrivePreviewUrl, getDirectDownloadUrl } from '../lib/driveUtils';
import { Copy, CheckCircle, Package, Heart, Star, Mic, BrainCircuit, Trophy, Flame, BookOpen } from 'lucide-react';
import NoteCard from '../components/NoteCard';
import MockTestEvaluationModal from '../components/MockTestEvaluationModal';

export default function Dashboard() {
  const { user, profile, setNotification } = useAuthStore();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [purchasedItems, setPurchasedItems] = useState<any[]>([]);
  const [wishlistItems, setWishlistItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [giveawayWins, setGiveawayWins] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'library' | 'wishlist' | 'prizes'>('library');
  
  // Evaluation Modal State
  const [testToEvaluate, setTestToEvaluate] = useState<any | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchDashboardData = async () => {
      try {
        // Fetch Giveaway Wins
        const giveawaysQuery = query(
          collection(db, 'giveaways'),
          where('winnerId', '==', user.uid)
        );
        const giveawaysSnapshot = await getDocs(giveawaysQuery);
        const wins = giveawaysSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        setGiveawayWins(wins);
        if (wins.length > 0 && activeTab !== 'prizes') {
            // Optional: suggest switching or showing a badge
        }

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
        const processedItemIds = new Set<string>();

        const addItemToList = (itemData: any, type: string, orderId: string) => {
          const uniqueKey = `${type}-${itemData.id}`;
          if (!processedItemIds.has(uniqueKey)) {
            itemsList.push({ ...itemData, type, orderId });
            processedItemIds.add(uniqueKey);
          }
        };

        for (const order of ordersData) {
          const orderWithItems = order as any;
          if (orderWithItems.items && Array.isArray(orderWithItems.items)) {
            for (const item of orderWithItems.items) {
              if (item.type === 'subscription') continue;

              try {
                const collectionName = item.type === 'note' ? 'notes' : 
                                     item.type === 'mindMap' ? 'mindMaps' : 
                                     item.type === 'mockTest' ? 'mockTests' : 
                                     item.type === 'audioNote' ? 'audioNotes' : 'bundles';
                
                const itemDoc = await getDoc(doc(db, collectionName, item.itemId));
                
                if (itemDoc.exists()) {
                  const data = { id: itemDoc.id, ...itemDoc.data() } as any;
                  
                  if (item.type === 'bundle') {
                    // Explode bundle contents
                    if (data.noteIds && data.noteIds.length > 0) {
                      const notesQuery = query(collection(db, 'notes'), where('__name__', 'in', data.noteIds));
                      const notesSnapshot = await getDocs(notesQuery);
                      notesSnapshot.docs.forEach(d => addItemToList({ id: d.id, ...d.data() }, 'note', order.id));
                    }
                    if (data.mindMapIds && data.mindMapIds.length > 0) {
                      const mmQuery = query(collection(db, 'mindMaps'), where('__name__', 'in', data.mindMapIds));
                      const mmSnapshot = await getDocs(mmQuery);
                      mmSnapshot.docs.forEach(d => addItemToList({ id: d.id, ...d.data() }, 'mindMap', order.id));
                    }
                    if (data.mockTestIds && data.mockTestIds.length > 0) {
                      const mtQuery = query(collection(db, 'mockTests'), where('__name__', 'in', data.mockTestIds));
                      const mtSnapshot = await getDocs(mtQuery);
                      mtSnapshot.docs.forEach(d => addItemToList({ id: d.id, ...d.data() }, 'mockTest', order.id));
                    }
                    if (data.audioNoteIds && data.audioNoteIds.length > 0) {
                      const anQuery = query(collection(db, 'audioNotes'), where('__name__', 'in', data.audioNoteIds));
                      const anSnapshot = await getDocs(anQuery);
                      anSnapshot.docs.forEach(d => addItemToList({ id: d.id, ...d.data() }, 'audioNote', order.id));
                    }
                    // We don't add the bundle itself to itemsList as per user request
                  } else {
                    addItemToList(data, item.type, order.id);
                  }
                }
              } catch(e) {
                 console.error("Error fetching individual purchased item details", e);
              }
            }
          }
        }
        setPurchasedItems(itemsList);

        // Fetch Wishlist
        const wishlistData: any[] = [];

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
        setPurchasedItems(itemsList);

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
      setNotification({ message: 'Referral code copied!', type: 'success' });
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Welcome, {profile?.name}</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">Manage your purchased notes and referral rewards.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Referral Card */}
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 dark:from-indigo-900 dark:to-purple-950 rounded-2xl p-6 text-white shadow-md">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-semibold opacity-90">Your Referral Code</h3>
            <div className="bg-white/20 px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm">
              {profile?.referralsCount || 0} {(profile?.referralsCount || 0) === 1 ? 'Person' : 'Persons'} Referred
            </div>
          </div>
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
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-center">
          <div className="flex items-center text-gray-500 dark:text-gray-400 mb-2">
            <Package className="h-5 w-5 mr-2" />
            <h3 className="font-medium">Purchased Items</h3>
          </div>
          <p className="text-4xl font-extrabold text-gray-900 dark:text-white">{purchasedItems.length}</p>
        </div>
        
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-center">
          <div className="flex items-center text-gray-500 dark:text-gray-400 mb-2">
            <Heart className="h-5 w-5 mr-2 text-red-500" />
            <h3 className="font-medium">Wishlist</h3>
          </div>
          <p className="text-4xl font-extrabold text-gray-900 dark:text-white">{profile?.wishlist?.length || 0}</p>
        </div>

        {/* Streak Card */}
        <div className="bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl p-6 text-white shadow-md flex flex-col justify-center">
          <div className="flex items-center justify-between opacity-90 mb-2">
            <div className="flex items-center">
              <Flame className="h-6 w-6 mr-2 fill-white animate-pulse" />
              <h3 className="font-bold">Daily Study Streak</h3>
            </div>
            <span className="text-xl font-black">{profile?.streakCount || 0} Days</span>
          </div>
          
          <div className="mt-4">
            <div className="flex justify-between text-xs font-bold mb-1 opacity-90">
              <span>Today's Progress</span>
              <span>{Math.floor((profile?.timeSpentToday || 0) / 60)} / 15 mins</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden backdrop-blur-sm">
              <div 
                className="bg-white h-full transition-all duration-500 ease-out" 
                style={{ width: `${Math.min(((profile?.timeSpentToday || 0) / 900) * 100, 100)}%` }}
              ></div>
            </div>
            {profile?.streakIncrementedToday ? (
              <p className="text-[10px] mt-2 font-bold flex items-center">
                <CheckCircle className="h-3 w-3 mr-1" /> Streak maintained for today!
              </p>
            ) : (
              <p className="text-[10px] mt-2 opacity-80">Study for 15 minutes to increase your streak.</p>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-800">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('library')}
            className={`${
              activeTab === 'library'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-700'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-lg flex items-center`}
          >
            <Package className="h-5 w-5 mr-2" />
            Your Library
          </button>
          <button
            onClick={() => setActiveTab('wishlist')}
            className={`${
              activeTab === 'wishlist'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-700'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-lg flex items-center`}
          >
            <Heart className="h-5 w-5 mr-2" />
            Wishlist
          </button>
          {giveawayWins.length > 0 && (
            <button
              onClick={() => setActiveTab('prizes')}
              className={`${
                activeTab === 'prizes'
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-700'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-lg flex items-center relative gap-2`}
            >
              <Trophy className="h-5 w-5 text-amber-500 dark:text-amber-400" />
              My Prizes
              <span className="absolute -top-1 -right-2 bg-amber-500 text-white text-[10px] h-4 w-4 rounded-full flex items-center justify-center animate-bounce font-bold">
                {giveawayWins.length}
              </span>
            </button>
          )}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden min-h-[300px]">
        {activeTab === 'library' ? (
          purchasedItems.length > 0 ? (
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {purchasedItems.map((item, idx) => (
                <li key={`${item.id}-${idx}`} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                      {item.type === 'bundle' ? <Package className="h-8 w-8 text-indigo-600 dark:text-indigo-400" /> : item.type === 'audioNote' ? <Mic className="h-8 w-8 text-indigo-600 dark:text-indigo-400" /> : <BookOpen className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{item.title}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{item.type} • Class {item.classLevel} {item.subject ? `• ${item.subject}` : ''}</p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:items-end gap-2">
                    {item.type === 'note' ? (
                      <div className="flex flex-col gap-2">
                        <a 
                          href={getDrivePreviewUrl(item.pdfUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-lg text-sm font-medium transition-colors cursor-pointer"
                        >
                          <BookOpen className="h-4 w-4 mr-2" />
                          View Note
                        </a>
                        <button 
                          onClick={() => navigate(`/notes/${item.id}`)}
                          className="inline-flex items-center justify-center px-4 py-2 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/10 rounded-lg text-sm font-medium transition-colors"
                        >
                          <Star className="h-4 w-4 mr-2 text-amber-500 dark:text-amber-400" />
                          Rate & Review
                        </button>
                      </div>
                    ) : item.type === 'mockTest' ? (
                      <div className="flex flex-col gap-2">
                        <a 
                          href={getDrivePreviewUrl(item.pdfUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-lg text-sm font-medium transition-colors cursor-pointer"
                        >
                          <BookOpen className="h-4 w-4 mr-2" />
                          View Test PDF
                        </a>
                        <button 
                          onClick={() => setTestToEvaluate(item)}
                          className="inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-800 dark:to-indigo-800 text-white hover:from-purple-700 hover:to-indigo-700 rounded-lg text-sm font-medium transition-colors shadow-sm"
                        >
                          <BrainCircuit className="h-4 w-4 mr-2" />
                          Get your answers evaluated by experts
                        </button>
                      </div>
                    ) : item.type === 'audioNote' ? (
                      <div className="flex flex-col gap-2">
                        {item.audioUrl && item.audioUrl.includes('drive.google.com') ? (
                          <div className="w-full max-w-xs h-32 bg-gray-50 dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700 relative">
                            <iframe 
                              src={getDrivePreviewUrl(item.audioUrl)} 
                              className="absolute left-0 w-full border-0"
                              style={{ top: '-56px', height: 'calc(100% + 56px)' }}
                              allow="autoplay"
                              title="Audio Player"
                            ></iframe>
                          </div>
                        ) : (
                          <audio 
                            controls 
                            controlsList="nodownload" 
                            src={getDirectDownloadUrl(item.audioUrl)} 
                            className="w-full max-w-xs dark:filter dark:invert transition-all" 
                            onError={(e: any) => {
                              console.error("Dashboard Audio Load Error:", e);
                              if ((e.target as any).error) console.error("Detail:", (e.target as any).error.message);
                            }}
                          />
                        )}
                      </div>
                    ) : item.type === 'bundle' ? (
                      <div className="flex flex-col gap-2">
                        {item.pdfUrl && (
                          <a 
                            href={getDrivePreviewUrl(item.pdfUrl)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center px-4 py-2 bg-indigo-600 dark:bg-indigo-700 text-white hover:bg-indigo-700 dark:hover:bg-indigo-600 rounded-lg text-sm font-medium transition-colors cursor-pointer"
                          >
                            <BookOpen className="h-4 w-4 mr-2" />
                            View Bundle PDF
                          </a>
                        )}
                        <div className="flex gap-2">
                          <button 
                            onClick={() => navigate(`/bundles/${item.id}`)}
                            className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-lg text-sm font-medium transition-colors"
                          >
                            View Contents
                          </button>
                          <button 
                            onClick={() => navigate(`/bundles/${item.id}`)}
                            className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/10 rounded-lg text-sm font-medium transition-colors"
                          >
                            <Star className="h-4 w-4 mr-2 text-amber-500 dark:text-amber-400" />
                            Rate
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {item.pdfUrl && (
                          <a 
                            href={getDrivePreviewUrl(item.pdfUrl)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center px-4 py-2 bg-indigo-600 dark:bg-indigo-700 text-white hover:bg-indigo-700 dark:hover:bg-indigo-600 rounded-lg text-sm font-medium transition-colors cursor-pointer"
                          >
                            <BookOpen className="h-4 w-4 mr-2" />
                            View Mind Map PDF
                          </a>
                        )}
                        <button 
                          onClick={() => navigate(`/mind-maps/${item.id}`)}
                          className="inline-flex items-center justify-center px-4 py-2 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/10 rounded-lg text-sm font-medium transition-colors"
                        >
                          <Star className="h-4 w-4 mr-2 text-amber-500 dark:text-amber-400" />
                          Rate & Review
                        </button>
                      </div>
                    )}
                    <span className="text-xs text-gray-400 dark:text-gray-500 mt-1">Order ID: {item.orderId?.substring(0, 8) ?? 'N/A'}...</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
                <Package className="h-8 w-8 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">Your library is empty</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">Start exploring our premium notes to ace your exams.</p>
              <button 
                onClick={() => navigate('/notes')}
                className="inline-flex items-center justify-center px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
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
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50 dark:bg-red-900/10 mb-4">
                  <Heart className="h-8 w-8 text-red-400 dark:text-red-500" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">Your wishlist is empty</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">Save items you're interested in for later.</p>
                <button 
                  onClick={() => navigate('/notes')}
                  className="inline-flex items-center justify-center px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
                >
                  Explore Marketplace
                </button>
              </div>
            )}
          </div>
        ) : activeTab === 'prizes' ? (
          <div className="p-6 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {giveawayWins.map(win => (
                <div key={win.id} className="relative bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-2 border-amber-200 dark:border-amber-800 rounded-3xl p-8 overflow-hidden group shadow-sm">
                  <div className="absolute -top-4 -right-4 h-32 w-32 bg-amber-200 dark:bg-amber-900 rounded-full blur-3xl opacity-20 dark:opacity-10 group-hover:opacity-40 transition-opacity"></div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-3 bg-amber-500 dark:bg-amber-600 rounded-2xl shadow-lg shadow-amber-200 dark:shadow-none rotate-3 group-hover:rotate-0 transition-transform">
                        <Trophy className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-[2px] text-amber-600 dark:text-amber-400 block mb-0.5">Giveaway Winner</span>
                        <h3 className="text-xl font-black text-gray-900 dark:text-gray-100 leading-tight">{win.title}</h3>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
                      Amazing job! You won the giveaway for this chapter. Use the secret code below at checkout to unlock it for <span className="font-black text-amber-600 dark:text-amber-400">FREE</span>.
                    </p>
                    
                    <div className="bg-white dark:bg-gray-800 border-4 border-dashed border-amber-200 dark:border-amber-900 rounded-2xl p-6 mb-8 flex items-center justify-between shadow-inner">
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-1">Coupon Code</span>
                        <span className="text-2xl font-mono font-black text-indigo-600 dark:text-indigo-400 tracking-tighter">{win.winnerCode}</span>
                      </div>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(win.winnerCode);
                          setNotification({ message: 'Coupon code copied!', type: 'success' });
                        }}
                        className="bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 p-3 rounded-xl hover:bg-amber-200 dark:hover:bg-amber-800 transition-colors shadow-sm"
                        title="Copy Code"
                      >
                        <Copy className="h-5 w-5" />
                      </button>
                    </div>

                    <button 
                      onClick={() => navigate(`/notes/${win.noteId}`)}
                      className="w-full py-4 bg-gray-900 dark:bg-amber-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-black dark:hover:bg-amber-700 transition-all shadow-lg hover:shadow-xl active:scale-95"
                    >
                      Redeem on Chapter Page
                    </button>
                  </div>
                </div>
              ))}
            </div>
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

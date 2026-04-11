import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, documentId } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuthStore } from '../store/useAuthStore';
import { ShoppingCart, CheckCircle, Layers, Download } from 'lucide-react';

export default function BundleDetails() {
  const { id } = useParams<{ id: string }>();
  const [bundle, setBundle] = useState<any>(null);
  const [includedNotes, setIncludedNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [hasPurchased, setHasPurchased] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuthStore();

  useEffect(() => {
    const fetchBundleAndNotes = async () => {
      if (!id) return;
      try {
        const bundleDoc = await getDoc(doc(db, 'bundles', id));
        if (bundleDoc.exists()) {
          const bundleData = { id: bundleDoc.id, ...bundleDoc.data() } as any;
          setBundle(bundleData);

          if (bundleData.noteIds && bundleData.noteIds.length > 0) {
            // Fetch notes in chunks of 10 due to Firestore 'in' query limits
            const chunks = [];
            for (let i = 0; i < bundleData.noteIds.length; i += 10) {
              chunks.push(bundleData.noteIds.slice(i, i + 10));
            }
            
            let allNotes: any[] = [];
            for (const chunk of chunks) {
              const q = query(collection(db, 'notes'), where(documentId(), 'in', chunk));
              const snapshot = await getDocs(q);
              allNotes = [...allNotes, ...snapshot.docs.map(d => ({ id: d.id, ...d.data() }))];
            }
            setIncludedNotes(allNotes);
          } else {
            // If no specific notes selected, fetch all notes for this class and subject
            const q = query(
              collection(db, 'notes'),
              where('classLevel', '==', bundleData.classLevel),
              where('subject', '==', bundleData.subject)
            );
            const snapshot = await getDocs(q);
            const matchingNotes = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            setIncludedNotes(matchingNotes);
          }
        }

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
            <h3 className="text-lg font-bold text-gray-900 mb-4">Included Chapters ({includedNotes.length}):</h3>
            <ul className="space-y-3 max-h-48 overflow-y-auto pr-2">
              {includedNotes.map(note => (
                <li key={note.id} className="flex items-start text-gray-700 bg-white p-3 rounded-lg border border-gray-200">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                  <span className="font-medium">{note.title}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-center justify-between mt-auto pt-6 border-t border-gray-100">
            <div>
              <p className="text-sm text-gray-500 font-medium mb-1">Bundle Price</p>
              <p className="text-4xl font-extrabold text-gray-900">₹{bundle.price}</p>
              {!hasPurchased && <p className="text-sm text-green-600 font-medium mt-1">Save big compared to individual chapters!</p>}
            </div>
            
            {hasPurchased ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center text-green-600 font-medium bg-green-50 px-4 py-2 rounded-lg">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Purchased
                </div>
                {bundle.pdfUrl && (
                  <a
                    href={getDirectDownloadUrl(bundle.pdfUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                    className="flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all"
                  >
                    <Download className="h-5 w-5 mr-2" />
                    Download Bundle PDF
                  </a>
                )}
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
    </div>
  );
}

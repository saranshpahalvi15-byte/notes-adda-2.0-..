import { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, getDocs, where } from 'firebase/firestore';
import { getDirectDownloadUrl, getDrivePreviewUrl } from '../lib/downloadUtils';
import { Mic, Play, X, Pause, Volume2, VolumeX, Lock, ShoppingCart } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate } from 'react-router-dom';

export default function AudioNotes() {
  const { profile } = useAuthStore();
  const [audioNotes, setAudioNotes] = useState<any[]>([]);
  const [purchasedIds, setPurchasedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [selectedNote, setSelectedNote] = useState<any | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState('0:00');
  const [duration, setDuration] = useState('0:00');
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const q = query(collection(db, 'audioNotes'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        const notesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAudioNotes(notesData || []);

        if (user) {
          const ordersQuery = query(
            collection(db, 'orders'), 
            where('userId', '==', user.uid)
          );
          const ordersSnapshot = await getDocs(ordersQuery);
          const boughtIds = new Set<string>();
          const bundleIds: string[] = [];

          ordersSnapshot.forEach(docSnap => {
            const orderData = docSnap.data();
            // Consider order as valid if status is 'completed' OR if status field is missing (legacy)
            if (orderData.status === 'completed' || !orderData.status) {
              if (orderData.items) {
                orderData.items.forEach((item: any) => {
                  if (item.type === 'audioNote') {
                    boughtIds.add(item.itemId);
                  } else if (item.type === 'bundle') {
                    bundleIds.push(item.itemId);
                  }
                });
              }
            }
          });

          // Fetch included IDs from purchased bundles (chunked because 'in' query limit is 10)
          if (bundleIds.length > 0) {
            const chunks = [];
            for (let i = 0; i < bundleIds.length; i += 10) {
              chunks.push(bundleIds.slice(i, i + 10));
            }

            for (const chunk of chunks) {
              const bundlesQuery = query(collection(db, 'bundles'), where('__name__', 'in', chunk));
              const bundlesSnapshot = await getDocs(bundlesQuery);
              bundlesSnapshot.forEach(docSnap => {
                const bundleData = docSnap.data();
                if (bundleData.audioNoteIds && Array.isArray(bundleData.audioNoteIds)) {
                  bundleData.audioNoteIds.forEach((id: string) => boughtIds.add(id));
                }
              });
            }
          }

          setPurchasedIds(boughtIds);
        }
      } catch (error) {
        console.error("Error fetching audio notes:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const filteredNotes = audioNotes.filter(note => {
    if (profile?.classLevel && note.classLevel !== profile.classLevel) return false;
    return true;
  });

  const getDiscountedOriginalPrice = (price: number, note: any) => {
    if (price <= 0) return 0;
    const dp = note.discountPercent !== undefined && note.discountPercent !== null ? note.discountPercent : (20 + (note.id.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0) % 31));
    return Math.round((price * 100) / (100 - dp));
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const openAudioPlayer = (note: any) => {
    const price = note.price !== undefined ? note.price : 5;
    // If it's a paid note and hasn't been purchased
    if (price > 0 && !purchasedIds.has(note.id)) {
      if (!user) {
        navigate('/login');
        return;
      }
      navigate('/checkout', { state: { items: [{ ...note, price, type: 'audioNote' }] } });
      return;
    }

    setSelectedNote(note);
    setIsPlaying(true);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.load();
    }
  };

  const closeAudioPlayer = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setSelectedNote(null);
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime('0:00');
  };

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      const total = audioRef.current.duration;
      setCurrentTime(formatTime(current));
      if (isFinite(total) && total > 0) {
        setProgress((current / total) * 100);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      if (isFinite(audioRef.current.duration)) {
        setDuration(formatTime(audioRef.current.duration));
      }
      audioRef.current.play().catch(err => {
        console.error("Autoplay failed:", err);
        setIsPlaying(false);
      });
      setIsPlaying(true);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (audioRef.current && isFinite(audioRef.current.duration)) {
      const seekTime = (Number(e.target.value) / 100) * audioRef.current.duration;
      if (isFinite(seekTime)) {
        audioRef.current.currentTime = seekTime;
        setProgress(Number(e.target.value));
      }
    }
  };

  const handleAudioError = (e: any) => {
    console.error("Audio Load Error:", e);
    // If the element has no supported sources, we should handle it
    if (audioRef.current?.error) {
      console.error("Audio detail:", audioRef.current.error.message);
    }
    alert("This audio file could not be loaded. It might be in an unsupported format or the link might be broken.");
    setIsPlaying(false);
    setSelectedNote(null);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setVolume(value);
    if (audioRef.current) {
      audioRef.current.volume = value;
      setIsMuted(value === 0);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      const newMutedState = !isMuted;
      audioRef.current.muted = newMutedState;
      setIsMuted(newMutedState);
      if (newMutedState) {
        setVolume(0);
        audioRef.current.volume = 0;
      } else {
        setVolume(1);
        audioRef.current.volume = 1;
      }
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <Mic className="h-8 w-8 text-indigo-600 mr-3" />
          Audio Notes
        </h1>
        <p className="text-gray-500 mt-2">Listen and learn with our high-quality audio notes.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : filteredNotes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNotes.map(note => {
            const price = note.price !== undefined ? note.price : 5;
            const isPaid = price > 0;
            const hasPurchased = purchasedIds.has(note.id) || profile?.role === 'admin';
            const canPlay = !isPaid || hasPurchased;
            
            return (
              <div 
                key={note.id} 
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 p-6 flex flex-col cursor-pointer group hover:border-indigo-200"
                onClick={() => openAudioPlayer(note)}
              >
                <div className="mb-4 flex-1">
                  <div className="flex justify-between items-start mb-3">
                    <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-semibold inline-block">
                      Class {note.classLevel}
                    </span>
                    {isPaid && !hasPurchased && (
                      <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded-lg text-xs font-bold flex items-center gap-2">
                        <span>₹{price}</span>
                        {price > 0 && (
                          <span className="text-gray-500 line-through text-[10px]">
                            ₹{getDiscountedOriginalPrice(price, note)}
                          </span>
                        )}
                      </span>
                    )}
                    {isPaid && hasPurchased && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-lg text-xs font-bold flex items-center">
                        Purchased
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{note.title}</h3>
                  {note.noteId && (
                    <p className="text-sm text-gray-500 mt-1">Associated with a chapter</p>
                  )}
                </div>
                
                <div className={`mt-4 pt-4 border-t border-gray-100 flex items-center font-medium ${canPlay ? 'text-indigo-600' : 'text-amber-600'}`}>
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center mr-3 transition-colors ${canPlay ? 'bg-indigo-50 group-hover:bg-indigo-100' : 'bg-amber-50 group-hover:bg-amber-100'}`}>
                    {canPlay ? (
                      <Play className="h-4 w-4 fill-current" />
                    ) : (
                      <Lock className="h-4 w-4" />
                    )}
                  </div>
                  {canPlay ? 'Listen to Audio Note' : 'Unlock to Listen'}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <Mic className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No audio notes found matching your filters.</p>
        </div>
      )}

      {/* Audio Player Modal */}
      {selectedNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 shadow-2xl backdrop-blur-sm transition-opacity">
          <div className="w-full max-w-md bg-white rounded-2xl overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-6 bg-gradient-to-br from-indigo-600 to-purple-700 text-white relative">
              <button 
                onClick={closeAudioPlayer}
                className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/30 rounded-full text-white transition-colors"
                aria-label="Close audio player"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-md">
                <Mic className="h-8 w-8 text-white" />
              </div>
              <span className="px-2 py-1 bg-white/20 text-white rounded text-xs font-semibold uppercase tracking-wider mb-2 inline-block">
                Class {selectedNote.classLevel}
              </span>
              <h2 className="text-2xl font-bold leading-tight">{selectedNote.title}</h2>
            </div>
            
            <div className="p-6 bg-white">
              {selectedNote.audioUrl && selectedNote.audioUrl.includes('drive.google.com') ? (
                <div className="w-full aspect-video sm:aspect-auto sm:h-40 bg-gray-50 rounded-xl overflow-hidden border border-gray-100 mb-4 relative">
                  <iframe 
                    src={getDrivePreviewUrl(selectedNote.audioUrl)} 
                    className="absolute left-0 w-full border-0"
                    style={{ top: '-56px', height: 'calc(100% + 56px)' }}
                    allow="autoplay"
                    title="Audio Player"
                  ></iframe>
                  <div className="absolute bottom-0 left-0 right-0 p-2 text-center text-[10px] text-gray-400 bg-white/80 backdrop-blur-sm border-t border-gray-100">
                    Secure Drive Player
                  </div>
                </div>
              ) : (
                <>
                  <audio 
                    ref={audioRef} 
                    src={getDirectDownloadUrl(selectedNote.audioUrl)} 
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    onEnded={() => setIsPlaying(false)}
                    onError={handleAudioError}
                  />
                  
                  {/* Progress Bar */}
                  <div className="mb-6">
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={progress} 
                      onChange={handleSeek}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                    <div className="flex justify-between text-xs font-medium text-gray-500 mt-2">
                      <span>{currentTime}</span>
                      <span>{duration}</span>
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center justify-between">
                    {/* Volume control */}
                    <div className="flex items-center group relative w-1/3">
                      <button onClick={toggleMute} className="text-gray-500 hover:text-indigo-600 transition-colors p-2">
                        {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                      </button>
                      <label className="sr-only">Volume</label>
                      <input 
                        type="range" 
                        min="0" 
                        max="1" 
                        step="0.01" 
                        value={volume}
                        onChange={handleVolumeChange}
                        className="w-20 h-1.5 ml-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      />
                    </div>

                    {/* Play/Pause */}
                    <div className="flex justify-center w-1/3">
                      <button 
                        onClick={togglePlayPause} 
                        className="w-14 h-14 flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg transition-transform hover:scale-105"
                      >
                        {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-1 fill-white" />}
                      </button>
                    </div>

                    <div className="w-1/3"></div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

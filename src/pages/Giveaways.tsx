import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, query, orderBy, onSnapshot, doc, getDoc, addDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { Trophy, Clock, Users, ArrowRight, CheckCircle, Gift } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

interface Giveaway {
  id: string;
  noteId: string;
  title: string;
  endTime: string;
  winnerId?: string;
  winnerName?: string;
  participantsCount: number;
  isActive: boolean;
}

interface Participant {
  id: string;
  userName: string;
  score?: number;
  enteredAt: any;
}

const CountdownTimer: React.FC<{ endTime: string; onExpire?: () => void }> = ({ endTime, onExpire }) => {
  const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number; s: number } | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const end = new Date(endTime).getTime();
      const diff = end - now;

      if (diff <= 0) {
        clearInterval(timer);
        setTimeLeft({ d: 0, h: 0, m: 0, s: 0 });
        if (onExpire) onExpire();
      } else {
        setTimeLeft({
          d: Math.floor(diff / (1000 * 60 * 60 * 24)),
          h: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          m: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
          s: Math.floor((diff % (1000 * 60)) / 1000)
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [endTime, onExpire]);

  if (!timeLeft) return null;

  return (
    <div className="flex space-x-2 text-center">
      <div className="bg-indigo-600 text-white rounded-lg p-2 min-w-[3rem]">
        <div className="text-lg font-bold">{timeLeft.d}</div>
        <div className="text-[10px] uppercase">Days</div>
      </div>
      <div className="bg-indigo-600 text-white rounded-lg p-2 min-w-[3rem]">
        <div className="text-lg font-bold">{timeLeft.h}</div>
        <div className="text-[10px] uppercase">Hrs</div>
      </div>
      <div className="bg-indigo-600 text-white rounded-lg p-2 min-w-[3rem]">
        <div className="text-lg font-bold">{timeLeft.m}</div>
        <div className="text-[10px] uppercase">Min</div>
      </div>
      <div className="bg-indigo-600 text-white rounded-lg p-2 min-w-[3rem]">
        <div className="text-lg font-bold">{timeLeft.s}</div>
        <div className="text-[10px] uppercase">Sec</div>
      </div>
    </div>
  );
};

const Giveaways: React.FC = () => {
  const [giveaways, setGiveaways] = useState<Giveaway[]>([]);
  const [participants, setParticipants] = useState<{ [key: string]: Participant[] }>({});
  const [userEntries, setUserEntries] = useState<string[]>([]);
  const { user, profile } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    const q = query(collection(db, 'giveaways'), orderBy('endTime', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const gList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Giveaway));
      setGiveaways(gList);
      
      // Fetch participants for each active giveaway
      gList.forEach(g => {
        const entryQ = query(collection(db, 'giveawayEntries'), orderBy('enteredAt', 'desc'));
        // Simplified: this could be optimized with better query parameters but let's keep it robust
        onSnapshot(entryQ, (entrySnapshot) => {
          const pList = entrySnapshot.docs
            .filter(doc => doc.data().giveawayId === g.id)
            .map(doc => ({ id: doc.id, ...doc.data() } as Participant));
          setParticipants(prev => ({ ...prev, [g.id]: pList }));
          
          if (profile && pList.some(p => p.id.includes(profile.id))) {
            setUserEntries(prev => Array.from(new Set([...prev, g.id])));
          }
        });
      });
    });

    return () => unsubscribe();
  }, [user]);

  const handleEnterGiveaway = (giveaway: Giveaway) => {
    if (!user) {
      navigate('/login');
      return;
    }
    navigate(`/quiz/${giveaway.noteId}?giveawayId=${giveaway.id}`);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-12">
      <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-3xl p-8 md:p-12 text-white shadow-xl shadow-indigo-500/20">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md text-white rounded-full text-xs font-bold uppercase tracking-widest mb-6 border border-white/20">
            <Gift className="h-4 w-4" />
            Rewards Program
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-6 tracking-tight">Student Giveaways</h1>
          <p className="text-indigo-100 text-lg md:text-xl leading-relaxed mb-8">
            At Notes Adda, we believe in rewarding academic curiosity. Participate in our periodic giveaways to win free lifetime access to premium chapter notes, subject bundles, and exclusive mind maps.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 text-sm font-medium text-indigo-100">
              <CheckCircle className="h-4 w-4 text-green-400" />
              Skill-Based Winning
            </div>
            <div className="flex items-center gap-3 text-sm font-medium text-indigo-100">
              <CheckCircle className="h-4 w-4 text-green-400" />
              Weekly New Opportunities
            </div>
          </div>
        </div>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
        <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-3 uppercase tracking-wider text-xs">How it Works</h3>
          <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
            Entry isn't just about luck. To qualify for our giveaways, you must complete a "Lightning Quiz" related to the subject being offered. We believe the students who engage most with the material deserve the rewards!
          </p>
        </div>
        <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-3 uppercase tracking-wider text-xs">Terms & Transparency</h3>
          <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
            Winners are announced automatically once the timer expires. Our system picks the top scorers from the quiz pool. If multiple students have the same top score, the one who completed the quiz fastest wins the prize.
          </p>
        </div>
      </section>

      <div>
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-black text-indigo-900 flex items-center">
              <Gift className="mr-3 h-7 w-7 text-indigo-600" />
              Live Competitions
            </h2>
          </div>
        </div>
      </div>

      {giveaways.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border-2 border-dashed border-gray-200">
          <div className="bg-gray-100 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trophy className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">No active giveaways</h3>
          <p className="text-gray-500 mt-2">Check back later for new opportunities to win!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8">
          {/* Active Giveaways */}
          {giveaways.filter(g => g.isActive).map((g) => (
            <motion.div 
              key={g.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-xl overflow-hidden border border-indigo-100"
            >
              <div className="p-6">
                <div className="flex flex-col md:flex-row justify-between gap-6">
                  <div className="space-y-4 flex-1">
                    <h2 className="text-2xl font-bold text-gray-900">{g.title}</h2>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <div className="flex items-center bg-gray-50 px-3 py-1 rounded-full">
                        <Users className="h-4 w-4 mr-2 text-indigo-500" />
                        {participants[g.id]?.length || 0} Participants
                      </div>
                      <div className="flex items-center bg-gray-50 px-3 py-1 rounded-full">
                        <Trophy className="h-4 w-4 mr-2 text-yellow-500" />
                        1 Winner
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Time Remaining</h4>
                      <CountdownTimer endTime={g.endTime} />
                    </div>
                  </div>

                  <div className="flex flex-col justify-center items-center md:items-end gap-3 min-w-[200px]">
                    {userEntries.includes(g.id) ? (
                      <div className="w-full bg-green-50 text-green-700 border border-green-100 rounded-xl p-4 text-center">
                        <CheckCircle className="h-6 w-6 mx-auto mb-2" />
                        <p className="font-bold text-sm">Valid Entry</p>
                        <p className="text-[10px] mt-1">Quiz successfully completed!</p>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleEnterGiveaway(g)}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center group"
                      >
                        Start Quiz to Enter
                        <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Participants List */}
                <div className="mt-8 border-t border-gray-100 pt-6">
                  <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    Participation List
                  </h3>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                    {participants[g.id]?.map((p, idx) => (
                      <span key={idx} className="bg-gray-100 text-gray-700 text-[10px] sm:text-xs px-3 py-1 rounded-full flex items-center gap-1.5">
                        <span className="font-bold">{p.userName}</span>
                        {p.score !== undefined && (
                          <span className="bg-indigo-600 text-white px-1.5 rounded text-[8px] sm:text-[10px] font-black">
                            {p.score}
                          </span>
                        )}
                      </span>
                    ))}
                    {(!participants[g.id] || participants[g.id].length === 0) && (
                      <p className="text-xs text-gray-400 italic">No entries yet. Be the first!</p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}

          {/* Past/Finished Giveaways */}
          {giveaways.filter(g => !g.isActive).length > 0 && (
            <div className="mt-12">
              <h2 className="text-xl font-bold text-gray-400 mb-6 flex items-center">
                <Clock className="mr-2 h-5 w-5" />
                Previous Giveaways
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {giveaways.filter(g => !g.isActive).map((g) => (
                  <div key={g.id} className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-gray-100 grayscale hover:grayscale-0 transition-all cursor-default">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-gray-600">{g.title}</h3>
                      <span className="bg-gray-200 text-gray-500 text-[10px] px-2 py-0.5 rounded uppercase">Finished</span>
                    </div>
                    <div className="flex items-center text-sm text-amber-600 font-bold bg-amber-50 p-3 rounded-lg border border-amber-100">
                      <Trophy className="h-5 w-5 mr-3 flex-shrink-0" />
                      Winner: {g.winnerName || 'Announcing...'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Giveaways;

import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, getDocs, addDoc, updateDoc, doc, deleteDoc, where, serverTimestamp, onSnapshot, orderBy } from 'firebase/firestore';
import { Plus, Trash2, Edit, Trophy, Gift, BookOpen, Clock, Users, CheckCircle, BrainCircuit, FileUp, Loader2, Sparkles } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import * as pdfjsLib from 'pdfjs-dist/build/pdf.mjs';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export function AdminQuizzes() {
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    noteId: '',
    title: '',
    questions: Array(20).fill(null).map(() => ({
      question: '',
      options: ['', '', '', ''],
      correctAnswerIndex: 0
    }))
  });

  useEffect(() => {
    const q = query(collection(db, 'quizzes'));
    const unsubscribe = onSnapshot(q, (snap) => {
      const qList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      qList.sort((a: any, b: any) => {
        const timeA = a.createdAt?.toMillis?.() || 0;
        const timeB = b.createdAt?.toMillis?.() || 0;
        return timeB - timeA;
      });
      setQuizzes(qList);
      setLoading(false);
    }, (error) => {
      console.error("Quizzes listener error:", error);
      alert("Error loading quizzes: " + error.message);
      setLoading(false);
    });
    
    fetchNotes();
    return () => unsubscribe();
  }, []);

  const fetchNotes = async () => {
    try {
      const q = query(collection(db, 'notes'));
      const snap = await getDocs(q);
      setNotes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingQuiz) {
        await updateDoc(doc(db, 'quizzes', editingQuiz.id), formData);
      } else {
        await addDoc(collection(db, 'quizzes'), {
          ...formData,
          createdAt: serverTimestamp()
        });
      }
      setShowForm(false);
      setEditingQuiz(null);
      setFormData({
        noteId: '',
        title: '',
        questions: Array(20).fill(null).map(() => ({
          question: '',
          options: ['', '', '', ''],
          correctAnswerIndex: 0
        }))
      });
    } catch (e) {
      alert("Error saving quiz");
      console.error(e);
    }
  };

  const handleEdit = (quiz: any) => {
    setEditingQuiz(quiz);
    setFormData({
      noteId: quiz.noteId,
      title: quiz.title,
      questions: quiz.questions
    });
    setShowForm(true);
  };

  const handleGenerateAI = async (file: File) => {
    if (!file) return;
    setIsGenerating(true);
    try {
      // 1. Extract text from PDF
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = "";
      
      // Limit to first 20 pages or so to manage token limits and time
      const pagesToScan = Math.min(pdf.numPages, 30);
      for (let i = 1; i <= pagesToScan; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(" ");
        fullText += pageText + "\n";
      }

      // 2. Call Gemini to generate quiz
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            role: "user",
            parts: [{ text: `You are an expert educator. Create a high-quality 20-question multiple-choice quiz based on the following NCERT chapter text. 
            The questions should test deep understanding and conceptual clarity.
            Each question must have exactly 4 options and one correct answer.
            
            TEXT:
            ${fullText.slice(0, 30000)}` }] // Limit context size slightly
          }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "A catchy title for the quiz related to the chapter" },
              questions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    question: { type: Type.STRING },
                    options: { 
                      type: Type.ARRAY, 
                      items: { type: Type.STRING },
                      minItems: 4,
                      maxItems: 4
                    },
                    correctAnswerIndex: { type: Type.INTEGER, description: "Index (0-3) of the correct option" }
                  },
                  required: ["question", "options", "correctAnswerIndex"]
                }
              }
            },
            required: ["title", "questions"]
          }
        }
      });

      const result = JSON.parse(response.text);
      
      if (result.questions && Array.isArray(result.questions)) {
        setFormData({
          ...formData,
          title: result.title || formData.title,
          questions: result.questions.slice(0, 20)
        });
        setShowAIModal(false);
        setShowForm(true);
      }
    } catch (error: any) {
      console.error("AI Generation failed:", error);
      alert("AI Generation failed: " + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDelete = async (id: string) => {
    setConfirmDeleteId(null);
    setDeletingId(id);
    try {
      await deleteDoc(doc(db, 'quizzes', id));
    } catch (e: any) {
      console.error(e);
      alert("Error deleting quiz: " + e.message);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;
  }

  if (showForm) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">{editingQuiz ? 'Edit Quiz' : 'Add New Quiz'} (20 Questions)</h2>
          <div className="flex items-center space-x-4">
            {!editingQuiz && (
              <button 
                type="button"
                onClick={() => setShowAIModal(true)}
                className="flex items-center text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg text-sm font-bold border border-indigo-200 hover:bg-indigo-100 transition-colors"
              >
                <BrainCircuit className="w-4 h-4 mr-2" /> AI Regenerate from PDF
              </button>
            )}
            <button onClick={() => setShowForm(false)} className="text-gray-500 underline">Cancel</button>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Associate with Chapter</label>
              <select 
                required 
                value={formData.noteId} 
                onChange={e => setFormData({...formData, noteId: e.target.value})}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              >
                <option value="">Select a note</option>
                {notes.map(n => <option key={n.id} value={n.id}>[{n.subject}] {n.title}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Quiz Title</label>
              <input 
                type="text" 
                required 
                value={formData.title} 
                onChange={e => setFormData({...formData, title: e.target.value})}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              />
            </div>
          </div>

          <div className="space-y-12">
            {formData.questions.map((q, qIdx) => (
              <div key={qIdx} className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <h3 className="font-bold mb-4 text-indigo-600">Question {qIdx + 1}</h3>
                <div className="space-y-4">
                  <input 
                    type="text" 
                    placeholder="Enter question text..." 
                    required 
                    value={q.question}
                    onChange={e => {
                      const newQuestions = [...formData.questions];
                      newQuestions[qIdx].question = e.target.value;
                      setFormData({...formData, questions: newQuestions});
                    }}
                    className="block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    {q.options.map((opt, oIdx) => (
                      <div key={oIdx} className="flex items-center space-x-2">
                        <input 
                          type="radio" 
                          name={`correct-${qIdx}`} 
                          checked={q.correctAnswerIndex === oIdx}
                          onChange={() => {
                            const newQuestions = [...formData.questions];
                            newQuestions[qIdx].correctAnswerIndex = oIdx;
                            setFormData({...formData, questions: newQuestions});
                          }}
                        />
                        <input 
                          type="text" 
                          placeholder={`Option ${oIdx + 1}`} 
                          required 
                          value={opt}
                          onChange={e => {
                            const newQuestions = [...formData.questions];
                            newQuestions[qIdx].options[oIdx] = e.target.value;
                            setFormData({...formData, questions: newQuestions});
                          }}
                          className="flex-1 border border-gray-300 rounded-md shadow-sm p-1 text-sm"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl">
            {editingQuiz ? 'Update Quiz' : 'Create Quiz'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Manage Quizzes</h2>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowAIModal(true)} 
            className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-4 py-2 rounded-md hover:bg-indigo-100 flex items-center font-bold"
          >
            <BrainCircuit className="w-4 h-4 mr-2" /> AI Generate
          </button>
          <button onClick={() => setShowForm(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center">
            <Plus className="w-4 h-4 mr-2" /> Create Quiz
          </button>
        </div>
      </div>

      {/* AI Modal */}
      {showAIModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
           <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl border border-gray-100 animate-in fade-in zoom-in duration-300">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-indigo-200">
                  <BrainCircuit className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-black text-gray-900 mb-2">AI Quiz Generator</h2>
                <p className="text-gray-500 text-sm mb-8">Upload an NCERT chapter PDF and Gemini AI will create a comprehensive 20-question quiz for you.</p>
                
                {isGenerating ? (
                   <div className="flex flex-col items-center py-6">
                      <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
                      <div className="text-indigo-600 font-black animate-pulse">Analyzing NCERT PDF...</div>
                      <p className="text-xs text-gray-400 mt-2">Gemini is crafting 20 high-quality questions</p>
                   </div>
                ) : (
                  <label className="w-full">
                    <div className="border-4 border-dashed border-gray-100 rounded-3xl p-10 hover:border-indigo-200 hover:bg-indigo-50/50 transition-all cursor-pointer group">
                       <FileUp className="w-10 h-10 text-gray-300 mx-auto mb-4 group-hover:text-indigo-500 group-hover:-translate-y-1 transition-all" />
                       <span className="text-gray-400 font-bold group-hover:text-indigo-600">Click to upload Chapter PDF</span>
                    </div>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="application/pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleGenerateAI(file);
                      }}
                    />
                  </label>
                )}

                <button 
                  disabled={isGenerating}
                  onClick={() => setShowAIModal(false)}
                  className="mt-8 text-gray-400 font-black uppercase text-xs tracking-widest hover:text-gray-600"
                >
                  Cancel
                </button>
              </div>
           </div>
        </div>
      )}
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quiz Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Chapter</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {quizzes.map(q => (
              <tr key={q.id}>
                <td className="px-6 py-4 font-medium">{q.title}</td>
                <td className="px-6 py-4 text-gray-500">{notes.find(n => n.id === q.noteId)?.title || q.noteId}</td>
                <td className="px-6 py-4 text-right space-x-4">
                  <button onClick={() => handleEdit(q)} className="text-indigo-600 hover:text-indigo-900"><Edit className="w-5 h-5" /></button>
                  {confirmDeleteId === q.id ? (
                    <span className="inline-flex items-center space-x-2">
                       <button 
                         onClick={() => handleDelete(q.id)}
                         className="text-white bg-red-600 px-2 py-1 rounded text-xs font-bold"
                       >
                         Confirm Delete
                       </button>
                       <button 
                         onClick={() => setConfirmDeleteId(null)}
                         className="text-gray-500 text-xs underline"
                       >
                         Cancel
                       </button>
                    </span>
                  ) : (
                    <button 
                      disabled={deletingId === q.id}
                      onClick={() => setConfirmDeleteId(q.id)} 
                      className={`text-red-600 hover:text-red-900 ${deletingId === q.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <Trash2 className={`w-5 h-5 ${deletingId === q.id ? 'animate-pulse' : ''}`} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AdminGiveaways() {
  const [giveaways, setGiveaways] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmEndId, setConfirmEndId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    noteId: '',
    title: '',
    endTime: '',
    isActive: true
  });

  useEffect(() => {
    // Listen to giveaways with fallback sorting
    const q = query(collection(db, 'giveaways'));
    const unsubscribe = onSnapshot(q, (snap) => {
      const gList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Clientside sort as fallback for missing createdAt
      gList.sort((a: any, b: any) => {
        const timeA = a.createdAt?.toMillis?.() || new Date(a.endTime || 0).getTime();
        const timeB = b.createdAt?.toMillis?.() || new Date(b.endTime || 0).getTime();
        return timeB - timeA;
      });
      setGiveaways(gList);
      setLoading(false);
    }, (error) => {
      console.error("Giveaways listener error:", error);
      alert("Error loading giveaways: " + error.message);
      setLoading(false);
    });
    
    fetchNotes();
    return () => unsubscribe();
  }, []);

  const fetchNotes = async () => {
    try {
      const q = query(collection(db, 'notes'));
      const snap = await getDocs(q);
      setNotes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'giveaways'), {
        ...formData,
        participantsCount: 0,
        createdAt: serverTimestamp()
      });
      setShowForm(false);
      setFormData({ noteId: '', title: '', endTime: '', isActive: true });
    } catch (e) {
      console.error(e);
      alert("Error creating giveaway");
    }
  };

  const handleEndGiveaway = async (giveaway: any) => {
    setConfirmEndId(null);
    // Pick lucky winner from participants
    try {
      const entriesQ = query(collection(db, 'giveawayEntries'), where('giveawayId', '==', giveaway.id));
      const entriesSnap = await getDocs(entriesQ);
      const entries = entriesSnap.docs.map(d => d.data());
      
      if (entries.length === 0) {
        alert("No participants in this giveaway.");
        await updateDoc(doc(db, 'giveaways', giveaway.id), { isActive: false });
        // Since we are using onSnapshot, isActive false will hide the button automatically
        return;
      }
      
      const winnerData = (() => {
        // Find max score
        const maxScore = Math.max(...entries.map((e: any) => e.score || 0));
        // Filter those with max score
        const topScorers = entries.filter((e: any) => (e.score || 0) === maxScore);
        // Randomly pick from top scorers
        return topScorers[Math.floor(Math.random() * topScorers.length)];
      })();

      const winner = winnerData;
      const specialCode = `WIN-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      
      // Create the actual coupon in the coupons collection
      await addDoc(collection(db, 'coupons'), {
        code: specialCode,
        discountPercent: 100,
        isActive: true,
        isSingleUse: true,
        userId: winner.userId,
        noteId: giveaway.noteId,
        description: `Giveaway Winner Prize: ${giveaway.title}`,
        createdAt: serverTimestamp()
      });

      await updateDoc(doc(db, 'giveaways', giveaway.id), {
        isActive: false,
        winnerId: winner.userId,
        winnerName: winner.userName,
        winnerCode: specialCode
      });
      
      alert(`Winner chosen: ${winner.userName}. Special Code: ${specialCode}`);
    } catch (e: any) {
      console.error(e);
      alert("Error ending giveaway: " + (e.message || "Unknown error"));
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Manage Giveaways</h2>
        <button onClick={() => setShowForm(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center">
          <Plus className="w-4 h-4 mr-2" /> Start Giveaway
        </button>
      </div>

      {showForm && (
        <div className="mb-8 bg-white p-6 rounded-xl border border-indigo-200">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium">Title</label>
                <input 
                  type="text" 
                  required 
                  value={formData.title} 
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Chapter/Note to giveaway</label>
                <select 
                  required 
                  value={formData.noteId} 
                  onChange={e => setFormData({...formData, noteId: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                >
                  <option value="">Select a note</option>
                  {notes.map(n => <option key={n.id} value={n.id}>[{n.subject}] {n.title}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">End DateTime</label>
                <input 
                  type="datetime-local" 
                  required 
                  value={formData.endTime} 
                  onChange={e => setFormData({...formData, endTime: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="text-gray-500">Cancel</button>
              <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded-md">Launch</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {giveaways.map(g => (
          <div key={g.id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <h3 className="font-bold text-lg">{g.title}</h3>
              <p className="text-sm text-gray-500">Note: {notes.find(n => n.id === g.noteId)?.title || g.noteId}</p>
              <div className="flex gap-4 mt-2 text-xs font-bold uppercase tracking-wider text-gray-400">
                <span className="flex items-center"><Clock className="w-3 h-3 mr-1" /> End: {new Date(g.endTime).toLocaleString()}</span>
                <span className="flex items-center"><Users className="w-3 h-3 mr-1" /> {g.participantsCount || 0} participants</span>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {g.isActive ? (
                confirmEndId === g.id ? (
                  <div className="flex flex-col items-end gap-1">
                    <button 
                      onClick={() => handleEndGiveaway(g)}
                      className="bg-amber-600 text-white px-3 py-1 rounded text-sm font-bold"
                    >
                      Confirm Draw
                    </button>
                    <button onClick={() => setConfirmEndId(null)} className="text-gray-400 text-xs underline uppercase font-black">Cancel</button>
                  </div>
                ) : (
                  <button 
                    onClick={() => setConfirmEndId(g.id)}
                    className="bg-amber-600 text-white px-4 py-2 rounded-md hover:bg-amber-700 font-bold"
                  >
                    End & Draw Winner
                  </button>
                )
              ) : (
                <div className="bg-green-50 text-green-700 px-4 py-2 rounded-md border border-green-200">
                  <Trophy className="w-4 h-4 inline mr-2" />
                  Winner: {g.winnerName}
                </div>
              )}

              {confirmDeleteId === g.id ? (
                <div className="flex flex-col items-end gap-1">
                  <button 
                    onClick={async () => {
                      setConfirmDeleteId(null);
                      setDeletingId(g.id);
                      try {
                        await deleteDoc(doc(db, 'giveaways', g.id));
                      } catch (e: any) {
                        console.error(e);
                        alert("Error deleting giveaway: " + e.message);
                      } finally {
                        setDeletingId(null);
                      }
                    }}
                    className="bg-red-600 text-white px-3 py-1 rounded text-sm font-bold"
                  >
                    Confirm Delete
                  </button>
                  <button onClick={() => setConfirmDeleteId(null)} className="text-gray-400 text-xs underline uppercase font-black">Cancel</button>
                </div>
              ) : (
                <button 
                  disabled={deletingId === g.id}
                  onClick={() => setConfirmDeleteId(g.id)}
                  className={`text-red-400 hover:text-red-600 ${deletingId === g.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Trash2 className={`w-5 h-5 ${deletingId === g.id ? 'animate-pulse' : ''}`} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

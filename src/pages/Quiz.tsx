import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, getDoc, updateDoc, increment, setDoc } from 'firebase/firestore';
import { CheckCircle, XCircle, ChevronRight, Award, AlertCircle, Loader2, ArrowLeft, Trophy } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { motion, AnimatePresence } from 'motion/react';

interface Question {
  question: string;
  options: string[];
  correctAnswerIndex: number;
}

interface QuizData {
  id: string;
  noteId: string;
  title: string;
  questions: Question[];
}

const Quiz: React.FC = () => {
  const { noteId } = useParams<{ noteId: string }>();
  const [searchParams] = useSearchParams();
  const giveawayId = searchParams.get('giveawayId');
  const navigate = useNavigate();
  const { user, profile } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchQuiz = async () => {
      if (!noteId) return;
      try {
        const q = query(collection(db, 'quizzes'), where('noteId', '==', noteId));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const doc = snapshot.docs[0];
          setQuiz({ id: doc.id, ...doc.data() } as QuizData);
        }
      } catch (err) {
        console.error("Error fetching quiz:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [noteId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 text-indigo-600 animate-spin mb-4" />
        <p className="text-gray-600 animate-pulse">Loading Quiz Questions...</p>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8">
          <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900">No Quiz Available</h2>
          <p className="text-gray-600 mt-2">A quiz for this chapter hasn't been set up yet. Please check back later!</p>
          <button 
            onClick={() => navigate(-1)}
            className="mt-6 inline-flex items-center text-indigo-600 font-bold hover:underline"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
          </button>
        </div>
      </div>
    );
  }

  const handleStart = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setQuizStarted(true);
  };

  const handleAnswer = (optionIndex: number) => {
    const newAnswers = [...userAnswers, optionIndex];
    setUserAnswers(newAnswers);

    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      completeQuiz(newAnswers);
    }
  };

  const completeQuiz = async (finalAnswers: number[]) => {
    setSubmitting(true);
    let finalScore = 0;
    quiz.questions.forEach((q, idx) => {
      if (finalAnswers[idx] === q.correctAnswerIndex) {
        finalScore++;
      }
    });
    setScore(finalScore);

    try {
      // 1. Save submission
      await addDoc(collection(db, 'quizSubmissions'), {
        userId: profile?.id,
        quizId: quiz.id,
        noteId: noteId,
        score: finalScore,
        total: quiz.questions.length,
        completedAt: serverTimestamp()
      });

      // 2. If part of giveaway, enter user
      if (giveawayId) {
        // Create entry unique by userId and giveawayId
        await setDoc(doc(db, 'giveawayEntries', `${giveawayId}_${profile?.id}`), {
          giveawayId,
          userId: profile?.id,
          userName: profile?.name,
          score: finalScore,
          enteredAt: serverTimestamp()
        });
        
        // Increment participant count
        const giveawayRef = doc(db, 'giveaways', giveawayId);
        await updateDoc(giveawayRef, {
          participantsCount: increment(1)
        });
      }
    } catch (err) {
      console.error("Error saving quiz results:", err);
    } finally {
      setSubmitting(false);
      setQuizCompleted(true);
    }
  };

  if (quizCompleted) {
    const passed = (score / quiz.questions.length) >= 0.5;
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-3xl shadow-2xl p-8 text-center border-4 border-indigo-50"
        >
          <div className={`h-24 w-24 rounded-full flex items-center justify-center mx-auto mb-6 ${passed ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
            {passed ? <Award className="h-12 w-12" /> : <Trophy className="h-12 w-12" />}
          </div>
          
          <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Quiz Completed!</h2>
          <p className="text-gray-500 mb-8">You've answered all {quiz.questions.length} questions.</p>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-gray-50 p-4 rounded-2xl">
              <span className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Score</span>
              <span className="text-3xl font-black text-indigo-600">{score}/{quiz.questions.length}</span>
            </div>
            <div className="bg-gray-50 p-4 rounded-2xl">
              <span className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Accuracy</span>
              <span className="text-3xl font-black text-indigo-600">{Math.round((score / quiz.questions.length) * 100)}%</span>
            </div>
          </div>

          {giveawayId && (
            <div className="bg-indigo-600 text-white rounded-2xl p-6 mb-8 text-left relative overflow-hidden">
                <Gift className="absolute -bottom-4 -right-4 h-24 w-24 opacity-10" />
                <h3 className="text-lg font-bold flex items-center mb-1">
                  <CheckCircle className="mr-2 h-5 w-5 text-green-300" />
                  Successfully Participated!
                </h3>
                <p className="text-indigo-100 text-sm">Your entry has been recorded for the giveaway. We'll announce the winner once the countdown ends!</p>
            </div>
          )}

          <div className="space-y-3">
            <button 
              onClick={() => navigate('/giveaways')}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-indigo-100"
            >
              Back to Giveaways
            </button>
            <button 
              onClick={() => navigate('/')}
              className="w-full bg-white hover:bg-gray-50 text-gray-700 font-bold py-4 rounded-2xl transition-all border border-gray-200"
            >
              Go Home
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!quizStarted) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
          <h1 className="text-3xl font-extrabold text-indigo-900 mb-4">{quiz.title}</h1>
          <div className="prose prose-indigo text-gray-600 mb-8">
            <p>Ready to test your knowledge? This quiz consists of <strong>{quiz.questions.length}</strong> questions related to the chapter.</p>
            <ul className="list-disc list-inside space-y-2 mt-4 text-sm">
              <li>Each question has 4 options.</li>
              <li>Only one answer is correct.</li>
              <li>{giveawayId ? "Complete the quiz to enter the GIVEAWAY." : "Complete the quiz to track your progress."}</li>
            </ul>
          </div>

          <button 
            onClick={handleStart}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center group"
          >
            Start Quiz Now
            <ChevronRight className="ml-2 h-6 w-6 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between items-end mb-2">
            <span className="text-xs font-black text-indigo-600 uppercase tracking-widest">Question {currentQuestionIndex + 1} of {quiz.questions.length}</span>
            <span className="text-xs font-bold text-gray-400">{Math.round(progress)}% Complete</span>
        </div>
        <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-indigo-600"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          ></motion.div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div 
          key={currentQuestionIndex}
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -20, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-8 leading-tight">
            {currentQuestion.question}
          </h2>

          <div className="space-y-4">
            {currentQuestion.options.map((option, idx) => (
              <button
                key={idx}
                onClick={() => handleAnswer(idx)}
                className="w-full text-left p-5 rounded-2xl border-2 border-gray-100 hover:border-indigo-300 hover:bg-indigo-50 transition-all font-medium text-gray-700 group flex items-center justify-between"
              >
                <span>{option}</span>
                <div className="h-6 w-6 rounded-full border-2 border-gray-200 group-hover:border-indigo-400 flex-shrink-0"></div>
              </button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      <p className="text-center text-gray-400 text-xs mt-8">
        Questions are based on the latest syllabus for {quiz.title}.
      </p>
    </div>
  );
};

const Gift = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M20 12v10H4V12" />
    <path d="M2 7h20v5H2z" />
    <path d="M12 22V7" />
    <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
    <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
  </svg>
);

export default Quiz;

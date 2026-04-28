import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useAuthStore } from '../store/useAuthStore';
import { Atom, Microscope, BookOpen, GraduationCap, FileText, Pencil, X } from 'lucide-react';

interface GoalSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GoalSelectionModal({ isOpen, onClose }: GoalSelectionModalProps) {
  const { user, profile, setProfile } = useAuthStore();
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSelectedGoal(profile?.classLevel || null);
    }
  }, [isOpen, profile?.classLevel]);

  if (!isOpen) return null;

  const handleSaveGoal = async () => {
    if (!selectedGoal || !profile) return;
    setLoading(true);
    setError('');
    try {
      const uid = user?.uid || profile.id;
      if (!uid) {
         throw new Error("Unable to identify user profile, please sign out and sign in again.");
      }
      await updateDoc(doc(db, 'users', uid), {
        classLevel: selectedGoal
      });
      setProfile({ ...profile, classLevel: selectedGoal, id: uid });
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to save goal.');
    } finally {
      setLoading(false);
    }
  };

  const popularExams = [
    { id: 'jee', title: 'IIT-JEE', Icon: Atom, color: 'bg-blue-50 border-blue-200 text-blue-900', iconColor: 'text-blue-600' },
    { id: 'neet', title: 'NEET', Icon: Microscope, color: 'bg-green-50 border-green-200 text-green-900', iconColor: 'text-green-600' },
  ];

  const allExams = [
    { id: '9', title: 'Class 9', Icon: Pencil, desc: 'Schools & Boards' },
    { id: '10', title: 'Class 10', Icon: BookOpen, desc: 'Schools & Boards' },
    { id: '11', title: 'Class 11', Icon: FileText, desc: 'Schools & Boards' },
    { id: '12', title: 'Class 12', Icon: GraduationCap, desc: 'Schools & Boards' },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 pb-20 sm:pb-6">
      <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

      <div className="relative bg-gray-50 rounded-2xl text-left shadow-xl w-full max-w-3xl flex flex-col max-h-[90vh]">
        <div className="absolute top-0 right-0 pt-4 pr-4 z-10">
          <button
            onClick={onClose}
            className="bg-white/80 backdrop-blur-sm rounded-full p-1.5 text-gray-500 hover:text-gray-700 hover:bg-white focus:outline-none shadow-sm"
          >
            <span className="sr-only">Close</span>
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div className="p-6 md:p-8 overflow-y-auto flex-1">
          <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-2">Select Your Goal</h2>
          <p className="text-sm md:text-base text-gray-600 mb-6 font-medium">Personalize your experience by selecting your target exam or class.</p>
          
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4 text-sm">
              {error}
            </div>
          )}

          <div className="mb-8">
            <h3 className="text-lg font-bold text-gray-800 mb-3">Popular Exams</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {popularExams.map((exam) => {
                const isSelected = selectedGoal === exam.id;
                return (
                  <button
                    type="button"
                    key={exam.id}
                    onClick={() => setSelectedGoal(exam.id)}
                    className={`flex items-center p-3 sm:p-4 border rounded-xl transition-all ${isSelected ? `ring-2 ring-offset-1 ring-indigo-500 scale-[1.02] opacity-100 ${exam.color}` : `hover:scale-[1.02] opacity-70 hover:opacity-100 ${exam.color.replace(/bg-\w+-50/, 'bg-white').replace(/border-\w+-200/, 'border-gray-200')}`}`}
                  >
                    <exam.Icon className={`w-6 h-6 sm:w-8 sm:h-8 min-w-[24px] mr-3 ${exam.iconColor}`} />
                    <span className="font-bold text-sm sm:text-base whitespace-nowrap">{exam.title}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-3">All Classes & Exams</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {allExams.map((exam) => {
                const isSelected = selectedGoal === exam.id;
                return (
                  <button
                    type="button"
                    key={exam.id}
                    onClick={() => setSelectedGoal(exam.id)}
                    className={`flex items-center p-3 sm:p-4 border rounded-xl bg-white transition-all ${isSelected ? 'border-indigo-500 ring-2 ring-indigo-200 bg-indigo-50/50 scale-[1.02]' : 'border-gray-200 hover:border-indigo-300 hover:shadow-sm hover:scale-[1.01]'}`}
                  >
                    <div className="h-10 w-10 sm:h-12 sm:w-12 bg-indigo-50 rounded-lg flex items-center justify-center mr-3 sm:mr-4 shrink-0">
                      <exam.Icon className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />
                    </div>
                    <div className="text-left flex-1">
                      <div className="font-bold text-gray-900 text-sm sm:text-base">{exam.title}</div>
                      <div className="text-xs sm:text-sm text-gray-500">{exam.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="p-4 md:p-6 bg-white border-t border-gray-200 rounded-b-2xl flex justify-end shrink-0">
          <button
            onClick={handleSaveGoal}
            disabled={!selectedGoal || loading}
            className="w-full sm:w-auto px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Saving...' : 'Save Goal'}
          </button>
        </div>
      </div>
    </div>
  );
}

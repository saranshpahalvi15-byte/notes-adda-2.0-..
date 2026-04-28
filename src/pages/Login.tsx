import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { useAuthStore } from '../store/useAuthStore';
import { Atom, Microscope, BookOpen, GraduationCap, FileText, Pencil } from 'lucide-react';

export default function Login() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [showGoalSelection, setShowGoalSelection] = useState(false);
  const [tempProfile, setTempProfile] = useState<any>(null);
  const [tempUser, setTempUser] = useState<any>(null);
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);

  const navigate = useNavigate();
  const { setProfile, setUser } = useAuthStore();

  const generateReferralCode = (name: string) => {
    const prefix = name.substring(0, 3).toUpperCase();
    const random = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}${random}`;
  };

  const syncProfile = async (uid: string, email: string | null, displayName: string | null) => {
    const userDocRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      let data = userDoc.data();
      if ((email === 'masteradmin@vidyanotes.com' || email === 'saransh1860@gmail.com') && data.role !== 'admin') {
        await updateDoc(userDocRef, { role: 'admin' });
        data.role = 'admin';
      }
      return { id: userDoc.id, ...data } as any;
    } else {
      const newProfile = {
        id: uid,
        email: email || '',
        name: displayName || email?.split('@')[0] || 'User',
        role: (email === 'masteradmin@vidyanotes.com' || email === 'saransh1860@gmail.com') ? 'admin' : 'user',
        referralCode: generateReferralCode(displayName || 'USR'),
        referredBy: null,
        createdAt: new Date().toISOString()
      };
      await setDoc(userDocRef, newProfile);
      return newProfile;
    }
  };

  const proceedOrAskGoal = (profileData: any, user: any) => {
    if (profileData.role !== 'admin' && !profileData.classLevel) {
      setTempProfile(profileData);
      setTempUser(user);
      setShowGoalSelection(true);
    } else {
      setProfile(profileData);
      setUser(user);
      navigate(profileData.role === 'admin' ? '/admin' : '/dashboard');
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError('');
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      const profileData = await syncProfile(result.user.uid, result.user.email, result.user.displayName);
      proceedOrAskGoal(profileData, result.user);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred during sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGoal = async () => {
    if (!selectedGoal || !tempProfile || !tempUser) return;
    setLoading(true);
    setError('');
    try {
      await updateDoc(doc(db, 'users', tempUser.uid), {
        classLevel: selectedGoal
      });
      const updatedProfile = { ...tempProfile, classLevel: selectedGoal };
      setProfile(updatedProfile);
      setUser(tempUser);
      navigate(updatedProfile.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to save goal.');
    } finally {
      setLoading(false);
    }
  };

  if (showGoalSelection) {
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
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 pb-20 sm:pb-6 bg-gray-50/80 backdrop-blur-sm">
        <div className="relative bg-white border border-gray-200 rounded-2xl text-left shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh]">
          
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

          <div className="p-4 md:p-6 bg-gray-50 border-t border-gray-200 rounded-b-2xl flex justify-end shrink-0">
            <button
              type="button"
              onClick={handleSaveGoal}
              disabled={!selectedGoal || loading}
              className="w-full sm:w-auto px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Saving...' : 'Continue to Dashboard'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-10 bg-white p-8 border border-gray-200 rounded-2xl shadow-sm">
      <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">
        Sign In / Sign Up
      </h2>
      
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4 text-sm">
          {error}
        </div>
      )}

      <button
        onClick={handleGoogleLogin}
        disabled={loading}
        className="w-full flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 mb-6"
      >
        <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        Continue with Google
      </button>
    </div>
  );
}

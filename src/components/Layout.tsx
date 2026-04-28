import { useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { BookOpen, LogOut, User, LayoutDashboard, Settings, Menu, X, Target } from 'lucide-react';
import AIChatWidget from './AIChatWidget';
import GoalSelectionModal from './GoalSelectionModal';

export default function Layout() {
  const { user, profile, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch(e) {
      console.error(e);
    }
    logout();
    navigate('/');
  };

  const currentGoalLabel = profile?.classLevel 
    ? (profile.classLevel === 'jee' ? 'IIT-JEE' : profile.classLevel === 'neet' ? 'NEET' : `Class ${profile.classLevel}`)
    : 'Select Goal';

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900">
      <div className="bg-[#25D366] text-white px-4 py-2 text-sm font-bold text-center flex justify-center items-center">
        <a 
          href="https://whatsapp.com/channel/0029VbBxL9H2ZjCrSXo1mc2A" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center hover:text-green-100 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
          </svg>
          FOR EXTRA DISCOUNT CLICK HERE
        </a>
      </div>
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <button 
                className="lg:hidden mr-2 p-2 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 focus:outline-none"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
              <Link to="/" className="flex items-center space-x-1 sm:space-x-2">
                <img src="/logo.svg" alt="NotesAdda Logo" className="h-8 md:h-10 w-auto object-contain" />
                <span className="text-xl md:text-2xl font-black tracking-tight whitespace-nowrap" style={{ fontFamily: "'Nunito', 'Arial Rounded MT Bold', sans-serif" }}>
                  <span className="text-[#0B406B]">Notes</span>
                  <span className="text-[#F47B20]">Adda</span>
                </span>
              </Link>
            </div>
            
            <nav className="hidden lg:flex space-x-1">
              <Link to="/notes" className="text-xs xl:text-sm px-2 xl:px-3 py-2 rounded-md text-gray-600 hover:bg-gray-100 hover:text-indigo-600 font-medium transition-colors">
                Chapter Wise Notes
              </Link>
              <Link to="/bundles" className="text-xs xl:text-sm px-2 xl:px-3 py-2 rounded-md text-gray-600 hover:bg-gray-100 hover:text-indigo-600 font-medium transition-colors">
                Bundles
              </Link>
              <Link to="/mindMaps" className="text-xs xl:text-sm px-2 xl:px-3 py-2 rounded-md text-gray-600 hover:bg-gray-100 hover:text-indigo-600 font-medium transition-colors">
                Mind Maps
              </Link>
              <Link to="/audioNotes" className="text-sm px-3 py-2 rounded-md text-gray-600 hover:bg-gray-100 hover:text-indigo-600 font-medium transition-colors">
                Audio Notes
              </Link>
              <Link to="/mockTests" className="text-sm px-3 py-2 rounded-md text-gray-600 hover:bg-gray-100 hover:text-indigo-600 font-medium transition-colors">
                Mock Tests
              </Link>
            </nav>

            <div className="flex items-center space-x-2 sm:space-x-4">
              {user ? (
                <div className="flex items-center space-x-2 sm:space-x-4">
                  <button
                    onClick={() => setIsGoalModalOpen(true)}
                    className="hidden sm:flex items-center px-3 py-1.5 border border-indigo-200 rounded-lg text-sm font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors"
                  >
                    <Target className="h-4 w-4 mr-1.5 text-indigo-500" />
                    Goal: {currentGoalLabel}
                  </button>
                  {profile?.role === 'admin' && (
                    <Link to="/admin" className="text-gray-500 hover:text-indigo-600 flex items-center p-2 sm:p-0">
                      <Settings className="h-5 w-5 sm:mr-1" />
                      <span className="hidden lg:inline text-sm font-medium">Admin</span>
                    </Link>
                  )}
                  <Link to="/dashboard" className="text-gray-500 hover:text-indigo-600 flex items-center p-2 sm:p-0">
                    <LayoutDashboard className="h-5 w-5 sm:mr-1" />
                    <span className="hidden lg:inline text-sm font-medium">Dashboard</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="text-gray-500 hover:text-red-600 flex items-center p-2 sm:p-0"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center px-3 py-1.5 border border-transparent rounded-md shadow-sm text-xs sm:text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 whitespace-nowrap"
                >
                  <User className="h-4 w-4 hidden sm:block sm:mr-1.5" />
                  <span className="sm:hidden">Login</span>
                  <span className="hidden sm:inline">Login/Signup</span>
                </Link>
              )}
            </div>
          </div>
        </div>
        
        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-gray-200 px-2 pt-2 pb-3 space-y-1 sm:px-3 shadow-inner w-full">
            {user && (
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsGoalModalOpen(true);
                }}
                className="w-full flex items-center px-3 py-2 rounded-md text-base font-medium text-indigo-700 bg-indigo-50 mb-2"
              >
                <Target className="h-5 w-5 mr-2 text-indigo-500" />
                Goal: {currentGoalLabel} (Change)
              </button>
            )}
            <Link 
              to="/notes" 
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Chapter Wise Notes
            </Link>
            <Link 
              to="/bundles" 
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Bundles
            </Link>
            <Link 
              to="/mindMaps" 
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Mind Maps
            </Link>
            <Link 
              to="/audioNotes" 
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Audio Notes
            </Link>
            <Link 
              to="/mockTests" 
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Mock Tests
            </Link>
          </div>
        )}
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      <footer className="bg-[#99c2c6] border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-1">
              <Link to="/" className="flex items-center space-x-2 mb-4">
                <img src="/logo.svg" alt="NotesAdda Logo" className="h-8 w-auto object-contain" />
                <span className="text-xl font-black tracking-tight" style={{ fontFamily: "'Nunito', 'Arial Rounded MT Bold', sans-serif" }}>
                  <span className="text-[#0B406B]">Notes</span>
                  <span className="text-[#F47B20]">Adda</span>
                </span>
              </Link>
              <p className="text-gray-500 text-sm">
                Your ultimate destination for high-quality, handwritten, and printed PDF notes for Classes 9-12.
              </p>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase mb-4">Quick Links</h3>
              <ul className="space-y-3">
                <li><Link to="/notes" className="text-sm text-gray-600 hover:text-indigo-600">Chapter Wise Notes</Link></li>
                <li><Link to="/bundles" className="text-sm text-gray-600 hover:text-indigo-600">Bundles</Link></li>
                <li><Link to="/mindMaps" className="text-sm text-gray-600 hover:text-indigo-600">Mind Maps</Link></li>
                <li><Link to="/audioNotes" className="text-sm text-gray-600 hover:text-indigo-600">Audio Notes</Link></li>
                <li><Link to="/mockTests" className="text-sm text-gray-600 hover:text-indigo-600">Mock Tests</Link></li>
                <li><Link to="/dashboard" className="text-sm text-gray-600 hover:text-indigo-600">My Dashboard</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase mb-4">Legal</h3>
              <ul className="space-y-3">
                <li><Link to="/privacy" className="text-sm text-gray-600 hover:text-indigo-600">Privacy Policy</Link></li>
                <li><Link to="/terms" className="text-sm text-gray-600 hover:text-indigo-600">Terms of Service</Link></li>
                <li><Link to="/refund" className="text-sm text-gray-600 hover:text-indigo-600">Refund Policy</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase mb-4">Connect With Us</h3>
              <div className="flex space-x-4">
                <a href="https://whatsapp.com/channel/0029VbBxL9H2ZjCrSXo1mc2A" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#25D366]">
                  <span className="sr-only">WhatsApp</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
          <div className="mt-8 border-t border-gray-200 pt-8">
            <p className="text-center text-sm text-gray-500">
              &copy; {new Date().getFullYear()} NotesAdda. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
      
      <AIChatWidget />
      
      <GoalSelectionModal 
        isOpen={isGoalModalOpen} 
        onClose={() => setIsGoalModalOpen(false)} 
      />
    </div>
  );
}

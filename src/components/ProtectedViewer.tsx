import React, { useState, useEffect, useRef } from 'react';
import { Shield, EyeOff, Lock } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

interface ProtectedViewerProps {
  children: React.ReactNode;
  isActive: boolean;
  title?: string;
}

export default function ProtectedViewer({ children, isActive, title }: ProtectedViewerProps) {
  const [isBlurred, setIsBlurred] = useState(false);
  const { user } = useAuthStore();

  const requestRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!isActive) return;

    const handleVisibilityChange = () => {
      if (document.hidden) setIsBlurred(true);
    };

    const handleBlur = () => setIsBlurred(true);
    const handleFocus = () => setIsBlurred(false);
    const handleMouseLeave = () => setIsBlurred(true);
    const handleMouseEnter = () => {
      if (document.hasFocus()) setIsBlurred(false);
    };

    const handleClick = () => {
      setIsBlurred(false);
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Blur immediately on Windows/Cmd keys
      if (e.key === 'Meta' || e.key === 'OS' || e.key === 'Windows' || e.key === 'Alt') {
        setIsBlurred(true);
      }

      const isScreenshotShortcut = (
        ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key.toLowerCase() === 's' || e.key === '4' || e.key === '5')) ||
        (e.key === 'PrintScreen') ||
        (e.metaKey && e.key.toLowerCase() === 's')
      );

      if (isScreenshotShortcut) {
        setIsBlurred(true);
        if (e.key === 'PrintScreen') {
          navigator.clipboard.writeText("");
        }
        setTimeout(() => {
          if (document.hasFocus()) setIsBlurred(false);
        }, 2000);
      }

      if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 's' || e.key === 'c' || e.key === 'u')) {
        e.preventDefault();
        setIsBlurred(true);
        setTimeout(() => setIsBlurred(false), 2000);
        return false;
      }
    };

    // Ultra-high frequency polling (up to 144Hz)
    const checkFocus = () => {
      if (!document.hasFocus()) {
        setIsBlurred(true);
      }
      requestRef.current = requestAnimationFrame(checkFocus);
    };
    requestRef.current = requestAnimationFrame(checkFocus);

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('mouseenter', handleMouseEnter);
    window.addEventListener('click', handleClick);
    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown, true);

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('mouseenter', handleMouseEnter);
      window.removeEventListener('click', handleClick);
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [isActive]);

  if (!isActive) return <>{children}</>;

  return (
    <div className="relative w-full h-full overflow-hidden select-none group">
      <div className={`w-full h-full transition-all duration-0 ${isBlurred ? 'blur-3xl grayscale scale-110 opacity-0 pointer-events-none' : ''}`}>
        {children}
      </div>

      {isBlurred && (
        <div className="absolute inset-0 z-[60] flex flex-col items-center justify-center bg-gray-900/40 backdrop-blur-md text-white p-6 text-center animate-in fade-in duration-500">
          <div className="bg-white/20 p-4 rounded-full mb-4 animate-pulse">
            <EyeOff className="h-12 w-12 text-white" />
          </div>
          <h3 className="text-2xl font-black mb-2 uppercase tracking-tight">Content Protected</h3>
          <p className="text-indigo-100 max-w-sm font-medium">
            Screenshot protection is active. Please focus the window to continue reading your study material.
          </p>
          <div className="mt-8 flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl text-xs font-bold border border-white/20">
            <Lock className="h-3 w-3" />
            Security Powered by NotesAdda
          </div>
        </div>
      )}

      {/* Security Overlay Watermark */}
      {!isBlurred && (
        <>
          <div className="absolute top-4 right-4 z-10 pointer-events-none flex items-center gap-2 bg-black/20 backdrop-blur-sm px-3 py-1.5 rounded-full text-[10px] font-bold text-white/70 border border-white/10 italic">
            <Shield className="h-3 w-3" />
            Protected Mode Active
          </div>
          
          {/* Subtle Watermark Overlay */}
          <div className="absolute inset-0 z-[5] pointer-events-none grid grid-cols-2 grid-rows-3 opacity-[0.03] rotate-[-25deg] scale-150">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="flex items-center justify-center text-sm font-black whitespace-nowrap text-gray-900 overflow-hidden">
                {user?.email?.split('@')[0]} • NOTESADDA • {user?.uid.slice(0, 5)}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

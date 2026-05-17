import React, { useState, useEffect, useRef } from 'react';
import { Shield, Lock } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

interface ProtectedViewerProps {
  children: React.ReactNode;
  isActive: boolean;
  title?: string;
}

export default function ProtectedViewer({ children, isActive }: ProtectedViewerProps) {
  const [isBlurred, setIsBlurred] = useState(false);

  const isResumingRef = useRef(false);
  const requestRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!isActive) return;

    const handleVisibilityChange = () => {
      if (document.hidden || document.visibilityState === 'hidden') {
        setIsBlurred(true);
      }
    };

    const handleBlur = () => setIsBlurred(true);
    const handleFocus = () => {
      if (document.hasFocus()) setIsBlurred(false);
    };
    const handleMouseLeave = () => setIsBlurred(true);
    const handleMouseEnter = () => {
      if (document.hasFocus()) setIsBlurred(false);
    };

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (touch.clientY < 60) setIsBlurred(true);
      if (e.touches.length > 1) setIsBlurred(true);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches[0].clientY < 100) setIsBlurred(true);
    };

    const handleTouchEnd = () => {
      setTimeout(() => {
        if (document.hasFocus()) setIsBlurred(false);
      }, 1500);
    };

    const handleClick = () => {
      if (!document.hasFocus()) setIsBlurred(true);
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      setIsBlurred(true);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Meta' || e.key === 'OS' || e.key === 'Windows' || e.key === 'Alt' || e.key === 'Tab' || e.key === 'Escape') {
        setIsBlurred(true);
      }

      const isScreenshotShortcut = (
        ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key.toLowerCase() === 's' || e.key === '4' || e.key === '5')) ||
        (e.key === 'PrintScreen') ||
        (e.metaKey && e.key.toLowerCase() === 's')
      );

      if (isScreenshotShortcut) {
        setIsBlurred(true);
        navigator.clipboard.writeText("Protected Content - NotesAdda");
        e.preventDefault();
      }

      if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 's' || e.key === 'c' || e.key === 'u')) {
        e.preventDefault();
        setIsBlurred(true);
      }
    };

    let lastTime = performance.now();
    let frameCount = 0;
    const checkFocus = () => {
      const now = performance.now();
      const delta = now - lastTime;
      lastTime = now;
      frameCount++;

      if (isResumingRef.current) {
        requestRef.current = requestAnimationFrame(checkFocus);
        return;
      }

      if (frameCount < 10) {
        requestRef.current = requestAnimationFrame(checkFocus);
        return;
      }

      if (delta > 100) setIsBlurred(true);

      const isInIframe = window.self !== window.top;
      if (!isInIframe) {
        if (window.outerWidth - window.innerWidth > 160 || window.outerHeight - window.innerHeight > 160) {
          setIsBlurred(true);
        }
      }
      
      if (window.visualViewport) {
        if (window.visualViewport.height < window.innerHeight * 0.75) {
          if (!isBlurred) setIsBlurred(true);
        }
      }

      if (!document.hasFocus() && frameCount > 120) {
        setIsBlurred(true);
      }
      
      requestRef.current = requestAnimationFrame(checkFocus);
    };
    requestRef.current = requestAnimationFrame(checkFocus);

    const handleResize = () => {
      setIsBlurred(true);
      setTimeout(() => {
        if (document.hasFocus()) setIsBlurred(false);
      }, 1500);
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('focusout', handleBlur);
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('mouseenter', handleMouseEnter);
    window.addEventListener('resize', handleResize);
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('click', handleClick);
    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown, true);

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('focusout', handleBlur);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('mouseenter', handleMouseEnter);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('click', handleClick);
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [isActive, isBlurred]);

  if (!isActive) return <>{children}</>;

  return (
    <div className="relative w-full h-full overflow-hidden select-none bg-gray-950">
      <div className={`w-full h-full transition-all duration-0 ${isBlurred ? 'blur-[100px] grayscale brightness-0 opacity-0 pointer-events-none' : ''}`}>
        {children}
      </div>

      {isBlurred && (
        <div className="absolute inset-0 z-[60] flex flex-col items-center justify-center bg-gray-950 text-white p-6 text-center animate-in fade-in duration-300">
          <div className="bg-white/10 p-5 rounded-full mb-6 border border-white/20">
            <Shield className="h-14 w-14 text-indigo-400" />
          </div>
          <h3 className="text-3xl font-black mb-3 uppercase tracking-tighter">Content Protected</h3>
          <p className="text-gray-400 max-w-sm font-medium text-lg leading-relaxed">
            For security reasons, content is hidden when focusing away or using capture tools.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4">
            <button 
              onClick={() => {
                isResumingRef.current = true;
                setIsBlurred(false);
                setTimeout(() => {
                  isResumingRef.current = false;
                }, 2000);
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-2xl font-bold transition-all active:scale-95 shadow-xl shadow-indigo-500/20"
            >
              Resume Viewing
            </button>
            <div className="flex items-center gap-2 text-gray-500 text-[10px] font-bold tracking-widest uppercase">
              <Lock className="h-3 w-3" />
              End-to-End Security Powered by NotesAdda
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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

    // Heartbeat detection to catch frame drops during system-level screenshot captures
    let lastTime = performance.now();
    const checkFocus = () => {
      const now = performance.now();
      const delta = now - lastTime;
      lastTime = now;

      // If the frame took more than 100ms (typical of a screenshot tool freeze)
      if (delta > 100) {
        setIsBlurred(true);
      }

      if (!document.hasFocus()) {
        setIsBlurred(true);
      }
      requestRef.current = requestAnimationFrame(checkFocus);
    };
    requestRef.current = requestAnimationFrame(checkFocus);

    const handleResize = () => {
      setIsBlurred(true);
      setTimeout(() => {
        if (document.hasFocus()) setIsBlurred(false);
      }, 500);
    };

    const handleTouchStart = (e: TouchEvent) => {
      // Blur on multi-finger touches (often used for screenshot gestures)
      if (e.touches.length > 2) {
        setIsBlurred(true);
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('mouseenter', handleMouseEnter);
    window.addEventListener('resize', handleResize);
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
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
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('click', handleClick);
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [isActive]);

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!isActive) return;

    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isActive]);

  if (!isActive) return <>{children}</>;

  return (
    <div className="relative w-full h-full overflow-hidden select-none group">
      <div className={`w-full h-full transition-all duration-0 ${isBlurred ? 'blur-3xl grayscale scale-110 opacity-0 pointer-events-none' : ''}`}>
        {children}
      </div>

      {/* Floating identity watermark that follows interaction */}
      {!isBlurred && (
        <div 
          className="fixed z-[100] pointer-events-none text-[10px] font-bold text-gray-900/10 whitespace-nowrap uppercase select-none transition-all duration-500"
          style={{ 
            left: mousePos.x + 20, 
            top: mousePos.y + 20,
            transform: 'rotate(-15deg)'
          }}
        >
          {user?.email} • {user?.uid.slice(0, 10)}
        </div>
      )}

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
          
          {/* Aggressive Watermark Grid */}
          <div className="absolute inset-0 z-[5] pointer-events-none grid grid-cols-3 grid-rows-6 opacity-[0.05] rotate-[-20deg] scale-125 select-none">
            {Array.from({ length: 18 }).map((_, i) => (
              <div key={i} className="flex items-center justify-center text-[10px] sm:text-xs font-black whitespace-nowrap text-gray-900 border border-gray-900/5 m-2 overflow-hidden uppercase">
                {user?.email?.split('@')[0]} • {user?.uid.slice(0, 8)} • PRIVATE
              </div>
            ))}
          </div>

          <div className="absolute inset-0 z-[6] pointer-events-none grid grid-cols-2 grid-rows-4 opacity-[0.03] rotate-[20deg] scale-110 select-none">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center justify-center text-[8px] sm:text-[10px] font-bold whitespace-nowrap text-indigo-900 overflow-hidden uppercase">
                COPYRIGHT © NOTESADDA • {new Date().getFullYear()}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

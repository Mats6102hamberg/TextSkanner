"use client";

import React, { useState, useEffect } from "react";

interface MobileLayoutProps {
  children: React.ReactNode;
  title?: string;
  showBackButton?: boolean;
  backButtonHref?: string;
  rightAction?: React.ReactNode;
  className?: string;
}

export default function MobileLayout({
  children,
  title,
  showBackButton = false,
  backButtonHref,
  rightAction,
  className = ""
}: MobileLayoutProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleBack = () => {
    if (backButtonHref) {
      window.location.href = backButtonHref;
    } else {
      window.history.back();
    }
  };

  if (!isMobile) {
    return (
      <div className={`min-h-screen bg-gray-50 ${className}`}>
        {children}
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-50 flex flex-col ${className}`}>
      {/* Mobile Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-3">
            {showBackButton && (
              <button
                onClick={handleBack}
                className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Go back"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            {title && (
              <h1 className="text-lg font-semibold text-gray-900 truncate">
                {title}
              </h1>
            )}
          </div>
          
          {rightAction && (
            <div className="flex items-center">
              {rightAction}
            </div>
          )}
          
          {!rightAction && (
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50"
          onClick={() => setIsMenuOpen(false)}
        >
          <div
            className="bg-white w-64 h-full shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold">Menu</h2>
            </div>
            <nav className="p-4">
              <a href="/" className="block py-2 text-gray-700 hover:text-blue-600">
                🏠 Home
              </a>
              <a href="/dagbok" className="block py-2 text-gray-700 hover:text-blue-600">
                📝 Diary Scanner
              </a>
              <a href="/avtal" className="block py-2 text-gray-700 hover:text-blue-600">
                📄 Contract Scanner
              </a>
              <a href="/slaktmagin" className="block py-2 text-gray-700 hover:text-blue-600">
                🧬 Släktmagin
              </a>
              <a href="/minnesbok" className="block py-2 text-gray-700 hover:text-blue-600">
                📚 Memory Book
              </a>
              <a href="/maskering" className="block py-2 text-gray-700 hover:text-blue-600">
                🔒 Masking Tool
              </a>
              <a href="/sprak" className="block py-2 text-gray-700 hover:text-blue-600">
                🌍 Language Tool
              </a>
              <a href="/analytics" className="block py-2 text-gray-700 hover:text-blue-600">
                📊 Analytics
              </a>
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="bg-white border-t sticky bottom-0 z-30">
        <div className="grid grid-cols-4 gap-1">
          <a
            href="/"
            className="flex flex-col items-center py-2 px-1 text-xs text-gray-600 hover:text-blue-600 transition-colors"
          >
            <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span>Home</span>
          </a>
          <a
            href="/dagbok"
            className="flex flex-col items-center py-2 px-1 text-xs text-gray-600 hover:text-blue-600 transition-colors"
          >
            <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <span>Diary</span>
          </a>
          <a
            href="/slaktmagin"
            className="flex flex-col items-center py-2 px-1 text-xs text-gray-600 hover:text-blue-600 transition-colors"
          >
            <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span>Family</span>
          </a>
          <a
            href="/maskering"
            className="flex flex-col items-center py-2 px-1 text-xs text-gray-600 hover:text-blue-600 transition-colors"
          >
            <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>Mask</span>
          </a>
        </div>
      </nav>
    </div>
  );
}

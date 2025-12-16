// src/components/Layout.tsx
import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Navigation Bar */}
      <header className="bg-blue-600 text-white shadow-md p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">🍔 Restaurant POS</h1>
        <div className="text-sm">Owner Mode</div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4">
        {children}
      </main>
      
      {/* Footer / Status Bar */}
      <footer className="bg-gray-800 text-white p-2 text-center text-xs">
        System Active • Offline Capable
      </footer>
    </div>
  );
};
// src/App.tsx
import { useState } from 'react';
import { Layout } from './components/Layout';
import { CategoryManager } from './components/CategoryManager';
import { TableGrid } from './components/TableGrid';

// Simple Navigation State
type View = 'tables' | 'menu';

function App() {
  const [currentView, setCurrentView] = useState<View>('tables');

  return (
    <Layout>
      {/* Navigation Tabs */}
      <div className="flex gap-4 mb-6 border-b pb-4">
        <button
          onClick={() => setCurrentView('tables')}
          className={`px-6 py-2 rounded-full font-bold transition-colors ${
            currentView === 'tables' 
              ? 'bg-blue-600 text-white shadow-md' 
              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
          }`}
        >
          🍽️ Tables
        </button>
        <button
          onClick={() => setCurrentView('menu')}
          className={`px-6 py-2 rounded-full font-bold transition-colors ${
            currentView === 'menu' 
              ? 'bg-blue-600 text-white shadow-md' 
              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
          }`}
        >
          📂 Menu Setup
        </button>
      </div>

      {/* View Switcher */}
      <div className="animate-fade-in">
        {currentView === 'tables' ? <TableGrid /> : <CategoryManager />}
      </div>
    </Layout>
  )
}

export default App
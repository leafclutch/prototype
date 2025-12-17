// src/components/TableGrid.tsx
import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { orderService } from '../services/orderService';

const TABLES = Array.from({ length: 16 }, (_, i) => (i + 1).toString());

interface TableGridProps {
  onTableSelect?: (tableNum: string) => void;
}

export const TableGrid: React.FC<TableGridProps> = ({ onTableSelect }) => {
  const activeTables = useLiveQuery(() => orderService.getActiveTables(), []);

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">🍽️ Restaurant Tables</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {TABLES.map((tableNum) => {
          const isOccupied = activeTables?.includes(tableNum);

          return (
            <button
              key={tableNum}
              onClick={() => onTableSelect && onTableSelect(tableNum)}
              // REMOVED THE DISABLED CHECK HERE so you can always click it
              className={`
                h-32 rounded-xl shadow-md flex flex-col items-center justify-center
                transition-all transform hover:scale-105 relative
                ${isOccupied 
                  ? 'bg-red-600 text-white hover:bg-red-700 shadow-red-200' // Occupied Style
                  : 'bg-green-100 text-green-800 hover:bg-green-200 border-2 border-green-500'} // Free Style
              `}
            >
              <span className="text-3xl font-bold mb-1">{tableNum}</span>
              <span className="text-sm font-medium uppercase tracking-wider">
                {isOccupied ? 'Occupied' : 'Empty'}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
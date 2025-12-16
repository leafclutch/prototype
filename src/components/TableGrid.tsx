// src/components/TableGrid.tsx
import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { orderService } from '../services/orderService';

// Tables 1 to 16
const TABLES = Array.from({ length: 16 }, (_, i) => (i + 1).toString());

interface TableGridProps {
  // If provided, the grid acts as a "Picker" (for switching tables)
  // If not provided, it acts as the "Dashboard" (Open/Create orders)
  onTableSelect?: (tableNum: string) => void;
}

export const TableGrid: React.FC<TableGridProps> = ({ onTableSelect }) => {
  const activeTables = useLiveQuery(
    () => orderService.getActiveTables(),
    []
  );

  const handleTableClick = (tableNum: string, isOccupied: boolean) => {
    // MODE 1: Selection Mode (Switching Tables)
    if (onTableSelect) {
      if (isOccupied) {
        alert("⚠️ Cannot move to an occupied table!");
        return;
      }
      onTableSelect(tableNum);
      return;
    }

    // MODE 2: Dashboard Mode (Normal Operation)
    if (isOccupied) {
      // TODO: Open existing order (Step 7)
      alert(`Open Order for Table ${tableNum}`);
    } else {
      // TODO: Create new order (Step 6)
      alert(`Start New Order for Table ${tableNum}`);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      {!onTableSelect && (
        <h2 className="text-2xl font-bold mb-6 text-gray-800">🍽️ Restaurant Tables</h2>
      )}
      
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {TABLES.map((tableNum) => {
          const isOccupied = activeTables?.includes(tableNum);

          return (
            <button
              key={tableNum}
              onClick={() => handleTableClick(tableNum, !!isOccupied)}
              // Disable button if we are in "Switch Mode" and table is occupied
              disabled={!!onTableSelect && isOccupied}
              className={`
                h-32 rounded-xl shadow-md flex flex-col items-center justify-center
                transition-all transform hover:scale-105 relative
                ${isOccupied 
                  ? 'bg-red-500 text-white hover:bg-red-600' 
                  : 'bg-green-100 text-green-800 hover:bg-green-200 border-2 border-green-500'}
                
                ${(!!onTableSelect && isOccupied) ? 'opacity-50 cursor-not-allowed' : ''}
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
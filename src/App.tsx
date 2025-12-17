// src/App.tsx
import { useState } from 'react';
import { Layout } from './components/Layout';
import { MenuManager } from './components/MenuManager';
import { TableGrid } from './components/TableGrid';
import { OrderView } from './components/OrderView';
import { OrderList } from './components/OrderList';
import { SalesDashboard } from './components/SalesDashboard';
import { orderService } from './services/orderService';
import type { Order } from './db/db';

type View = 'tables' | 'active-list' | 'menu' | 'sales' | 'order';

function App() {
  const [currentView, setCurrentView] = useState<View>('tables');
  const [returnView, setReturnView] = useState<View>('tables'); 
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);

  const handleTableClick = async (tableNum: string, source: View) => {
    try {
      // 1. Try to find existing order
      let order = await orderService.getOrderByTable(tableNum);
      
      // 2. If not found, create one
      if (!order) {
        order = await orderService.createOrder(tableNum);
      }
      
      // 3. Set state (ensure order is valid)
      if (order) {
        setActiveOrder(order);
        setReturnView(source);
        setCurrentView('order');
      }
    } catch (error) {
      console.error(error);
      alert("Error opening table");
    }
  };

  const handleCloseOrder = async () => {
    // Clean up empty orders on close
    if (activeOrder) {
      const freshOrder = await orderService.getOrderById(activeOrder.id);
      if (freshOrder && freshOrder.totalAmount <= 0) {
        await orderService.deleteOrder(freshOrder.id);
      }
    }
    setActiveOrder(null);
    setCurrentView(returnView);
  };

  return (
    <Layout>
      {currentView !== 'order' && (
        <div className="flex w-full gap-4 mb-6 border-b pb-4">
          <NavButton active={currentView === 'tables'} onClick={() => setCurrentView('tables')}>🍽️ Tables</NavButton>
          <NavButton active={currentView === 'active-list'} onClick={() => setCurrentView('active-list')}>📝 Orders</NavButton>
          <NavButton active={currentView === 'menu'} onClick={() => setCurrentView('menu')}>📂 Menu</NavButton>
          <NavButton active={currentView === 'sales'} onClick={() => setCurrentView('sales')}>📈 Sales</NavButton>
        </div>
      )}

      <div className="animate-fade-in w-full relative">
        {currentView === 'tables' && <TableGrid onTableSelect={(t) => handleTableClick(t, 'tables')} />}
        {currentView === 'active-list' && <OrderList onSelectOrder={(t) => handleTableClick(t, 'active-list')} />}
        {currentView === 'menu' && <MenuManager />}
        {currentView === 'sales' && <SalesDashboard />}
        
        {currentView === 'order' && activeOrder && (
          <OrderView order={activeOrder} onBack={handleCloseOrder} />
        )}
      </div>
    </Layout>
  )
}

const NavButton = ({ active, onClick, children }: any) => (
  <button onClick={onClick} className={`flex-1 py-4 rounded-xl font-bold text-lg transition-all shadow-sm ${active ? 'bg-gray-900 text-white shadow-lg transform scale-[1.02]' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}>
    {children}
  </button>
);

export default App
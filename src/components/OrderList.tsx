// src/components/OrderList.tsx
import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Order } from '../db/db';
import { orderService } from '../services/orderService';
import { PaymentModal } from './PaymentModal';

interface OrderListProps {
  onSelectOrder: (tableNum: string) => void;
}

export const OrderList: React.FC<OrderListProps> = ({ onSelectOrder }) => {
  const [paymentOrder, setPaymentOrder] = useState<Order | null>(null);
  const [openStatusMenuId, setOpenStatusMenuId] = useState<string | null>(null);

  const activeOrders = useLiveQuery(async () => {
    return await db.orders.where('status').noneOf(['paid', 'cancelled']).reverse().sortBy('updatedAt');
  });

  const handleQuickStart = async () => {
    const walkInId = `Walk-in ${Math.floor(Math.random() * 1000)}`;
    await orderService.createOrder(walkInId);
    onSelectOrder(walkInId);
  };

  const handleStatusUpdate = async (orderId: string, status: 'order' | 'served') => {
    await orderService.updateStatus(orderId, status);
    setOpenStatusMenuId(null);
  };

  return (
    <div className="max-w-6xl mx-auto animate-fade-in pb-20">
      <div className="flex justify-between items-center mb-8">
        <div>
           <h2 className="text-2xl font-bold text-gray-800">Active Orders</h2>
           <p className="text-gray-500 text-sm">Manage Kitchen & Payments</p>
        </div>
        <button onClick={handleQuickStart} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-bold shadow-lg text-lg flex items-center gap-2 transition-transform active:scale-95">
          <span>+</span> Start New Order
        </button>
      </div>
      
      <div className="bg-white shadow rounded-xl overflow-visible border border-gray-200">
        <table className="min-w-full">
          <thead className="bg-gray-100 text-gray-600 text-sm uppercase font-bold tracking-wider">
            <tr>
              <th className="py-4 px-6 text-left">Table / Customer</th>
              <th className="py-4 px-6 text-left">Bill Total</th>
              <th className="py-4 px-6 text-left">Kitchen Status</th>
              <th className="py-4 px-6 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {activeOrders?.map((order) => (
              <tr key={order.id} className="hover:bg-blue-50 transition-colors">
                
                <td onClick={() => onSelectOrder(order.tableNumber)} className="py-4 px-6 cursor-pointer group">
                  <div className="font-bold text-xl text-gray-800 group-hover:text-blue-600">{order.tableNumber}</div>
                  <div className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                </td>

                <td className="py-4 px-6 font-bold text-gray-700">₹{order.totalAmount}</td>
                
                <td className="py-4 px-6 relative">
                   <button 
                     onClick={() => setOpenStatusMenuId(openStatusMenuId === order.id ? null : order.id)}
                     className={`px-4 py-2 rounded-lg text-xs font-extrabold border-2 transition-all flex items-center gap-2
                       ${order.status === 'served' 
                         ? 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200' 
                         : 'bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-200'}`}
                   >
                     {order.status === 'served' ? '✅ SERVED' : '🕒 PREPARING'}
                     <span className="text-xs opacity-50">▼</span>
                   </button>
                   {openStatusMenuId === order.id && (
                     <div className="absolute top-12 left-0 bg-white shadow-2xl rounded-xl border border-gray-200 z-50 w-40 overflow-hidden animate-fade-in">
                        <button onClick={() => handleStatusUpdate(order.id, 'order')} className="w-full text-left px-4 py-3 hover:bg-orange-50 text-xs font-bold text-orange-700 flex items-center gap-2 border-b border-gray-100">🕒 PREPARING</button>
                        <button onClick={() => handleStatusUpdate(order.id, 'served')} className="w-full text-left px-4 py-3 hover:bg-green-50 text-xs font-bold text-green-700 flex items-center gap-2">✅ SERVED</button>
                     </div>
                   )}
                   {openStatusMenuId === order.id && <div className="fixed inset-0 z-40" onClick={() => setOpenStatusMenuId(null)}></div>}
                </td>

                <td className="py-4 px-6 text-center">
                  <div className="flex justify-center gap-4 items-center">
                    <button onClick={() => onSelectOrder(order.tableNumber)} className="text-gray-400 font-bold text-sm hover:text-blue-600 hover:underline">Edit</button>
                    <button onClick={() => setPaymentOrder(order)} className="bg-green-600 text-white px-6 py-2 rounded-lg shadow hover:bg-green-700 text-sm font-bold uppercase tracking-wide transform transition hover:scale-105">
                      Pay Bill
                    </button>
                  </div>
                </td>
              </tr>
            ))}
             {(!activeOrders || activeOrders.length === 0) && (
               <tr><td colSpan={4} className="text-center py-10 text-gray-400">No active orders.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {paymentOrder && <PaymentModal order={paymentOrder} onClose={() => setPaymentOrder(null)} onSuccess={() => setPaymentOrder(null)} />}
    </div>
  );
};
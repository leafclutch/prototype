// src/components/OrderView.tsx
import React, { useState, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Order, type Product, type OrderItem } from '../db/db';
import { orderService } from '../services/orderService';
import { PaymentModal } from './PaymentModal';

interface OrderViewProps {
  order: Order;
  onBack: () => void;
}

const ALL_TABLES = Array.from({ length: 16 }, (_, i) => (i + 1).toString());
const DAYS_MAP = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const OrderView: React.FC<OrderViewProps> = ({ order, onBack }) => {
  const orderItems = useLiveQuery(() => orderService.getOrderItems(order.id), [order.id]);
  const allProducts = useLiveQuery(() => db.products.toArray(), []);
  const activeTables = useLiveQuery(() => orderService.getActiveTables(), []) || [];

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [qty, setQty] = useState(1);
  const [rate, setRate] = useState(0);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  
  const [isChangingTable, setIsChangingTable] = useState(false);
  const [tableName, setTableName] = useState(order.tableNumber);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);

  // MERGE MODAL STATE
  const [pendingMergeTable, setPendingMergeTable] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const qtyInputRef = useRef<HTMLInputElement>(null);

  const filteredProducts = allProducts?.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())) || [];
  const orderTotal = orderItems?.reduce((sum, item) => sum + item.total, 0) || 0;

  const checkAvailability = (p: Product) => {
    if (p.isAvailableNow === false) return { allowed: false, reason: 'Manual Toggle' };
    if (p.availableDays && p.availableDays.length > 0) {
      const todayName = DAYS_MAP[new Date().getDay()];
      if (!p.availableDays.includes(todayName)) return { allowed: false, reason: `Only on ${p.availableDays.join(', ')}` };
    }
    return { allowed: true, reason: '' };
  };

  const handleSelectProduct = (p: Product) => {
    const status = checkAvailability(p);
    if (!status.allowed) { alert(`⚠️ Unavailable: ${status.reason}`); searchInputRef.current?.focus(); return; }
    setSelectedProduct(p); setSearchTerm(p.name); setRate(p.price); setQty(1); setShowSuggestions(false); qtyInputRef.current?.focus(); qtyInputRef.current?.select();
  };

  const handleSaveItem = async (e?: React.FormEvent) => {
    if(e) e.preventDefault();
    if (!searchTerm) return;

    if (editingItemId) {
      await orderService.updateLineItem(order.id, editingItemId, qty, rate);
      setEditingItemId(null);
    } else {
      let productToAdd = selectedProduct;
      if (!productToAdd) productToAdd = allProducts?.find(p => p.name.toLowerCase() === searchTerm.toLowerCase()) || null;
      if (!productToAdd) { alert("⚠️ Item not found in menu."); return; }
      const status = checkAvailability(productToAdd);
      if (!status.allowed) { alert(`⚠️ Unavailable: ${status.reason}`); return; }
      
      await orderService.addItem(order.id, productToAdd.name, 'Manual', rate);
      if(qty > 1) { for(let i=1; i<qty; i++) await orderService.addItem(order.id, productToAdd.name, 'Manual', rate); }
    }
    setSearchTerm(''); setSelectedProduct(null); setQty(1); setRate(0); setHighlightIndex(0); searchInputRef.current?.focus();
  };

  const handleEditClick = (item: OrderItem) => { setEditingItemId(item.id!); setSearchTerm(item.itemName); setQty(item.quantity); setRate(item.rate); qtyInputRef.current?.focus(); qtyInputRef.current?.select(); };
  const handleCancelEdit = () => { setEditingItemId(null); setSearchTerm(''); setSelectedProduct(null); setQty(1); setRate(0); };

  // === TABLE CHANGE & MERGE CONFIRMATION ===
  const initiateTableChange = (val: string) => {
    // Check if target is busy
    if (activeTables.includes(val) && val !== order.tableNumber) {
      setPendingMergeTable(val); // Open Modal
    } else {
      // Just rename immediately
      orderService.updateTableNumber(order.id, val);
      setTableName(val);
      setIsChangingTable(false);
    }
  };

  const confirmMerge = async () => {
    if (pendingMergeTable) {
      await orderService.updateTableNumber(order.id, pendingMergeTable);
      setPendingMergeTable(null);
      onBack(); // Close view because current order ID is gone
    }
  };

  const handlePlaceOrder = () => {
    if (orderTotal <= 0) { alert("⚠️ Cannot place empty order."); return; }
    onBack(); 
  };

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden relative font-sans">
      <div className="bg-white border-b p-5 flex justify-between items-center shadow-sm z-20">
        <div className="flex items-center gap-6">
           <button onClick={onBack} className="text-gray-500 font-extrabold text-sm px-4 py-2 bg-gray-100 rounded-lg hover:bg-red-500 hover:text-white transition-all">✕ CLOSE</button>
           <div className="flex items-center gap-2">
             <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50 px-2 py-1 rounded">Table</div>
             {!isChangingTable ? (
               <div className="flex items-center gap-3">
                 <span className="text-2xl font-black text-gray-800 tracking-tight">{tableName}</span>
                 <button onClick={() => setIsChangingTable(true)} className="text-blue-600 text-xs font-bold hover:underline">Edit</button>
               </div>
             ) : (
               <div className="relative z-50">
                 <input className="bg-white border-2 border-blue-500 p-2 rounded-lg font-bold text-gray-800 outline-none w-56 shadow-lg" value={tableName} onChange={e => setTableName(e.target.value)} autoFocus />
                 <div className="absolute top-full left-0 mt-2 w-72 bg-white shadow-2xl rounded-lg border border-gray-200 max-h-80 overflow-y-auto z-[100]">
                   {ALL_TABLES.map(num => (
                     <button key={num} onClick={() => initiateTableChange(num)} className="w-full text-left px-4 py-3 flex justify-between border-b border-gray-50 hover:bg-blue-50">
                       <span className="font-bold">Table {num}</span>
                       <span className={`text-xs font-bold px-2 py-1 rounded-full ${activeTables.includes(num) && num !== order.tableNumber ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>{activeTables.includes(num) && num !== order.tableNumber ? 'Occupied' : 'Free'}</span>
                     </button>
                   ))}
                 </div>
                 <div className="fixed inset-0 z-40" onClick={() => setIsChangingTable(false)}></div>
               </div>
             )}
           </div>
        </div>
        <div className="flex items-center gap-8">
           <div className="text-right">
             <div className="text-[10px] font-bold text-gray-400 uppercase">Total Bill</div>
             <div className="text-3xl font-black text-gray-800">₹{orderTotal}</div>
           </div>
           <button onClick={() => { if(orderTotal > 0) setShowPayModal(true); }} disabled={orderTotal <= 0} className={`px-6 py-3 rounded-lg font-extrabold text-white shadow-md transition-all ${orderTotal > 0 ? 'bg-green-600 hover:bg-green-700 hover:shadow-lg transform hover:-translate-y-0.5' : 'bg-gray-200 cursor-not-allowed text-gray-400'}`}>PAY BILL</button>
        </div>
      </div>

      <div className={`p-5 border-b z-10 transition-colors ${editingItemId ? 'bg-orange-50' : 'bg-blue-50/50'}`}>
        <form onSubmit={handleSaveItem} className="flex gap-4 items-end">
          <div className="flex-1 relative">
            <label className={`block text-xs font-bold mb-1 uppercase tracking-wide ${editingItemId ? 'text-orange-600' : 'text-gray-500'}`}>{editingItemId ? 'Editing Item' : 'Item Name'}</label>
            <input ref={searchInputRef} autoFocus disabled={!!editingItemId} className={`w-full p-3 border-2 focus:border-blue-500 rounded-xl font-bold outline-none shadow-sm transition-all ${editingItemId ? 'bg-gray-100 text-gray-500 border-orange-200' : 'bg-white text-gray-800 border-transparent'}`} placeholder="Search..." value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setShowSuggestions(true); setHighlightIndex(0); }} onKeyDown={(e) => { if(e.key === 'ArrowDown') setHighlightIndex(prev => Math.min(prev + 1, filteredProducts.length - 1)); if(e.key === 'ArrowUp') setHighlightIndex(prev => Math.max(prev - 1, 0)); if(e.key === 'Enter' && showSuggestions) { e.preventDefault(); handleSelectProduct(filteredProducts[highlightIndex]); } }} />
            {showSuggestions && searchTerm && !editingItemId && (
              <div className="absolute top-full left-0 w-full bg-white shadow-2xl border border-gray-100 rounded-xl mt-2 max-h-72 overflow-y-auto z-50">
                {filteredProducts.map((p, index) => {
                  const status = checkAvailability(p);
                  const isHighlighted = index === highlightIndex;
                  return (
                    <button key={p.id} type="button" onClick={() => handleSelectProduct(p)} className={`w-full text-left px-5 py-3 border-b border-gray-50 flex justify-between items-center transition-colors ${isHighlighted ? 'bg-blue-50 border-blue-100' : 'bg-white'} ${status.allowed ? 'hover:bg-blue-50' : 'bg-gray-50 opacity-80 cursor-not-allowed'}`}>
                      <span className={`font-bold ${isHighlighted ? 'text-blue-700' : 'text-gray-800'}`}>{p.name}</span>
                      <div className="flex items-center gap-3">
                         {status.allowed ? <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold">AVAILABLE</span> : <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded font-bold">{status.reason}</span>}
                         <span className="font-bold text-gray-500">₹{p.price}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <div className="w-24">
            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wide">Qty</label>
            <input ref={qtyInputRef} type="number" className="w-full p-3 bg-white rounded-xl font-bold outline-none text-center shadow-sm focus:ring-2 focus:ring-blue-500" value={qty} onChange={e => setQty(parseInt(e.target.value) || 0)} onFocus={e => e.target.select()} />
          </div>
          <div className="w-32">
            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wide">Rate</label>
            <input type="number" className="w-full p-3 bg-white border border-gray-100 rounded-xl font-bold text-gray-800 outline-none shadow-sm focus:ring-2 focus:ring-blue-500" value={rate} onChange={e => setRate(parseFloat(e.target.value) || 0)} />
          </div>
          {editingItemId ? (
            <div className="flex gap-2">
              <button type="submit" className="bg-orange-500 text-white px-6 py-3 rounded-xl font-bold shadow-md hover:bg-orange-600 h-[52px]">Update</button>
              <button type="button" onClick={handleCancelEdit} className="bg-gray-200 text-gray-600 px-4 py-3 rounded-xl font-bold hover:bg-gray-300 h-[52px]">Cancel</button>
            </div>
          ) : (
            <button type="submit" className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold shadow-md hover:bg-blue-700 h-[52px] transition-transform active:scale-95">Add</button>
          )}
        </form>
      </div>

      <div className="flex-1 overflow-y-auto bg-white p-0">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase sticky top-0 z-0">
            <tr>
              <th className="px-6 py-4 font-bold tracking-wider border-b">Item Name</th>
              <th className="px-6 py-4 text-center font-bold tracking-wider border-b">Qty</th>
              <th className="px-6 py-4 text-right font-bold tracking-wider border-b">Rate</th>
              <th className="px-6 py-4 text-right font-bold tracking-wider border-b">Total</th>
              <th className="px-6 py-4 text-center border-b">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {orderItems?.map(item => (
              <tr 
                key={item.id} 
                className={`transition-colors ${editingItemId === item.id ? 'bg-orange-50' : (item.originalTable ? 'bg-purple-50 hover:bg-purple-100' : 'hover:bg-blue-50/50')}`}
              >
                <td className="px-6 py-4 font-bold text-gray-800">
                  {item.itemName}
                  {/* === VISUAL SEPARATION BADGE === */}
                  {item.originalTable && (
                    <span className="ml-2 bg-purple-200 text-purple-700 text-[10px] px-2 py-0.5 rounded-full font-bold border border-purple-300">
                      From Table {item.originalTable}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-center font-bold text-gray-600 bg-white/50 rounded-lg mx-2 border border-gray-100 shadow-sm">{item.quantity}</td>
                <td className="px-6 py-4 text-right text-gray-500">₹{item.rate}</td>
                <td className="px-6 py-4 text-right font-black text-gray-800">₹{item.total}</td>
                <td className="px-6 py-4 text-center">
                  <div className="flex justify-center gap-3">
                    <button onClick={() => handleEditClick(item)} className="text-blue-500 hover:text-blue-700 font-bold text-xs bg-blue-50 px-3 py-1 rounded">Edit</button>
                    <button onClick={() => orderService.removeItem(order.id, item.id!, item.total)} className="text-red-400 hover:text-red-600 font-bold text-lg px-2">×</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="bg-white border-t p-4 flex justify-end">
        <button onClick={handlePlaceOrder} disabled={orderTotal <= 0} className={`px-8 py-4 rounded-xl font-bold text-xl shadow-lg transition-all flex items-center gap-3 ${orderTotal > 0 ? 'bg-black text-white hover:bg-gray-900 hover:scale-[1.02]' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
          {orderTotal > 0 ? '✓ SAVE ORDER' : 'Add Items First'}
        </button>
      </div>

      {showPayModal && <PaymentModal order={order} onClose={() => setShowPayModal(false)} onSuccess={() => { setShowPayModal(false); onBack(); }} />}

      {/* MERGE CONFIRMATION MODAL */}
      {pendingMergeTable && (
        <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[100] backdrop-blur-sm animate-fade-in">
          <div className="bg-white p-8 rounded-2xl shadow-2xl w-96 text-center">
             <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">🔗</div>
             <h3 className="text-2xl font-bold text-gray-800 mb-2">Merge Tables?</h3>
             <p className="text-gray-500 mb-6">
               Table <b>{pendingMergeTable}</b> is already occupied. <br/>
               Do you want to merge this bill into it?
             </p>
             <div className="flex gap-3">
               <button onClick={() => setPendingMergeTable(null)} className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200">Cancel</button>
               <button onClick={confirmMerge} className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg">Yes, Merge</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
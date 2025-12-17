// src/services/orderService.ts
import { db, type Order } from '../db/db';

export const orderService = {
  getActiveTables: async () => {
    const activeOrders = await db.orders.where('status').noneOf(['paid', 'cancelled']).toArray();
    return activeOrders.map(o => o.tableNumber);
  },
  getOrderByTable: async (tableNumber: string) => {
    return await db.orders.where({ tableNumber }).filter(o => o.status !== 'paid' && o.status !== 'cancelled').first();
  },
  getOrderById: async (id: string) => {
    return await db.orders.get(id);
  },
  createOrder: async (tableNumber: string): Promise<Order> => {
    const existing = await db.orders.where({ tableNumber }).filter(o => o.status !== 'paid' && o.status !== 'cancelled').first();
    if (existing) return existing;
    const newOrder: Order = { id: crypto.randomUUID(), tableNumber, status: 'order', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), totalAmount: 0, paymentCash: 0, paymentOnline: 0, exportedToExcel: false };
    await db.orders.add(newOrder);
    return newOrder;
  },
  deleteOrder: async (orderId: string) => {
    await db.transaction('rw', db.orders, db.orderItems, async () => {
      await db.orderItems.where({ orderId }).delete();
      await db.orders.delete(orderId);
    });
  },

  // === UPDATED MERGE LOGIC ===
  updateTableNumber: async (currentOrderId: string, newTableNumber: string) => {
    const currentOrder = await db.orders.get(currentOrderId);
    if (!currentOrder) throw new Error("Current order not found");

    const targetOrder = await db.orders.where({ tableNumber: newTableNumber })
      .filter(o => o.status !== 'paid' && o.status !== 'cancelled' && o.id !== currentOrderId)
      .first();

    if (targetOrder) {
      // === MERGE SCENARIO (NO ITEM GROUPING) ===
      await db.transaction('rw', db.orders, db.orderItems, async () => {
        const currentItems = await db.orderItems.where({ orderId: currentOrderId }).toArray();
        
        // Move items to target order, but tag them
        for (const item of currentItems) {
          await db.orderItems.update(item.id!, { 
            orderId: targetOrder.id,
            // Tag with previous table so we can show them in different color
            originalTable: currentOrder.tableNumber 
          });
        }

        // Recalc Target Total
        const allItems = await db.orderItems.where({ orderId: targetOrder.id }).toArray();
        const grandTotal = allItems.reduce((sum, i) => sum + i.total, 0);
        await db.orders.update(targetOrder.id, { 
          totalAmount: grandTotal, 
          updatedAt: new Date().toISOString() 
        });

        // Delete the old order container
        await db.orders.delete(currentOrderId);
      });
      return { merged: true, newOrderId: targetOrder.id };
    } else {
      // === SIMPLE RENAME SCENARIO ===
      await db.orders.update(currentOrderId, { tableNumber: newTableNumber, updatedAt: new Date().toISOString() });
      return { merged: false, newOrderId: currentOrderId };
    }
  },

  addItem: async (orderId: string, itemName: string, categoryName: string, price: number) => {
    await db.transaction('rw', db.orders, db.orderItems, async () => {
      const existingItem = await db.orderItems.where({ orderId, itemName }).first();
      // Only merge quantities if it's the SAME table source (undefined originalTable)
      if (existingItem && !existingItem.originalTable) {
        await db.orderItems.update(existingItem.id!, { quantity: existingItem.quantity + 1, total: (existingItem.quantity + 1) * existingItem.rate });
      } else {
        await db.orderItems.add({ orderId, itemName, categoryName, quantity: 1, rate: price, total: price });
      }
      const allItems = await db.orderItems.where({ orderId }).toArray();
      const grandTotal = allItems.reduce((sum, i) => sum + i.total, 0);
      await db.orders.update(orderId, { totalAmount: grandTotal, updatedAt: new Date().toISOString() });
    });
  },

  // ... (Keep the rest standard) ...
  removeItem: async (orderId: string, itemId: number, itemTotal: number) => {
    await db.transaction('rw', db.orders, db.orderItems, async () => {
      await db.orderItems.delete(itemId);
      const allItems = await db.orderItems.where({ orderId }).toArray();
      const grandTotal = allItems.reduce((sum, i) => sum + i.total, 0);
      await db.orders.update(orderId, { totalAmount: grandTotal, updatedAt: new Date().toISOString() });
    });
  },
  updateLineItem: async (orderId: string, itemId: number, newQty: number, newRate: number) => {
    await db.transaction('rw', db.orders, db.orderItems, async () => {
      await db.orderItems.update(itemId, { quantity: newQty, rate: newRate, total: newQty * newRate });
      const allItems = await db.orderItems.where({ orderId }).toArray();
      const grandTotal = allItems.reduce((sum, i) => sum + i.total, 0);
      await db.orders.update(orderId, { totalAmount: grandTotal, updatedAt: new Date().toISOString() });
    });
  },
  getOrderItems: async (orderId: string) => { return await db.orderItems.where({ orderId }).toArray(); },
  updateStatus: async (orderId: string, status: 'order' | 'served') => { await db.orders.update(orderId, { status, updatedAt: new Date().toISOString() }); },
  processPayment: async (orderId: string, cash: number, online: number) => {
    const order = await db.orders.get(orderId);
    if (!order) throw new Error("Order not found");
    await db.orders.update(orderId, { status: 'paid', paymentCash: cash, paymentOnline: online, paidAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  }
};
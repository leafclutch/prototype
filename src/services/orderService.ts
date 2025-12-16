// src/services/orderService.ts
import { db } from '../db/db';

export const orderService = {
  // Get all tables that currently have an open order
  // Status is NOT 'paid' and NOT 'cancelled'
  getActiveTables: async () => {
    const activeOrders = await db.orders
      .where('status')
      .noneOf(['paid', 'cancelled']) // 'order' or 'served'
      .toArray();
    
    // Return a simple list of table numbers, e.g., ["1", "5"]
    return activeOrders.map(o => o.tableNumber);
  }
};
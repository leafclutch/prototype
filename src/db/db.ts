// src/db/db.ts
import Dexie, { type Table } from 'dexie';

export interface Category {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  categoryId: string;
  name: string;
  price: number;
  isActive: boolean;
  availableDays?: string[];
  isAvailableNow?: boolean;
}

export interface Order {
  id: string;
  tableNumber: string;
  status: 'order' | 'served' | 'paid' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
  totalAmount: number;
  paymentCash: number;
  paymentOnline: number;
  exportedToExcel: boolean;
}

export interface OrderItem {
  id?: number;
  orderId: string;
  itemName: string;
  categoryName: string;
  quantity: number;
  rate: number;
  total: number;
  originalTable?: string; // NEW: To track merged items (e.g., "Table 1")
}

export class RestaurantDB extends Dexie {
  categories!: Table<Category>;
  products!: Table<Product>;
  orders!: Table<Order>;
  orderItems!: Table<OrderItem>;

  constructor() {
    super('RestaurantPOS_DB');
    
    // UPDATE TO VERSION 5
    this.version(5).stores({
      categories: 'id, name, isActive', 
      products: 'id, categoryId, name, isActive, isAvailableNow',
      orders: 'id, tableNumber, status, createdAt, paidAt, exportedToExcel',
      orderItems: '++id, orderId' // Index remains same
    });
  }
}

export const db = new RestaurantDB();
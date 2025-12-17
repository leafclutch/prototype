// src/services/excelService.ts
import * as XLSX from 'xlsx';
import { db } from '../db/db';

export const excelService = {
  exportSalesData: async () => {
    try {
      const workbook = XLSX.utils.book_new();

      // --- SHEET 1: SALES DATA ---
      const orders = await db.orders.toArray();
      const items = await db.orderItems.toArray();
      
      const salesData = items.map(item => {
        const order = orders.find(o => o.id === item.orderId);
        if (!order) return null;
        return {
          "Date": new Date(order.createdAt).toLocaleDateString(),
          "Time": new Date(order.createdAt).toLocaleTimeString(),
          "Table": order.tableNumber,
          "Item": item.itemName,
          "Qty": item.quantity,
          "Rate": item.rate,
          "Total": item.total,
          "Payment": order.paymentCash > 0 && order.paymentOnline > 0 ? 'Mix' : (order.paymentCash > 0 ? 'Cash' : 'Online'),
          "Bill ID": order.id.slice(0, 6)
        };
      }).filter(Boolean);

      const salesSheet = XLSX.utils.json_to_sheet(salesData);
      XLSX.utils.book_append_sheet(workbook, salesSheet, "Sales History");

      // --- SHEET 2: MENU ITEMS ---
      const products = await db.products.toArray();
      const productData = products.map(p => ({
        "Item Name": p.name,
        "Price": p.price,
        "In Stock": p.isAvailableNow !== false ? 'Yes' : 'No',
        "Category ID": p.categoryId
      }));
      const menuSheet = XLSX.utils.json_to_sheet(productData);
      XLSX.utils.book_append_sheet(workbook, menuSheet, "Menu Items");

      // --- SHEET 3: CATEGORIES ---
      const categories = await db.categories.toArray();
      const catData = categories.map(c => ({
        "Category Name": c.name,
        "ID": c.id
      }));
      const catSheet = XLSX.utils.json_to_sheet(catData);
      XLSX.utils.book_append_sheet(workbook, catSheet, "Categories");

      // Generate Buffer
      return XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    } catch (error) {
      console.error("Export error:", error);
      throw error;
    }
  }
};
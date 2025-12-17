// src/services/productService.ts
import { db, type Product } from '../db/db';

export const productService = {
  // 1. Add Product
  addProduct: async (categoryId: string, name: string, price: number, availableDays: string[] = []) => {
    if (!name) throw new Error("Item name is required");
    if (price <= 0) throw new Error("Price must be greater than 0");

    const newProduct: Product = {
      id: crypto.randomUUID(),
      categoryId,
      name,
      price,
      isActive: true,
      availableDays 
    };

    await db.products.add(newProduct);
    return newProduct;
  },

  // 2. Get Products by Category
  getProductsByCategory: async (categoryId: string) => {
    return await db.products
      .where({ categoryId })
      .filter(p => p.isActive === true)
      .toArray();
  },

  // 3. Update Product
  updateProduct: async (id: string, updates: Partial<Product>) => {
    await db.products.update(id, updates);
  },

  // 4. Delete Product
  deleteProduct: async (id: string) => {
    await db.products.delete(id);
  }
};
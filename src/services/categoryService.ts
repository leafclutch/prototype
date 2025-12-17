// src/services/categoryService.ts
import { db, type Category } from '../db/db';

export const categoryService = {
  // 1. Add a new category
  addCategory: async (name: string) => {
    const trimmedName = name.trim();
    if (!trimmedName) throw new Error("Name cannot be empty");

    // Check for duplicates (case-insensitive)
    const existing = await db.categories
      .where('name').equalsIgnoreCase(trimmedName)
      .first();
    
    if (existing) throw new Error("Category already exists");

    const newCategory: Category = {
      id: crypto.randomUUID(), // Built-in browser UUID generator
      name: trimmedName,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await db.categories.add(newCategory);
    return newCategory;
  },

  // 2. Get all categories (sorted by name)
  getAllCategories: async () => {
    return await db.categories
      .orderBy('name')
      .toArray();
  },

  // 3. Toggle Active Status (Soft Delete)
  toggleStatus: async (id: string, currentStatus: boolean) => {
    await db.categories.update(id, {
      isActive: !currentStatus,
      updatedAt: new Date().toISOString()
    });
  }
};
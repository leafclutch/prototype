// src/components/CategoryManager.tsx
import React, { useEffect, useState } from 'react';
import { categoryService } from '../services/categoryService';
import type { Category } from '../db/db';

export const CategoryManager: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [error, setError] = useState('');

  // Load data on mount
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    const data = await categoryService.getAllCategories();
    setCategories(data);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await categoryService.addCategory(newCategoryName);
      setNewCategoryName(''); 
      await loadCategories(); 
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleToggle = async (cat: Category) => {
    await categoryService.toggleStatus(cat.id, cat.isActive);
    await loadCategories();
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">📂 Menu Categories</h2>

      {/* Add New Category Form */}
      <form onSubmit={handleAdd} className="bg-white p-6 rounded-xl shadow-sm mb-8 flex gap-4 items-start">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">New Category Name</label>
          <input
            type="text"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-lg"
            placeholder="e.g., Starters, Drinks, Desserts"
          />
          {error && <p className="text-red-500 text-sm mt-2">⚠️ {error}</p>}
        </div>
        <button 
          type="submit"
          className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold shadow-md transition-colors"
        >
          + Add Category
        </button>
      </form>

      {/* List of Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => (
          <div 
            key={cat.id} 
            className={`p-4 rounded-xl border-l-4 shadow-sm flex justify-between items-center bg-white
              ${cat.isActive ? 'border-green-500' : 'border-gray-300 bg-gray-50'}`}
          >
            <div>
              <h3 className={`font-bold text-lg ${!cat.isActive && 'text-gray-400 line-through'}`}>
                {cat.name}
              </h3>
              <span className={`text-xs px-2 py-1 rounded-full font-bold ${cat.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'}`}>
                {cat.isActive ? 'AVAILABLE' : 'NOT AVAILABLE'}
              </span>
            </div>
            
            <button
              onClick={() => handleToggle(cat)}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors border
                ${cat.isActive 
                  ? 'text-red-600 border-red-200 hover:bg-red-50' 
                  : 'text-green-600 border-green-200 hover:bg-green-50'}`}
            >
              {cat.isActive ? 'Make Unavailable' : 'Make Available'}
            </button>
          </div>
        ))}
      </div>
      
      {categories.length === 0 && (
        <p className="text-center text-gray-500 mt-10">No categories found.</p>
      )}
    </div>
  );
};
import React, { useState, useEffect } from 'react';
import {
  FolderTree,
  Plus,
  Edit2,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  Package,
  Search,
  X,
  AlertCircle,
} from 'lucide-react';
import api from '../api/client';
import { useNotification } from '../context/NotificationContext';
import { formatDate } from '../utils/formatters';

export default function Categories() {
  const notify = useNotification();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await api.get('/categories');
      if (res.data?.categories) {
        setCategories(res.data.categories);
      }
    } catch (err) {
      notify.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setName('');
    setDescription('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat) => {
    setEditingCategory(cat);
    setName(cat.name);
    setDescription(cat.description || '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      notify.error('Category name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingCategory) {
        await api.patch(`/categories/${editingCategory._id}`, {
          name: name.trim(),
          description: description.trim(),
        });
        notify.success('Category updated successfully');
      } else {
        await api.post('/categories', {
          name: name.trim(),
          description: description.trim(),
        });
        notify.success('Category created successfully');
      }
      setIsModalOpen(false);
      fetchCategories();
    } catch (err) {
      notify.error(err.response?.data?.message || err.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (cat) => {
    try {
      await api.patch(`/categories/${cat._id}`, {
        isActive: !cat.isActive,
      });
      notify.success(`Category ${!cat.isActive ? 'activated' : 'deactivated'}`);
      fetchCategories();
    } catch (err) {
      notify.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.description && c.description.toLowerCase().includes(search.toLowerCase())) ||
    (c.slug && c.slug.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Category Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Organize departments, clothing lines, and general store categories
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-500/25 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add Category</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search category name or slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:bg-white"
          />
        </div>
        <span className="text-xs text-slate-400 font-medium hidden sm:inline">
          {categories.length} total categories
        </span>
      </div>

      {/* Categories Grid / Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Category Name</th>
                <th className="py-3 px-4">Slug</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Products</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    Loading categories...
                  </td>
                </tr>
              ) : filtered.length > 0 ? (
                filtered.map((cat) => (
                  <tr key={cat._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                        <span>{cat.name}</span>
                        {cat.isSystemDefault && (
                          <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200">
                            Core
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500">{cat.slug}</td>
                    <td className="py-3 px-4 text-slate-500 max-w-xs truncate">{cat.description || '-'}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full text-[11px]">
                        <Package className="w-3 h-3 text-slate-400" />
                        <span>{cat.productCount || 0}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 font-semibold text-[11px] ${
                          cat.isActive ? 'text-emerald-700' : 'text-slate-400'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${cat.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        <span>{cat.isActive ? 'Active' : 'Inactive'}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(cat)}
                          title="Edit Category"
                          className="p-1.5 text-slate-500 hover:text-brand-600 rounded-lg hover:bg-slate-100"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(cat)}
                          title={cat.isActive ? 'Deactivate Category' : 'Activate Category'}
                          className={`p-1.5 rounded-lg transition-colors ${
                            cat.isActive
                              ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                              : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                          }`}
                        >
                          {cat.isActive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    No categories found. Click "Add Category" to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-base">
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Footwear, Perfumes, Electronics"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:border-brand-500 font-semibold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  rows="3"
                  placeholder="Short notes about this category"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-md shadow-brand-500/25"
                >
                  {isSubmitting ? 'Saving...' : editingCategory ? 'Save Changes' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

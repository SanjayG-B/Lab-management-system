import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Box, Search, Filter, Plus, Trash2, Edit, AlertTriangle } from 'lucide-react';

export default function Inventory() {
  const { user } = useAuth();
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [lowStockFilter, setLowStockFilter] = useState(false);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Forms
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState('CSE');
  const [quantity, setQuantity] = useState(0);
  const [threshold, setThreshold] = useState(5);
  const [unit, setUnit] = useState('pcs');
  const [costPerUnit, setCostPerUnit] = useState(0);
  const [supplier, setSupplier] = useState('');

  const [error, setError] = useState('');

  const fetchInventory = async () => {
    setLoading(true);
    try {
      let url = `/api/v1/inventory`;
      const params = [];
      if (categoryFilter) params.push(`category=${categoryFilter}`);
      if (lowStockFilter) params.push(`lowStock=true`);
      if (params.length > 0) {
        url += `?${params.join('&')}`;
      }

      const res = await api.get(url);
      if (res.success) {
        let items = res.data;
        if (search) {
          items = items.filter(item => 
            item.itemName.toLowerCase().includes(search.toLowerCase()) ||
            (item.supplier && item.supplier.toLowerCase().includes(search.toLowerCase()))
          );
        }
        setInventory(items);
      }
    } catch (err) {
      console.warn('Inventory roster fetch failed:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [categoryFilter, lowStockFilter, search]);

  const handleAddInventory = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await api.post('/api/v1/inventory', {
        itemName,
        category,
        quantity: Number(quantity),
        threshold: Number(threshold),
        unit,
        costPerUnit: Number(costPerUnit),
        supplier
      });
      if (res.success) {
        setShowAddModal(false);
        resetForm();
        fetchInventory();
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError('Connection failed. Ensure API is running.');
    }
  };

  const handleEditInventory = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await api.put(`/api/v1/inventory/${selectedItem._id}`, {
        itemName,
        category,
        quantity: Number(quantity),
        threshold: Number(threshold),
        unit,
        costPerUnit: Number(costPerUnit),
        supplier
      });
      if (res.success) {
        setShowEditModal(false);
        resetForm();
        fetchInventory();
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError('Update failed.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this inventory item registry?')) return;
    try {
      const res = await api.delete(`/api/v1/inventory/${id}`);
      if (res.success) {
        fetchInventory();
      }
    } catch (err) {
      console.warn(err.message);
    }
  };

  const openEdit = (item) => {
    setSelectedItem(item);
    setItemName(item.itemName);
    setCategory(item.category || 'CSE');
    setQuantity(item.quantity);
    setThreshold(item.threshold);
    setUnit(item.unit || 'pcs');
    setCostPerUnit(item.costPerUnit || 0);
    setSupplier(item.supplier || '');
    setShowEditModal(true);
  };

  const resetForm = () => {
    setItemName('');
    setCategory('CSE');
    setQuantity(0);
    setThreshold(5);
    setUnit('pcs');
    setCostPerUnit(0);
    setSupplier('');
    setSelectedItem(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-white font-display">Consumables Inventory</h2>
          <p className="text-xs text-gray-400">Track chemical levels, hardware accessories, and consumable thresholds</p>
        </div>
        {user?.role !== 'student' && (
          <button
            onClick={() => { resetForm(); setShowAddModal(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-darkBg font-bold rounded-lg btn-glow-emerald hover:opacity-95 transition text-xs"
          >
            <Plus size={16} /> Register Consumable
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-darkCard/30 p-4 border border-white/5 rounded-xl">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-gray-500" size={16} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or supplier..."
            className="w-full bg-white/5 border border-white/5 rounded-lg pl-10 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-primary/50"
          />
        </div>

        <div className="relative">
          <Filter className="absolute left-3 top-2.5 text-gray-500" size={16} />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full bg-white/5 border border-white/5 rounded-lg pl-10 pr-4 py-2 text-xs text-gray-400 focus:outline-none focus:border-primary/55"
          >
            <option value="">All Categories</option>
            <option value="CE">CE</option>
            <option value="ISE">ISE</option>
            <option value="CSE">CSE</option>
            <option value="AIML">AIML</option>
            <option value="CSD">CSD</option>
            <option value="EC">EC</option>
            <option value="DATA SCIENCE">DATA SCIENCE</option>
          </select>
        </div>

        <div className="flex items-center">
          <label className="flex items-center gap-2.5 text-xs text-gray-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={lowStockFilter}
              onChange={(e) => setLowStockFilter(e.target.checked)}
              className="accent-primary w-4 h-4 rounded border-white/10 bg-white/5"
            />
            <span>Show Low Stock Warnings Only</span>
          </label>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {inventory.map((item) => {
            const isLowStock = item.quantity <= item.threshold;
            return (
              <div key={item._id} className={`glass-panel p-5 rounded-2xl flex flex-col justify-between glass-panel-hover border ${isLowStock ? 'border-red-500/20 bg-gradient-to-br from-darkCard to-red-950/10' : 'border-white/5'}`}>
                <div>
                  <div className="flex justify-between items-start gap-4">
                    <h3 className="text-sm font-semibold text-white truncate">{item.itemName}</h3>
                    {isLowStock && (
                      <span className="flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-red-500/10 text-accentRed border border-red-500/20 animate-pulse">
                        <AlertTriangle size={10} /> Low Stock
                      </span>
                    )}
                  </div>

                  <div className="mt-4 space-y-2 text-xs text-gray-400 border-b border-white/5 pb-4">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Current Stock:</span>
                      <span className={`font-bold ${isLowStock ? 'text-accentRed' : 'text-primary'}`}>
                        {item.quantity} {item.unit}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Warning Threshold:</span>
                      <span className="text-white">{item.threshold} {item.unit}</span>
                    </div>
                    <p><span className="text-gray-500">Category:</span> {item.category}</p>
                    <p><span className="text-gray-500">Supplier:</span> {item.supplier || 'N/A'}</p>
                    <p><span className="text-gray-500">Cost/Unit:</span> ${item.costPerUnit || '0.00'}</p>
                    <p><span className="text-gray-500">Last Restocked:</span> {item.lastRestocked ? new Date(item.lastRestocked).toLocaleDateString() : 'N/A'}</p>
                  </div>
                </div>

                {user?.role !== 'student' && (
                  <div className="mt-5 flex gap-2 justify-end">
                    <button
                      onClick={() => openEdit(item)}
                      className="flex items-center gap-1 px-2.5 py-1 bg-white/5 hover:bg-white/10 hover:text-white transition rounded-lg text-xs font-semibold text-gray-400"
                    >
                      <Edit size={14} /> Update Stock
                    </button>
                    {user.role === 'hod' && (
                      <button
                        onClick={() => handleDelete(item._id)}
                        className="p-1 text-gray-500 hover:text-red-400 transition"
                        aria-label="Delete item"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {inventory.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-500 text-xs">
              No inventory items found matching filters.
            </div>
          )}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleAddInventory} className="w-full max-w-md glass-panel p-6 rounded-2xl space-y-4 border border-white/10 animate-in zoom-in-95 duration-200">
            <h3 className="text-base font-bold text-white mb-2">Register Consumable Stock</h3>
            {error && <p className="text-xs text-red-400 bg-red-500/10 p-2 rounded-lg border border-red-500/20">{error}</p>}
            
            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Item Name</label>
              <input type="text" required value={itemName} onChange={e => setItemName(e.target.value)} className="w-full bg-white/5 border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary/50" placeholder="e.g. Copper Sulfate Crystals" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Category</label>
                <select value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-white/5 border border-white/5 rounded-lg px-3 py-2 text-xs text-gray-400 focus:outline-none focus:border-primary/50">
                  <option value="CE">CE</option>
                  <option value="ISE">ISE</option>
                  <option value="CSE">CSE</option>
                  <option value="AIML">AIML</option>
                  <option value="CSD">CSD</option>
                  <option value="EC">EC</option>
                  <option value="DATA SCIENCE">DATA SCIENCE</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Unit of Measure</label>
                <input type="text" required value={unit} onChange={e => setUnit(e.target.value)} className="w-full bg-white/5 border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary/50" placeholder="e.g. kg, liters, pcs" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Initial Quantity</label>
                <input type="number" required min="0" value={quantity} onChange={e => setQuantity(e.target.value)} className="w-full bg-white/5 border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary/50" />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Alert Threshold</label>
                <input type="number" required min="0" value={threshold} onChange={e => setThreshold(e.target.value)} className="w-full bg-white/5 border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary/50" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Cost Per Unit ($)</label>
                <input type="number" step="0.01" min="0" value={costPerUnit} onChange={e => setCostPerUnit(e.target.value)} className="w-full bg-white/5 border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary/50" />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Supplier Name</label>
                <input type="text" value={supplier} onChange={e => setSupplier(e.target.value)} className="w-full bg-white/5 border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary/50" placeholder="e.g. Sigma Aldrich" />
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 border border-white/5 rounded-lg text-xs font-semibold text-gray-400 hover:text-white transition">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-primary text-darkBg rounded-lg text-xs font-semibold hover:opacity-95 transition">Register Item</button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleEditInventory} className="w-full max-w-md glass-panel p-6 rounded-2xl space-y-4 border border-white/10 animate-in zoom-in-95 duration-200">
            <h3 className="text-base font-bold text-white mb-2">Update Stock Quantity & Config</h3>
            {error && <p className="text-xs text-red-400 bg-red-500/10 p-2 rounded-lg border border-red-500/20">{error}</p>}
            
            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Item Name</label>
              <input type="text" required value={itemName} onChange={e => setItemName(e.target.value)} className="w-full bg-white/5 border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary/50" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Category</label>
                <select value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-white/5 border border-white/5 rounded-lg px-3 py-2 text-xs text-gray-400 focus:outline-none focus:border-primary/50">
                  <option value="CE">CE</option>
                  <option value="ISE">ISE</option>
                  <option value="CSE">CSE</option>
                  <option value="AIML">AIML</option>
                  <option value="CSD">CSD</option>
                  <option value="EC">EC</option>
                  <option value="DATA SCIENCE">DATA SCIENCE</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Unit of Measure</label>
                <input type="text" required value={unit} onChange={e => setUnit(e.target.value)} className="w-full bg-white/5 border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary/50" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Current Quantity</label>
                <input type="number" required min="0" value={quantity} onChange={e => setQuantity(e.target.value)} className="w-full bg-white/5 border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary/50" />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Alert Threshold</label>
                <input type="number" required min="0" value={threshold} onChange={e => setThreshold(e.target.value)} className="w-full bg-white/5 border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary/50" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Cost Per Unit ($)</label>
                <input type="number" step="0.01" min="0" value={costPerUnit} onChange={e => setCostPerUnit(e.target.value)} className="w-full bg-white/5 border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary/50" />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Supplier Name</label>
                <input type="text" value={supplier} onChange={e => setSupplier(e.target.value)} className="w-full bg-white/5 border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary/50" />
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 border border-white/5 rounded-lg text-xs font-semibold text-gray-400 hover:text-white transition">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-primary text-darkBg rounded-lg text-xs font-semibold hover:opacity-95 transition">Update Stock</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

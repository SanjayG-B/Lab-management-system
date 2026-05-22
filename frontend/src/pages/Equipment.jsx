import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Wrench, Search, Filter, Plus, Trash2, QrCode } from 'lucide-react';
import qrcode from '../services/qrcode';

export default function Equipment() {
  const { user } = useAuth();
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Forms
  const [name, setName] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [category, setCategory] = useState('CSE');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState('available');

  const [studentRoll, setStudentRoll] = useState('');
  const [returnCondition, setReturnCondition] = useState('available');
  const [usageHoursIncrement, setUsageHoursIncrement] = useState(0);

  const [error, setError] = useState('');

  const fetchEquipment = async () => {
    setLoading(true);
    try {
      let url = `/api/v1/equipment?search=${search}`;
      if (categoryFilter) url += `&category=${categoryFilter}`;
      if (statusFilter) url += `&status=${statusFilter}`;

      const res = await api.get(url);
      if (res.success) {
        setEquipment(res.data);
      }
    } catch (err) {
      console.warn('Equipment roster fetch failed:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipment();
  }, [search, categoryFilter, statusFilter]);

  const handleAddEquipment = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await api.post('/api/v1/equipment', { name, serialNumber, category, location, status });
      if (res.success) {
        setShowAddModal(false);
        setName('');
        setSerialNumber('');
        setLocation('');
        fetchEquipment();
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError('Connection failed. Ensure API is running.');
    }
  };

  const handleIssue = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await api.post(`/api/v1/equipment/${selectedItem._id}/issue`, { studentRollNumber: studentRoll });
      if (res.success) {
        setShowIssueModal(false);
        setStudentRoll('');
        fetchEquipment();
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError('Checkout transaction request failed.');
    }
  };

  const handleReturn = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await api.post(`/api/v1/equipment/${selectedItem._id}/return`, {
        condition: returnCondition,
        usageHours: Number(usageHoursIncrement)
      });
      if (res.success) {
        setShowReturnModal(false);
        setReturnCondition('available');
        setUsageHoursIncrement(0);
        fetchEquipment();
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError('Return transaction request failed.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this equipment registration?')) return;
    try {
      const res = await api.delete(`/api/v1/equipment/${id}`);
      if (res.success) {
        fetchEquipment();
      }
    } catch (err) {
      console.warn(err.message);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-white font-display">Equipment Roster</h2>
          <p className="text-xs text-gray-400">Manage lab instrumentation, checkout lists, and operational states</p>
        </div>
        {user?.role !== 'student' && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-darkBg font-bold rounded-lg btn-glow-emerald hover:opacity-95 transition text-xs"
          >
            <Plus size={16} /> Register Equipment
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
            placeholder="Search by name or serial..."
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

        <div className="relative">
          <Filter className="absolute left-3 top-2.5 text-gray-500" size={16} />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-white/5 border border-white/5 rounded-lg pl-10 pr-4 py-2 text-xs text-gray-400 focus:outline-none focus:border-primary/55"
          >
            <option value="">All Statuses</option>
            <option value="available">Available</option>
            <option value="issued">Issued</option>
            <option value="maintenance">Maintenance</option>
            <option value="damaged">Damaged</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {equipment.map((item) => (
            <div key={item._id} className="glass-panel p-5 rounded-2xl flex flex-col justify-between glass-panel-hover">
              <div>
                <div className="flex justify-between items-start gap-4">
                  <h3 className="text-sm font-semibold text-white truncate">{item.name}</h3>
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    item.status === 'available' ? 'bg-primary/10 text-primary' :
                    item.status === 'issued' ? 'bg-blue-500/10 text-blue-400' :
                    item.status === 'maintenance' ? 'bg-amber-500/10 text-amber-500' : 'bg-red-500/10 text-accentRed'
                  }`}>
                    {item.status}
                  </span>
                </div>

                <div className="mt-4 space-y-2 text-xs text-gray-400 border-b border-white/5 pb-4">
                  <p><span className="text-gray-500">Serial:</span> {item.serialNumber}</p>
                  <p><span className="text-gray-500">Category:</span> {item.category}</p>
                  <p><span className="text-gray-500">Location:</span> {item.location}</p>
                  <p><span className="text-gray-500">Accumulated Usage:</span> {item.usageHours} hours</p>
                </div>
              </div>

              <div className="mt-5 flex gap-2 justify-between items-center">
                <button
                  onClick={() => { setSelectedItem(item); setShowQrModal(true); }}
                  className="flex items-center gap-1.5 text-gray-500 hover:text-primary transition focus:outline-none bg-transparent border-none p-0 cursor-pointer"
                  aria-label="View QR Code"
                >
                  <QrCode size={16} />
                  <span className="text-[10px] font-semibold">QR Code</span>
                </button>

                {user?.role !== 'student' && (
                  <div className="flex gap-2">
                    {item.status === 'available' && (
                      <button
                        onClick={() => { setSelectedItem(item); setShowIssueModal(true); }}
                        className="px-2.5 py-1 bg-primary/20 text-primary hover:bg-primary hover:text-darkBg transition rounded-lg text-xs font-semibold"
                      >
                        Issue
                      </button>
                    )}
                    {item.status === 'issued' && (
                      <button
                        onClick={() => { setSelectedItem(item); setShowReturnModal(true); }}
                        className="px-2.5 py-1 bg-blue-500/20 text-blue-400 hover:bg-blue-500 hover:text-white transition rounded-lg text-xs font-semibold"
                      >
                        Return
                      </button>
                    )}
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
            </div>
          ))}

          {equipment.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-500 text-xs">
              No equipment found matching filters.
            </div>
          )}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleAddEquipment} className="w-full max-w-md glass-panel p-6 rounded-2xl space-y-4 border border-white/10 animate-in zoom-in-95 duration-200">
            <h3 className="text-base font-bold text-white mb-2">Register Lab Equipment</h3>
            {error && <p className="text-xs text-red-400 bg-red-500/10 p-2 rounded-lg border border-red-500/20">{error}</p>}
            
            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Equipment Name</label>
              <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full bg-white/5 border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary/50" placeholder="e.g. Digital Oscilloscope" />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Serial Number</label>
              <input type="text" required value={serialNumber} onChange={e => setSerialNumber(e.target.value)} className="w-full bg-white/5 border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary/50" placeholder="e.g. OSC-99201" />
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
                <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Location Room</label>
                <input type="text" required value={location} onChange={e => setLocation(e.target.value)} className="w-full bg-white/5 border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary/50" placeholder="e.g. Room 204, Table A" />
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 border border-white/5 rounded-lg text-xs font-semibold text-gray-400 hover:text-white transition">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-primary text-darkBg rounded-lg text-xs font-semibold hover:opacity-95 transition">Register</button>
            </div>
          </form>
        </div>
      )}

      {/* Issue Modal */}
      {showIssueModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleIssue} className="w-full max-w-sm glass-panel p-6 rounded-2xl space-y-4 border border-white/10 animate-in zoom-in-95 duration-200">
            <h3 className="text-base font-bold text-white mb-2">Issue Device Checkout</h3>
            <p className="text-xs text-gray-400">Assigning <strong>{selectedItem?.name}</strong> to student profile.</p>
            {error && <p className="text-xs text-red-400 bg-red-500/10 p-2 rounded-lg border border-red-500/20">{error}</p>}
            
            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Student Roll Number</label>
              <input type="text" required value={studentRoll} onChange={e => setStudentRoll(e.target.value)} className="w-full bg-white/5 border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary/50" placeholder="e.g. CS2026001" />
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <button type="button" onClick={() => setShowIssueModal(false)} className="px-4 py-2 border border-white/5 rounded-lg text-xs font-semibold text-gray-400 hover:text-white transition">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-primary text-darkBg rounded-lg text-xs font-semibold hover:opacity-95 transition">Assign Checkout</button>
            </div>
          </form>
        </div>
      )}

      {/* Return Modal */}
      {showReturnModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleReturn} className="w-full max-w-sm glass-panel p-6 rounded-2xl space-y-4 border border-white/10 animate-in zoom-in-95 duration-200">
            <h3 className="text-base font-bold text-white mb-2">Process Return Check In</h3>
            <p className="text-xs text-gray-400">Updating check in log for <strong>{selectedItem?.name}</strong>.</p>
            {error && <p className="text-xs text-red-400 bg-red-500/10 p-2 rounded-lg border border-red-500/20">{error}</p>}
            
            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Condition Status</label>
              <select value={returnCondition} onChange={e => setReturnCondition(e.target.value)} className="w-full bg-white/5 border border-white/5 rounded-lg px-3 py-2 text-xs text-gray-400 focus:outline-none focus:border-primary/50">
                <option value="available">Available (Good Condition)</option>
                <option value="damaged">Damaged (Faulty / Needs Repair)</option>
                <option value="maintenance">Maintenance (Needs Calibration)</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Session Usage Time (Hours)</label>
              <input type="number" required min="0" value={usageHoursIncrement} onChange={e => setUsageHoursIncrement(e.target.value)} className="w-full bg-white/5 border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary/50" />
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <button type="button" onClick={() => setShowReturnModal(false)} className="px-4 py-2 border border-white/5 rounded-lg text-xs font-semibold text-gray-400 hover:text-white transition">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-lg text-xs font-semibold hover:opacity-95 transition">Return Check In</button>
            </div>
          </form>
        </div>
      )}

      {/* QR Code Modal */}
      {showQrModal && selectedItem && (() => {
        const qrData = selectedItem.qrCodeUrl || `qr:lab:equip:${selectedItem.serialNumber}`;
        let qrDataUrl = '';
        try {
          const qr = qrcode(0, 'M');
          qr.addData(qrData);
          qr.make();
          qrDataUrl = qr.createDataURL(6, 12);
        } catch (err) {
          console.error('Failed to generate offline QR code', err);
        }

        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-sm glass-panel p-6 rounded-2xl flex flex-col items-center text-center space-y-4 border border-white/10 animate-in zoom-in-95 duration-200">
              <h3 className="text-base font-bold text-white font-display">Equipment QR Tag</h3>
              
              <div className="bg-white p-3 rounded-xl border border-white/15 shadow-xl">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt={`QR Code for ${selectedItem.name}`}
                    className="w-48 h-48 block"
                  />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center text-red-500 text-xs">
                    QR Generation Failed
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white">{selectedItem.name}</h4>
                <p className="text-xs text-primary font-mono">{selectedItem.serialNumber}</p>
                <p className="text-[11px] text-gray-400">{selectedItem.category} • {selectedItem.location}</p>
              </div>

              <div className="flex gap-3 w-full pt-2">
                {qrDataUrl && (
                  <a
                    href={qrDataUrl}
                    download={`QR_${selectedItem.serialNumber}.gif`}
                    className="flex-1 py-2 bg-primary/20 text-primary border border-primary/20 rounded-lg text-xs font-semibold hover:bg-primary hover:text-darkBg text-center block leading-normal transition animate-in fade-in cursor-pointer decoration-none"
                  >
                    Print / Save QR
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => { setShowQrModal(false); setSelectedItem(null); }}
                  className="flex-1 py-2 border border-white/5 bg-white/5 rounded-lg text-xs font-semibold text-gray-400 hover:text-white transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

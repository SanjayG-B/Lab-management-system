import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Wrench,
  Users,
  Box,
  FileSpreadsheet,
  AlertTriangle,
  Zap,
  CheckCircle,
  HelpCircle,
  Plus
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

export default function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  const fetchSummary = async () => {
    try {
      const res = await api.get('/api/v1/ai/dashboard-summary');
      if (res.success) {
        setData(res);
      }
    } catch (err) {
      console.warn('Could not load telemetry metrics:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary"></div>
      </div>
    );
  }

  const stats = data?.stats || {
    equipment: { total: 0, available: 0, issued: 0, maintenance: 0, damaged: 0 },
    studentsCount: 0,
    experimentsCount: 0,
    lowStockItems: 0,
    attendanceWarnings: 0,
    unreadNotifications: 0
  };

  const chartData = [
    { name: 'Available', value: stats.equipment.available, color: '#10b981' },
    { name: 'Issued', value: stats.equipment.issued, color: '#3b82f6' },
    { name: 'Maintenance', value: stats.equipment.maintenance, color: '#f59e0b' },
    { name: 'Damaged', value: stats.equipment.damaged, color: '#ef4444' }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Welcome banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-primary/10 to-secondary/10 border border-white/5 p-6 rounded-2xl">
        <div>
          <h2 className="text-xl md:text-2xl font-bold font-display text-white">Welcome back, {user?.name}!</h2>
          <p className="text-xs text-gray-400 mt-1">The analytical engine has compiled your morning overview.</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-xs text-primary font-medium">
          <Zap size={14} className="animate-pulse" /> Active Status: Mock In-Memory DB Fallback
        </div>
      </div>

      {/* Roster Cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-panel p-5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500">Equipment Catalog</span>
            <h3 className="text-2xl font-bold text-white mt-1">{stats.equipment.total}</h3>
            <p className="text-xs text-gray-400 mt-0.5">{stats.equipment.available} available to issue</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Wrench size={22} />
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500">Total Enrolled</span>
            <h3 className="text-2xl font-bold text-white mt-1">{stats.studentsCount}</h3>
            <p className="text-xs text-gray-400 mt-0.5">{stats.attendanceWarnings} low attendance alerts</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center">
            <Users size={22} />
          </div>
        </div>

        <div className={`glass-panel p-5 rounded-2xl flex items-center justify-between border ${stats.lowStockItems > 0 ? 'border-red-500/25' : 'border-white/5'}`}>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500">Low Stock Consumables</span>
            <h3 className={`text-2xl font-bold mt-1 ${stats.lowStockItems > 0 ? 'text-accentRed' : 'text-white'}`}>{stats.lowStockItems}</h3>
            <p className="text-xs text-gray-400 mt-0.5">Consumables requiring order</p>
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stats.lowStockItems > 0 ? 'bg-red-500/10 text-accentRed' : 'bg-primary/10 text-primary'}`}>
            <Box size={22} />
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500">Active Syllabus</span>
            <h3 className="text-2xl font-bold text-white mt-1">{stats.experimentsCount}</h3>
            <p className="text-xs text-gray-400 mt-0.5">Syllabus practical schedules</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <FileSpreadsheet size={22} />
          </div>
        </div>
      </div>

      {/* Telemetry charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="glass-panel p-6 rounded-2xl">
            <h3 className="text-sm font-semibold text-white mb-6">Equipment Distribution & Status</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#6b7280" fontSize={11} tickLine={false} />
                  <YAxis stroke="#6b7280" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#151c2c', borderColor: '#374151', borderRadius: '8px' }}
                    labelStyle={{ color: '#f3f4f6', fontWeight: 'bold' }}
                    itemStyle={{ color: '#10b981' }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {user?.role !== 'student' && (
            <div className="glass-panel p-6 rounded-2xl">
              <h3 className="text-sm font-semibold text-white mb-4">Logistics Quick Actions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <Link to="/equipment" className="flex items-center gap-3 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-xs font-semibold text-gray-300 hover:text-white transition">
                  <Plus size={16} className="text-primary" /> Register New Equipment
                </Link>
                <Link to="/students" className="flex items-center gap-3 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-xs font-semibold text-gray-300 hover:text-white transition">
                  <Users size={16} className="text-secondary" /> Bulk Mark Attendance
                </Link>
                <Link to="/reports" className="flex items-center gap-3 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-xs font-semibold text-gray-300 hover:text-white transition">
                  <FileSpreadsheet size={16} className="text-blue-400" /> Compile Export Report
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-8">
          {/* AI Insights */}
          <div className="bg-gradient-to-tr from-secondary/15 to-primary/10 border border-secondary/20 p-6 rounded-2xl space-y-4 shadow-xl">
            <div className="flex items-center gap-2 text-secondary">
              <Zap size={18} className="text-secondary fill-secondary/25 animate-pulse" />
              <h3 className="text-sm font-bold text-white font-display uppercase tracking-wider">AI Insights</h3>
            </div>
            
            <div className="space-y-3">
              {data?.insights?.map((insight, idx) => (
                <div key={idx} className="p-3 bg-darkBg/60 border border-white/5 rounded-xl text-xs leading-relaxed text-gray-300">
                  {insight}
                </div>
              ))}
            </div>
          </div>

          {/* System Notifications */}
          <div className="glass-panel p-6 rounded-2xl">
            <h3 className="text-sm font-semibold text-white mb-4">Recent Alerts</h3>
            <div className="space-y-4">
              {data?.recentNotifications && data.recentNotifications.length > 0 ? (
                data.recentNotifications.map((notif) => (
                  <div key={notif._id} className="flex gap-3 border-b border-white/5 pb-3 last:border-b-0 last:pb-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      notif.type === 'stock' ? 'bg-red-500/10 text-accentRed' :
                      notif.type === 'maintenance' ? 'bg-amber-500/10 text-amber-500' : 'bg-primary/10 text-primary'
                    }`}>
                      {notif.type === 'stock' ? <AlertTriangle size={14} /> : <CheckCircle size={14} />}
                    </div>
                    <div className="overflow-hidden">
                      <h4 className="text-xs font-semibold text-white truncate">{notif.title}</h4>
                      <p className="text-[10px] text-gray-400 mt-0.5 leading-normal">{notif.message}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-gray-500 text-xs flex flex-col items-center gap-1">
                  <HelpCircle size={18} /> No warnings logged.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

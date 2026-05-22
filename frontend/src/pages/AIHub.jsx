import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Sparkles, AlertTriangle, ShieldCheck, TrendingDown, Eye, RefreshCw, BarChart2, Activity, ShieldAlert } from 'lucide-react';

export default function AIHub() {
  const { user } = useAuth();
  const [maintenance, setMaintenance] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('maintenance'); // maintenance, inventory, attendance

  const fetchAIData = async () => {
    setLoading(true);
    try {
      const [maintRes, invRes, attRes] = await Promise.all([
        api.get('/api/v1/ai/predict-maintenance'),
        api.get('/api/v1/ai/inventory-forecast'),
        api.get('/api/v1/ai/attendance-analysis')
      ]);

      if (maintRes.success) setMaintenance(maintRes.data);
      if (invRes.success) setInventory(invRes.data);
      if (attRes.success) setAttendance(attRes.data);
    } catch (err) {
      console.warn('Failed to load AI analytics hub reports:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAIData();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="text-secondary fill-secondary/20" size={20} />
            <h2 className="text-xl font-bold text-white font-display">AI Analytics Hub</h2>
          </div>
          <p className="text-xs text-gray-400">Predictive maintenance calibration, stock burnout schedules, and student attendance risk analysis</p>
        </div>
        <button
          onClick={fetchAIData}
          className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-lg text-xs font-semibold transition"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh Calculations
        </button>
      </div>

      {/* Tabs Selector */}
      <div className="flex border-b border-white/5 space-x-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('maintenance')}
          className={`pb-3 transition ${activeTab === 'maintenance' ? 'text-primary border-b-2 border-primary' : 'text-gray-400 hover:text-white'}`}
        >
          Predictive Maintenance ({maintenance.length})
        </button>
        <button
          onClick={() => setActiveTab('inventory')}
          className={`pb-3 transition ${activeTab === 'inventory' ? 'text-primary border-b-2 border-primary' : 'text-gray-400 hover:text-white'}`}
        >
          Stock Burnout Forecast ({inventory.length})
        </button>
        <button
          onClick={() => setActiveTab('attendance')}
          className={`pb-3 transition ${activeTab === 'attendance' ? 'text-primary border-b-2 border-primary' : 'text-gray-400 hover:text-white'}`}
        >
          Student Risk Alerts ({attendance.length})
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* TAB 1: PREDICTIVE MAINTENANCE */}
          {activeTab === 'maintenance' && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {maintenance.map((item, idx) => {
                const isHighRisk = item.riskScore >= 70;
                const isMedRisk = item.riskScore >= 45 && item.riskScore < 70;
                return (
                  <div key={idx} className={`glass-panel p-5 rounded-2xl flex flex-col justify-between border ${
                    isHighRisk ? 'border-red-500/25 bg-gradient-to-br from-darkCard to-red-950/10' :
                    isMedRisk ? 'border-amber-500/25 bg-gradient-to-br from-darkCard to-amber-950/10' : 'border-white/5'
                  }`}>
                    <div>
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <h4 className="text-sm font-semibold text-white">{item.name}</h4>
                          <span className="text-[10px] text-gray-500 font-mono">Serial: {item.serialNumber}</span>
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          isHighRisk ? 'bg-red-500/10 text-accentRed border border-red-500/20' :
                          isMedRisk ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                          'bg-primary/10 text-primary border border-primary/20'
                        }`}>
                          Risk: {item.riskScore}%
                        </span>
                      </div>

                      {/* Progress wear bar */}
                      <div className="mt-4 space-y-1">
                        <div className="flex justify-between text-[10px] text-gray-500">
                          <span>Accumulated Wear Rate</span>
                          <span>{item.riskScore}%</span>
                        </div>
                        <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              isHighRisk ? 'bg-accentRed' :
                              isMedRisk ? 'bg-amber-500' : 'bg-primary'
                            }`}
                            style={{ width: `${item.riskScore}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="mt-4 space-y-2 border-t border-white/5 pt-3 text-xs">
                        <div className="text-[10px] uppercase font-bold text-gray-500">Wear Contributors:</div>
                        {item.reasons?.length > 0 ? (
                          <ul className="list-disc list-inside space-y-1 text-gray-400">
                            {item.reasons.map((r, i) => (
                              <li key={i}>{r}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-gray-600 italic">No structural deterioration patterns detected.</p>
                        )}
                      </div>
                    </div>

                    <div className="mt-6 flex items-start gap-2.5 p-3 rounded-xl bg-white/5 border border-white/5 text-[11px] leading-relaxed text-gray-300">
                      {isHighRisk ? <AlertTriangle size={14} className="text-accentRed shrink-0" /> : <ShieldCheck size={14} className="text-primary shrink-0" />}
                      <span><strong>Recommendation:</strong> {item.recommendation}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 2: INVENTORY FORECAST */}
          {activeTab === 'inventory' && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {inventory.map((item, idx) => {
                const isCritical = item.status === 'CRITICAL';
                const isWarning = item.status === 'WARNING';
                return (
                  <div key={idx} className={`glass-panel p-5 rounded-2xl flex flex-col justify-between border ${
                    isCritical ? 'border-red-500/25 bg-gradient-to-br from-darkCard to-red-950/10' :
                    isWarning ? 'border-amber-500/25 bg-gradient-to-br from-darkCard to-amber-950/10' : 'border-white/5'
                  }`}>
                    <div>
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <h4 className="text-sm font-semibold text-white">{item.itemName}</h4>
                          <span className="text-[10px] text-gray-500">{item.category}</span>
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          isCritical ? 'bg-red-500/10 text-accentRed border border-red-500/20' :
                          isWarning ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                          'bg-primary/10 text-primary border border-primary/20'
                        }`}>
                          {item.status}
                        </span>
                      </div>

                      <div className="mt-4 space-y-2.5 text-xs text-gray-400">
                        <div className="flex justify-between border-b border-white/5 pb-2">
                          <span className="text-gray-500">Current Qty:</span>
                          <span className="text-white font-bold">{item.quantity} {item.unit}</span>
                        </div>
                        <div className="flex justify-between border-b border-white/5 pb-2">
                          <span className="text-gray-500">Depletion Burn Forecast:</span>
                          <span className={isCritical ? 'text-accentRed font-bold' : 'text-white'}>
                            {item.daysRemaining} days remaining
                          </span>
                        </div>
                        <div className="flex justify-between border-b border-white/5 pb-2">
                          <span className="text-gray-500">Estimated Depletion Date:</span>
                          <span className="text-white font-mono">{item.depletionDate}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 space-y-3">
                      <div className="flex justify-between text-[11px] bg-white/5 p-2 rounded-lg border border-white/5 text-gray-400">
                        <span>Restock Suggestion:</span>
                        <strong className="text-primary">+{item.recommendedRestockQty} {item.unit}</strong>
                      </div>
                      <p className="text-[10px] text-gray-500">Preferred Vendor: {item.supplier || 'Not set'}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 3: ATTENDANCE ANALYSIS */}
          {activeTab === 'attendance' && (
            <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-white/5 border-b border-white/5 text-gray-400 uppercase font-semibold">
                      <th className="px-6 py-4">Student Details</th>
                      <th className="px-6 py-4">Department</th>
                      <th className="px-6 py-4">Recent Trend</th>
                      <th className="px-6 py-4">Risk Assessment</th>
                      <th className="px-6 py-4">Analysis Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {attendance.map((att, idx) => {
                      const isHighRisk = att.riskLevel === 'High';
                      const isMedRisk = att.riskLevel === 'Medium';
                      return (
                        <tr key={idx} className="hover:bg-white/5 transition duration-150">
                          <td className="px-6 py-4">
                            <div>
                              <div className="font-semibold text-white">Student ID: {att.studentId}</div>
                              <div className="text-[10px] text-gray-500 font-mono mt-0.5">Roll: {att.rollNumber}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-400">{att.department}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1 font-bold ${
                              att.trend === 'Declining' ? 'text-accentRed' : 'text-primary'
                            }`}>
                              {att.trend === 'Declining' && <TrendingDown size={12} />}
                              {att.trend}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                              isHighRisk ? 'bg-red-500/10 text-accentRed border border-red-500/20 animate-pulse' :
                              isMedRisk ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                              'bg-primary/10 text-primary border border-primary/20'
                            }`}>
                              {att.riskLevel} Risk ({att.attendancePercentage}%)
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-400">
                            <div className="flex items-center gap-1.5">
                              {isHighRisk && <ShieldAlert size={12} className="text-accentRed" />}
                              <span>{att.remarks}</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {attendance.length === 0 && (
                      <tr>
                        <td colSpan="5" className="text-center py-12 text-gray-500 text-xs">
                          No student risk telemetry available.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

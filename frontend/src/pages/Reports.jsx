import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FileSpreadsheet, Plus, Download, FileText, Calendar, Trash2 } from 'lucide-react';

export default function Reports() {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  // Forms
  const [title, setTitle] = useState('');
  const [type, setType] = useState('inventory');
  const [format, setFormat] = useState('pdf');

  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [error, setError] = useState('');
  const [generating, setGenerating] = useState(false);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/v1/reports');
      if (res.success) {
        setReports(res.data);
      }
    } catch (err) {
      console.warn('Failed to load systems reports:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleGenerateReport = async (e) => {
    e.preventDefault();
    setError('');
    setGenerating(true);
    try {
      const res = await api.post('/api/v1/reports/generate', { title, type, format });
      if (res.success) {
        setShowGenerateModal(false);
        setTitle('');
        fetchReports();
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError('Generation failed. Ensure server connection.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-white font-display">Systems Reports</h2>
          <p className="text-xs text-gray-400">Generate, compile, and download tabular reports for lab auditing and management</p>
        </div>
        {user?.role !== 'student' && (
          <button
            onClick={() => setShowGenerateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-darkBg font-bold rounded-lg btn-glow-emerald hover:opacity-95 transition text-xs"
          >
            <Plus size={16} /> Compile Audit Report
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl overflow-hidden border border-white/5">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-white/5 border-b border-white/5 text-gray-400 uppercase font-semibold">
                  <th className="px-6 py-4">Report Details</th>
                  <th className="px-6 py-4">Category Type</th>
                  <th className="px-6 py-4">Format</th>
                  <th className="px-6 py-4">Compilation Date</th>
                  <th className="px-6 py-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {reports.map((report) => (
                  <tr key={report._id} className="hover:bg-white/5 transition duration-150">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-semibold text-white">{report.title}</div>
                        <div className="text-[10px] text-gray-500 mt-0.5">ID: {report._id}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 capitalize text-gray-300 font-semibold">{report.type}</td>
                    <td className="px-6 py-4">
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        report.format === 'pdf' ? 'bg-red-500/10 text-accentRed border border-red-500/20' : 'bg-green-500/10 text-emerald-400 border border-green-500/20'
                      }`}>
                        {report.format}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-400">
                      {new Date(report.createdAt || report.timestamp || Date.now()).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <a
                        href={report.fileUrl}
                        download
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary hover:text-darkBg transition rounded-lg text-xs font-semibold"
                      >
                        <Download size={12} /> Download
                      </a>
                    </td>
                  </tr>
                ))}

                {reports.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-center py-12 text-gray-500 text-xs">
                      No compiled reports present.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Generate Report Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleGenerateReport} className="w-full max-w-sm glass-panel p-6 rounded-2xl space-y-4 border border-white/10 animate-in zoom-in-95 duration-200">
            <h3 className="text-base font-bold text-white mb-2">Compile Systems Report</h3>
            {error && <p className="text-xs text-red-400 bg-red-500/10 p-2 rounded-lg border border-red-500/20">{error}</p>}
            
            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Report Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full bg-white/5 border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary/50"
                placeholder="e.g. Q2 EC Stock Audit"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Data Context</label>
              <select
                value={type}
                onChange={e => setType(e.target.value)}
                className="w-full bg-white/5 border border-white/5 rounded-lg px-3 py-2 text-xs text-gray-400 focus:outline-none focus:border-primary/50"
              >
                <option value="inventory">Inventory depletion log</option>
                <option value="attendance">Student attendance logs</option>
                <option value="maintenance">Equipment Calibration wear</option>
                <option value="usage">General usage statistics</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Export Format</label>
              <select
                value={format}
                onChange={e => setFormat(e.target.value)}
                className="w-full bg-white/5 border border-white/5 rounded-lg px-3 py-2 text-xs text-gray-400 focus:outline-none focus:border-primary/50"
              >
                <option value="pdf">Document PDF (.pdf)</option>
                <option value="excel">Tabular Spreadsheet (.xlsx)</option>
              </select>
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <button
                type="button"
                onClick={() => setShowGenerateModal(false)}
                className="px-4 py-2 border border-white/5 rounded-lg text-xs font-semibold text-gray-400 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={generating}
                className="px-4 py-2 bg-primary text-darkBg rounded-lg text-xs font-bold hover:opacity-95 transition disabled:opacity-50"
              >
                {generating ? 'Compiling...' : 'Generate Report'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

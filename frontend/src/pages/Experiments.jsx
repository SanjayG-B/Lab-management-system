import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, Plus, BookOpen, Upload, Download, Eye, FileText, Sparkles, Trash2 } from 'lucide-react';

export default function Experiments() {
  const { user } = useAuth();
  const [experiments, setExperiments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showViewSubmissionsModal, setShowViewSubmissionsModal] = useState(false);
  const [showUploadManualModal, setShowUploadManualModal] = useState(false);
  const [selectedExperiment, setSelectedExperiment] = useState(null);

  // Add Experiment syllabus form
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [department, setDepartment] = useState('CSE');
  const [manualFile, setManualFile] = useState(null);

  // Student upload report form
  const [recordImage, setRecordImage] = useState(null);
  const [submittingReport, setSubmittingReport] = useState(false);
  const [ocrResult, setOcrResult] = useState(null);

  // Manual upload form
  const [manualUploadFile, setManualUploadFile] = useState(null);
  const [uploadingManual, setUploadingManual] = useState(false);

  const [error, setError] = useState('');

  const fetchExperiments = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/v1/experiments');
      if (res.success) {
        setExperiments(res.data);
      }
    } catch (err) {
      console.warn('Failed to load experiments roster:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExperiments();
  }, []);

  const handleAddExperiment = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('code', code);
      formData.append('description', description);
      formData.append('department', department);
      if (manualFile) {
        formData.append('manual', manualFile);
      }

      const res = await api.post('/api/v1/experiments', formData, true);
      if (res.success) {
        setShowAddModal(false);
        resetAddForm();
        fetchExperiments();
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError('Failed to create new syllabus item.');
    }
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    setError('');
    if (!recordImage) {
      setError('Please select a handwritten lab log image to scan.');
      return;
    }

    setSubmittingReport(true);
    try {
      const formData = new FormData();
      formData.append('recordImage', recordImage);

      const res = await api.post(`/api/v1/experiments/${selectedExperiment._id}/submit`, formData, true);
      if (res.success) {
        setOcrResult(res.submission);
        setRecordImage(null);
        fetchExperiments();
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError('Failed to transmit laboratory log scanner data.');
    } finally {
      setSubmittingReport(false);
    }
  };

  const handleUploadManual = async (e) => {
    e.preventDefault();
    setError('');
    if (!manualUploadFile) {
      setError('Please select a PDF lab manual file.');
      return;
    }

    setUploadingManual(true);
    try {
      const formData = new FormData();
      formData.append('manual', manualUploadFile);

      const res = await api.post(`/api/v1/experiments/${selectedExperiment._id}/manual`, formData, true);
      if (res.success) {
        setShowUploadManualModal(false);
        setManualUploadFile(null);
        fetchExperiments();
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError('Failed to upload lab manual document.');
    } finally {
      setUploadingManual(false);
    }
  };

  const handleDeleteManual = async (experimentId) => {
    if (!window.confirm('Are you sure you want to remove the lab manual for this experiment?')) {
      return;
    }
    try {
      const res = await api.delete(`/api/v1/experiments/${experimentId}/manual`);
      if (res.success) {
        fetchExperiments();
      } else {
        alert(res.message || 'Failed to remove lab manual.');
      }
    } catch (err) {
      alert('An error occurred while removing the manual.');
    }
  };

  const handleDeleteExperiment = async (experimentId) => {
    if (!window.confirm('Are you sure you want to delete this entire experiment syllabus card? All submissions and files will be permanently lost.')) {
      return;
    }
    try {
      const res = await api.delete(`/api/v1/experiments/${experimentId}`);
      if (res.success) {
        fetchExperiments();
      } else {
        alert(res.message || 'Failed to delete experiment syllabus.');
      }
    } catch (err) {
      alert('An error occurred while deleting the experiment.');
    }
  };

  const resetAddForm = () => {
    setTitle('');
    setCode('');
    setDescription('');
    setDepartment('CSE');
    setManualFile(null);
  };

  const closeSubmitModal = () => {
    setShowSubmitModal(false);
    setOcrResult(null);
    setRecordImage(null);
    setError('');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-white font-display">Experiments Syllabus & Submissions</h2>
          <p className="text-xs text-gray-400">Access lab manual guidelines and submit handwritten experiment files for auto-grading</p>
        </div>
        {user?.role !== 'student' && (
          <button
            onClick={() => { resetAddForm(); setShowAddModal(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-darkBg font-bold rounded-lg btn-glow-emerald hover:opacity-95 transition text-xs"
          >
            <Plus size={16} /> Add Syllabus Manual
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {experiments.map((exp) => (
            <div key={exp._id} className="glass-panel p-5 rounded-2xl flex flex-col justify-between glass-panel-hover">
              <div className="space-y-3">
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <span className="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-white/5 text-secondary border border-white/5">
                      {exp.code}
                    </span>
                    <h3 className="text-sm font-semibold text-white mt-1.5 truncate">{exp.title}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-500 font-medium">{exp.department}</span>
                    {user?.role !== 'student' && (
                      <button
                        onClick={() => handleDeleteExperiment(exp._id)}
                        className="p-1 hover:bg-red-500/10 text-gray-500 hover:text-red-400 rounded-md transition"
                        title="Delete Syllabus Card"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>
                
                <p className="text-xs text-gray-400 line-clamp-3 leading-relaxed">{exp.description}</p>
              </div>

              <div className="mt-6 space-y-3 border-t border-white/5 pt-4">
                {exp.manualUrl ? (
                  <div className="flex gap-2">
                    <a
                      href={exp.manualUrl}
                      download
                      className="flex-1 flex items-center justify-center gap-2 py-2 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-lg text-xs font-semibold transition"
                    >
                      <Download size={14} /> Download Manual PDF
                    </a>
                    {user?.role !== 'student' && (
                      <>
                        <button
                          onClick={() => { setSelectedExperiment(exp); setShowUploadManualModal(true); }}
                          className="px-2.5 py-2 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-lg text-xs font-semibold transition"
                          title="Update Manual"
                        >
                          <Upload size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteManual(exp._id)}
                          className="px-2.5 py-2 bg-red-500/10 hover:bg-red-500/20 text-accentRed rounded-lg text-xs font-semibold transition"
                          title="Delete Manual"
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>
                ) : (
                  <div>
                    {user?.role !== 'student' ? (
                      <button
                        onClick={() => { setSelectedExperiment(exp); setShowUploadManualModal(true); }}
                        className="flex items-center justify-center gap-2 w-full py-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 hover:border-primary/30 rounded-lg text-xs font-semibold transition"
                      >
                        <Upload size={14} /> Upload Manual PDF
                      </button>
                    ) : (
                      <div className="text-center py-2 text-gray-600 text-xs italic">
                        No manual document uploaded
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-2">
                  {user?.role === 'student' ? (
                    <button
                      onClick={() => { setSelectedExperiment(exp); setShowSubmitModal(true); }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-primary/25 hover:bg-primary text-primary hover:text-darkBg transition rounded-lg text-xs font-bold"
                    >
                      <Upload size={14} /> Upload Report
                    </button>
                  ) : (
                    <button
                      onClick={() => { setSelectedExperiment(exp); setShowViewSubmissionsModal(true); }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-secondary/25 hover:bg-secondary text-secondary hover:text-darkBg transition rounded-lg text-xs font-bold"
                    >
                      <Eye size={14} /> View Submissions ({exp.submissions?.length || 0})
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {experiments.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-500 text-xs">
              No experiment syllabus records established.
            </div>
          )}
        </div>
      )}

      {/* Add Experiment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleAddExperiment} className="w-full max-w-md glass-panel p-6 rounded-2xl space-y-4 border border-white/10 animate-in zoom-in-95 duration-200">
            <h3 className="text-base font-bold text-white mb-2">Create Syllabus & Upload Manual</h3>
            {error && <p className="text-xs text-red-400 bg-red-500/10 p-2 rounded-lg border border-red-500/20">{error}</p>}
            
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-1">
                <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Code</label>
                <input type="text" required value={code} onChange={e => setCode(e.target.value)} className="w-full bg-white/5 border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary/50" placeholder="e.g. CS-201" />
              </div>
              <div className="col-span-2">
                <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Title</label>
                <input type="text" required value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-white/5 border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary/50" placeholder="e.g. Verification of Ohm's Law" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows="3" className="w-full bg-white/5 border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary/50 placeholder-gray-500" placeholder="Describe laboratory tasks, equipment required, and report structure guidelines..."></textarea>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Department</label>
                <select value={department} onChange={e => setDepartment(e.target.value)} className="w-full bg-white/5 border border-white/5 rounded-lg px-3 py-2 text-xs text-gray-400 focus:outline-none focus:border-primary/50">
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
                <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Lab Manual PDF</label>
                <input type="file" accept=".pdf" onChange={e => setManualFile(e.target.files[0])} className="w-full text-xs text-gray-400 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20 cursor-pointer mt-1" />
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 border border-white/5 rounded-lg text-xs font-semibold text-gray-400 hover:text-white transition">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-primary text-darkBg rounded-lg text-xs font-semibold hover:opacity-95 transition">Add Syllabus</button>
            </div>
          </form>
        </div>
      )}

      {/* Student Submit Report Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-xl glass-panel p-6 rounded-2xl space-y-4 border border-white/10 animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]">
            <h3 className="text-base font-bold text-white">Transmit Lab Report scan</h3>
            <p className="text-xs text-gray-400 mb-2">Upload your handwritten log book image. The AI engine will scan values using Tesseract OCR and automatically score it.</p>
            {error && <p className="text-xs text-red-400 bg-red-500/10 p-2 rounded-lg border border-red-500/20">{error}</p>}
            
            {!ocrResult ? (
              <form onSubmit={handleSubmitReport} className="space-y-4">
                <div className="flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-xl p-8 hover:border-primary/50 transition cursor-pointer relative bg-white/5">
                  <input
                    type="file"
                    required
                    accept="image/*"
                    onChange={e => setRecordImage(e.target.files[0])}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Upload size={32} className="text-gray-500 mb-2" />
                  <span className="text-xs font-semibold text-gray-300">
                    {recordImage ? recordImage.name : 'Select or drag notebook photo...'}
                  </span>
                  <span className="text-[10px] text-gray-500 mt-1">Accepts PNG, JPG, JPEG</span>
                </div>

                <div className="flex gap-3 justify-end pt-4">
                  <button type="button" onClick={closeSubmitModal} className="px-4 py-2 border border-white/5 rounded-lg text-xs font-semibold text-gray-400 hover:text-white transition">Cancel</button>
                  <button
                    type="submit"
                    disabled={submittingReport}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-darkBg rounded-lg text-xs font-bold hover:opacity-95 transition disabled:opacity-50"
                  >
                    {submittingReport ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-darkBg"></div>
                        Scanning OCR...
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} /> Scan & Grade
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/5">
                  <div>
                    <span className="text-[10px] text-gray-500 uppercase font-bold">Auto Grade Scored</span>
                    <h4 className="text-xl font-bold text-primary mt-0.5">Grade: {ocrResult.grade}</h4>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-gray-500 uppercase font-bold">Execution Date</span>
                    <p className="text-xs font-semibold text-white mt-0.5">{new Date(ocrResult.submittedAt).toLocaleDateString()}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">OCR Scanned Text Output</label>
                  <div className="bg-darkBg border border-white/5 rounded-xl p-4 text-xs font-mono text-gray-300 whitespace-pre-line leading-relaxed max-h-[200px] overflow-y-auto">
                    {ocrResult.ocrText}
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button onClick={closeSubmitModal} className="px-5 py-2 bg-primary text-darkBg font-bold rounded-lg text-xs hover:opacity-95 transition">Done</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* View Submissions Modal */}
      {showViewSubmissionsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl glass-panel p-6 rounded-2xl space-y-4 border border-white/10 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <h3 className="text-base font-bold text-white">Student Submissions Log</h3>
            <p className="text-xs text-gray-400">Review lab logs for <strong>{selectedExperiment?.title}</strong>.</p>

            <div className="flex-1 overflow-y-auto divide-y divide-white/5 pr-2">
              {selectedExperiment?.submissions?.length > 0 ? (
                selectedExperiment.submissions.map((sub, idx) => (
                  <div key={idx} className="py-4 space-y-2 first:pt-0 last:pb-0">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <span className="text-xs font-bold text-white">Student ID: {sub.student}</span>
                        <p className="text-[10px] text-gray-500 mt-0.5">Submitted: {new Date(sub.submittedAt).toLocaleString()}</p>
                      </div>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase ${
                        sub.grade === 'A' ? 'bg-primary/10 text-primary border border-primary/20' :
                        sub.grade === 'B' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                        'bg-red-500/10 text-accentRed border border-red-500/20'
                      }`}>
                        Grade {sub.grade}
                      </span>
                    </div>

                    <div className="bg-white/5 p-3 rounded-lg text-xs leading-relaxed border border-white/5">
                      <div className="text-[10px] uppercase font-bold text-gray-500 mb-1 flex items-center gap-1">
                        <Sparkles size={10} className="text-primary" /> Digitized OCR Readings
                      </div>
                      <p className="font-mono text-gray-300 text-[11px] whitespace-pre-line">{sub.ocrText}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-gray-500 text-xs flex flex-col items-center gap-1 justify-center">
                  <FileText size={24} /> No submissions logged yet.
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4 border-t border-white/5">
              <button onClick={() => setShowViewSubmissionsModal(false)} className="px-4 py-2 border border-white/5 rounded-lg text-xs font-semibold text-gray-400 hover:text-white transition">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Upload/Update Manual Modal */}
      {showUploadManualModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleUploadManual} className="w-full max-w-md glass-panel p-6 rounded-2xl space-y-4 border border-white/10 animate-in zoom-in-95 duration-200">
            <h3 className="text-base font-bold text-white mb-1">
              {selectedExperiment?.manualUrl ? 'Update Lab Manual PDF' : 'Upload Lab Manual PDF'}
            </h3>
            <p className="text-xs text-gray-400">
              For: <span className="text-white font-semibold">{selectedExperiment?.title}</span> ({selectedExperiment?.code})
            </p>
            
            {error && <p className="text-xs text-red-400 bg-red-500/10 p-2 rounded-lg border border-red-500/20">{error}</p>}
            
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-xl p-8 hover:border-primary/50 transition cursor-pointer relative bg-white/5">
              <input
                type="file"
                required
                accept=".pdf"
                onChange={e => setManualUploadFile(e.target.files[0])}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Upload size={32} className="text-gray-500 mb-2" />
              <span className="text-xs font-semibold text-gray-300">
                {manualUploadFile ? manualUploadFile.name : 'Select or drag PDF file...'}
              </span>
              <span className="text-[10px] text-gray-500 mt-1">Accepts only PDF files</span>
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowUploadManualModal(false);
                  setManualUploadFile(null);
                  setError('');
                }}
                className="px-4 py-2 border border-white/5 rounded-lg text-xs font-semibold text-gray-400 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={uploadingManual}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-darkBg rounded-lg text-xs font-bold hover:opacity-95 transition disabled:opacity-50"
              >
                {uploadingManual ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-darkBg"></div>
                    Uploading...
                  </>
                ) : (
                  'Upload PDF'
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

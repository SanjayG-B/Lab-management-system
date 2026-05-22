import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Users, Search, Filter, Plus, Calendar, Check, X, ShieldAlert } from 'lucide-react';

export default function Students() {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [semFilter, setSemFilter] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);

  // Forms for adding student user
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [department, setDepartment] = useState('CSE');
  const [semester, setSemester] = useState(1);
  const [phone, setPhone] = useState('');

  // Forms for attendance logging
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [labSession, setLabSession] = useState('Morning Batch');
  const [attendanceRecords, setAttendanceRecords] = useState({}); // studentId: 'present' | 'absent'

  const [error, setError] = useState('');

  const fetchStudents = async () => {
    setLoading(true);
    try {
      let url = `/api/v1/students`;
      const params = [];
      if (deptFilter) params.push(`department=${deptFilter}`);
      if (semFilter) params.push(`semester=${semFilter}`);
      if (params.length > 0) {
        url += `?${params.join('&')}`;
      }

      const res = await api.get(url);
      if (res.success) {
        let list = res.data;
        if (search) {
          list = list.filter(s => 
            s.name.toLowerCase().includes(search.toLowerCase()) ||
            s.rollNumber.toLowerCase().includes(search.toLowerCase())
          );
        }
        setStudents(list);
      }
    } catch (err) {
      console.warn('Failed to fetch student roster:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [deptFilter, semFilter, search]);

  const handleAddStudent = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await api.post('/api/v1/auth/register', {
        name,
        email,
        password,
        role: 'student',
        department,
        semester: Number(semester),
        phone
      });
      if (res.success) {
        setShowAddModal(false);
        resetForm();
        fetchStudents();
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError('Registration failed. Try checking input values.');
    }
  };

  const openAttendanceModal = () => {
    const initialRecords = {};
    students.forEach(s => {
      initialRecords[s._id] = 'present';
    });
    setAttendanceRecords(initialRecords);
    setShowAttendanceModal(true);
  };

  const handleToggleAttendance = (studentId) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [studentId]: prev[studentId] === 'present' ? 'absent' : 'present'
    }));
  };

  const handleSubmitAttendance = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const recordsArray = Object.keys(attendanceRecords).map(studentId => ({
        studentId,
        status: attendanceRecords[studentId]
      }));

      const res = await api.post('/api/v1/students/attendance/mark', {
        date: attendanceDate,
        labSession,
        records: recordsArray
      });

      if (res.success) {
        setShowAttendanceModal(false);
        fetchStudents();
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError('Failed to record session attendance logs.');
    }
  };

  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setDepartment('CSE');
    setSemester(1);
    setPhone('');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-white font-display">Students & Attendance</h2>
          <p className="text-xs text-gray-400">Review student metrics, update profiles, and check session attendance logs</p>
        </div>
        {user?.role !== 'student' && (
          <div className="flex gap-3">
            <button
              onClick={openAttendanceModal}
              disabled={students.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-secondary text-darkBg font-bold rounded-lg btn-glow-violet hover:opacity-95 transition text-xs disabled:opacity-50"
            >
              <Calendar size={16} /> Log Attendance
            </button>
            <button
              onClick={() => { resetForm(); setShowAddModal(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-darkBg font-bold rounded-lg btn-glow-emerald hover:opacity-95 transition text-xs"
            >
              <Plus size={16} /> Register Student
            </button>
          </div>
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
            placeholder="Search by name or roll number..."
            className="w-full bg-white/5 border border-white/5 rounded-lg pl-10 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-primary/50"
          />
        </div>

        <div className="relative">
          <Filter className="absolute left-3 top-2.5 text-gray-500" size={16} />
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="w-full bg-white/5 border border-white/5 rounded-lg pl-10 pr-4 py-2 text-xs text-gray-400 focus:outline-none focus:border-primary/55"
          >
            <option value="">All Departments</option>
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
            value={semFilter}
            onChange={(e) => setSemFilter(e.target.value)}
            className="w-full bg-white/5 border border-white/5 rounded-lg pl-10 pr-4 py-2 text-xs text-gray-400 focus:outline-none focus:border-primary/55"
          >
            <option value="">All Semesters</option>
            <option value="1">Semester 1</option>
            <option value="2">Semester 2</option>
            <option value="3">Semester 3</option>
            <option value="4">Semester 4</option>
            <option value="5">Semester 5</option>
            <option value="6">Semester 6</option>
            <option value="7">Semester 7</option>
            <option value="8">Semester 8</option>
          </select>
        </div>
      </div>

      {/* Student List */}
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
                  <th className="px-6 py-4">Student Info</th>
                  <th className="px-6 py-4">Roll Number</th>
                  <th className="px-6 py-4">Department & Sem</th>
                  <th className="px-6 py-4">Phone</th>
                  <th className="px-6 py-4 text-center">Attendance Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {students.map((student) => {
                  const isLowAttendance = student.attendancePercentage < 75;
                  return (
                    <tr key={student._id} className="hover:bg-white/5 transition duration-150">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-semibold text-white">{student.name}</div>
                          <div className="text-[10px] text-gray-500 mt-0.5">{student.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-gray-300 font-semibold">{student.rollNumber}</td>
                      <td className="px-6 py-4 text-gray-400">
                        {student.department} — Sem {student.semester}
                      </td>
                      <td className="px-6 py-4 text-gray-400">{student.phone || 'N/A'}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col items-center justify-center gap-1">
                          <span className={`font-bold px-2 py-0.5 rounded-full ${
                            isLowAttendance ? 'bg-red-500/10 text-accentRed border border-red-500/20' : 'bg-primary/10 text-primary'
                          }`}>
                            {student.attendancePercentage}%
                          </span>
                          {isLowAttendance && (
                            <span className="flex items-center gap-0.5 text-[9px] text-accentRed font-semibold">
                              <ShieldAlert size={10} /> Shortage
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {students.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-center py-12 text-gray-500 text-xs">
                      No student records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleAddStudent} className="w-full max-w-md glass-panel p-6 rounded-2xl space-y-4 border border-white/10 animate-in zoom-in-95 duration-200">
            <h3 className="text-base font-bold text-white mb-2">Register Student Account</h3>
            {error && <p className="text-xs text-red-400 bg-red-500/10 p-2 rounded-lg border border-red-500/20">{error}</p>}
            
            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Full Name</label>
              <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full bg-white/5 border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary/50" placeholder="e.g. John Doe" />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Email Address</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-white/5 border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary/50" placeholder="e.g. john@lab.edu" />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Password</label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-white/5 border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary/50" placeholder="••••••••" />
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
                <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Semester</label>
                <input type="number" required min="1" max="8" value={semester} onChange={e => setSemester(e.target.value)} className="w-full bg-white/5 border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary/50" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Phone Number (Optional)</label>
              <input type="text" value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-white/5 border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary/50" placeholder="e.g. +1 555-0199" />
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 border border-white/5 rounded-lg text-xs font-semibold text-gray-400 hover:text-white transition">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-primary text-darkBg rounded-lg text-xs font-semibold hover:opacity-95 transition">Register Account</button>
            </div>
          </form>
        </div>
      )}

      {/* Attendance Modal */}
      {showAttendanceModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSubmitAttendance} className="w-full max-w-xl glass-panel p-6 rounded-2xl space-y-4 border border-white/10 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <h3 className="text-base font-bold text-white mb-1">Log Session Attendance</h3>
            <p className="text-xs text-gray-400">Quickly toggle attendance status for students currently listed.</p>
            {error && <p className="text-xs text-red-400 bg-red-500/10 p-2 rounded-lg border border-red-500/20">{error}</p>}
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Date</label>
                <input type="date" required value={attendanceDate} onChange={e => setAttendanceDate(e.target.value)} className="w-full bg-white/5 border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary/50" />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Lab Session Batch</label>
                <select value={labSession} onChange={e => setLabSession(e.target.value)} className="w-full bg-white/5 border border-white/5 rounded-lg px-3 py-2 text-xs text-gray-400 focus:outline-none focus:border-primary/50">
                  <option value="Morning Batch">Morning Batch</option>
                  <option value="Afternoon Batch">Afternoon Batch</option>
                  <option value="Weekend Special">Weekend Special</option>
                </select>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto border border-white/5 rounded-xl divide-y divide-white/5 max-h-[300px]">
              {students.map((student) => {
                const status = attendanceRecords[student._id] || 'present';
                return (
                  <div key={student._id} className="flex justify-between items-center px-4 py-3 hover:bg-white/5 transition">
                    <div>
                      <div className="text-xs font-semibold text-white">{student.name}</div>
                      <div className="text-[10px] text-gray-400 font-mono mt-0.5">{student.rollNumber}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleAttendance(student._id)}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition duration-150 ${
                        status === 'present' 
                          ? 'bg-primary/20 text-primary border border-primary/30' 
                          : 'bg-red-500/20 text-accentRed border border-red-500/30'
                      }`}
                    >
                      {status === 'present' ? <Check size={12} /> : <X size={12} />}
                      {status}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t border-white/5">
              <button type="button" onClick={() => setShowAttendanceModal(false)} className="px-4 py-2 border border-white/5 rounded-lg text-xs font-semibold text-gray-400 hover:text-white transition">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-primary text-darkBg rounded-lg text-xs font-semibold hover:opacity-95 transition">Submit Attendance Logs</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

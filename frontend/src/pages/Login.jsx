import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Mail, Lock, AlertCircle } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotMsg, setShowForgotMsg] = useState('');

  const handlePreFill = (role) => {
    if (role === 'hod') {
      setEmail('admin@lab.edu');
      setPassword('admin123');
    } else if (role === 'staff') {
      setEmail('staff@lab.edu');
      setPassword('staff123');
    } else if (role === 'student') {
      setEmail('student@lab.edu');
      setPassword('student123');
    }
    setError('');
    setShowForgotMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setShowForgotMsg('');
    setLoading(true);

    try {
      const res = await login(email, password);
      if (res.success) {
        navigate('/');
      } else {
        setError(res.message || 'Authentication failed. Verify credentials.');
      }
    } catch (err) {
      setError('Could not establish server authentication handshake.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Provide an email address to request a reset path.');
      return;
    }
    try {
      const res = await fetch('/api/v1/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (data.success) {
        setShowForgotMsg(`Success! Reset token link: ${data.resetLink} (In production, this routes via SMTP email).`);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Could not process request at this moment.');
    }
  };

  return (
    <div className="min-h-screen bg-darkBg text-gray-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Visual background blurs */}
      <div className="absolute top-1/4 left-1/4 w-[30rem] h-[30rem] bg-primary/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[30rem] h-[30rem] bg-secondary/10 rounded-full blur-3xl"></div>

      <div className="w-full max-w-md glass-panel p-8 rounded-2xl shadow-2xl relative z-10 border border-white/10 animate-in fade-in duration-300">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-3">
            <Sparkles size={14} /> AI-Powered Operations
          </div>
          <h2 className="text-3xl font-extrabold font-display bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">LABS</h2>
          <p className="text-xs text-gray-400 mt-1">Laboratory Logistics & Intelligence Suite</p>
        </div>

        {error && (
          <div className="mb-4 bg-accentRed/10 border border-accentRed/20 text-red-400 p-3 rounded-lg flex items-center gap-2 text-xs">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {showForgotMsg && (
          <div className="mb-4 bg-primary/10 border border-primary/20 text-primary p-3 rounded-lg text-xs leading-relaxed">
            {showForgotMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 text-gray-500" size={16} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@institution.edu"
                className="w-full bg-white/5 border border-white/5 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-primary/50 text-white placeholder-gray-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 text-gray-500" size={16} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/5 border border-white/5 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-primary/50 text-white placeholder-gray-600"
              />
            </div>
          </div>

          <div className="text-right">
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-xs text-primary/80 hover:text-primary transition font-medium"
            >
              Forgot Password?
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-gradient-to-r from-primary to-secondary text-darkBg font-bold rounded-lg btn-glow-emerald hover:opacity-95 transition text-sm disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-8 border-t border-white/5 pt-6 text-center">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-3">Fast Demo Login Profiles</p>
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => handlePreFill('hod')}
              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-medium text-gray-300 border border-white/5 hover:border-primary/20 transition"
            >
              HOD
            </button>
            <button
              onClick={() => handlePreFill('staff')}
              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-medium text-gray-300 border border-white/5 hover:border-primary/20 transition"
            >
              Staff
            </button>
            <button
              onClick={() => handlePreFill('student')}
              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-medium text-gray-300 border border-white/5 hover:border-primary/20 transition"
            >
              Student
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

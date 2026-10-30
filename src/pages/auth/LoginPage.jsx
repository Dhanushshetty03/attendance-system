import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Lock, Mail, Eye, EyeOff, ShieldCheck, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function LoginPage() {
  const [email, setEmail] = useState('student.rahul@logisys.edu');
  const [password, setPassword] = useState('Student@123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(email, password);
      if (user.role === 'STUDENT') {
        navigate('/student/dashboard');
      } else if (user.role === 'FACULTY') {
        navigate('/faculty/dashboard');
      } else if (user.role === 'ADMIN') {
        navigate('/admin/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const setDemoCredentials = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-navy-900 to-slate-950 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-12 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/20 dark:border-slate-800 overflow-hidden">
        {/* Left Side: Brand & Visual */}
        <div className="md:col-span-5 bg-gradient-to-br from-navy-900 via-blue-900 to-navy-950 p-8 sm:p-10 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

          <div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <GraduationCap className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold tracking-wider">LOGISYS</h1>
                <p className="text-[11px] text-blue-200 uppercase tracking-widest font-semibold">
                  Academic Portal
                </p>
              </div>
            </div>

            <div className="mt-8 space-y-3">
              <h2 className="text-2xl font-bold leading-tight">
                Smart Attendance Management System
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Recreating the Logisys college attendance workflow with real-time analytics, shortage calculator, and faculty verification.
              </p>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-blue-800/40 space-y-3 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Role-based access (Student, Faculty, Admin)</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Duplicate session prevention & audit logging</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Target attendance calculator with bunk buffer</span>
            </div>
          </div>
        </div>

        {/* Right Side: Login Form & Quick Selectors */}
        <div className="md:col-span-7 p-6 sm:p-10 flex flex-col justify-center">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Portal Sign In</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Enter your credentials or choose a pre-loaded demo account below.
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-center gap-2.5 text-xs text-rose-700 dark:text-rose-300 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Demo Selector Chips */}
          <div className="mb-6">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
              Quick 1-Click Demo Accounts:
            </label>
            <div className="grid grid-cols-2 gap-2 text-left">
              <button
                type="button"
                onClick={() => setDemoCredentials('student.rahul@logisys.edu', 'Student@123')}
                className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-blue-500 hover:bg-blue-50/40 dark:hover:bg-blue-950/30 transition-all text-xs"
              >
                <div className="font-semibold text-slate-800 dark:text-slate-200">Rahul Verma</div>
                <div className="text-[10px] text-emerald-600 font-medium">Student (82% Attendance)</div>
              </button>

              <button
                type="button"
                onClick={() => setDemoCredentials('student.priya@logisys.edu', 'Student@123')}
                className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-rose-500 hover:bg-rose-50/40 dark:hover:bg-rose-950/30 transition-all text-xs"
              >
                <div className="font-semibold text-slate-800 dark:text-slate-200">Priya Nair</div>
                <div className="text-[10px] text-rose-600 font-medium">Student (68% Low Warning)</div>
              </button>

              <button
                type="button"
                onClick={() => setDemoCredentials('faculty.sharma@logisys.edu', 'Faculty@123')}
                className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-indigo-500 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/30 transition-all text-xs"
              >
                <div className="font-semibold text-slate-800 dark:text-slate-200">Dr. Rajesh Sharma</div>
                <div className="text-[10px] text-indigo-600 font-medium">Faculty (HOD CSE)</div>
              </button>

              <button
                type="button"
                onClick={() => setDemoCredentials('admin@logisys.edu', 'Admin@123')}
                className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-purple-500 hover:bg-purple-50/40 dark:hover:bg-purple-950/30 transition-all text-xs"
              >
                <div className="font-semibold text-slate-800 dark:text-slate-200">Chief Registrar</div>
                <div className="text-[10px] text-purple-600 font-medium">Administrator</div>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Official Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student.rahul@logisys.edu"
                  className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition-all duration-150 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Authenticate & Enter Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

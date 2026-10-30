import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  GraduationCap,
  LayoutDashboard,
  CalendarCheck,
  Calculator,
  Calendar,
  FileText,
  UserCheck,
  Users,
  Building2,
  BookOpen,
  ClipboardList,
  ShieldAlert,
  Settings,
  Bell,
  Sun,
  Moon,
  LogOut,
  Menu,
  X,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  Info,
  ExternalLink,
  Database,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';

export function DashboardLayout() {
  const { user, role, logout, switchDemoAccount } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const navigate = useNavigate();
  const location = useLocation();

  // Fetch notifications
  useEffect(() => {
    let isMounted = true;
    async function loadNotifications() {
      try {
        const res = await api.getNotifications();
        if (res.success && isMounted) {
          setNotifications(res.notifications || []);
          setUnreadCount(res.unreadCount || 0);
        }
      } catch (err) {
        // Silently catch
      }
    }
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  // Nav links based on Role
  const studentNav = [
    { name: 'Dashboard', path: '/student/dashboard', icon: LayoutDashboard },
    { name: 'Attendance History', path: '/student/attendance', icon: CalendarCheck },
    { name: 'Attendance Calculator', path: '/student/calculator', icon: Calculator },
    { name: 'My Timetable', path: '/student/timetable', icon: Calendar },
    { name: 'Correction Requests', path: '/student/corrections', icon: ClipboardList },
    { name: 'My Profile', path: '/student/profile', icon: UserCheck },
  ];

  const facultyNav = [
    { name: 'Dashboard', path: '/faculty/dashboard', icon: LayoutDashboard },
    { name: 'Mark Attendance', path: '/faculty/mark', icon: CalendarCheck },
    { name: 'Sessions History', path: '/faculty/sessions', icon: Calendar },
    { name: 'Class Reports', path: '/faculty/reports', icon: FileText },
  ];

  const adminNav = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Database Viewer', path: '/admin/database', icon: Database },
    { name: 'Students', path: '/admin/students', icon: Users },
    { name: 'Faculty', path: '/admin/faculty', icon: UserCheck },
    { name: 'Correction Requests', path: '/admin/corrections', icon: ClipboardList },
    { name: 'Security Audit Logs', path: '/admin/audit-logs', icon: ShieldAlert },
    { name: 'Portal Settings', path: '/admin/settings', icon: Settings },
  ];

  let currentNav = studentNav;
  if (role === 'FACULTY') currentNav = facultyNav;
  if (role === 'ADMIN') currentNav = adminNav;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-navy-900 text-white border-b border-navy-800 shadow-md">
        <div className="flex items-center justify-between px-4 sm:px-6 h-16">
          {/* Left Brand + Sidebar Toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-2 text-slate-300 hover:text-white hover:bg-navy-800 rounded-lg"
              title="Toggle Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center shadow-inner">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <div className="leading-tight">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold tracking-wider text-base sm:text-lg text-white">
                    LOGISYS
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-widest bg-blue-500/30 text-blue-300 px-1.5 py-0.5 rounded border border-blue-400/20">
                    Portal
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 hidden sm:block truncate max-w-[240px]">
                  Smart Attendance System
                </p>
              </div>
            </div>
          </div>

          {/* Quick Demo Role Switcher Bar */}
          <div className="hidden lg:flex items-center gap-1.5 bg-navy-950/70 p-1 rounded-lg border border-navy-800 text-xs">
            <span className="text-slate-400 font-medium px-2">Demo Switch:</span>
            <button
              onClick={() => switchDemoAccount('STUDENT_RAHUL').then(() => navigate('/student/dashboard'))}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                user?.email === 'student.rahul@logisys.edu'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-navy-800'
              }`}
            >
              Student (82%)
            </button>
            <button
              onClick={() => switchDemoAccount('STUDENT_PRIYA').then(() => navigate('/student/dashboard'))}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                user?.email === 'student.priya@logisys.edu'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-navy-800'
              }`}
            >
              Student (68% Low)
            </button>
            <button
              onClick={() => switchDemoAccount('FACULTY_SHARMA').then(() => navigate('/faculty/dashboard'))}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                user?.email === 'faculty.sharma@logisys.edu'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-navy-800'
              }`}
            >
              Faculty (HOD)
            </button>
            <button
              onClick={() => switchDemoAccount('ADMIN').then(() => navigate('/admin/dashboard'))}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                user?.email === 'admin@logisys.edu'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-navy-800'
              }`}
            >
              Administrator
            </button>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 text-slate-300 hover:text-white hover:bg-navy-800 rounded-lg transition-colors"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Notifications Menu */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-2 text-slate-300 hover:text-white hover:bg-navy-800 rounded-lg relative transition-colors"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl py-2 z-50 text-slate-800 dark:text-slate-100 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">Notifications</span>
                      {unreadCount > 0 && (
                        <span className="text-[11px] bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 px-1.5 py-0.2 rounded font-bold">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                    {notifications.length === 0 ? (
                      <div className="py-6 text-center text-xs text-slate-400">
                        No notifications right now
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => {
                            if (!n.isRead) handleMarkAsRead(n.id);
                            if (n.link) {
                              navigate(n.link);
                              setNotificationsOpen(false);
                            }
                          }}
                          className={`p-3 text-xs hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors ${
                            !n.isRead ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''
                          }`}
                        >
                          <div className="flex items-start gap-2.5">
                            {n.type === 'WARNING' ? (
                              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                            ) : n.type === 'SUCCESS' ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                            ) : (
                              <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                            )}
                            <div className="flex-1">
                              <p className="font-semibold text-slate-900 dark:text-white">
                                {n.title}
                              </p>
                              <p className="text-slate-600 dark:text-slate-400 mt-0.5">
                                {n.message}
                              </p>
                              <p className="text-[10px] text-slate-400 mt-1">
                                {new Date(n.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            {!n.isRead && (
                              <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-1" />
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-navy-800 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shadow">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <div className="text-left hidden md:block leading-tight">
                  <p className="text-xs font-semibold text-white truncate max-w-[120px]">
                    {user?.name}
                  </p>
                  <p className="text-[10px] text-slate-400 capitalize">{role?.toLowerCase()}</p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl py-2 z-50 text-slate-800 dark:text-slate-100">
                  <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {user?.name}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                    <span className="mt-1 inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 uppercase">
                      {role}
                    </span>
                  </div>

                  {role === 'STUDENT' && (
                    <NavLink
                      to="/student/profile"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                    >
                      <UserCheck className="w-4 h-4 text-slate-400" />
                      View Profile
                    </NavLink>
                  )}

                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main App Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-30 pt-16 md:pt-0 md:static md:translate-x-0 transition-transform duration-200 ease-in-out bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col ${
            sidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'
          } ${sidebarCollapsed ? 'md:w-20' : 'md:w-64'}`}
        >
          {/* Term Header */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className={`${sidebarCollapsed ? 'md:hidden' : 'block'}`}>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Academic Session
              </p>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Odd Semester 2026-27
              </p>
            </div>
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden md:block p-1 text-slate-400 hover:text-slate-600 rounded"
              title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {sidebarCollapsed ? '→' : '←'}
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
            {currentNav.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title={sidebarCollapsed ? item.name : undefined}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className={`${sidebarCollapsed ? 'md:hidden' : 'block'} truncate`}>
                    {item.name}
                  </span>
                </NavLink>
              );
            })}
          </nav>

          {/* Institution Footer */}
          <div className="p-3 border-t border-slate-100 dark:border-slate-800">
            <div
              className={`bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-800 ${
                sidebarCollapsed ? 'md:hidden' : 'block'
              }`}
            >
              <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200">NIET Portal</p>
              <p className="text-[10px] text-slate-500">Logisys Engine v2.4</p>
            </div>
          </div>
        </aside>

        {/* Backdrop for mobile sidebar */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-20 md:hidden"
          />
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

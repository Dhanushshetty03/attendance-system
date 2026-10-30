import React, { useEffect, useState } from 'react';
import { Settings, Bell, Shield, CheckCircle2, Save, Send } from 'lucide-react';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import api from '../../services/api';

export function AdminSettingsPage() {
  const [settings, setSettings] = useState({
    min_attendance_threshold: '75',
    critical_attendance_threshold: '65',
    institution_name: 'National Institute of Engineering & Technology (NIET)',
    attendance_edit_window_hours: '72',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');

  // Broadcast announcement
  const [announceTitle, setAnnounceTitle] = useState('');
  const [announceMessage, setAnnounceMessage] = useState('');
  const [targetRole, setTargetRole] = useState('ALL');
  const [announceType, setAnnounceType] = useState('INFO');
  const [sendingAnnounce, setSendingAnnounce] = useState(false);
  const [announceSuccess, setAnnounceSuccess] = useState('');

  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        const res = await api.getSystemSettings();
        if (res.success && res.settings) {
          setSettings((prev) => ({
            ...prev,
            ...res.settings,
          }));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setSaveSuccess('');
      const res = await api.updateSystemSettings(settings);
      if (res.success) {
        setSaveSuccess('Portal configurations updated successfully.');
      }
    } catch (err) {
      alert(err.message || 'Failed to update system settings');
    } finally {
      setSaving(false);
    }
  };

  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!announceTitle || !announceMessage) return;

    try {
      setSendingAnnounce(true);
      setAnnounceSuccess('');
      const res = await api.broadcastAnnouncement({
        title: announceTitle,
        message: announceMessage,
        targetRole,
        type: announceType,
      });

      if (res.success) {
        setAnnounceSuccess(res.message || 'Announcement broadcasted successfully.');
        setAnnounceTitle('');
        setAnnounceMessage('');
      }
    } catch (err) {
      alert(err.message || 'Broadcast failed');
    } finally {
      setSendingAnnounce(false);
    }
  };

  if (loading) {
    return <LoadingSkeleton lines={6} />;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-600" />
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            System Settings & Academic Thresholds
          </h1>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Configure institutional attendance eligibility thresholds, edit window timeframes, and campus broadcast announcements.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Attendance Thresholds & Config */}
        <div className="md:col-span-7 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Institutional Regulations & Thresholds
            </h3>
            <p className="text-xs text-slate-500">
              Thresholds govern automated warning banners, exam eligibility, and student calculators.
            </p>
          </div>

          {saveSuccess && (
            <div className="p-3 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{saveSuccess}</span>
            </div>
          )}

          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                College / Institution Display Name
              </label>
              <input
                type="text"
                required
                value={settings.institution_name}
                onChange={(e) => setSettings({ ...settings, institution_name: e.target.value })}
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Mandatory Minimum Threshold (%)
                </label>
                <input
                  type="number"
                  min="50"
                  max="100"
                  value={settings.min_attendance_threshold}
                  onChange={(e) =>
                    setSettings({ ...settings, min_attendance_threshold: e.target.value })
                  }
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Standard: 75%</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Critical Shortage Threshold (%)
                </label>
                <input
                  type="number"
                  min="40"
                  max="80"
                  value={settings.critical_attendance_threshold}
                  onChange={(e) =>
                    setSettings({ ...settings, critical_attendance_threshold: e.target.value })
                  }
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Standard: 65%</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Faculty Attendance Edit Window (Hours)
              </label>
              <input
                type="number"
                min="12"
                max="168"
                value={settings.attendance_edit_window_hours}
                onChange={(e) =>
                  setSettings({ ...settings, attendance_edit_window_hours: e.target.value })
                }
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Time within which faculty can revise submitted marks without dean approval.
              </span>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors shadow-xs disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
            </button>
          </form>
        </div>

        {/* Broadcast Announcement */}
        <div className="md:col-span-5 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Bell className="w-4 h-4 text-blue-600" />
              <span>Broadcast Notice</span>
            </h3>
            <p className="text-xs text-slate-500">
              Transmit an in-app announcement to all enrolled students and faculty.
            </p>
          </div>

          {announceSuccess && (
            <div className="p-3 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-xl">
              {announceSuccess}
            </div>
          )}

          <form onSubmit={handleBroadcast} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Notice Title
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Mid-Term Attendance Shortage Warning"
                value={announceTitle}
                onChange={(e) => setAnnounceTitle(e.target.value)}
                className="w-full p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Recipient Group
                </label>
                <select
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="w-full p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">All Users</option>
                  <option value="STUDENT">Students Only</option>
                  <option value="FACULTY">Faculty Only</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Priority Type
                </label>
                <select
                  value={announceType}
                  onChange={(e) => setAnnounceType(e.target.value)}
                  className="w-full p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="INFO">Information</option>
                  <option value="WARNING">Warning / Alert</option>
                  <option value="SUCCESS">Success Notice</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Announcement Body
              </label>
              <textarea
                required
                rows={3}
                placeholder="Details of the announcement..."
                value={announceMessage}
                onChange={(e) => setAnnounceMessage(e.target.value)}
                className="w-full p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={sendingAnnounce}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{sendingAnnounce ? 'Sending...' : 'Transmit Broadcast'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

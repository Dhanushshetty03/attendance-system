import React, { useState } from 'react';
import { UserCheck, Shield, Phone, Mail, Award, Lock, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export function StudentProfilePage() {
  const { user, refreshUser } = useAuth();
  const profile = user?.studentProfile;

  const [contactNo, setContactNo] = useState(profile?.contactNo || '');
  const [guardianName, setGuardianName] = useState(profile?.guardianName || '');
  const [guardianContact, setGuardianContact] = useState(profile?.guardianContact || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');

  // Password change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState({ text: '', isError: false });

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      setProfileSuccess('');
      const res = await api.updateProfile({ contactNo, guardianName, guardianContact });
      if (res.success) {
        setProfileSuccess('Profile details updated successfully.');
        refreshUser();
      }
    } catch (err) {
      alert(err.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    try {
      setSavingPassword(true);
      setPasswordMsg({ text: '', isError: false });
      const res = await api.changePassword({ currentPassword, newPassword });
      if (res.success) {
        setPasswordMsg({ text: 'Password updated successfully.', isError: false });
        setCurrentPassword('');
        setNewPassword('');
      }
    } catch (err) {
      setPasswordMsg({ text: err.message || 'Password update failed', isError: true });
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Profile Card */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center sm:items-start gap-6">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
          {user?.name?.charAt(0) || 'S'}
        </div>

        <div className="flex-1 text-center sm:text-left space-y-1">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              {user?.name}
            </h1>
            <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
              USN: {profile?.usn}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {profile?.department?.name || 'Computer Science & Engineering'} • Semester {profile?.semester} ({profile?.section})
          </p>
          <p className="text-xs text-slate-500">{user?.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Editable Personal & Guardian Contact Details */}
        <div className="md:col-span-7 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Contact & Emergency Information
            </h3>
            <p className="text-xs text-slate-500">
              Keep your contact and guardian details updated for critical attendance alerts.
            </p>
          </div>

          {profileSuccess && (
            <div className="p-3 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{profileSuccess}</span>
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Student Contact Number
              </label>
              <input
                type="text"
                value={contactNo}
                onChange={(e) => setContactNo(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Parent / Guardian Name
              </label>
              <input
                type="text"
                value={guardianName}
                onChange={(e) => setGuardianName(e.target.value)}
                placeholder="Guardian Full Name"
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Guardian Emergency Contact
              </label>
              <input
                type="text"
                value={guardianContact}
                onChange={(e) => setGuardianContact(e.target.value)}
                placeholder="+91 98765 00000"
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs shadow-xs transition-colors disabled:opacity-50"
            >
              {savingProfile ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </form>
        </div>

        {/* Security & Password */}
        <div className="md:col-span-5 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Security Credentials
            </h3>
            <p className="text-xs text-slate-500">Update your Logisys portal password</p>
          </div>

          {passwordMsg.text && (
            <div
              className={`p-3 text-xs font-semibold rounded-xl ${
                passwordMsg.isError
                  ? 'bg-rose-50 text-rose-700'
                  : 'bg-emerald-50 text-emerald-700'
              }`}
            >
              {passwordMsg.text}
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Current Password
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                New Password (min 6 characters)
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={savingPassword}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-semibold rounded-xl text-xs transition-colors disabled:opacity-50"
            >
              {savingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

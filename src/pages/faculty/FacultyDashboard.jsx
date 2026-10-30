import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  BookOpen,
  CalendarCheck,
  Clock,
  Calendar,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { StatCard } from '../../components/common/StatCard';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import api from '../../services/api';

export function FacultyDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    async function fetchDashboard() {
      try {
        setLoading(true);
        const res = await api.getFacultyDashboard();
        if (res.success) {
          setData(res.data);
        }
      } catch (err) {
        setError(err.message || 'Failed to load faculty dashboard');
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  if (loading) {
    return <LoadingSkeleton lines={6} />;
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center text-rose-600 bg-rose-50 dark:bg-rose-950/30 rounded-2xl">
        <p className="font-semibold">{error || 'Unable to load faculty dashboard'}</p>
      </div>
    );
  }

  const { faculty, summary, assignedClasses, todaySchedule, recentSessions } = data;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              Welcome, {faculty.name}
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-md font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
              {faculty.employeeId}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {faculty.designation} • {faculty.department}
          </p>
        </div>

        <button
          onClick={() => navigate('/faculty/mark')}
          className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors shrink-0"
        >
          <CalendarCheck className="w-4 h-4" />
          <span>Mark Class Attendance</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Assigned Courses"
          value={summary.assignedSubjectsCount}
          variant="blue"
          icon={BookOpen}
          subtext="Active semester sections"
        />
        <StatCard
          title="Total Students"
          value={summary.totalEnrolledStudents}
          variant="green"
          icon={Users}
          subtext="Enrolled across sections"
        />
        <StatCard
          title="Sessions Conducted"
          value={summary.totalSessionsConducted}
          variant="purple"
          icon={CalendarCheck}
          subtext="Locked in database"
        />
        <StatCard
          title="Today's Classes"
          value={summary.todayClassesCount}
          variant="amber"
          icon={Clock}
          subtext="Scheduled time slots"
        />
      </div>

      {/* Today's Schedule & Quick Mark */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Today's Teaching Schedule
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
          </span>
        </div>

        {todaySchedule.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">
            No lectures scheduled for today. Enjoy your day or review past attendance records!
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {todaySchedule.map((slot) => (
              <div
                key={slot.id}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                      {slot.subjectCode}
                    </span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                      {slot.startTime} - {slot.endTime}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-1">
                    {slot.subjectName}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Section {slot.sectionName} • Room {slot.roomNumber}
                  </p>
                </div>

                <button
                  onClick={() =>
                    navigate(
                      `/faculty/mark?subjectId=${slot.subjectId}&sectionId=${slot.sectionId}&timeSlot=${encodeURIComponent(
                        `${slot.startTime} - ${slot.endTime}`
                      )}`
                    )
                  }
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <CalendarCheck className="w-3.5 h-3.5" />
                  <span>Mark This Attendance</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Assigned Classes Grid & Recent Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Assigned Classes */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-5">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
            Assigned Courses & Sections
          </h3>
          <div className="space-y-2.5">
            {assignedClasses.map((cls) => (
              <div
                key={cls.assignmentId}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">
                      {cls.subjectCode}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-semibold">
                      Sec {cls.sectionName}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate max-w-xs">{cls.subjectName}</p>
                </div>
                <button
                  onClick={() =>
                    navigate(`/faculty/mark?subjectId=${cls.subjectId}&sectionId=${cls.sectionId}`)
                  }
                  className="text-xs text-blue-600 font-semibold hover:underline"
                >
                  Mark
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Sessions Conducted */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Recent Attendance Submissions
            </h3>
            <button
              onClick={() => navigate('/faculty/sessions')}
              className="text-xs text-blue-600 hover:underline font-medium"
            >
              All Sessions
            </button>
          </div>

          <div className="space-y-2.5">
            {recentSessions.map((sess) => (
              <div
                key={sess.id}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">
                      {sess.subjectCode}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(sess.date).toLocaleDateString()} ({sess.timeSlot})
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate max-w-xs">{sess.topicCovered || 'Regular Class'}</p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-xs font-black text-slate-900 dark:text-white">
                      {sess.presentCount} / {sess.totalStudents}
                    </span>
                    <p className="text-[10px] text-slate-400">{sess.percentage}% present</p>
                  </div>

                  <button
                    onClick={() => navigate(`/faculty/sessions?viewSession=${sess.id}`)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-200 dark:hover:bg-slate-700"
                    title="View Roster"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

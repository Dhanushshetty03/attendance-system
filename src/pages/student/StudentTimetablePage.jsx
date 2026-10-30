import React, { useEffect, useState } from 'react';
import { Calendar, Clock, MapPin, User } from 'lucide-react';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import api from '../../services/api';

export function StudentTimetablePage() {
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTimetable() {
      try {
        setLoading(true);
        const res = await api.getStudentTimetable();
        if (res.success) {
          setTimetable(res.timetable || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchTimetable();
  }, []);

  if (loading) {
    return <LoadingSkeleton lines={6} />;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Semester Class Timetable
          </h1>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Weekly schedule of classes, laboratory sessions, room allocations, and course instructors.
        </p>
      </div>

      {/* Timetable Days Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {timetable.map((dayGroup) => (
          <div
            key={dayGroup.day}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden flex flex-col"
          >
            {/* Day Header */}
            <div className="bg-slate-900 text-white px-5 py-3 flex items-center justify-between">
              <span className="font-extrabold text-xs tracking-wider uppercase">
                {dayGroup.day}
              </span>
              <span className="text-[11px] text-slate-300 font-medium">
                {dayGroup.classes.length} Sessions
              </span>
            </div>

            {/* Classes List */}
            <div className="p-4 space-y-3 flex-1">
              {dayGroup.classes.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">
                  No classes scheduled
                </p>
              ) : (
                dayGroup.classes.map((cls) => (
                  <div
                    key={cls.id}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-2 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                        {cls.subjectCode}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                        <Clock className="w-3 h-3" />
                        {cls.startTime} - {cls.endTime}
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">
                      {cls.subjectName}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200/40 dark:border-slate-700/40">
                      <div className="flex items-center gap-1 truncate max-w-[150px]">
                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{cls.facultyName}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{cls.roomNumber}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

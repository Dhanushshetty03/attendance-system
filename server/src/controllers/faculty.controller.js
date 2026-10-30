import prisma from '../prisma.js';
import { calculateAttendancePercentage } from '../utils/calculator.js';
import { markAttendanceSchema, updateAttendanceSchema } from '../validators/attendance.validator.js';
import { recordAuditLog } from '../utils/audit.js';
import { evaluateStudentAttendanceAlerts, notifyAbsences } from '../services/notification.service.js';

export async function getDashboard(req, res, next) {
  try {
    const facultyProfile = req.user.facultyProfile;
    if (!facultyProfile) {
      return res.status(404).json({ success: false, message: 'Faculty profile not found.' });
    }

    // Assigned subjects and sections
    const assignments = await prisma.facultyAssignment.findMany({
      where: { facultyId: facultyProfile.id },
      include: {
        subject: true,
        section: true,
        academicTerm: true,
      },
    });

    const subjectIds = assignments.map((a) => a.subjectId);

    // Total distinct enrolled students across assigned subjects
    const enrollments = await prisma.enrollment.findMany({
      where: {
        subjectId: { in: subjectIds },
        isActive: true,
      },
      select: { studentId: true },
    });
    const uniqueStudentIds = new Set(enrollments.map((e) => e.studentId));

    // Sessions conducted by this faculty
    const sessions = await prisma.classSession.findMany({
      where: { facultyId: facultyProfile.id },
      include: {
        subject: true,
        section: true,
        attendanceRecords: true,
      },
      orderBy: { date: 'desc' },
    });

    // Today's schedule
    const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const currentDay = days[new Date().getDay()];

    const todayTimetable = await prisma.timetable.findMany({
      where: {
        facultyId: facultyProfile.id,
        dayOfWeek: currentDay === 'SUNDAY' ? 'MONDAY' : currentDay,
      },
      include: {
        subject: true,
        section: true,
      },
      orderBy: { startTime: 'asc' },
    });

    // Recent 10 conducted sessions
    const recentSessions = sessions.slice(0, 10).map((s) => {
      const total = s.attendanceRecords.length;
      const present = s.attendanceRecords.filter((r) => r.status === 'PRESENT').length;
      return {
        id: s.id,
        subjectId: s.subjectId,
        subjectCode: s.subject.code,
        subjectName: s.subject.name,
        section: s.section.name,
        date: s.date,
        timeSlot: s.timeSlot,
        topicCovered: s.topicCovered,
        totalStudents: total,
        presentCount: present,
        percentage: calculateAttendancePercentage(present, total),
        isLocked: s.isLocked,
        createdAt: s.createdAt,
      };
    });

    res.json({
      success: true,
      data: {
        faculty: {
          id: facultyProfile.id,
          name: req.user.name,
          employeeId: facultyProfile.employeeId,
          department: facultyProfile.department.name,
          designation: facultyProfile.designation,
        },
        summary: {
          assignedSubjectsCount: assignments.length,
          totalEnrolledStudents: uniqueStudentIds.size,
          totalSessionsConducted: sessions.length,
          todayClassesCount: todayTimetable.length,
        },
        assignedClasses: assignments.map((a) => ({
          assignmentId: a.id,
          subjectId: a.subject.id,
          subjectCode: a.subject.code,
          subjectName: a.subject.name,
          credits: a.subject.credits,
          sectionId: a.section.id,
          sectionName: a.section.name,
        })),
        todaySchedule: todayTimetable.map((t) => ({
          id: t.id,
          subjectId: t.subject.id,
          subjectCode: t.subject.code,
          subjectName: t.subject.name,
          sectionId: t.section.id,
          sectionName: t.section.name,
          startTime: t.startTime,
          endTime: t.endTime,
          roomNumber: t.roomNumber,
        })),
        recentSessions,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getFacultyTimetable(req, res, next) {
  try {
    const facultyProfile = req.user.facultyProfile;
    if (!facultyProfile) {
      return res.status(404).json({ success: false, message: 'Faculty profile not found.' });
    }

    const entries = await prisma.timetable.findMany({
      where: { facultyId: facultyProfile.id },
      include: {
        subject: true,
        section: true,
      },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });

    const daysOrder = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const grouped = daysOrder.map((day) => ({
      day,
      classes: entries
        .filter((e) => e.dayOfWeek === day)
        .map((e) => ({
          id: e.id,
          startTime: e.startTime,
          endTime: e.endTime,
          roomNumber: e.roomNumber,
          subjectCode: e.subject.code,
          subjectName: e.subject.name,
          sectionName: e.section.name,
        })),
    }));

    res.json({
      success: true,
      timetable: grouped,
    });
  } catch (error) {
    next(error);
  }
}

export async function getEnrolledStudents(req, res, next) {
  try {
    const { subjectId, sectionId } = req.query;

    if (!subjectId || !sectionId) {
      return res.status(400).json({ success: false, message: 'subjectId and sectionId are required' });
    }

    const section = await prisma.section.findUnique({
      where: { id: sectionId },
    });

    if (!section) {
      return res.status(404).json({ success: false, message: 'Section not found' });
    }

    // Find students enrolled in this subject and in this section
    const enrollments = await prisma.enrollment.findMany({
      where: {
        subjectId,
        isActive: true,
        student: {
          section: section.name,
        },
      },
      include: {
        student: {
          include: {
            user: { select: { id: true, name: true, email: true, avatar: true } },
          },
        },
      },
      orderBy: {
        student: { rollNo: 'asc' },
      },
    });

    // Calculate each student's current attendance in this subject
    const studentStats = await Promise.all(
      enrollments.map(async (e) => {
        const student = e.student;
        const records = await prisma.attendanceRecord.findMany({
          where: {
            studentId: student.id,
            session: { subjectId },
          },
        });

        const conducted = records.length;
        const attended = records.filter((r) => r.status === 'PRESENT').length;
        const percentage = calculateAttendancePercentage(attended, conducted);

        return {
          id: student.id,
          userId: student.user.id,
          name: student.user.name,
          email: student.user.email,
          usn: student.usn,
          rollNo: student.rollNo,
          avatar: student.user.avatar,
          currentAttendance: {
            conducted,
            attended,
            percentage,
            isLow: percentage < 75 && conducted > 0,
          },
        };
      })
    );

    res.json({
      success: true,
      students: studentStats,
      count: studentStats.length,
    });
  } catch (error) {
    next(error);
  }
}

export async function markAttendance(req, res, next) {
  try {
    const facultyProfile = req.user.facultyProfile;
    if (!facultyProfile && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Only faculty members or administrators can mark attendance.' });
    }

    const facultyId = facultyProfile ? facultyProfile.id : (await prisma.facultyProfile.findFirst()).id;
    const validated = markAttendanceSchema.parse(req.body);
    const sessionDate = new Date(validated.date);

    // 1. Authorization check: Is faculty assigned to this subject & section?
    if (req.user.role !== 'ADMIN') {
      const assignment = await prisma.facultyAssignment.findFirst({
        where: {
          facultyId: facultyProfile.id,
          subjectId: validated.subjectId,
          sectionId: validated.sectionId,
        },
      });

      if (!assignment) {
        return res.status(403).json({
          success: false,
          message: 'You are not assigned to teach this subject and section.',
        });
      }
    }

    // 2. Duplicate Session Prevention check:
    const existingSession = await prisma.classSession.findUnique({
      where: {
        subjectId_sectionId_date_timeSlot: {
          subjectId: validated.subjectId,
          sectionId: validated.sectionId,
          date: sessionDate,
          timeSlot: validated.timeSlot,
        },
      },
    });

    if (existingSession) {
      return res.status(409).json({
        success: false,
        message: `Attendance has already been submitted for this session (${validated.date} at ${validated.timeSlot}). Duplicate submission is prevented. Use the Edit Attendance feature if corrections are needed.`,
      });
    }

    // 3. Database transaction: create session and attendance records together
    const result = await prisma.$transaction(async (tx) => {
      const session = await tx.classSession.create({
        data: {
          subjectId: validated.subjectId,
          sectionId: validated.sectionId,
          facultyId,
          date: sessionDate,
          timeSlot: validated.timeSlot,
          topicCovered: validated.topicCovered || null,
          sessionType: validated.sessionType,
          isLocked: true,
          lockedAt: new Date(),
        },
      });

      const recordsData = validated.records.map((r) => ({
        sessionId: session.id,
        studentId: r.studentId,
        status: r.status,
        remarks: r.remarks || null,
        markedById: req.user.id,
      }));

      await tx.attendanceRecord.createMany({
        data: recordsData,
      });

      await recordAuditLog(tx, {
        userId: req.user.id,
        action: 'ATTENDANCE_SUBMITTED',
        entity: 'ClassSession',
        entityId: session.id,
        details: `Submitted and locked attendance for ${validated.records.length} students on ${validated.date} (${validated.timeSlot}). Topic: ${validated.topicCovered || 'N/A'}`,
        req,
      });

      return session;
    });

    // Counts for immediate feedback
    const presentCount = validated.records.filter((r) => r.status === 'PRESENT').length;
    const absentCount = validated.records.filter((r) => r.status === 'ABSENT').length;
    const leaveCount = validated.records.filter((r) => r.status === 'LEAVE').length;

    // Asynchronously trigger automated student notifications & shortage warnings
    const absentStudentIds = validated.records.filter((r) => r.status === 'ABSENT').map((r) => r.studentId);
    notifyAbsences(result.id, absentStudentIds).catch(console.error);

    for (const rec of validated.records) {
      evaluateStudentAttendanceAlerts(rec.studentId, validated.subjectId).catch(console.error);
    }

    res.status(201).json({
      success: true,
      message: 'Attendance marked, validated, and locked successfully.',
      session: result,
      summary: {
        totalEvaluated: validated.records.length,
        presentCount,
        absentCount,
        leaveCount,
        attendancePercentage: calculateAttendancePercentage(presentCount, validated.records.length),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getSessionAttendance(req, res, next) {
  try {
    const { sessionId } = req.params;

    const session = await prisma.classSession.findUnique({
      where: { id: sessionId },
      include: {
        subject: true,
        section: true,
        faculty: { include: { user: true } },
        attendanceRecords: {
          include: {
            student: {
              include: { user: true },
            },
          },
          orderBy: {
            student: { rollNo: 'asc' },
          },
        },
      },
    });

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    // Check edit window (e.g. 72 hours from session creation)
    const settings = await prisma.systemSetting.findUnique({
      where: { key: 'attendance_edit_window_hours' },
    });
    const editWindowHours = settings ? parseInt(settings.value) : 72;
    const sessionTime = new Date(session.createdAt).getTime();
    const nowTime = Date.now();
    const isWithinEditWindow = (nowTime - sessionTime) / (1000 * 60 * 60) <= editWindowHours;

    res.json({
      success: true,
      session: {
        id: session.id,
        subjectId: session.subjectId,
        subjectCode: session.subject.code,
        subjectName: session.subject.name,
        sectionId: session.sectionId,
        sectionName: session.section.name,
        facultyName: session.faculty.user.name,
        date: session.date,
        timeSlot: session.timeSlot,
        topicCovered: session.topicCovered,
        sessionType: session.sessionType,
        isLocked: session.isLocked,
        createdAt: session.createdAt,
        isEditable: req.user.role === 'ADMIN' || isWithinEditWindow,
        editWindowHours,
      },
      records: session.attendanceRecords.map((r) => ({
        id: r.id,
        studentId: r.studentId,
        studentName: r.student.user.name,
        usn: r.student.usn,
        rollNo: r.student.rollNo,
        status: r.status,
        remarks: r.remarks,
      })),
    });
  } catch (error) {
    next(error);
  }
}

export async function updateSessionAttendance(req, res, next) {
  try {
    const { sessionId } = req.params;
    const validated = updateAttendanceSchema.parse(req.body);

    const session = await prisma.classSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return res.status(404).json({ success: false, message: 'Class session not found.' });
    }

    // Check time window unless Admin
    if (req.user.role !== 'ADMIN') {
      const settings = await prisma.systemSetting.findUnique({
        where: { key: 'attendance_edit_window_hours' },
      });
      const editWindowHours = settings ? parseInt(settings.value) : 72;
      const elapsedHours = (Date.now() - new Date(session.createdAt).getTime()) / (1000 * 60 * 60);

      if (elapsedHours > editWindowHours) {
        return res.status(403).json({
          success: false,
          message: `The authorized attendance edit window of ${editWindowHours} hours has elapsed. Only an Administrator can make retroactive modifications.`,
        });
      }
    }

    // Update records within transaction and log audit
    await prisma.$transaction(async (tx) => {
      for (const rec of validated.records) {
        await tx.attendanceRecord.update({
          where: { id: rec.recordId },
          data: {
            status: rec.status,
            remarks: rec.remarks || null,
          },
        });
      }

      await recordAuditLog(tx, {
        userId: req.user.id,
        action: 'ATTENDANCE_MODIFIED',
        entity: 'ClassSession',
        entityId: session.id,
        details: `Modified attendance for ${validated.records.length} records in ${session.id}. Reason: ${validated.auditReason}`,
        req,
      });
    });

    res.json({
      success: true,
      message: 'Attendance records updated and audited successfully.',
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteClassSession(req, res, next) {
  try {
    const { sessionId } = req.params;
    const { reason } = req.body;

    const session = await prisma.classSession.findUnique({
      where: { id: sessionId },
      include: { subject: true, section: true },
    });

    if (!session) {
      return res.status(404).json({ success: false, message: 'Class session not found.' });
    }

    // Check authorization: faculty who owns it (within 72h) or Admin
    if (req.user.role !== 'ADMIN') {
      if (session.facultyId !== req.user.facultyProfile?.id) {
        return res.status(403).json({ success: false, message: 'Unauthorized to delete this session.' });
      }

      const settings = await prisma.systemSetting.findUnique({ where: { key: 'attendance_edit_window_hours' } });
      const editWindowHours = settings ? parseInt(settings.value) : 72;
      const elapsedHours = (Date.now() - new Date(session.createdAt).getTime()) / (1000 * 60 * 60);

      if (elapsedHours > editWindowHours) {
        return res.status(403).json({
          success: false,
          message: `The authorized edit window of ${editWindowHours} hours has elapsed. Only an Administrator can cancel locked sessions.`,
        });
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.attendanceRecord.deleteMany({ where: { sessionId } });
      await tx.classSession.delete({ where: { id: sessionId } });

      await recordAuditLog(tx, {
        userId: req.user.id,
        action: 'SESSION_CANCELLED',
        entity: 'ClassSession',
        entityId: sessionId,
        details: `Cancelled and removed session for ${session.subject.code} (${new Date(session.date).toLocaleDateString()}). Reason: ${reason || 'Mistake / Rescheduled'}`,
        req,
      });
    });

    res.json({
      success: true,
      message: 'Class session and related attendance records removed successfully.',
    });
  } catch (error) {
    next(error);
  }
}

export async function getFacultyReports(req, res, next) {
  try {
    const facultyProfile = req.user.facultyProfile;
    const { subjectId, sectionId } = req.query;

    const whereClause = {
      ...(facultyProfile ? { facultyId: facultyProfile.id } : {}),
    };
    if (subjectId) whereClause.subjectId = subjectId;
    if (sectionId) whereClause.sectionId = sectionId;

    const sessions = await prisma.classSession.findMany({
      where: whereClause,
      include: {
        subject: true,
        section: true,
        attendanceRecords: {
          include: {
            student: {
              include: { user: true },
            },
          },
        },
      },
      orderBy: { date: 'asc' },
    });

    // Compile student attendance summary
    const studentAggregates = new Map();

    sessions.forEach((s) => {
      s.attendanceRecords.forEach((r) => {
        const sid = r.studentId;
        if (!studentAggregates.has(sid)) {
          studentAggregates.set(sid, {
            studentId: sid,
            name: r.student.user.name,
            usn: r.student.usn,
            rollNo: r.student.rollNo,
            conducted: 0,
            attended: 0,
            absent: 0,
            leave: 0,
          });
        }
        const st = studentAggregates.get(sid);
        st.conducted++;
        if (r.status === 'PRESENT') st.attended++;
        else if (r.status === 'ABSENT') st.absent++;
        else if (r.status === 'LEAVE') st.leave++;
      });
    });

    const studentList = Array.from(studentAggregates.values()).map((st) => {
      const percentage = calculateAttendancePercentage(st.attended, st.conducted);
      return {
        ...st,
        percentage,
        isBelowThreshold: percentage < 75,
      };
    });

    // Sort by roll number
    studentList.sort((a, b) => (a.rollNo || '').localeCompare(b.rollNo || ''));

    const totalConducted = sessions.length;
    const lowAttendanceStudents = studentList.filter((s) => s.isBelowThreshold);

    res.json({
      success: true,
      report: {
        totalSessions: totalConducted,
        totalStudentsEnrolled: studentList.length,
        averageAttendancePercentage: studentList.length
          ? Math.round(
              (studentList.reduce((acc, curr) => acc + curr.percentage, 0) / studentList.length) * 100
            ) / 100
          : 0,
        lowAttendanceCount: lowAttendanceStudents.length,
        students: studentList,
        lowAttendanceStudents,
      },
    });
  } catch (error) {
    next(error);
  }
}

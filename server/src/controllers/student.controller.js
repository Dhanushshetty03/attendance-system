import prisma from '../prisma.js';
import {
  calculateAttendancePercentage,
  calculateAttendanceStatus,
  calculateTargetClassesNeeded,
} from '../utils/calculator.js';
import { correctionRequestSchema, targetCalculationSchema } from '../validators/attendance.validator.js';

export async function getDashboard(req, res, next) {
  try {
    const studentProfile = req.user.studentProfile;
    if (!studentProfile) {
      return res.status(404).json({ success: false, message: 'Student profile not linked to user account.' });
    }

    // Fetch system settings for thresholds
    const settings = await prisma.systemSetting.findMany();
    const minThresholdSetting = settings.find((s) => s.key === 'min_attendance_threshold');
    const threshold = minThresholdSetting ? parseFloat(minThresholdSetting.value) : 75;

    // Get active enrollments with subject details and faculty assignment
    const enrollments = await prisma.enrollment.findMany({
      where: {
        studentId: studentProfile.id,
        isActive: true,
      },
      include: {
        subject: {
          include: {
            facultyAssignments: {
              where: { section: { name: studentProfile.section } },
              include: {
                faculty: {
                  include: { user: true },
                },
              },
            },
          },
        },
      },
    });

    const subjectIds = enrollments.map((e) => e.subjectId);

    // Get all attendance records for this student
    const attendanceRecords = await prisma.attendanceRecord.findMany({
      where: {
        studentId: studentProfile.id,
        session: {
          subjectId: { in: subjectIds },
        },
      },
      include: {
        session: {
          include: {
            subject: true,
          },
        },
      },
      orderBy: {
        session: {
          date: 'desc',
        },
      },
    });

    // Subject-wise grouping
    let totalConducted = 0;
    let totalAttended = 0;
    let totalMissed = 0;
    let totalLeave = 0;

    const subjectStats = enrollments.map((enrollment) => {
      const sub = enrollment.subject;
      const records = attendanceRecords.filter((r) => r.session.subjectId === sub.id);
      const conducted = records.length;
      const attended = records.filter((r) => r.status === 'PRESENT').length;
      const missed = records.filter((r) => r.status === 'ABSENT').length;
      const leave = records.filter((r) => r.status === 'LEAVE').length;

      totalConducted += conducted;
      totalAttended += attended;
      totalMissed += missed;
      totalLeave += leave;

      const percentage = calculateAttendancePercentage(attended, conducted);
      const status = calculateAttendanceStatus(percentage, threshold, 65);
      const targetCalculation = calculateTargetClassesNeeded(attended, conducted, threshold / 100);

      // Find faculty teaching this subject
      const faculty = sub.facultyAssignments[0]?.faculty?.user?.name || 'Faculty Assigned';

      return {
        subjectId: sub.id,
        code: sub.code,
        name: sub.name,
        credits: sub.credits,
        type: sub.subjectType,
        faculty,
        conducted,
        attended,
        missed,
        leave,
        percentage,
        status, // 'GOOD', 'LOW', 'CRITICAL'
        isBelowThreshold: percentage < threshold,
        classesNeeded: targetCalculation.classesNeeded,
        classesCanMiss: targetCalculation.classesCanMiss,
        advice: targetCalculation.message,
      };
    });

    const overallPercentage = calculateAttendancePercentage(totalAttended, totalConducted);
    const lowAttendanceCount = subjectStats.filter((s) => s.isBelowThreshold).length;

    // Trend chart data: aggregate weekly/daily
    // Sort records chronologically
    const chronologicalRecords = [...attendanceRecords].reverse();
    const trendMap = new Map();

    let runningAttended = 0;
    let runningConducted = 0;

    chronologicalRecords.forEach((rec) => {
      const dateKey = new Date(rec.session.date).toISOString().split('T')[0];
      runningConducted++;
      if (rec.status === 'PRESENT') runningAttended++;

      trendMap.set(dateKey, {
        date: dateKey,
        percentage: calculateAttendancePercentage(runningAttended, runningConducted),
        attended: runningAttended,
        conducted: runningConducted,
      });
    });

    // Take last 15 recorded dates for clean visual line chart
    const trendData = Array.from(trendMap.values()).slice(-15);

    // Today's Timetable
    const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const currentDay = days[new Date().getDay()];

    const todayClasses = await prisma.timetable.findMany({
      where: {
        section: {
          name: studentProfile.section,
          departmentId: studentProfile.departmentId,
        },
        dayOfWeek: currentDay === 'SUNDAY' ? 'MONDAY' : currentDay, // fallback if weekend
      },
      include: {
        subject: true,
        faculty: { include: { user: true } },
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    // Recent 5 attendance records
    const recentActivity = attendanceRecords.slice(0, 7).map((r) => ({
      id: r.id,
      sessionId: r.sessionId,
      subjectCode: r.session.subject.code,
      subjectName: r.session.subject.name,
      date: r.session.date,
      timeSlot: r.session.timeSlot,
      status: r.status,
      topic: r.session.topicCovered,
    }));

    res.json({
      success: true,
      data: {
        student: {
          id: studentProfile.id,
          name: req.user.name,
          email: req.user.email,
          usn: studentProfile.usn,
          department: studentProfile.department.name,
          departmentCode: studentProfile.department.code,
          semester: studentProfile.semester,
          section: studentProfile.section,
        },
        threshold,
        summary: {
          overallPercentage,
          totalConducted,
          totalAttended,
          totalMissed,
          totalLeave,
          lowAttendanceSubjectsCount: lowAttendanceCount,
          hasLowAttendanceWarning: lowAttendanceCount > 0 || overallPercentage < threshold,
        },
        subjectWise: subjectStats,
        attendanceTrend: trendData,
        todayClasses: todayClasses.map((c) => ({
          id: c.id,
          subjectCode: c.subject.code,
          subjectName: c.subject.name,
          faculty: c.faculty.user.name,
          startTime: c.startTime,
          endTime: c.endTime,
          roomNumber: c.roomNumber,
        })),
        recentActivity,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getAttendanceHistory(req, res, next) {
  try {
    const studentProfile = req.user.studentProfile;
    if (!studentProfile) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    const { subjectId, status, startDate, endDate } = req.query;

    const whereClause = {
      studentId: studentProfile.id,
      session: {},
    };

    if (subjectId && subjectId !== 'ALL') {
      whereClause.session.subjectId = subjectId;
    }

    if (status && status !== 'ALL') {
      whereClause.status = status;
    }

    if (startDate || endDate) {
      whereClause.session.date = {};
      if (startDate) whereClause.session.date.gte = new Date(startDate);
      if (endDate) whereClause.session.date.lte = new Date(endDate);
    }

    const records = await prisma.attendanceRecord.findMany({
      where: whereClause,
      include: {
        session: {
          include: {
            subject: true,
            faculty: { include: { user: true } },
          },
        },
      },
      orderBy: {
        session: {
          date: 'desc',
        },
      },
    });

    const formattedRecords = records.map((r) => ({
      id: r.id,
      sessionId: r.sessionId,
      subjectId: r.session.subjectId,
      subjectCode: r.session.subject.code,
      subjectName: r.session.subject.name,
      facultyName: r.session.faculty.user.name,
      date: r.session.date,
      timeSlot: r.session.timeSlot,
      topicCovered: r.session.topicCovered || 'Regular Class Session',
      status: r.status,
      remarks: r.remarks,
      isLocked: r.session.isLocked,
    }));

    res.json({
      success: true,
      records: formattedRecords,
      totalCount: formattedRecords.length,
    });
  } catch (error) {
    next(error);
  }
}

export async function calculateAttendanceProjection(req, res, next) {
  try {
    const studentProfile = req.user.studentProfile;
    const targetPercentage = parseFloat(req.query.target || 75);
    const targetDecimal = targetPercentage / 100;

    // Get all records
    const records = await prisma.attendanceRecord.findMany({
      where: { studentId: studentProfile.id },
      include: {
        session: {
          include: { subject: true },
        },
      },
    });

    // Total counts
    const totalConducted = records.length;
    const totalAttended = records.filter((r) => r.status === 'PRESENT').length;

    const overallCalculation = calculateTargetClassesNeeded(totalAttended, totalConducted, targetDecimal);

    // Subject-wise calculations
    const subjectsMap = new Map();
    records.forEach((r) => {
      const sub = r.session.subject;
      if (!subjectsMap.has(sub.id)) {
        subjectsMap.set(sub.id, {
          subjectId: sub.id,
          code: sub.code,
          name: sub.name,
          conducted: 0,
          attended: 0,
        });
      }
      const data = subjectsMap.get(sub.id);
      data.conducted++;
      if (r.status === 'PRESENT') data.attended++;
    });

    const subjectsProjections = Array.from(subjectsMap.values()).map((sub) => {
      const calc = calculateTargetClassesNeeded(sub.attended, sub.conducted, targetDecimal);
      return {
        ...sub,
        currentPercentage: calc.currentPercentage,
        targetPercentage,
        status: calc.status,
        classesNeeded: calc.classesNeeded,
        classesCanMiss: calc.classesCanMiss,
        message: calc.message,
      };
    });

    res.json({
      success: true,
      targetPercentage,
      overall: overallCalculation,
      subjectWise: subjectsProjections,
      formulaExplanation: {
        formula: 'x = max(0, ceil((r * t - a) / (1 - r)))',
        variables: {
          r: `Target attendance rate (${targetPercentage}% = ${targetDecimal})`,
          a: `Current classes attended (${totalAttended})`,
          t: `Total classes conducted (${totalConducted})`,
          x: `Minimum additional consecutive classes you must attend (${overallCalculation.classesNeeded})`,
        },
        bunkBufferFormula: 'm = floor((a - r * t) / r)',
        bunkBufferExplanation: `Number of classes you can miss while keeping attendance >= ${targetPercentage}%: ${overallCalculation.classesCanMiss}`,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getTimetable(req, res, next) {
  try {
    const studentProfile = req.user.studentProfile;

    const entries = await prisma.timetable.findMany({
      where: {
        section: {
          name: studentProfile.section,
          departmentId: studentProfile.departmentId,
        },
      },
      include: {
        subject: true,
        faculty: { include: { user: true } },
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
          facultyName: e.faculty.user.name,
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

export async function submitCorrectionRequest(req, res, next) {
  try {
    const studentProfile = req.user.studentProfile;
    const validated = correctionRequestSchema.parse(req.body);

    // Validate that session exists and student was enrolled
    const session = await prisma.classSession.findUnique({
      where: { id: validated.sessionId },
      include: { subject: true },
    });

    if (!session) {
      return res.status(404).json({ success: false, message: 'Class session not found.' });
    }

    // Check student's current record in this session
    const record = await prisma.attendanceRecord.findUnique({
      where: {
        sessionId_studentId: {
          sessionId: session.id,
          studentId: studentProfile.id,
        },
      },
    });

    if (!record) {
      return res.status(400).json({ success: false, message: 'No attendance record found for you in this session.' });
    }

    if (record.status === validated.requestedStatus) {
      return res.status(400).json({
        success: false,
        message: `Your attendance in this session is already '${record.status}'.`,
      });
    }

    // Check if there is already a pending request for this session
    const existingPending = await prisma.attendanceCorrectionRequest.findFirst({
      where: {
        studentId: studentProfile.id,
        sessionId: session.id,
        status: 'PENDING',
      },
    });

    if (existingPending) {
      return res.status(400).json({
        success: false,
        message: 'A correction request for this class session is already pending review.',
      });
    }

    const request = await prisma.attendanceCorrectionRequest.create({
      data: {
        studentId: studentProfile.id,
        sessionId: session.id,
        currentStatus: record.status,
        requestedStatus: validated.requestedStatus,
        reason: validated.reason,
        proofDocUrl: validated.proofDocUrl || null,
        status: 'PENDING',
      },
      include: {
        session: { include: { subject: true } },
      },
    });

    // Create notification for Admin
    const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
    for (const admin of admins) {
      await prisma.notification.create({
        data: {
          userId: admin.id,
          title: 'New Attendance Correction Request',
          message: `Student ${req.user.name} (${studentProfile.usn}) requested attendance correction for ${session.subject.code}.`,
          type: 'INFO',
          link: '/admin/corrections',
        },
      });
    }

    res.status(201).json({
      success: true,
      message: 'Correction request submitted successfully.',
      request,
    });
  } catch (error) {
    next(error);
  }
}

export async function getCorrectionRequests(req, res, next) {
  try {
    const studentProfile = req.user.studentProfile;

    const requests = await prisma.attendanceCorrectionRequest.findMany({
      where: { studentId: studentProfile.id },
      include: {
        session: {
          include: {
            subject: true,
            faculty: { include: { user: true } },
          },
        },
        reviewedBy: {
          select: { name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      requests: requests.map((r) => ({
        id: r.id,
        sessionId: r.sessionId,
        subjectCode: r.session.subject.code,
        subjectName: r.session.subject.name,
        facultyName: r.session.faculty.user.name,
        sessionDate: r.session.date,
        timeSlot: r.session.timeSlot,
        currentStatus: r.currentStatus,
        requestedStatus: r.requestedStatus,
        reason: r.reason,
        proofDocUrl: r.proofDocUrl,
        status: r.status,
        reviewedBy: r.reviewedBy?.name || null,
        reviewRemarks: r.reviewRemarks,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      })),
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteCorrectionRequest(req, res, next) {
  try {
    const studentProfile = req.user.studentProfile;
    const { id } = req.params;

    const request = await prisma.attendanceCorrectionRequest.findUnique({
      where: { id },
    });

    if (!request) {
      return res.status(404).json({ success: false, message: 'Correction request not found.' });
    }

    if (request.studentId !== studentProfile.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized. You can only withdraw your own requests.' });
    }

    if (request.status !== 'PENDING') {
      return res.status(400).json({ success: false, message: `Cannot withdraw a request that has already been ${request.status.toLowerCase()}.` });
    }

    await prisma.attendanceCorrectionRequest.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Correction request withdrawn successfully.',
    });
  } catch (error) {
    next(error);
  }
}

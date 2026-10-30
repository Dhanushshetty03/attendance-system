import prisma from '../prisma.js';
import { calculateAttendancePercentage } from '../utils/calculator.js';

export async function getStudentAttendanceReport(req, res, next) {
  try {
    const studentId = req.params.studentId || req.user.studentProfile?.id;

    if (!studentId) {
      return res.status(400).json({ success: false, message: 'Student ID required.' });
    }

    // Role check: Student can only view their own report
    if (req.user.role === 'STUDENT' && req.user.studentProfile?.id !== studentId) {
      return res.status(403).json({ success: false, message: 'Unauthorized. You can only access your own report.' });
    }

    const student = await prisma.studentProfile.findUnique({
      where: { id: studentId },
      include: {
        user: { select: { name: true, email: true } },
        department: true,
      },
    });

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    const records = await prisma.attendanceRecord.findMany({
      where: { studentId },
      include: {
        session: {
          include: {
            subject: true,
            faculty: { include: { user: true } },
          },
        },
      },
      orderBy: { session: { date: 'asc' } },
    });

    // Subject aggregates
    const subjectMap = new Map();
    records.forEach((r) => {
      const sub = r.session.subject;
      if (!subjectMap.has(sub.id)) {
        subjectMap.set(sub.id, {
          code: sub.code,
          name: sub.name,
          credits: sub.credits,
          type: sub.subjectType,
          conducted: 0,
          attended: 0,
          absent: 0,
          leave: 0,
        });
      }
      const item = subjectMap.get(sub.id);
      item.conducted++;
      if (r.status === 'PRESENT') item.attended++;
      else if (r.status === 'ABSENT') item.absent++;
      else if (r.status === 'LEAVE') item.leave++;
    });

    const subjectBreakdown = Array.from(subjectMap.values()).map((s) => ({
      ...s,
      percentage: calculateAttendancePercentage(s.attended, s.conducted),
      status: s.percentage >= 75 ? 'ELIGIBLE' : 'SHORTAGE',
    }));

    const totalConducted = records.length;
    const totalAttended = records.filter((r) => r.status === 'PRESENT').length;
    const overallPercentage = calculateAttendancePercentage(totalAttended, totalConducted);

    const settings = await prisma.systemSetting.findMany();
    const instName = settings.find((s) => s.key === 'institution_name')?.value || 'Logisys Institute of Technology';

    res.json({
      success: true,
      report: {
        institutionName: instName,
        generatedAt: new Date().toISOString(),
        student: {
          name: student.user.name,
          email: student.user.email,
          usn: student.usn,
          department: student.department.name,
          departmentCode: student.department.code,
          semester: student.semester,
          section: student.section,
          rollNo: student.rollNo,
          batch: student.academicBatch,
        },
        summary: {
          totalConducted,
          totalAttended,
          overallPercentage,
          overallStatus: overallPercentage >= 75 ? 'ELIGIBLE' : 'ATTENDANCE SHORTAGE',
        },
        subjects: subjectBreakdown,
        detailedRecords: records.map((r) => ({
          date: r.session.date,
          subjectCode: r.session.subject.code,
          subjectName: r.session.subject.name,
          timeSlot: r.session.timeSlot,
          status: r.status,
          topic: r.session.topicCovered || 'Regular Session',
          faculty: r.session.faculty.user.name,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getClassMatrixReport(req, res, next) {
  try {
    const { subjectId, sectionId } = req.query;

    if (!subjectId || !sectionId) {
      return res.status(400).json({ success: false, message: 'subjectId and sectionId are required' });
    }

    const [subject, section, sessions] = await Promise.all([
      prisma.subject.findUnique({ where: { id: subjectId }, include: { department: true } }),
      prisma.section.findUnique({ where: { id: sectionId } }),
      prisma.classSession.findMany({
        where: { subjectId, sectionId },
        include: {
          attendanceRecords: {
            include: {
              student: { include: { user: true } },
            },
          },
        },
        orderBy: { date: 'asc' },
      }),
    ]);

    if (!subject || !section) {
      return res.status(404).json({ success: false, message: 'Subject or Section not found' });
    }

    // Build students roster
    const enrollments = await prisma.enrollment.findMany({
      where: { subjectId, student: { section: section.name } },
      include: { student: { include: { user: true } } },
      orderBy: { student: { rollNo: 'asc' } },
    });

    const students = enrollments.map((e) => {
      const sid = e.student.id;
      let attended = 0;
      let absent = 0;
      let leave = 0;

      const sessionAttendance = sessions.map((sess) => {
        const rec = sess.attendanceRecords.find((r) => r.studentId === sid);
        const status = rec ? rec.status : 'ABSENT';
        if (status === 'PRESENT') attended++;
        else if (status === 'ABSENT') absent++;
        else if (status === 'LEAVE') leave++;

        return {
          sessionId: sess.id,
          date: sess.date,
          status,
        };
      });

      const total = sessions.length;
      const pct = calculateAttendancePercentage(attended, total);

      return {
        id: sid,
        name: e.student.user.name,
        usn: e.student.usn,
        rollNo: e.student.rollNo,
        attended,
        absent,
        leave,
        conducted: total,
        percentage: pct,
        isLow: pct < 75,
        sessionRecords: sessionAttendance,
      };
    });

    res.json({
      success: true,
      data: {
        subject: { code: subject.code, name: subject.name, department: subject.department.name },
        section: section.name,
        totalSessions: sessions.length,
        sessionDates: sessions.map((s) => ({ id: s.id, date: s.date, timeSlot: s.timeSlot, topic: s.topicCovered })),
        students,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function exportStudentAttendanceCSV(req, res, next) {
  try {
    const studentId = req.params.studentId || req.user.studentProfile?.id;
    if (!studentId) {
      return res.status(400).json({ success: false, message: 'Student ID required.' });
    }

    if (req.user.role === 'STUDENT' && req.user.studentProfile?.id !== studentId) {
      return res.status(403).json({ success: false, message: 'Unauthorized. You can only export your own report.' });
    }

    const student = await prisma.studentProfile.findUnique({
      where: { id: studentId },
      include: {
        user: { select: { name: true, email: true } },
        department: true,
      },
    });

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    const records = await prisma.attendanceRecord.findMany({
      where: { studentId },
      include: {
        session: {
          include: {
            subject: true,
            faculty: { include: { user: true } },
          },
        },
      },
      orderBy: { session: { date: 'asc' } },
    });

    const subjectMap = new Map();
    records.forEach((r) => {
      const sub = r.session.subject;
      if (!subjectMap.has(sub.id)) {
        subjectMap.set(sub.id, {
          code: sub.code,
          name: sub.name,
          conducted: 0,
          attended: 0,
        });
      }
      const item = subjectMap.get(sub.id);
      item.conducted++;
      if (r.status === 'PRESENT') item.attended++;
    });

    const lines = [];
    lines.push(`LOGISYS ATTENDANCE REPORT`);
    lines.push(`Student Name,${student.user.name}`);
    lines.push(`USN,${student.usn}`);
    lines.push(`Department,${student.department.name} (${student.department.code})`);
    lines.push(`Semester,${student.semester}`);
    lines.push(`Section,${student.section}`);
    lines.push(``);
    lines.push(`Subject Code,Subject Name,Classes Conducted,Classes Attended,Attendance %,Status`);

    let totalConducted = 0;
    let totalAttended = 0;

    for (const item of subjectMap.values()) {
      const pct = calculateAttendancePercentage(item.attended, item.conducted);
      const status = pct >= 75 ? 'ELIGIBLE' : 'SHORTAGE';
      totalConducted += item.conducted;
      totalAttended += item.attended;
      lines.push(`"${item.code}","${item.name}",${item.conducted},${item.attended},${pct}%,${status}`);
    }

    const overallPct = calculateAttendancePercentage(totalAttended, totalConducted);
    lines.push(``);
    lines.push(`OVERALL TOTAL,ALL SUBJECTS,${totalConducted},${totalAttended},${overallPct}%,${overallPct >= 75 ? 'ELIGIBLE' : 'SHORTAGE'}`);

    const csvContent = lines.join('\r\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="attendance_${student.usn}.csv"`);
    res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
}

export async function exportClassMatrixCSV(req, res, next) {
  try {
    const { subjectId, sectionId } = req.query;

    if (!subjectId || !sectionId) {
      return res.status(400).json({ success: false, message: 'subjectId and sectionId are required' });
    }

    const [subject, section, sessions] = await Promise.all([
      prisma.subject.findUnique({ where: { id: subjectId }, include: { department: true } }),
      prisma.section.findUnique({ where: { id: sectionId } }),
      prisma.classSession.findMany({
        where: { subjectId, sectionId },
        include: {
          attendanceRecords: true,
        },
        orderBy: { date: 'asc' },
      }),
    ]);

    if (!subject || !section) {
      return res.status(404).json({ success: false, message: 'Subject or Section not found' });
    }

    const enrollments = await prisma.enrollment.findMany({
      where: { subjectId, student: { section: section.name } },
      include: { student: { include: { user: true } } },
      orderBy: { student: { rollNo: 'asc' } },
    });

    const lines = [];
    lines.push(`LOGISYS CLASS ATTENDANCE MATRIX`);
    lines.push(`Subject,"${subject.code} - ${subject.name}"`);
    lines.push(`Section,"${section.name}"`);
    lines.push(`Total Sessions,${sessions.length}`);
    lines.push(``);

    // Header row with dates
    const sessionHeaders = sessions.map((s) => s.date.toISOString().split('T')[0]);
    const headerRow = ['Roll No', 'USN', 'Student Name', 'Conducted', 'Attended', 'Percentage', 'Eligibility', ...sessionHeaders];
    lines.push(headerRow.join(','));

    // Student rows
    for (const e of enrollments) {
      const sid = e.student.id;
      let attended = 0;
      const statusCols = [];

      for (const sess of sessions) {
        const rec = sess.attendanceRecords.find((r) => r.studentId === sid);
        const st = rec ? rec.status : 'ABSENT';
        if (st === 'PRESENT') {
          attended++;
          statusCols.push('P');
        } else if (st === 'LEAVE') {
          statusCols.push('OD');
        } else {
          statusCols.push('A');
        }
      }

      const total = sessions.length;
      const pct = calculateAttendancePercentage(attended, total);
      const eligibility = pct >= 75 ? 'ELIGIBLE' : 'SHORTAGE';

      const row = [
        e.student.rollNo || '-',
        `"${e.student.usn}"`,
        `"${e.student.user.name}"`,
        total,
        attended,
        `${pct}%`,
        eligibility,
        ...statusCols,
      ];
      lines.push(row.join(','));
    }

    const csvContent = lines.join('\r\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="attendance_matrix_${subject.code}_${section.name}.csv"`);
    res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
}

export async function getDepartmentSummaryReport(req, res, next) {
  try {
    const departments = await prisma.department.findMany({
      include: {
        students: {
          include: {
            attendanceRecords: { select: { status: true } },
          },
        },
        subjects: true,
      },
    });

    const summary = departments.map((d) => {
      let totalConducted = 0;
      let totalAttended = 0;
      let shortageStudents = 0;

      d.students.forEach((s) => {
        const records = s.attendanceRecords;
        const attended = records.filter((r) => r.status === 'PRESENT').length;
        const total = records.length;
        totalConducted += total;
        totalAttended += attended;

        const pct = calculateAttendancePercentage(attended, total);
        if (pct < 75 && total > 0) {
          shortageStudents++;
        }
      });

      const deptPercentage = calculateAttendancePercentage(totalAttended, totalConducted);

      return {
        id: d.id,
        code: d.code,
        name: d.name,
        totalStudents: d.students.length,
        totalSubjects: d.subjects.length,
        totalSessionsLogged: totalConducted,
        departmentAttendancePercentage: deptPercentage,
        shortageCount: shortageStudents,
        eligibleCount: d.students.length - shortageStudents,
      };
    });

    res.json({
      success: true,
      summary,
    });
  } catch (error) {
    next(error);
  }
}


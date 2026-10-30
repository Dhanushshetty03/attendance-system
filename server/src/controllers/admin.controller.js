import bcrypt from 'bcryptjs';
import prisma from '../prisma.js';
import { calculateAttendancePercentage } from '../utils/calculator.js';
import { reviewCorrectionSchema } from '../validators/attendance.validator.js';
import { recordAuditLog } from '../utils/audit.js';
import { notifyCorrectionDecision } from '../services/notification.service.js';

// ==========================================
// 1. DASHBOARD & OVERVIEW
// ==========================================

export async function getDashboard(req, res, next) {
  try {
    const [
      totalStudents,
      totalFaculty,
      totalDepartments,
      totalSubjects,
      allAttendanceRecords,
      departments,
      recentAuditLogs,
      pendingCorrectionsCount,
      // DB table counts
      totalUsers,
      totalSections,
      totalEnrollments,
      totalFacultyAssignments,
      totalTimetables,
      totalClassSessions,
      totalAttendanceRecords,
      totalCorrectionRequests,
      totalNotifications,
      totalAuditLogs,
      totalSystemSettings,
      totalAcademicTerms,
    ] = await Promise.all([
      prisma.studentProfile.count(),
      prisma.facultyProfile.count(),
      prisma.department.count(),
      prisma.subject.count(),
      prisma.attendanceRecord.findMany({
        select: { status: true, studentId: true, session: { select: { subject: { select: { departmentId: true } } } } },
      }),
      prisma.department.findMany(),
      prisma.auditLog.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true, email: true, role: true } } },
      }),
      prisma.attendanceCorrectionRequest.count({ where: { status: 'PENDING' } }),
      // DB table counts
      prisma.user.count(),
      prisma.section.count(),
      prisma.enrollment.count(),
      prisma.facultyAssignment.count(),
      prisma.timetable.count(),
      prisma.classSession.count(),
      prisma.attendanceRecord.count(),
      prisma.attendanceCorrectionRequest.count(),
      prisma.notification.count(),
      prisma.auditLog.count(),
      prisma.systemSetting.count(),
      prisma.academicTerm.count(),
    ]);

    const totalRecords = allAttendanceRecords.length;
    const totalPresent = allAttendanceRecords.filter((r) => r.status === 'PRESENT').length;
    const averageCampusAttendance = calculateAttendancePercentage(totalPresent, totalRecords);

    // Calculate low attendance students count
    const studentAttendanceMap = new Map();
    allAttendanceRecords.forEach((r) => {
      if (!studentAttendanceMap.has(r.studentId)) {
        studentAttendanceMap.set(r.studentId, { attended: 0, total: 0 });
      }
      const st = studentAttendanceMap.get(r.studentId);
      st.total++;
      if (r.status === 'PRESENT') st.attended++;
    });

    let lowAttendanceCount = 0;
    studentAttendanceMap.forEach((val) => {
      const pct = (val.attended / val.total) * 100;
      if (pct < 75) lowAttendanceCount++;
    });

    // Department-wise breakdown
    const deptStats = departments.map((dept) => {
      const deptRecords = allAttendanceRecords.filter(
        (r) => r.session?.subject?.departmentId === dept.id
      );
      const conducted = deptRecords.length;
      const attended = deptRecords.filter((r) => r.status === 'PRESENT').length;
      const pct = calculateAttendancePercentage(attended, conducted);

      return {
        id: dept.id,
        code: dept.code,
        name: dept.name,
        totalClasses: conducted,
        attendedClasses: attended,
        attendancePercentage: conducted > 0 ? pct : 84.5,
      };
    });

    // Database table overview (for admin homepage display)
    const databaseTables = [
      { table: 'User',                        description: 'All user accounts (admin, faculty, student)', records: totalUsers },
      { table: 'StudentProfile',              description: 'Student details (USN, semester, guardian)', records: totalStudents },
      { table: 'FacultyProfile',              description: 'Faculty details (employee ID, designation)', records: totalFaculty },
      { table: 'Department',                  description: 'Academic departments (CSE, ISE, ECE, AIML)', records: totalDepartments },
      { table: 'Subject',                     description: 'Courses / subjects per department', records: totalSubjects },
      { table: 'Section',                     description: 'Class sections per department', records: totalSections },
      { table: 'AcademicTerm',                description: 'Active academic terms / semesters', records: totalAcademicTerms },
      { table: 'Enrollment',                  description: 'Student–subject enrollment mappings', records: totalEnrollments },
      { table: 'FacultyAssignment',           description: 'Faculty–subject teaching assignments', records: totalFacultyAssignments },
      { table: 'Timetable',                   description: 'Weekly timetable schedule entries', records: totalTimetables },
      { table: 'ClassSession',                description: 'Conducted class sessions with date/time', records: totalClassSessions },
      { table: 'AttendanceRecord',            description: 'Per-student per-session attendance logs', records: totalAttendanceRecords },
      { table: 'AttendanceCorrectionRequest', description: 'Student grievance / correction requests', records: totalCorrectionRequests },
      { table: 'Notification',                description: 'System notifications & alerts', records: totalNotifications },
      { table: 'AuditLog',                    description: 'Immutable admin action audit trail', records: totalAuditLogs },
      { table: 'SystemSetting',               description: 'Configurable institutional settings', records: totalSystemSettings },
    ];

    res.json({
      success: true,
      data: {
        metrics: {
          totalStudents,
          totalFaculty,
          totalDepartments,
          totalSubjects,
          averageCampusAttendance,
          lowAttendanceCount,
          pendingCorrectionsCount,
        },
        departmentStats: deptStats,
        databaseTables,
        recentAuditLogs: recentAuditLogs.map((log) => ({
          id: log.id,
          action: log.action,
          entity: log.entity,
          details: log.details,
          userName: log.user?.name || 'System',
          userRole: log.user?.role || 'SYSTEM',
          ipAddress: log.ipAddress,
          createdAt: log.createdAt,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
}

// ==========================================
// 2. STUDENT MANAGEMENT (CRUD & BULK)
// ==========================================

export async function getStudents(req, res, next) {
  try {
    const { departmentId, semester, search } = req.query;

    const where = {};
    if (departmentId && departmentId !== 'ALL') where.departmentId = departmentId;
    if (semester && semester !== 'ALL') where.semester = parseInt(semester);
    if (search) {
      where.OR = [
        { usn: { contains: search } },
        { user: { name: { contains: search } } },
        { user: { email: { contains: search } } },
        { rollNo: { contains: search } },
      ];
    }

    const students = await prisma.studentProfile.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true, isActive: true } },
        department: true,
        attendanceRecords: { select: { status: true } },
      },
      orderBy: { rollNo: 'asc' },
    });

    const studentsWithStats = students.map((s) => {
      const total = s.attendanceRecords.length;
      const attended = s.attendanceRecords.filter((r) => r.status === 'PRESENT').length;
      const pct = calculateAttendancePercentage(attended, total);

      return {
        id: s.id,
        userId: s.user.id,
        name: s.user.name,
        email: s.user.email,
        usn: s.usn,
        department: s.department.name,
        departmentId: s.department.id,
        departmentCode: s.department.code,
        semester: s.semester,
        section: s.section,
        rollNo: s.rollNo,
        contactNo: s.contactNo,
        guardianName: s.guardianName,
        guardianContact: s.guardianContact,
        academicBatch: s.academicBatch,
        isActive: s.user.isActive,
        stats: {
          conducted: total,
          attended,
          percentage: pct,
          isLow: pct < 75 && total > 0,
        },
      };
    });

    res.json({
      success: true,
      students: studentsWithStats,
      count: studentsWithStats.length,
    });
  } catch (error) {
    next(error);
  }
}

export async function getStudentById(req, res, next) {
  try {
    const { id } = req.params;

    const student = await prisma.studentProfile.findUnique({
      where: { id },
      include: {
        user: true,
        department: true,
        enrollments: {
          include: {
            subject: true,
          },
        },
      },
    });

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    res.json({ success: true, student });
  } catch (error) {
    next(error);
  }
}

export async function createStudent(req, res, next) {
  try {
    const { name, email, password, usn, departmentId, semester, section, rollNo, contactNo, guardianName, guardianContact, academicBatch } = req.body;

    if (!name || !email || !usn || !departmentId) {
      return res.status(400).json({ success: false, message: 'Name, email, USN, and department are required.' });
    }

    const existingEmail = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existingEmail) {
      return res.status(400).json({ success: false, message: 'Email already registered.' });
    }

    const existingUsn = await prisma.studentProfile.findUnique({ where: { usn: usn.toUpperCase() } });
    if (existingUsn) {
      return res.status(400).json({ success: false, message: 'USN already exists in the system.' });
    }

    const passwordHash = await bcrypt.hash(password || 'Student@123', 10);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: email.toLowerCase(),
          passwordHash,
          name,
          role: 'STUDENT',
          avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
          studentProfile: {
            create: {
              usn: usn.toUpperCase(),
              departmentId,
              semester: parseInt(semester) || 5,
              section: section || '5A',
              rollNo: rollNo || null,
              contactNo: contactNo || null,
              guardianName: guardianName || null,
              guardianContact: guardianContact || null,
              academicBatch: academicBatch || '2023-2027',
            },
          },
        },
        include: { studentProfile: true },
      });

      // Auto enroll in active subjects for this semester & department
      const currentTerm = await tx.academicTerm.findFirst({ where: { isCurrent: true } });
      const subjects = await tx.subject.findMany({
        where: { departmentId, semester: parseInt(semester) || 5 },
      });

      if (currentTerm && subjects.length > 0) {
        for (const sub of subjects) {
          await tx.enrollment.create({
            data: {
              studentId: user.studentProfile.id,
              subjectId: sub.id,
              academicTermId: currentTerm.id,
              isActive: true,
            },
          });
        }
      }

      await recordAuditLog(tx, {
        userId: req.user.id,
        action: 'STUDENT_CREATED',
        entity: 'StudentProfile',
        entityId: user.studentProfile.id,
        details: `Enrolled student ${name} (${usn.toUpperCase()}) in Sem ${semester} with ${subjects.length} course enrollments.`,
        req,
      });

      return user;
    });

    res.status(201).json({
      success: true,
      message: 'Student account created and enrolled successfully.',
      student: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateStudent(req, res, next) {
  try {
    const { id } = req.params;
    const { name, email, usn, departmentId, semester, section, rollNo, contactNo, guardianName, guardianContact, academicBatch, isActive, password } = req.body;

    const student = await prisma.studentProfile.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    await prisma.$transaction(async (tx) => {
      const userUpdateData = {};
      if (name) userUpdateData.name = name;
      if (email) userUpdateData.email = email.toLowerCase();
      if (isActive !== undefined) userUpdateData.isActive = Boolean(isActive);
      if (password && password.trim().length >= 6) {
        userUpdateData.passwordHash = await bcrypt.hash(password, 10);
      }

      if (Object.keys(userUpdateData).length > 0) {
        await tx.user.update({
          where: { id: student.userId },
          data: userUpdateData,
        });
      }

      const profileUpdateData = {};
      if (usn) profileUpdateData.usn = usn.toUpperCase();
      if (departmentId) profileUpdateData.departmentId = departmentId;
      if (semester !== undefined) profileUpdateData.semester = parseInt(semester);
      if (section) profileUpdateData.section = section;
      if (rollNo !== undefined) profileUpdateData.rollNo = rollNo;
      if (contactNo !== undefined) profileUpdateData.contactNo = contactNo;
      if (guardianName !== undefined) profileUpdateData.guardianName = guardianName;
      if (guardianContact !== undefined) profileUpdateData.guardianContact = guardianContact;
      if (academicBatch !== undefined) profileUpdateData.academicBatch = academicBatch;

      await tx.studentProfile.update({
        where: { id },
        data: profileUpdateData,
      });

      await recordAuditLog(tx, {
        userId: req.user.id,
        action: 'STUDENT_UPDATED',
        entity: 'StudentProfile',
        entityId: id,
        details: `Updated student record for ${name || student.user.name} (${usn || student.usn}).`,
        req,
      });
    });

    res.json({ success: true, message: 'Student profile updated successfully.' });
  } catch (error) {
    next(error);
  }
}

export async function deleteStudent(req, res, next) {
  try {
    const { id } = req.params;

    const student = await prisma.studentProfile.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    await prisma.$transaction(async (tx) => {
      // Deleting user cascades to studentProfile, enrollments, attendanceRecords
      await tx.user.delete({
        where: { id: student.userId },
      });

      await recordAuditLog(tx, {
        userId: req.user.id,
        action: 'STUDENT_DELETED',
        entity: 'StudentProfile',
        entityId: id,
        details: `Deleted student ${student.user.name} (${student.usn}) and all associated records.`,
        req,
      });
    });

    res.json({ success: true, message: 'Student account and records removed successfully.' });
  } catch (error) {
    next(error);
  }
}

export async function bulkImportStudents(req, res, next) {
  try {
    const { students } = req.body; // Array of student objects

    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ success: false, message: 'Array of student records is required.' });
    }

    const currentTerm = await prisma.academicTerm.findFirst({ where: { isCurrent: true } });
    const defaultPasswordHash = await bcrypt.hash('Student@123', 10);

    let successCount = 0;
    const errors = [];

    for (const s of students) {
      try {
        if (!s.name || !s.email || !s.usn || !s.departmentId) {
          errors.push(`Row for ${s.name || s.usn || 'unknown'} is missing required fields.`);
          continue;
        }

        const existingUsn = await prisma.studentProfile.findUnique({ where: { usn: s.usn.toUpperCase() } });
        if (existingUsn) {
          errors.push(`USN ${s.usn} already exists.`);
          continue;
        }

        const user = await prisma.user.create({
          data: {
            email: s.email.toLowerCase(),
            passwordHash: defaultPasswordHash,
            name: s.name,
            role: 'STUDENT',
            studentProfile: {
              create: {
                usn: s.usn.toUpperCase(),
                departmentId: s.departmentId,
                semester: parseInt(s.semester) || 5,
                section: s.section || '5A',
                rollNo: s.rollNo || null,
                contactNo: s.contactNo || null,
              },
            },
          },
          include: { studentProfile: true },
        });

        // Auto enroll
        if (currentTerm) {
          const subjects = await prisma.subject.findMany({
            where: { departmentId: s.departmentId, semester: parseInt(s.semester) || 5 },
          });

          for (const sub of subjects) {
            await prisma.enrollment.create({
              data: {
                studentId: user.studentProfile.id,
                subjectId: sub.id,
                academicTermId: currentTerm.id,
                isActive: true,
              },
            });
          }
        }

        successCount++;
      } catch (err) {
        errors.push(`Failed to import ${s.usn}: ${err.message}`);
      }
    }

    await recordAuditLog(prisma, {
      userId: req.user.id,
      action: 'BULK_STUDENT_IMPORT',
      entity: 'StudentProfile',
      details: `Bulk imported ${successCount} students. Errors: ${errors.length}`,
      req,
    });

    res.json({
      success: true,
      message: `Successfully imported ${successCount} student records.`,
      importedCount: successCount,
      errors,
    });
  } catch (error) {
    next(error);
  }
}

// ==========================================
// 3. FACULTY MANAGEMENT (CRUD)
// ==========================================

export async function getFacultyList(req, res, next) {
  try {
    const faculty = await prisma.facultyProfile.findMany({
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true, isActive: true } },
        department: true,
        facultyAssignments: {
          include: {
            subject: true,
            section: true,
          },
        },
      },
      orderBy: { employeeId: 'asc' },
    });

    res.json({
      success: true,
      faculty: faculty.map((f) => ({
        id: f.id,
        userId: f.user.id,
        name: f.user.name,
        email: f.user.email,
        employeeId: f.employeeId,
        department: f.department.name,
        departmentId: f.department.id,
        designation: f.designation,
        qualification: f.qualification,
        contactNo: f.contactNo,
        isActive: f.user.isActive,
        assignments: f.facultyAssignments.map((a) => ({
          id: a.id,
          subjectId: a.subject.id,
          subjectCode: a.subject.code,
          subjectName: a.subject.name,
          sectionId: a.section.id,
          sectionName: a.section.name,
        })),
      })),
    });
  } catch (error) {
    next(error);
  }
}

export async function createFaculty(req, res, next) {
  try {
    const { name, email, password, employeeId, departmentId, designation, qualification, contactNo } = req.body;

    if (!name || !email || !employeeId || !departmentId) {
      return res.status(400).json({ success: false, message: 'Name, email, Employee ID, and Department are required.' });
    }

    const existingEmail = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existingEmail) {
      return res.status(400).json({ success: false, message: 'Email is already registered.' });
    }

    const existingEmpId = await prisma.facultyProfile.findUnique({ where: { employeeId } });
    if (existingEmpId) {
      return res.status(400).json({ success: false, message: 'Employee ID already in use.' });
    }

    const passwordHash = await bcrypt.hash(password || 'Faculty@123', 10);

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        name,
        role: 'FACULTY',
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
        facultyProfile: {
          create: {
            employeeId,
            departmentId,
            designation: designation || 'Assistant Professor',
            qualification: qualification || 'M.Tech',
            contactNo: contactNo || null,
          },
        },
      },
      include: { facultyProfile: true },
    });

    await recordAuditLog(prisma, {
      userId: req.user.id,
      action: 'FACULTY_CREATED',
      entity: 'FacultyProfile',
      entityId: user.facultyProfile.id,
      details: `Created faculty account for ${name} (${employeeId}) in department ${departmentId}.`,
      req,
    });

    res.status(201).json({
      success: true,
      message: 'Faculty created successfully',
      faculty: user,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateFaculty(req, res, next) {
  try {
    const { id } = req.params;
    const { name, email, designation, qualification, departmentId, contactNo, isActive, password } = req.body;

    const faculty = await prisma.facultyProfile.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!faculty) {
      return res.status(404).json({ success: false, message: 'Faculty profile not found.' });
    }

    await prisma.$transaction(async (tx) => {
      const userUpdate = {};
      if (name) userUpdate.name = name;
      if (email) userUpdate.email = email.toLowerCase();
      if (isActive !== undefined) userUpdate.isActive = Boolean(isActive);
      if (password && password.trim().length >= 6) {
        userUpdate.passwordHash = await bcrypt.hash(password, 10);
      }

      if (Object.keys(userUpdate).length > 0) {
        await tx.user.update({
          where: { id: faculty.userId },
          data: userUpdate,
        });
      }

      const profUpdate = {};
      if (designation) profUpdate.designation = designation;
      if (qualification !== undefined) profUpdate.qualification = qualification;
      if (departmentId) profUpdate.departmentId = departmentId;
      if (contactNo !== undefined) profUpdate.contactNo = contactNo;

      await tx.facultyProfile.update({
        where: { id },
        data: profUpdate,
      });

      await recordAuditLog(tx, {
        userId: req.user.id,
        action: 'FACULTY_UPDATED',
        entity: 'FacultyProfile',
        entityId: id,
        details: `Updated faculty details for ${name || faculty.user.name} (${faculty.employeeId}).`,
        req,
      });
    });

    res.json({ success: true, message: 'Faculty profile updated successfully.' });
  } catch (error) {
    next(error);
  }
}

export async function deleteFaculty(req, res, next) {
  try {
    const { id } = req.params;

    const faculty = await prisma.facultyProfile.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!faculty) {
      return res.status(404).json({ success: false, message: 'Faculty not found.' });
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.delete({
        where: { id: faculty.userId },
      });

      await recordAuditLog(tx, {
        userId: req.user.id,
        action: 'FACULTY_DELETED',
        entity: 'FacultyProfile',
        entityId: id,
        details: `Deleted faculty ${faculty.user.name} (${faculty.employeeId}).`,
        req,
      });
    });

    res.json({ success: true, message: 'Faculty account removed successfully.' });
  } catch (error) {
    next(error);
  }
}

// ==========================================
// 4. DEPARTMENTS & SUBJECTS CRUD
// ==========================================

export async function createDepartment(req, res, next) {
  try {
    const { code, name, description } = req.body;
    if (!code || !name) {
      return res.status(400).json({ success: false, message: 'Department code and name are required.' });
    }

    const dept = await prisma.department.create({
      data: {
        code: code.toUpperCase(),
        name,
        description: description || null,
      },
    });

    await recordAuditLog(prisma, {
      userId: req.user.id,
      action: 'DEPARTMENT_CREATED',
      entity: 'Department',
      entityId: dept.id,
      details: `Created department ${name} (${code.toUpperCase()}).`,
      req,
    });

    res.status(201).json({ success: true, department: dept });
  } catch (error) {
    next(error);
  }
}

export async function updateDepartment(req, res, next) {
  try {
    const { id } = req.params;
    const { code, name, description } = req.body;

    const dept = await prisma.department.update({
      where: { id },
      data: {
        ...(code && { code: code.toUpperCase() }),
        ...(name && { name }),
        ...(description !== undefined && { description }),
      },
    });

    res.json({ success: true, department: dept });
  } catch (error) {
    next(error);
  }
}

export async function deleteDepartment(req, res, next) {
  try {
    const { id } = req.params;
    await prisma.department.delete({ where: { id } });
    res.json({ success: true, message: 'Department deleted successfully.' });
  } catch (error) {
    next(error);
  }
}

export async function createSubject(req, res, next) {
  try {
    const { code, name, departmentId, semester, credits, totalSyllabusHours, subjectType } = req.body;

    if (!code || !name || !departmentId) {
      return res.status(400).json({ success: false, message: 'Subject code, name, and department are required.' });
    }

    const sub = await prisma.subject.create({
      data: {
        code: code.toUpperCase(),
        name,
        departmentId,
        semester: parseInt(semester) || 5,
        credits: parseInt(credits) || 4,
        totalSyllabusHours: parseInt(totalSyllabusHours) || 45,
        subjectType: subjectType || 'THEORY',
      },
    });

    await recordAuditLog(prisma, {
      userId: req.user.id,
      action: 'SUBJECT_CREATED',
      entity: 'Subject',
      entityId: sub.id,
      details: `Created course ${name} (${code.toUpperCase()}).`,
      req,
    });

    res.status(201).json({ success: true, subject: sub });
  } catch (error) {
    next(error);
  }
}

export async function updateSubject(req, res, next) {
  try {
    const { id } = req.params;
    const { code, name, departmentId, semester, credits, totalSyllabusHours, subjectType } = req.body;

    const sub = await prisma.subject.update({
      where: { id },
      data: {
        ...(code && { code: code.toUpperCase() }),
        ...(name && { name }),
        ...(departmentId && { departmentId }),
        ...(semester !== undefined && { semester: parseInt(semester) }),
        ...(credits !== undefined && { credits: parseInt(credits) }),
        ...(totalSyllabusHours !== undefined && { totalSyllabusHours: parseInt(totalSyllabusHours) }),
        ...(subjectType && { subjectType }),
      },
    });

    res.json({ success: true, subject: sub });
  } catch (error) {
    next(error);
  }
}

export async function deleteSubject(req, res, next) {
  try {
    const { id } = req.params;
    await prisma.subject.delete({ where: { id } });
    res.json({ success: true, message: 'Subject deleted successfully.' });
  } catch (error) {
    next(error);
  }
}

// ==========================================
// 5. SECTIONS & FACULTY ASSIGNMENTS
// ==========================================

export async function createSection(req, res, next) {
  try {
    const { name, departmentId, semester } = req.body;
    const sec = await prisma.section.create({
      data: {
        name,
        departmentId,
        semester: parseInt(semester) || 5,
      },
    });
    res.status(201).json({ success: true, section: sec });
  } catch (error) {
    next(error);
  }
}

export async function assignFaculty(req, res, next) {
  try {
    const { facultyId, subjectId, sectionId, academicTermId } = req.body;
    let termId = academicTermId;

    if (!termId) {
      const activeTerm = await prisma.academicTerm.findFirst({ where: { isCurrent: true } });
      termId = activeTerm ? activeTerm.id : null;
    }

    if (!facultyId || !subjectId || !sectionId || !termId) {
      return res.status(400).json({ success: false, message: 'facultyId, subjectId, sectionId, and academicTermId are required.' });
    }

    const assignment = await prisma.facultyAssignment.create({
      data: {
        facultyId,
        subjectId,
        sectionId,
        academicTermId: termId,
      },
      include: {
        subject: true,
        section: true,
        faculty: { include: { user: true } },
      },
    });

    await recordAuditLog(prisma, {
      userId: req.user.id,
      action: 'FACULTY_ASSIGNED',
      entity: 'FacultyAssignment',
      entityId: assignment.id,
      details: `Assigned faculty ${assignment.faculty.user.name} to ${assignment.subject.code} (Section ${assignment.section.name}).`,
      req,
    });

    res.status(201).json({ success: true, assignment });
  } catch (error) {
    next(error);
  }
}

export async function removeFacultyAssignment(req, res, next) {
  try {
    const { id } = req.params;
    await prisma.facultyAssignment.delete({ where: { id } });
    res.json({ success: true, message: 'Faculty assignment removed.' });
  } catch (error) {
    next(error);
  }
}

// ==========================================
// 6. TIMETABLE MANAGEMENT
// ==========================================

export async function getTimetables(req, res, next) {
  try {
    const { sectionId, departmentId } = req.query;
    const where = {};
    if (sectionId) where.sectionId = sectionId;
    if (departmentId) where.subject = { departmentId };

    const entries = await prisma.timetable.findMany({
      where,
      include: {
        subject: true,
        section: true,
        faculty: { include: { user: true } },
      },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });

    res.json({ success: true, timetables: entries });
  } catch (error) {
    next(error);
  }
}

export async function createTimetableEntry(req, res, next) {
  try {
    const { dayOfWeek, startTime, endTime, subjectId, sectionId, facultyId, roomNumber } = req.body;

    const entry = await prisma.timetable.create({
      data: {
        dayOfWeek: dayOfWeek.toUpperCase(),
        startTime,
        endTime,
        subjectId,
        sectionId,
        facultyId,
        roomNumber: roomNumber || 'L-301',
      },
      include: {
        subject: true,
        section: true,
        faculty: { include: { user: true } },
      },
    });

    res.status(201).json({ success: true, entry });
  } catch (error) {
    next(error);
  }
}

export async function deleteTimetableEntry(req, res, next) {
  try {
    const { id } = req.params;
    await prisma.timetable.delete({ where: { id } });
    res.json({ success: true, message: 'Timetable entry deleted.' });
  } catch (error) {
    next(error);
  }
}

// ==========================================
// 7. CORRECTION REQUESTS ADJUDICATION
// ==========================================

export async function getCorrectionRequests(req, res, next) {
  try {
    const { status } = req.query;
    const where = {};
    if (status && status !== 'ALL') where.status = status;

    const requests = await prisma.attendanceCorrectionRequest.findMany({
      where,
      include: {
        student: {
          include: {
            user: { select: { id: true, name: true, email: true } },
            department: true,
          },
        },
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
        studentName: r.student.user.name,
        studentEmail: r.student.user.email,
        usn: r.student.usn,
        department: r.student.department.code,
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
      })),
    });
  } catch (error) {
    next(error);
  }
}

export async function reviewCorrectionRequest(req, res, next) {
  try {
    const { id } = req.params;
    const validated = reviewCorrectionSchema.parse(req.body);

    const request = await prisma.attendanceCorrectionRequest.findUnique({
      where: { id },
      include: {
        student: { include: { user: true } },
        session: { include: { subject: true } },
      },
    });

    if (!request) {
      return res.status(404).json({ success: false, message: 'Correction request not found.' });
    }

    if (request.status !== 'PENDING') {
      return res.status(400).json({ success: false, message: `Request has already been reviewed (${request.status}).` });
    }

    await prisma.$transaction(async (tx) => {
      await tx.attendanceCorrectionRequest.update({
        where: { id },
        data: {
          status: validated.status,
          reviewRemarks: validated.reviewRemarks,
          reviewedById: req.user.id,
        },
      });

      if (validated.status === 'APPROVED') {
        await tx.attendanceRecord.update({
          where: {
            sessionId_studentId: {
              sessionId: request.sessionId,
              studentId: request.studentId,
            },
          },
          data: {
            status: request.requestedStatus,
            remarks: `Correction approved by Admin: ${validated.reviewRemarks}`,
          },
        });
      }

      await recordAuditLog(tx, {
        userId: req.user.id,
        action: `CORRECTION_${validated.status}`,
        entity: 'AttendanceCorrectionRequest',
        entityId: id,
        details: `Admin ${req.user.name} reviewed request for ${request.student.usn} (${request.session.subject.code}): ${validated.status}. Remarks: ${validated.reviewRemarks}`,
        req,
      });
    });

    // Notify student
    notifyCorrectionDecision({
      studentUserId: request.student.user.id,
      subjectCode: request.session.subject.code,
      sessionDate: request.session.date,
      status: validated.status,
      remarks: validated.reviewRemarks,
    }).catch(console.error);

    res.json({
      success: true,
      message: `Correction request has been ${validated.status.toLowerCase()} successfully.`,
    });
  } catch (error) {
    next(error);
  }
}

// ==========================================
// 8. AUDIT LOGS & SETTINGS
// ==========================================

export async function getAuditLogs(req, res, next) {
  try {
    const { action, limit = 50 } = req.query;
    const where = {};
    if (action && action !== 'ALL') where.action = action;

    const logs = await prisma.auditLog.findMany({
      where,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, email: true, role: true } },
      },
    });

    res.json({
      success: true,
      logs: logs.map((l) => ({
        id: l.id,
        action: l.action,
        entity: l.entity,
        entityId: l.entityId,
        details: l.details,
        userName: l.user?.name || 'System',
        userEmail: l.user?.email || 'N/A',
        userRole: l.user?.role || 'SYSTEM',
        ipAddress: l.ipAddress,
        createdAt: l.createdAt,
      })),
    });
  } catch (error) {
    next(error);
  }
}

export async function getSystemSettings(req, res, next) {
  try {
    const settings = await prisma.systemSetting.findMany();
    const settingsMap = {};
    settings.forEach((s) => {
      settingsMap[s.key] = s.value;
    });

    res.json({
      success: true,
      settings: settingsMap,
      details: settings,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateSystemSettings(req, res, next) {
  try {
    const updates = req.body;

    for (const [key, value] of Object.entries(updates)) {
      await prisma.systemSetting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value), description: `Setting for ${key}` },
      });
    }

    await recordAuditLog(prisma, {
      userId: req.user.id,
      action: 'SETTINGS_UPDATED',
      entity: 'SystemSetting',
      details: `Updated settings: ${Object.keys(updates).join(', ')}`,
      req,
    });

    res.json({
      success: true,
      message: 'System settings updated successfully.',
    });
  } catch (error) {
    next(error);
  }
}

export async function getAcademicResources(req, res, next) {
  try {
    const [departments, subjects, sections, academicTerms] = await Promise.all([
      prisma.department.findMany({ orderBy: { code: 'asc' } }),
      prisma.subject.findMany({ include: { department: true }, orderBy: { code: 'asc' } }),
      prisma.section.findMany({ include: { department: true }, orderBy: { name: 'asc' } }),
      prisma.academicTerm.findMany({ orderBy: { startDate: 'desc' } }),
    ]);

    res.json({
      success: true,
      departments,
      subjects,
      sections,
      academicTerms,
    });
  } catch (error) {
    next(error);
  }
}

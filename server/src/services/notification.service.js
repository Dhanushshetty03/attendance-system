import prisma from '../prisma.js';
import { calculateAttendancePercentage } from '../utils/calculator.js';

/**
 * Creates an in-app notification for a user
 */
export async function createNotification({ userId, title, message, type = 'INFO', link = null }) {
  try {
    return await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        link,
      },
    });
  } catch (error) {
    console.error('Failed to create notification:', error);
    return null;
  }
}

/**
 * Evaluates student attendance after a class session and triggers warnings if below threshold
 */
export async function evaluateStudentAttendanceAlerts(studentId, subjectId) {
  try {
    // Get student profile and user
    const student = await prisma.studentProfile.findUnique({
      where: { id: studentId },
      include: { user: true },
    });

    if (!student) return;

    // Get subject details
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
    });

    if (!subject) return;

    // Get system threshold
    const thresholdSetting = await prisma.systemSetting.findUnique({
      where: { key: 'min_attendance_threshold' },
    });
    const threshold = thresholdSetting ? parseFloat(thresholdSetting.value) : 75;

    // Calculate subject-wise attendance
    const records = await prisma.attendanceRecord.findMany({
      where: {
        studentId,
        session: { subjectId },
      },
    });

    const conducted = records.length;
    if (conducted < 5) return; // Wait until at least 5 classes have taken place

    const attended = records.filter((r) => r.status === 'PRESENT').length;
    const percentage = calculateAttendancePercentage(attended, conducted);

    if (percentage < threshold) {
      // Check if a warning was already sent within the past 48 hours to avoid spamming
      const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
      const existingWarning = await prisma.notification.findFirst({
        where: {
          userId: student.userId,
          title: { contains: `Low Attendance: ${subject.code}` },
          createdAt: { gte: fortyEightHoursAgo },
        },
      });

      if (!existingWarning) {
        await createNotification({
          userId: student.userId,
          title: `⚠️ Low Attendance: ${subject.code} (${percentage}%)`,
          message: `Your current attendance in ${subject.name} (${subject.code}) is ${percentage}%, which is below the mandatory ${threshold}% threshold. Please plan required classes immediately.`,
          type: 'WARNING',
          link: `/student/calculator?subject=${subject.code}`,
        });
      }
    }
  } catch (error) {
    console.error('Error evaluating attendance alerts:', error);
  }
}

/**
 * Notifies students who were marked absent in a class session
 */
export async function notifyAbsences(sessionId, absentStudentIds = []) {
  if (!absentStudentIds.length) return;

  try {
    const session = await prisma.classSession.findUnique({
      where: { id: sessionId },
      include: { subject: true },
    });

    if (!session) return;

    const students = await prisma.studentProfile.findMany({
      where: { id: { in: absentStudentIds } },
      include: { user: true },
    });

    for (const student of students) {
      await createNotification({
        userId: student.userId,
        title: `Marked Absent: ${session.subject.code}`,
        message: `You were marked absent in ${session.subject.code} on ${new Date(session.date).toLocaleDateString()} (${session.timeSlot}). If you were on authorized duty or medical leave, please submit a correction request.`,
        type: 'ALERT',
        link: '/student/attendance',
      });
    }
  } catch (error) {
    console.error('Error sending absence notifications:', error);
  }
}

/**
 * Notifies student when admin approves or rejects an attendance correction request
 */
export async function notifyCorrectionDecision({ studentUserId, subjectCode, sessionDate, status, remarks }) {
  const isApproved = status === 'APPROVED';
  await createNotification({
    userId: studentUserId,
    title: `Attendance Correction ${status}`,
    message: `Your correction request for ${subjectCode} on ${new Date(sessionDate).toLocaleDateString()} was ${status.toLowerCase()}.${remarks ? ` Remarks: ${remarks}` : ''}`,
    type: isApproved ? 'SUCCESS' : 'WARNING',
    link: '/student/attendance',
  });
}

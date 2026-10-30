import prisma from '../prisma.js';

export async function getNotifications(req, res, next) {
  try {
    const userId = req.user.id;

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const unreadCount = await prisma.notification.count({
      where: { userId, isRead: false },
    });

    res.json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (error) {
    next(error);
  }
}

export async function markAsRead(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });

    res.json({ success: true, message: 'Notification marked as read.' });
  } catch (error) {
    next(error);
  }
}

export async function markAllAsRead(req, res, next) {
  try {
    const userId = req.user.id;

    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (error) {
    next(error);
  }
}

export async function createBroadcastAnnouncement(req, res, next) {
  try {
    const { title, message, targetRole, type = 'INFO', link } = req.body;

    if (!title || !message) {
      return res.status(400).json({ success: false, message: 'Title and message are required.' });
    }

    const where = {};
    if (targetRole && targetRole !== 'ALL') {
      where.role = targetRole;
    }

    const recipients = await prisma.user.findMany({
      where,
      select: { id: true },
    });

    const notificationsData = recipients.map((u) => ({
      userId: u.id,
      title,
      message,
      type,
      link: link || null,
    }));

    await prisma.notification.createMany({
      data: notificationsData,
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'ANNOUNCEMENT_BROADCAST',
        entity: 'Notification',
        details: `Broadcasted announcement "${title}" to ${recipients.length} users.`,
        ipAddress: req.ip || '127.0.0.1',
      },
    });

    res.status(201).json({
      success: true,
      message: `Announcement broadcasted to ${recipients.length} users.`,
    });
  } catch (error) {
    next(error);
  }
}

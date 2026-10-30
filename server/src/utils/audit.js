import prisma from '../prisma.js';

/**
 * Creates an immutable audit log record for critical system operations
 */
export async function recordAuditLog(txOrPrisma, { userId, action, entity, entityId = null, details, req = null }) {
  const db = txOrPrisma || prisma;

  let ipAddress = '127.0.0.1';
  if (req) {
    ipAddress = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.ip || req.socket?.remoteAddress || '127.0.0.1';
  }

  const detailsString = typeof details === 'object' ? JSON.stringify(details) : String(details);

  try {
    return await db.auditLog.create({
      data: {
        userId: userId || null,
        action,
        entity,
        entityId: entityId ? String(entityId) : null,
        details: detailsString,
        ipAddress,
      },
    });
  } catch (error) {
    console.error('Failed to create audit log entry:', error);
    // Don't fail the primary transaction on audit write failure in production
    return null;
  }
}

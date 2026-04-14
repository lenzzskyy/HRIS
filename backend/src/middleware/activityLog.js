import { prisma } from '../config/prisma.js';

export function activityLogger({ action, module, getDescription, getMetadata }) {
  return async (req, _res, next) => {
    req.activity = async ({ description, metadata }) => {
      if (!req.user?.userId) return;
      await prisma.activityLog.create({
        data: {
          userId: req.user.userId,
          action,
          module,
          description: description || getDescription?.(req) || `${action} ${module}`,
          metadata: metadata || getMetadata?.(req) || {},
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'] || 'unknown'
        }
      });
    };
    next();
  };
}

export async function logActivity({ userId, action, module, description, metadata, ipAddress, userAgent }) {
  await prisma.activityLog.create({
    data: { userId, action, module, description, metadata, ipAddress, userAgent }
  });
}

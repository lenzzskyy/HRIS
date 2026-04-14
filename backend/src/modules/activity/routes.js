import { Router } from 'express';
import { prisma } from '../../config/prisma.js';
import { requireAuth, requirePermission } from '../../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, requirePermission('activity.read'), async (req, res) => {
  const page = Number(req.query.page || 1);
  const pageSize = Number(req.query.pageSize || 20);

  const [data, total] = await Promise.all([
    prisma.activityLog.findMany({
      include: { user: { select: { email: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize
    }),
    prisma.activityLog.count()
  ]);

  res.json({ data, meta: { page, pageSize, total } });
});

export default router;

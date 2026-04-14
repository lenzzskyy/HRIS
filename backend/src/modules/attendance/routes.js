import { Router } from 'express';
import { prisma } from '../../config/prisma.js';
import { requireAuth, requirePermission } from '../../middleware/auth.js';
import { activityLogger } from '../../middleware/activityLog.js';

const router = Router();

router.get('/', requireAuth, requirePermission('attendance.read'), async (req, res) => {
  const items = await prisma.attendance.findMany({ take: 100, orderBy: { checkInAt: 'desc' } });
  res.json(items);
});

router.post('/checkin', requireAuth, requirePermission('attendance.checkin'), activityLogger({ action: 'CHECK_IN', module: 'ATTENDANCE' }), async (req, res) => {
  const record = await prisma.attendance.create({
    data: {
      employeeId: req.body.employeeId,
      checkInAt: new Date(),
      status: 'PRESENT'
    }
  });
  await req.activity({ description: `Check-in employee ${record.employeeId}`, metadata: { attendanceId: record.id } });
  res.status(201).json(record);
});

export default router;

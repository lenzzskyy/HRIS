import { Router } from 'express';
import { prisma } from '../../config/prisma.js';
import { requireAuth, requirePermission } from '../../middleware/auth.js';
import { activityLogger } from '../../middleware/activityLog.js';

const router = Router();

router.get('/', requireAuth, async (_req, res) => {
  const leaves = await prisma.leaveRequest.findMany({ take: 100, orderBy: { createdAt: 'desc' } });
  res.json(leaves);
});

router.post('/', requireAuth, requirePermission('leave.create'), activityLogger({ action: 'CREATE', module: 'LEAVE' }), async (req, res) => {
  const leave = await prisma.leaveRequest.create({ data: req.body });
  await req.activity({ description: `Created leave request ${leave.id}`, metadata: { after: leave } });
  res.status(201).json(leave);
});

router.post('/:id/approve', requireAuth, requirePermission('leave.approve'), activityLogger({ action: 'APPROVE', module: 'LEAVE' }), async (req, res) => {
  const before = await prisma.leaveRequest.findUnique({ where: { id: req.params.id } });
  const leave = await prisma.leaveRequest.update({ where: { id: req.params.id }, data: { status: 'APPROVED', approvedById: req.user.userId, approvedAt: new Date() } });
  await req.activity({ description: `Approved leave ${leave.id}`, metadata: { before, after: leave } });
  res.json(leave);
});

router.post('/:id/reject', requireAuth, requirePermission('leave.approve'), activityLogger({ action: 'REJECT', module: 'LEAVE' }), async (req, res) => {
  const before = await prisma.leaveRequest.findUnique({ where: { id: req.params.id } });
  const leave = await prisma.leaveRequest.update({ where: { id: req.params.id }, data: { status: 'REJECTED', approvedById: req.user.userId, approvedAt: new Date() } });
  await req.activity({ description: `Rejected leave ${leave.id}`, metadata: { before, after: leave } });
  res.json(leave);
});

export default router;

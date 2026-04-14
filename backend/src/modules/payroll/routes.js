import { Router } from 'express';
import { prisma } from '../../config/prisma.js';
import { requireAuth, requirePermission } from '../../middleware/auth.js';
import { activityLogger } from '../../middleware/activityLog.js';

const router = Router();

router.get('/', requireAuth, requirePermission('payroll.read'), async (_req, res) => {
  const payroll = await prisma.payroll.findMany({ orderBy: { periodStart: 'desc' }, take: 100 });
  res.json(payroll);
});

router.post('/process', requireAuth, requirePermission('payroll.process'), activityLogger({ action: 'PROCESS', module: 'PAYROLL' }), async (req, res) => {
  const { employeeId, periodStart, periodEnd, baseSalary, bonus = 0, deduction = 0 } = req.body;
  const netSalary = baseSalary + bonus - deduction;
  const payroll = await prisma.payroll.create({
    data: { employeeId, periodStart: new Date(periodStart), periodEnd: new Date(periodEnd), baseSalary, bonus, deduction, netSalary, status: 'PROCESSED' }
  });
  await req.activity({ description: `Processed payroll for ${employeeId}`, metadata: { payrollId: payroll.id, netSalary } });
  res.status(201).json(payroll);
});

export default router;

import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../config/prisma.js';
import { requireAuth, requirePermission } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { activityLogger } from '../../middleware/activityLog.js';

const router = Router();

const listSchema = z.object({
  body: z.object({}),
  params: z.object({}),
  query: z.object({ page: z.string().optional(), pageSize: z.string().optional(), q: z.string().optional() })
});

const employeeSchema = z.object({
  body: z.object({
    employeeCode: z.string(),
    fullName: z.string().min(3),
    email: z.string().email(),
    departmentId: z.string(),
    title: z.string(),
    salary: z.number().nonnegative()
  }),
  params: z.object({}),
  query: z.object({})
});

router.get('/', requireAuth, requirePermission('employee.read'), validate(listSchema), async (req, res) => {
  const page = Number(req.query.page || 1);
  const pageSize = Number(req.query.pageSize || 10);
  const q = req.query.q || '';

  const where = q ? { OR: [{ fullName: { contains: q, mode: 'insensitive' } }, { employeeCode: { contains: q } }] } : {};

  const [data, total] = await Promise.all([
    prisma.employee.findMany({
      where,
      include: { department: true, user: { select: { email: true } } },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.employee.count({ where })
  ]);

  res.json({ data, meta: { page, pageSize, total } });
});

router.post(
  '/',
  requireAuth,
  requirePermission('employee.create'),
  validate(employeeSchema),
  activityLogger({ action: 'CREATE', module: 'EMPLOYEE' }),
  async (req, res) => {
    const employee = await prisma.employee.create({ data: req.validated.body });
    await req.activity({ description: `Created employee ${employee.fullName}`, metadata: { employeeId: employee.id, after: employee } });
    res.status(201).json(employee);
  }
);

router.put(
  '/:id',
  requireAuth,
  requirePermission('employee.update'),
  activityLogger({ action: 'UPDATE', module: 'EMPLOYEE' }),
  async (req, res) => {
    const before = await prisma.employee.findUnique({ where: { id: req.params.id } });
    const employee = await prisma.employee.update({ where: { id: req.params.id }, data: req.body });
    await req.activity({ description: `Updated employee ${employee.fullName}`, metadata: { employeeId: employee.id, before, after: employee } });
    res.json(employee);
  }
);

router.delete(
  '/:id',
  requireAuth,
  requirePermission('employee.delete'),
  activityLogger({ action: 'DELETE', module: 'EMPLOYEE' }),
  async (req, res) => {
    const before = await prisma.employee.findUnique({ where: { id: req.params.id } });
    await prisma.employee.delete({ where: { id: req.params.id } });
    await req.activity({ description: `Deleted employee ${before?.fullName || req.params.id}`, metadata: { before } });
    res.status(204).send();
  }
);

export default router;

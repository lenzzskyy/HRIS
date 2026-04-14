import { Router } from 'express';
import { prisma } from '../../config/prisma.js';
import { requireAuth, requirePermission } from '../../middleware/auth.js';
import { activityLogger } from '../../middleware/activityLog.js';

const router = Router();

router.get('/company-profile', requireAuth, requirePermission('settings.read'), async (_req, res) => {
  const data = await prisma.companySetting.findFirst();
  res.json(data);
});

router.put('/company-profile', requireAuth, requirePermission('settings.update'), activityLogger({ action: 'UPDATE', module: 'SETTINGS' }), async (req, res) => {
  const before = await prisma.companySetting.findFirst();
  const data = await prisma.companySetting.upsert({
    where: { id: before?.id || 'default-company-setting' },
    update: req.body,
    create: { id: 'default-company-setting', ...req.body }
  });
  await req.activity({ description: 'Updated company profile', metadata: { before, after: data } });
  res.json(data);
});

export default router;

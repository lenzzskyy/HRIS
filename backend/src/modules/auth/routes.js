import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';

import { prisma } from '../../config/prisma.js';
import { env } from '../../config/env.js';
import { validate } from '../../middleware/validate.js';
import { loginSchema, refreshSchema } from './schemas.js';
import { logActivity } from '../../middleware/activityLog.js';
import { signAccessToken, signRefreshToken } from '../../utils/tokens.js';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true
});

router.post('/login', loginLimiter, validate(loginSchema), async (req, res) => {
  const { email, password } = req.validated.body;
  const user = await prisma.user.findUnique({
    where: { email },
    include: { role: { include: { rolePermissions: { include: { permission: true } } } } }
  });

  if (!user) {
    return res.status(401).json({ message: 'Email/password salah' });
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    return res.status(423).json({ message: 'Akun terkunci sementara' });
  }

  const validPassword = await bcrypt.compare(password, user.passwordHash);

  if (!validPassword) {
    const failedAttempts = user.failedLoginAttempts + 1;
    const lockedUntil = failedAttempts >= 5 ? new Date(Date.now() + 30 * 60 * 1000) : null;

    await prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: failedAttempts, lockedUntil }
    });

    await logActivity({
      userId: user.id,
      action: 'LOGIN_FAILED',
      module: 'AUTH',
      description: `Failed login for ${email}`,
      metadata: { failedAttempts },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] || 'unknown'
    });

    return res.status(401).json({ message: 'Email/password salah' });
  }

  const permissions = user.role.rolePermissions.map((rp) => rp.permission.code);
  const tokenPayload = { userId: user.id, role: user.role.name, permissions };
  const accessToken = signAccessToken(tokenPayload);
  const refreshToken = signRefreshToken({ userId: user.id });

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() }
    }),
    prisma.session.create({
      data: {
        userId: user.id,
        refreshToken,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] || 'unknown',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    })
  ]);

  await logActivity({
    userId: user.id,
    action: 'LOGIN',
    module: 'AUTH',
    description: `User ${user.email} logged in`,
    metadata: { role: user.role.name },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'] || 'unknown'
  });

  res.json({ accessToken, refreshToken, user: { id: user.id, email: user.email, role: user.role.name, permissions } });
});

router.post('/refresh', validate(refreshSchema), async (req, res) => {
  const { refreshToken } = req.validated.body;

  try {
    const decoded = jwt.verify(refreshToken, env.jwtRefreshSecret);
    const session = await prisma.session.findFirst({
      where: { refreshToken, userId: decoded.userId, revokedAt: null, expiresAt: { gt: new Date() } },
      include: { user: { include: { role: { include: { rolePermissions: { include: { permission: true } } } } } } }
    });

    if (!session) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    const permissions = session.user.role.rolePermissions.map((rp) => rp.permission.code);
    const accessToken = signAccessToken({ userId: session.user.id, role: session.user.role.name, permissions });

    return res.json({ accessToken });
  } catch {
    return res.status(401).json({ message: 'Invalid refresh token' });
  }
});

router.post('/logout', async (req, res) => {
  const { refreshToken } = req.body;
  if (refreshToken) {
    await prisma.session.updateMany({
      where: { refreshToken, revokedAt: null },
      data: { revokedAt: new Date() }
    });
  }
  res.status(204).send();
});

export default router;

import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  try {
    req.user = jwt.verify(token, env.jwtAccessSecret);
    return next();
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

export function requirePermission(permissionCode) {
  return (req, res, next) => {
    const permissions = req.user?.permissions || [];
    if (!permissions.includes(permissionCode)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    return next();
  };
}

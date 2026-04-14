import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';

import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import authRoutes from './modules/auth/routes.js';
import employeeRoutes from './modules/employees/routes.js';
import attendanceRoutes from './modules/attendance/routes.js';
import payrollRoutes from './modules/payroll/routes.js';
import leaveRoutes from './modules/leave/routes.js';
import activityRoutes from './modules/activity/routes.js';
import settingsRoutes from './modules/settings/routes.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

app.set('trust proxy', 1);
app.use(pinoHttp({ logger }));
app.use(helmet());
app.use(cors({ origin: env.frontendUrl, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/auth', authRoutes);
app.use('/employees', employeeRoutes);
app.use('/attendance', attendanceRoutes);
app.use('/payroll', payrollRoutes);
app.use('/leave-requests', leaveRoutes);
app.use('/activity-logs', activityRoutes);
app.use('/settings', settingsRoutes);

app.use(errorHandler);

app.listen(env.port, () => {
  logger.info(`HRIS backend running on port ${env.port}`);
});

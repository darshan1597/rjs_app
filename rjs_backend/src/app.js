import cors from 'cors';
import express from 'express';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { errorHandler, notFoundHandler } from './common/middleware/error-handler.js';
import { env } from './config/env.js';
import { adminAuthRouter } from './modules/admins/admin-auth.routes.js';
import { auditRouter } from './modules/audit/audit.routes.js';
import { employeeRouter } from './modules/employees/employee.routes.js';
import { healthRouter } from './modules/health/health.routes.js';
import { systemSettingsRouter } from './modules/settings/system-settings.routes.js';
import { adminDashboardRouter } from './modules/dashboard/admin-dashboard.routes.js';
import { employeeDashboardRouter } from './modules/dashboard/employee-dashboard.routes.js';
import { driverRouter } from './modules/drivers/driver.routes.js';
import { bookingRouter } from './modules/bookings/booking.routes.js';
import { tourPackageRouter } from './modules/tour-packages/tour-package.routes.js';
import { driverFiles, mediaRouter, tourPackageImages } from './modules/media/media.routes.js';
import { paymentRouter } from './modules/payments/payment.routes.js';
import { supportRouter } from './modules/support/support.routes.js';
import { customerAuthRouter } from './modules/customers/customer-auth.routes.js';
import { customerAddressRouter } from './modules/customers/customer-address.routes.js';
import { customerBookingRouter } from './modules/customers/customer-booking.routes.js';
import { driverAuthRouter } from './modules/drivers/driver-auth.routes.js';
import { driverTripRouter } from './modules/drivers/driver-trip.routes.js';

function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.use(pinoHttp({
    redact: {
      paths: ['req.headers.authorization', 'req.headers.cookie'],
      censor: '[REDACTED]',
    },
  }));
  app.use(helmet());
  app.use(cors({
    origin(origin, callback) {
      if (!origin || env.clientOrigins.includes(origin)) return callback(null, true);
      return callback(null, false);
    },
    credentials: true,
  }));
  app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: 'draft-8' }));
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: false }));

  app.use('/api/v1/health', healthRouter);
  app.use('/api/v1/admin/auth', adminAuthRouter);
  app.use('/api/v1/admin/employees', employeeRouter);
  app.use('/api/v1/admin/audit-logs', auditRouter);
  app.use('/api/v1/admin/system-settings', systemSettingsRouter);
  app.use('/api/v1/admin/dashboard', adminDashboardRouter);
  app.use('/api/v1/admin/employee-dashboard', employeeDashboardRouter);
  app.use('/api/v1/admin/drivers', driverRouter);
  app.use('/api/v1/admin/bookings', bookingRouter);
  app.use('/api/v1/admin/tour-packages', tourPackageRouter);
  app.use('/api/v1/admin/media', mediaRouter);
  app.use('/api/v1/media/tour-package-images', tourPackageImages);
  app.use('/api/v1/media/driver-files', driverFiles);
  app.use('/api/v1/admin/payments', paymentRouter);
  app.use('/api/v1/admin/support-tickets', supportRouter);
  app.use('/api/v1/customer/auth', customerAuthRouter);
  app.use('/api/v1/customer/addresses', customerAddressRouter);
  app.use('/api/v1/customer/bookings', customerBookingRouter);
  app.use('/api/v1/driver/auth', driverAuthRouter);
  app.use('/api/v1/driver/trips', driverTripRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

export { createApp };

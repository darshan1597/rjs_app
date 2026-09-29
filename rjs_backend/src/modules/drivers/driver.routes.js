import express from 'express';
import { validate } from '../../common/middleware/validate.js';
import { authenticateAdmin, requireEmployee } from '../admins/admin-auth.middleware.js';
import { confirmPhoneVerification, createDriver, getDriverDetails, listDrivers, requestPhoneVerification, reviewDriverChange, updateDriverStatus } from './driver.controller.js';
import { createDriverSchema, driverDetailsSchema, listDriversSchema, phoneVerificationConfirmSchema, phoneVerificationRequestSchema, reviewDriverChangeSchema, updateDriverStatusSchema } from './driver.schemas.js';

const driverRouter = express.Router();

driverRouter.use(authenticateAdmin, requireEmployee);
driverRouter.get('/', validate(listDriversSchema), listDrivers);
driverRouter.post('/phone-verification/request-otp', validate(phoneVerificationRequestSchema), requestPhoneVerification);
driverRouter.post('/phone-verification/verify-otp', validate(phoneVerificationConfirmSchema), confirmPhoneVerification);
driverRouter.post('/', validate(createDriverSchema), createDriver);
driverRouter.patch('/:driverId/change-requests/:requestId/review', validate(reviewDriverChangeSchema), reviewDriverChange);
driverRouter.get('/:driverId', validate(driverDetailsSchema), getDriverDetails);
driverRouter.patch('/:driverId/status', validate(updateDriverStatusSchema), updateDriverStatus);

export { driverRouter };

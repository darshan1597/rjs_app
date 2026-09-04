import express from 'express';
import { validate } from '../../common/middleware/validate.js';
import { authenticateAdmin, requireEmployee } from '../admins/admin-auth.middleware.js';
import { confirmPhoneVerification, createDriver, getDriverDetails, listDrivers, requestPhoneVerification, updateDriverStatus } from './driver.controller.js';
import { createDriverSchema, driverDetailsSchema, listDriversSchema, phoneVerificationConfirmSchema, phoneVerificationRequestSchema, updateDriverStatusSchema } from './driver.schemas.js';

const driverRouter = express.Router();
driverRouter.use(authenticateAdmin, requireEmployee);
driverRouter.get('/', validate(listDriversSchema), listDrivers);
driverRouter.post('/phone-verification/request-otp', validate(phoneVerificationRequestSchema), requestPhoneVerification);
driverRouter.post('/phone-verification/verify-otp', validate(phoneVerificationConfirmSchema), confirmPhoneVerification);
driverRouter.post('/', validate(createDriverSchema), createDriver);
driverRouter.get('/:driverId', validate(driverDetailsSchema), getDriverDetails);
driverRouter.patch('/:driverId/status', validate(updateDriverStatusSchema), updateDriverStatus);
export { driverRouter };

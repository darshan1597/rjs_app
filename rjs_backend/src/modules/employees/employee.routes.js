import express from 'express';
import { validate } from '../../common/middleware/validate.js';
import { authenticateAdmin, requirePermission } from '../admins/admin-auth.middleware.js';
import { createEmployee, listEmployees, resetEmployeeMfa, updateEmployee } from './employee.controller.js';
import { createEmployeeSchema, employeeActionSchema, listEmployeesSchema, updateEmployeeSchema } from './employee.schemas.js';

const employeeRouter = express.Router();

employeeRouter.use(authenticateAdmin);
employeeRouter.get('/', requirePermission('employees.view'), validate(listEmployeesSchema), listEmployees);
employeeRouter.post('/', requirePermission('employees.create'), validate(createEmployeeSchema), createEmployee);
employeeRouter.patch('/:employeeId', requirePermission('employees.update'), validate(updateEmployeeSchema), updateEmployee);
employeeRouter.post('/:employeeId/mfa/reset', requirePermission('employees.update'), validate(employeeActionSchema), resetEmployeeMfa);

export { employeeRouter };

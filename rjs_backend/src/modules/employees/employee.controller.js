import { writeAuditLog } from '../audit/audit.service.js';
import { createEmployee as createRecord, listEmployees as listRecords, resetEmployeeMfa as resetMfaRecord, updateEmployee as updateRecord } from './employee.service.js';

async function listEmployees(req, res, next) {
  try { const result = await listRecords(req.validated.query); return res.json({ success: true, data: { items: result.items.map((item) => item.toSafeObject()), pagination: result.pagination } }); } catch (error) { return next(error); }
}
async function createEmployee(req, res, next) {
  try {
    const employee = await createRecord(req.validated.body, req.admin.id);
    await writeAuditLog({ req, action: 'employee.create', actor: req.admin, targetType: 'AdminAccount', targetId: employee.id });
    return res.status(201).json({ success: true, data: employee.toSafeObject() });
  } catch (error) { return next(error); }
}
async function updateEmployee(req, res, next) {
  try {
    const employee = await updateRecord(req.validated.params.employeeId, req.validated.body);
    await writeAuditLog({ req, action: 'employee.update', actor: req.admin, targetType: 'AdminAccount', targetId: employee.id, metadata: req.validated.body });
    return res.json({ success: true, data: employee.toSafeObject() });
  } catch (error) { return next(error); }
}
async function resetEmployeeMfa(req, res, next) {
  try {
    const employee = await resetMfaRecord(req.validated.params.employeeId);
    await writeAuditLog({ req, action: 'employee.mfa.reset', actor: req.admin, targetType: 'AdminAccount', targetId: employee.id });
    return res.json({ success: true, data: { reset: true } });
  } catch (error) { return next(error); }
}
export { createEmployee, listEmployees, resetEmployeeMfa, updateEmployee };

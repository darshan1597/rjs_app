import { AdminAccount } from '../admins/admin-account.model.js';
import { AdminSession } from '../admins/admin-session.model.js';
import { SystemSettings } from './system-settings.model.js';
const getSystemSettings = () => SystemSettings.findOneAndUpdate({ singletonKey: 'GLOBAL' }, { $setOnInsert: { singletonKey: 'GLOBAL' } }, { new: true, upsert: true, setDefaultsOnInsert: true }).populate('updatedBy', 'name email');
const updateSystemSettings = (data, adminId) => SystemSettings.findOneAndUpdate({ singletonKey: 'GLOBAL' }, { $set: { company: data.company, security: data.security, apps: data.apps, updatedBy: adminId } }, { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }).populate('updatedBy', 'name email');
async function revokeAllEmployeeSessions() { const employeeIds = await AdminAccount.find({ accountType: 'EMPLOYEE' }).distinct('_id'); const result = await AdminSession.updateMany({ adminId: { $in: employeeIds }, revokedAt: null }, { revokedAt: new Date() }); return result.modifiedCount; }
export { getSystemSettings, revokeAllEmployeeSessions, updateSystemSettings };

import { writeAuditLog } from "../audit/audit.service.js";
import {
    getSystemSettings,
    revokeAllEmployeeSessions,
    updateSystemSettings,
} from "./system-settings.service.js";
async function getSettings(req, res, next) {
    try {
        return res.json({ success: true, data: await getSystemSettings() });
    } catch (error) {
        return next(error);
    }
}
async function updateSettings(req, res, next) {
    try {
        const settings = await updateSystemSettings(
            req.validated.body,
            req.admin.id,
        );
        await writeAuditLog({
            req,
            action: "system.settings.updated",
            actor: req.admin,
            targetType: "SystemSettings",
            targetId: settings.id,
        });
        return res.json({ success: true, data: settings });
    } catch (error) {
        return next(error);
    }
}
async function revokeEmployeeSessions(req, res, next) {
    try {
        const revokedSessions = await revokeAllEmployeeSessions();
        await writeAuditLog({
            req,
            action: "employee.sessions.revoked_all",
            actor: req.admin,
            targetType: "AdminSession",
            metadata: { revokedSessions },
        });
        return res.json({ success: true, data: { revokedSessions } });
    } catch (error) {
        return next(error);
    }
}
export { getSettings, revokeEmployeeSessions, updateSettings };

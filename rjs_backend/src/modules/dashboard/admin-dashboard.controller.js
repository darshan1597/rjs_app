import { getAdminDashboard } from "./admin-dashboard.service.js";

async function dashboard(req, res, next) {
    try {
        return res.json({ success: true, data: await getAdminDashboard() });
    } catch (error) {
        return next(error);
    }
}

export { dashboard };

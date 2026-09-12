import { getEmployeeDashboard } from "./employee-dashboard.service.js";

async function employeeDashboard(req, res, next) {
    try {
        return res.json({ success: true, data: await getEmployeeDashboard() });
    } catch (error) {
        return next(error);
    }
}

export { employeeDashboard };

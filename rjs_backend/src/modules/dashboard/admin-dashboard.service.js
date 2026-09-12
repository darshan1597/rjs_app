import mongoose from "mongoose";
import { AdminAccount } from "../admins/admin-account.model.js";
import { AuditLog } from "../audit/audit-log.model.js";

const monthStart = (offset) => {
  const date = new Date();
  date.setDate(1);
  date.setHours(0, 0, 0, 0);
  date.setMonth(date.getMonth() + offset);
  return date;
};

async function revenueSummary() {
  const payments = mongoose.connection.db.collection("payments");
  const start = monthStart(-6);
  const [totalResult, monthlyResult] = await Promise.all([
    payments.aggregate([
        { $match: { status: { $in: ["COMPLETED", "SUCCESS", "CAPTURED"] } } },
        { $group: { _id: null, total: { $sum: { $ifNull: ["$amount", 0] } } } },
      ]).toArray(),
    payments.aggregate([
        {
          $match: {
            status: { $in: ["COMPLETED", "SUCCESS", "CAPTURED"] },
            createdAt: { $gte: start },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            total: { $sum: { $ifNull: ["$amount", 0] } },
          },
        },
      ]).toArray(),
  ]);
  const monthly = Array.from({ length: 7 }, (_, index) => {
    const date = monthStart(index - 6);
    const match = monthlyResult.find((item) =>
      item._id.year === date.getFullYear() &&
      item._id.month === date.getMonth() + 1,
    );
    return {
      label: date.toLocaleString("en-IN", { month: "short" }),
      value: match?.total || 0,
    };
  });
  return { total: totalResult[0]?.total || 0, monthly };
}
async function getAdminDashboard() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [totalEmployees, activeEmployees, mfaEnabledEmployees, auditEvents, recentAuditLogs, revenue,] = await Promise.all([
    AdminAccount.countDocuments({ accountType: "EMPLOYEE" }),
    AdminAccount.countDocuments({ accountType: "EMPLOYEE", status: "ACTIVE" }),
    AdminAccount.countDocuments({
      accountType: "EMPLOYEE",
      "mfa.enabled": true,
    }),
    AuditLog.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
    AuditLog.find()
      .populate("actorId", "name email accountType")
      .sort({ createdAt: -1 })
      .limit(6),
    revenueSummary(),
  ]);
  return {
    metrics: {
      totalEmployees,
      activeEmployees,
      mfaEnabledEmployees,
      auditEvents,
      totalRevenue: revenue.total,
    },
    revenue: revenue.monthly,
    recentAuditLogs,
  };
}

export { getAdminDashboard };

import mongoose from "mongoose";
import { AdminAccount } from "../admins/admin-account.model.js";
import { AuditLog } from "../audit/audit-log.model.js";

const INDIA_OFFSET_MS = 330 * 60 * 1000;
const monthStart = (offset) => {
  const indiaNow = new Date(Date.now() + INDIA_OFFSET_MS);
  return new Date(Date.UTC(indiaNow.getUTCFullYear(), indiaNow.getUTCMonth() + offset, 1) - INDIA_OFFSET_MS);
};

async function revenueSummary() {
  const payments = mongoose.connection.db.collection("payments");
  const refunds = mongoose.connection.db.collection("refunds");
  const start = monthStart(-6);
  const [totalResult, monthlyResult, refundTotalResult, monthlyRefundResult] = await Promise.all([
    payments.aggregate([
        { $match: { status: { $in: ["PAID", "PARTIALLY_REFUNDED", "REFUNDED"] } } },
        { $group: { _id: null, total: { $sum: { $ifNull: ["$amount", 0] } } } },
      ]).toArray(),
    payments.aggregate([
        {
          $match: {
            status: { $in: ["PAID", "PARTIALLY_REFUNDED", "REFUNDED"] },
            paidAt: { $gte: start },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: { date: "$paidAt", timezone: "Asia/Kolkata" } },
              month: { $month: { date: "$paidAt", timezone: "Asia/Kolkata" } },
            },
            total: { $sum: { $ifNull: ["$amount", 0] } },
          },
        },
      ]).toArray(),
    refunds.aggregate([
      { $match: { status: "COMPLETED" } },
      { $group: { _id: null, total: { $sum: { $ifNull: ["$eligibleAmount", 0] } } } },
    ]).toArray(),
    refunds.aggregate([
      { $match: { status: "COMPLETED", completedAt: { $gte: start } } },
      { $group: { _id: { year: { $year: { date: "$completedAt", timezone: "Asia/Kolkata" } },
        month: { $month: { date: "$completedAt", timezone: "Asia/Kolkata" } } },
        total: { $sum: { $ifNull: ["$eligibleAmount", 0] } } } },
    ]).toArray(),
  ]);
  const monthly = Array.from({ length: 7 }, (_, index) => {
    const date = monthStart(index - 6);
    const indiaDate = new Date(date.getTime() + INDIA_OFFSET_MS);
    const match = monthlyResult.find((item) =>
      item._id.year === indiaDate.getUTCFullYear() &&
      item._id.month === indiaDate.getUTCMonth() + 1,
    );
    const refundMatch = monthlyRefundResult.find((item) => item._id.year === indiaDate.getUTCFullYear()
      && item._id.month === indiaDate.getUTCMonth() + 1);
    return {
      label: indiaDate.toLocaleString("en-IN", { month: "short", timeZone: "UTC" }),
      value: (match?.total || 0) - (refundMatch?.total || 0),
    };
  });
  return { total: (totalResult[0]?.total || 0) - (refundTotalResult[0]?.total || 0), monthly };
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

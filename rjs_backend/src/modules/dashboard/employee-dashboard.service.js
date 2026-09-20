import mongoose from "mongoose";

const collection = (name) => mongoose.connection.db.collection(name);
const INDIA_OFFSET_MS = 330 * 60 * 1000;
const indiaDayBounds = (now = new Date()) => {
  const india = new Date(now.getTime() + INDIA_OFFSET_MS);
  const start = new Date(Date.UTC(india.getUTCFullYear(), india.getUTCMonth(), india.getUTCDate()) - INDIA_OFFSET_MS);
  return { start, end: new Date(start.getTime() + 24 * 60 * 60 * 1000) };
};
async function count(name, filter) {
  return collection(name).countDocuments(filter);
}
async function getEmployeeDashboard() {
  const { start, end } = indiaDayBounds();
  const activityStart = new Date(start);
  activityStart.setDate(activityStart.getDate() - 6);
  const [todayBookings, liveTrips, pendingDrivers, completedToday, revenueResult, recentBookings, statusRows, activityRows, driverRows,] = await Promise.all([
    count("bookings", { createdAt: { $gte: start, $lt: end } }),
    count("bookings", {
      status: {
        $in: ["DRIVER_ACCEPTED", "DRIVER_EN_ROUTE", "ARRIVED", "IN_PROGRESS"],
      },
    }),
    count("drivers", {
      status: "PENDING",
    }),
    count("bookings", {
      completedAt: { $gte: start, $lt: end },
    }),
    collection("payments").aggregate([
      {
        $match: {
          status: { $in: ["PAID", "PARTIALLY_REFUNDED", "REFUNDED"] },
          paidAt: { $gte: start, $lt: end },
        },
      },
      { $group: { _id: null, total: { $sum: { $ifNull: ["$amount", 0] } } } },
    ]).toArray(),
    collection("bookings").find({}).sort({ createdAt: -1 }).limit(6).project({
      bookingNumber: 1,
      "customer.name": 1,
      serviceType: 1,
      status: 1,
      createdAt: 1,
      pickup: 1,
      amount: 1,
      totalAmount: 1,
    }).toArray(),
    collection("bookings").aggregate([
      {
        $group: {
          _id: { $ifNull: ["$status", "UNKNOWN"] },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]).toArray(),
    collection("bookings").aggregate([
      { $match: { createdAt: { $gte: activityStart, $lt: end } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "Asia/Kolkata" } },
          count: { $sum: 1 },
        },
      },
    ]).toArray(),
    collection("drivers").find({ status: "ACTIVE" }).sort({ operationalStatus: -1, updatedAt: -1 }).limit(5).project({
      driverCode: 1,
      "personal.fullName": 1,
      "vehicle.category": 1,
      "vehicle.registrationNumber": 1,
      operationalStatus: 1,
    }).toArray(),
  ]);

  const activity = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(activityStart);
    date.setDate(date.getDate() + index);
    const india = new Date(date.getTime() + INDIA_OFFSET_MS);
    const key = `${india.getUTCFullYear()}-${String(india.getUTCMonth() + 1).padStart(2, "0")}-${String(india.getUTCDate()).padStart(2, "0")}`;
    return {
      label: date.toLocaleString("en-IN", { weekday: "short" }),
      value: activityRows.find((row) => row._id === key)?.count || 0,
    };
  });

  return {
    metrics: {
      todayBookings,
      liveTrips,
      pendingDrivers,
      completedToday,
      todayRevenue: revenueResult[0]?.total || 0,
    },
    activity,
    bookingStatuses: statusRows.map((row) => ({
      status: row._id,
      count: row.count,
    })),
    recentBookings,
    drivers: driverRows,
  };
}

export { getEmployeeDashboard, indiaDayBounds };

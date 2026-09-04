import mongoose from 'mongoose';

const collection = (name) => mongoose.connection.db.collection(name);
async function count(name, filter) { return collection(name).countDocuments(filter); }
async function getEmployeeDashboard() {
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const end = new Date(start); end.setDate(end.getDate() + 1);
  const activityStart = new Date(start); activityStart.setDate(activityStart.getDate() - 6);
  const [todayBookings, liveTrips, pendingDrivers, completedToday, revenueResult, recentBookings, statusRows, activityRows, driverRows] = await Promise.all([
    count('bookings', { createdAt: { $gte: start, $lt: end } }),
    count('bookings', { status: { $in: ['ACCEPTED', 'DRIVER_ARRIVING', 'ARRIVED', 'IN_PROGRESS'] } }),
    count('drivers', { status: { $in: ['PENDING', 'PENDING_VERIFICATION', 'UNDER_REVIEW'] } }),
    count('bookings', { status: 'COMPLETED', completedAt: { $gte: start, $lt: end } }),
    collection('payments').aggregate([{ $match: { status: { $in: ['COMPLETED', 'SUCCESS', 'CAPTURED'] }, createdAt: { $gte: start, $lt: end } } }, { $group: { _id: null, total: { $sum: { $ifNull: ['$amount', 0] } } } }]).toArray(),
    collection('bookings').find({}).sort({ createdAt: -1 }).limit(6).project({ bookingNumber: 1, customerName: 1, serviceType: 1, status: 1, createdAt: 1, pickup: 1, amount: 1, totalAmount: 1 }).toArray(),
    collection('bookings').aggregate([{ $group: { _id: { $ifNull: ['$status', 'UNKNOWN'] }, count: { $sum: 1 } } }, { $sort: { count: -1 } }]).toArray(),
    collection('bookings').aggregate([{ $match: { createdAt: { $gte: activityStart, $lt: end } } }, { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } }]).toArray(),
    collection('drivers').find({ status: 'ACTIVE' }).sort({ operationalStatus: -1, updatedAt: -1 }).limit(5).project({ driverCode: 1, 'personal.fullName': 1, 'vehicle.category': 1, 'vehicle.registrationNumber': 1, operationalStatus: 1 }).toArray(),
  ]);
  const activity = Array.from({ length: 7 }, (_, index) => { const date = new Date(activityStart); date.setDate(date.getDate() + index); const key = date.toISOString().slice(0, 10); return { label: date.toLocaleString('en-IN', { weekday: 'short' }), value: activityRows.find((row) => row._id === key)?.count || 0 }; });
  return { metrics: { todayBookings, liveTrips, pendingDrivers, completedToday, todayRevenue: revenueResult[0]?.total || 0 }, activity, bookingStatuses: statusRows.map((row) => ({ status: row._id, count: row.count })), recentBookings, drivers: driverRows };
}
export { getEmployeeDashboard };

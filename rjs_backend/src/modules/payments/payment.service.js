import { AppError } from "../../common/errors/app-error.js";
import { DriverPayout, Payment, Refund } from "./payment.model.js";
async function listPayments({ tab, page, limit, search, status, method }) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const filter = {};
    if (status) filter.status = status;
    if (method && tab === "transactions") filter.method = method;
    if (search) {
        const value = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        filter.$or =
        tab === "transactions"
            ? [
                { transactionId: { $regex: value, $options: "i" } },
                { customerName: { $regex: value, $options: "i" } },
                { customerPhone: { $regex: value, $options: "i" } },
            ]
            : tab === "payouts"
            ? [{ payoutId: { $regex: value, $options: "i" } }]
            : [
                { refundId: { $regex: value, $options: "i" } },
                { customerName: { $regex: value, $options: "i" } },
                ];
    }
    const Model =
        tab === "transactions"
        ? Payment
        : tab === "payouts"
            ? DriverPayout
            : Refund;
    let query = Model.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);
    if (tab === "transactions")
        query = query.populate("bookingId", "bookingNumber serviceType");
    if (tab === "payouts")
        query = query.populate("driverId", "driverCode personal.fullName");
    const [
        items,
        total,
        collected,
        pendingPayments,
        pendingPayouts,
        pendingRefunds,
        failedPayments,
    ] = await Promise.all([
        query.lean(),
        Model.countDocuments(filter),
        Payment.aggregate([
        { $match: { status: "PAID", paidAt: { $gte: start } } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
        ]),
        Payment.countDocuments({ status: "PENDING" }),
        DriverPayout.countDocuments({ status: { $in: ["PENDING", "FAILED"] } }),
        Refund.countDocuments({ status: "PENDING" }),
        Payment.countDocuments({ status: "FAILED" }),
    ]);
    return {
        items,
        summary: {
            collectedToday: collected[0]?.total || 0,
            pendingPayments,
            pendingPayouts,
            pendingRefunds,
            failedPayments,
        },
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
}
async function retryPayout(id) {
    const item = await DriverPayout.findOneAndUpdate(
        { _id: id, status: "FAILED" },
        { $set: { status: "PROCESSING", failureReason: "" } },
        { new: true },
    );
    if (!item)
        throw new AppError(
            409,
            "PAYOUT_NOT_RETRYABLE",
            "Only failed payouts can be retried",
        );
    return item;
}
async function reviewRefund(id, { decision, note }, adminId) {
    const item = await Refund.findOneAndUpdate(
        { _id: id, status: "PENDING" },
        {
            $set: {
                status: decision,
                reviewNote: note,
                reviewedBy: adminId,
                reviewedAt: new Date(),
            },
        },
        { new: true },
    );
    if (!item)
        throw new AppError(
            409,
            "REFUND_ALREADY_REVIEWED",
            "This refund has already been reviewed",
        );
    return item;
}
export { listPayments, retryPayout, reviewRefund };

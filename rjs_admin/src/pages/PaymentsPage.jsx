import { useEffect, useState } from "react";
import {
    LuBanknote,
    LuChevronLeft,
    LuChevronRight,
    LuCircleAlert,
    LuCircleCheck,
    LuClock3,
    LuCreditCard,
    LuRefreshCw,
    LuSearch,
} from "react-icons/lu";
import AdminLayout from "../components/AdminLayout.jsx";
import { get, post } from "../services/api.js";

const money = (v) =>
    new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(v || 0)
;
const date = (v) =>
    v
        ? new Intl.DateTimeFormat("en-IN", {
            dateStyle: "medium",
            timeStyle: "short",
        }).format(new Date(v))
        : "—"
;
const tone = {
    PAID: "bg-emerald-50 text-emerald-700",
    COMPLETED: "bg-emerald-50 text-emerald-700",
    APPROVED: "bg-emerald-50 text-emerald-700",
    PENDING: "bg-amber-50 text-amber-700",
    PROCESSING: "bg-blue-50 text-blue-700",
    PARTIALLY_REFUNDED: "bg-violet-50 text-violet-700",
    REFUNDED: "bg-violet-50 text-violet-700",
    FAILED: "bg-red-50 text-red-600",
    REJECTED: "bg-red-50 text-red-600",
    ON_HOLD: "bg-slate-100 text-slate-600",
};
export default function PaymentsPage() {
    const [tab, setTab] = useState("transactions");
    const [items, setItems] = useState([]);
    const [summary, setSummary] = useState({});
    const [pagination, setPagination] = useState(null);
    const [page, setPage] = useState(1);
    const [query, setQuery] = useState("");
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("");
    const [method, setMethod] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [review, setReview] = useState(null);
    useEffect(() => {
        const t = setTimeout(() => {
        setPage(1);
        setSearch(query);
        }, 350);
        return () => clearTimeout(t);
    }, [query]);
    async function load() {
        setLoading(true);
        setError("");
        try {
            const p = new URLSearchParams({ tab, page, limit: 10 });
            if (search) p.set("search", search);
            if (status) p.set("status", status);
            if (method && tab === "transactions") p.set("method", method);
            const d = await get(`/admin/payments?${p}`);
            setItems(d.items);
            setSummary(d.summary);
            setPagination(d.pagination);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }
    useEffect(() => {
        load();
    }, [tab, page, search, status, method]);
    function switchTab(value) {
        setTab(value);
        setPage(1);
        setStatus("");
        setMethod("");
    }
    async function retry(id) {
        try {
            await post(`/admin/payments/payouts/${id}/retry`, {});
            load();
        } catch (e) {
            setError(e.message);
        }
    }
    async function decide(decision) {
        try {
            await post(`/admin/payments/refunds/${review.item._id}/review`, {
                decision,
                note: review.note,
            });
            setReview(null);
            load();
        } catch (e) {
            setError(e.message);
        }
    }
    const cards = [
        [
            "Collected today",
            money(summary.collectedToday),
            LuBanknote,
            "bg-emerald-50 text-emerald-600",
        ],
        [
            "Pending payments",
            summary.pendingPayments || 0,
            LuClock3,
            "bg-amber-50 text-amber-600",
        ],
        [
            "Driver payouts pending",
            summary.pendingPayouts || 0,
            LuCreditCard,
            "bg-blue-50 text-blue-600",
        ],
        [
            "Refunds pending",
            summary.pendingRefunds || 0,
            LuRefreshCw,
            "bg-violet-50 text-violet-600",
        ],
        [
            "Failed payments",
            summary.failedPayments || 0,
            LuCircleAlert,
            "bg-red-50 text-red-600",
        ],
    ];
    return (
        <AdminLayout>
            <main className="mx-auto max-w-[1500px] p-4 sm:p-6 lg:p-7">
                <div className="mb-6">
                    <p className="text-[10px] font-bold tracking-[1.8px] text-blue-600">
                        ONLINE PAYMENTS
                    </p>
                    <h1 className="text-3xl font-black">Payments</h1>
                    <p className="mt-1 text-[11px] text-slate-500">
                        Monitor online collections, driver payouts and customer refunds.
                        Cash is not accepted.
                    </p>
                </div>
                <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                    {cards.map(([label, value, Icon, color]) => (
                        <article
                            key={label}
                            className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                        >
                            <span
                                className={`grid h-11 w-11 place-items-center rounded-full text-lg ${color}`}
                            >
                                <Icon />
                            </span>
                            <div>
                                <p className="text-[9px] text-slate-500">{label}</p>
                                <b className="text-xl">{value}</b>
                            </div>
                        </article>
                    ))}
                </section>
                <section className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex border-b border-slate-100 px-5 pt-4">
                        {[
                            ["transactions", "Transactions"],
                            ["payouts", "Driver Payouts"],
                            ["refunds", "Refunds"],
                        ].map(([value, label]) => (
                            <button
                                key={value}
                                onClick={() => switchTab(value)}
                                className={`border-b-2 px-5 py-3 text-[10px] font-extrabold ${tab === value ? "border-blue-600 text-blue-600" : "border-transparent text-slate-400"}`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                    <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row">
                        <div className="relative sm:w-80">
                            <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className="h-10 w-full rounded-xl border bg-slate-50 pl-9 pr-3 text-[10px]"
                                placeholder="Search transaction, customer or ID"
                            />
                        </div>
                        {tab === "transactions" && (
                            <select
                                value={method}
                                onChange={(e) => setMethod(e.target.value)}
                                className="h-10 rounded-xl border bg-slate-50 px-3 text-[9px]"
                            >
                                <option value="">All online methods</option>
                                <option>UPI</option>
                                <option>CARD</option>
                                <option>NET_BANKING</option>
                                <option>WALLET</option>
                            </select>
                        )}
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="h-10 rounded-xl border bg-slate-50 px-3 text-[9px]"
                        >
                            <option value="">All statuses</option>
                            {(tab === "transactions"
                                ? [
                                    "PENDING",
                                    "PAID",
                                    "FAILED",
                                    "REFUNDED",
                                    "PARTIALLY_REFUNDED",
                                ]
                                : tab === "payouts"
                                ? ["PENDING", "PROCESSING", "PAID", "FAILED", "ON_HOLD"]
                                : [
                                    "PENDING",
                                    "APPROVED",
                                    "REJECTED",
                                    "PROCESSING",
                                    "COMPLETED",
                                    "FAILED",
                                    ]
                            ).map((x) => (
                                <option key={x}>{x}</option>
                            ))}
                        </select>
                    </div>
                    {error && (
                        <p className="m-5 rounded-xl bg-red-50 p-3 text-[10px] font-bold text-red-600">
                            {error}
                        </p>
                    )}
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[950px] text-left text-[9px]">
                            <thead className="bg-slate-50 text-[8px] uppercase text-slate-400">
                                <tr>
                                    {(tab === "transactions"
                                        ? [
                                            "Transaction",
                                            "Booking / Customer",
                                            "Method",
                                            "Amount",
                                            "Date",
                                            "Status",
                                        ]
                                        : tab === "payouts"
                                        ? [
                                            "Payout",
                                            "Driver",
                                            "Period / Trips",
                                            "Gross",
                                            "Deductions / Incentives",
                                            "Net payout",
                                            "Status",
                                            "Action",
                                            ]
                                        : [
                                            "Refund",
                                            "Customer / Reason",
                                            "Original amount",
                                            "Charge",
                                            "Eligible refund",
                                            "Requested",
                                            "Status",
                                            "Action",
                                            ]
                                    ).map((x) => (
                                        <th key={x} className="px-5 py-3">
                                            {x}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    Array.from({ length: 5 }, (_, i) => (
                                        <tr key={i}>
                                            <td colSpan="8" className="border-t p-3">
                                                <div className="h-11 animate-pulse rounded bg-slate-100" />
                                            </td>
                                        </tr>
                                    ))
                                ) : items.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan="8"
                                            className="py-16 text-center text-slate-400"
                                        >
                                            No {tab} found.
                                        </td>
                                    </tr>
                                ) : (
                                    items.map((item) =>
                                        tab === "transactions" ? (
                                            <tr key={item._id} className="border-t">
                                                <td className="px-5 py-4 font-bold text-blue-600">
                                                    {item.transactionId}
                                                </td>
                                                <td className="px-5 py-4">
                                                    <b>{item.bookingId?.bookingNumber || "—"}</b>
                                                    <small className="block text-slate-400">
                                                        {item.customerName} · {item.customerPhone}
                                                    </small>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <b>{item.method}</b>
                                                    <small className="block text-slate-400">
                                                        {item.methodDisplay}
                                                    </small>
                                                </td>
                                                <td className="px-5 py-4 font-bold">
                                                    {money(item.amount)}
                                                </td>
                                                <td className="px-5 py-4">
                                                    {date(item.paidAt || item.createdAt)}
                                                </td>
                                                <td className="px-5 py-4">
                                                    <span
                                                        className={`rounded-full px-2 py-1 font-bold ${tone[item.status]}`}
                                                    >
                                                        {item.status.replaceAll("_", " ")}
                                                    </span>
                                                    {item.status === "FAILED" && (
                                                        <small
                                                            className="mt-1 block max-w-48 text-red-500"
                                                            title={item.failureDescription || item.failureReason || "Payment failed"}
                                                        >
                                                            {item.failureDescription || item.failureReason || item.failureCode || "Payment failed"}
                                                        </small>
                                                    )}
                                                </td>
                                            </tr>
                                        ) : tab === "payouts" ? (
                                            <tr key={item._id} className="border-t">
                                                <td className="px-5 py-4 font-bold text-blue-600">
                                                    {item.payoutId}
                                                </td>
                                                <td className="px-5 py-4">
                                                    <b>{item.driverId?.personal?.fullName || "Driver"}</b>
                                                    <small className="block text-slate-400">
                                                        {item.driverId?.driverCode} · Bank ••••
                                                        {item.bankAccountEnding}
                                                    </small>
                                                </td>
                                                <td className="px-5 py-4">
                                                    {date(item.periodStart)}
                                                    <small className="block text-slate-400">
                                                        {item.completedTrips} trips
                                                    </small>
                                                </td>
                                                <td className="px-5 py-4">
                                                    {money(item.grossEarnings)}
                                                </td>
                                                <td className="px-5 py-4 text-red-500">
                                                    -{money(item.deductions)}
                                                    <small className="block text-emerald-600">
                                                        +{money(item.incentives)}
                                                    </small>
                                                </td>
                                                <td className="px-5 py-4 font-bold">
                                                    {money(item.netPayout)}
                                                </td>
                                                <td className="px-5 py-4">
                                                    <span
                                                        className={`rounded-full px-2 py-1 font-bold ${tone[item.status]}`}
                                                    >
                                                        {item.status}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4">
                                                    {item.status === "FAILED" && (
                                                        <button
                                                        onClick={() => retry(item._id)}
                                                        className="rounded-lg bg-orange-500 px-3 py-2 font-bold text-white"
                                                        >
                                                        Retry
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ) : (
                                            <tr key={item._id} className="border-t">
                                                <td className="px-5 py-4 font-bold text-blue-600">
                                                    {item.refundId}
                                                </td>
                                                <td className="px-5 py-4">
                                                    <b>{item.customerName}</b>
                                                    <small className="block max-w-60 truncate text-slate-400">
                                                        {item.reason}
                                                    </small>
                                                </td>
                                                <td className="px-5 py-4">
                                                    {money(item.originalAmount)}
                                                </td>
                                                <td className="px-5 py-4 text-red-500">
                                                    {money(item.cancellationCharge)}
                                                </td>
                                                <td className="px-5 py-4 font-bold">
                                                    {money(item.eligibleAmount)}
                                                </td>
                                                <td className="px-5 py-4">{date(item.createdAt)}</td>
                                                <td className="px-5 py-4">
                                                    <span
                                                        className={`rounded-full px-2 py-1 font-bold ${tone[item.status]}`}
                                                    >
                                                        {item.status}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4">
                                                    {item.status === "PENDING" && (
                                                        <button
                                                        onClick={() => setReview({ item, note: "" })}
                                                        className="rounded-lg bg-blue-600 px-3 py-2 font-bold text-white"
                                                        >
                                                        Review
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ),
                                    )
                                )}
                            </tbody>
                        </table>
                    </div>
                    {pagination?.pages > 1 && (
                        <div className="flex justify-between border-t p-4 text-[9px]">
                            <span>
                                Page {pagination.page} of {pagination.pages}
                            </span>
                            <div className="flex gap-2">
                                <button
                                    disabled={page <= 1}
                                    onClick={() => setPage(page - 1)}
                                    className="grid h-8 w-8 place-items-center rounded border disabled:opacity-30"
                                >
                                    <LuChevronLeft />
                                </button>
                                <button
                                    disabled={page >= pagination.pages}
                                    onClick={() => setPage(page + 1)}
                                    className="grid h-8 w-8 place-items-center rounded border disabled:opacity-30"
                                >
                                    <LuChevronRight />
                                </button>
                            </div>
                        </div>
                    )}
                </section>
                {review && (
                    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4 backdrop-blur-sm">
                        <div className="w-full max-w-md rounded-2xl bg-white p-6">
                            <h2 className="text-xl font-black">Review refund</h2>
                            <p className="mt-2 text-[10px] text-slate-500">
                                Eligible refund: {money(review.item.eligibleAmount)}
                            </p>
                            <textarea
                                value={review.note}
                                onChange={(e) => setReview({ ...review, note: e.target.value })}
                                className="mt-4 h-24 w-full rounded-xl border p-3 text-[10px]"
                                placeholder="Required review note"
                            />
                            <div className="mt-4 flex gap-2">
                                <button
                                    onClick={() => setReview(null)}
                                    className="h-10 flex-1 rounded-xl border text-[9px] font-bold"
                                >
                                    Cancel
                                </button>
                                <button
                                    disabled={review.note.trim().length < 3}
                                    onClick={() => decide("REJECTED")}
                                    className="h-10 flex-1 rounded-xl bg-red-50 text-[9px] font-bold text-red-600 disabled:opacity-40"
                                >
                                    Reject
                                </button>
                                <button
                                    disabled={review.note.trim().length < 3}
                                    onClick={() => decide("APPROVED")}
                                    className="h-10 flex-1 rounded-xl bg-emerald-600 text-[9px] font-bold text-white disabled:opacity-40"
                                >
                                    <LuCircleCheck className="inline" /> Approve
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </AdminLayout>
    );
}

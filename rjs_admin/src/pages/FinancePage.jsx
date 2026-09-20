import { useEffect, useState } from "react";
import {
  LuBanknote,
  LuCircleDollarSign,
  LuClock3,
  LuRefreshCw,
  LuWalletCards,
} from "react-icons/lu";
import AdminLayout from "../components/AdminLayout.jsx";
import { get, post } from "../services/api.js";

const money = (paise) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(
    (paise || 0) / 100,
  );
const date = (value) =>
  value
    ? new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "—";
export default function FinancePage() {
  const [period, setPeriod] = useState("all"),
    [data, setData] = useState(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true);
  const [review, setReview] = useState(null),
    [busy, setBusy] = useState(false),
    [refreshKey, setRefreshKey] = useState(0);
  useEffect(() => {
    let active = true;
    const load = () => {
      setLoading(true);
      get(`/admin/finance?period=${period}`)
        .then((result) => {
          if (active) {
            setData(result);
            setError("");
          }
        })
        .catch((e) => {
          if (active) setError(e.message);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    };
    load();
    const timer = setInterval(load, 30000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [period, refreshKey]);
  async function reviewRefund(decision) {
    setBusy(true);
    try {
      await post(`/admin/payments/refunds/${review.item._id}/review`, {
        decision,
        note: review.note,
      });
      setReview(null);
      setRefreshKey((value) => value + 1);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  const s = data?.summary || {};
  const cards = [
    [
      "Gross ride revenue",
      money(s.grossRideRevenuePaise),
      LuBanknote,
      "bg-blue-50 text-blue-600",
    ],
    [
      "Completed refunds",
      money(s.completedRefundsPaise),
      LuRefreshCw,
      "bg-red-50 text-red-600",
    ],
    [
      "Net ride revenue",
      money(s.netRideRevenuePaise),
      LuCircleDollarSign,
      "bg-emerald-50 text-emerald-600",
    ],
    [
      "Pending customer payments",
      money(s.pendingCustomerPaymentsPaise),
      LuClock3,
      "bg-amber-50 text-amber-600",
    ],
    [
      "Wallet liability",
      money(s.walletLiabilityPaise),
      LuWalletCards,
      "bg-violet-50 text-violet-600",
    ],
  ];
  return (
    <AdminLayout>
      <main className="mx-auto max-w-[1500px] p-4 sm:p-6 lg:p-7">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="text-[10px] font-bold tracking-[1.8px] text-blue-600">
              FINANCIAL OVERVIEW
            </p>
            <h1 className="text-3xl font-black">Finance</h1>
            <p className="mt-1 text-[11px] text-slate-500">
              Revenue, refunds, receivables and wallet liability without
              double-counting wallet spend.
            </p>
          </div>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="h-10 rounded-xl border bg-white px-3 text-[10px] font-bold"
          >
            <option value="all">All time</option>
            <option value="today">Today</option>
            <option value="30d">Last 30 days</option>
            <option value="year">This year</option>
          </select>
        </div>
        {loading && <div className="mt-4 h-1 animate-pulse bg-blue-500" />}
        {error && (
          <p className="mt-4 rounded-xl bg-red-50 p-3 text-[10px] font-bold text-red-600">
            {error}
          </p>
        )}
        <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {cards.map(([label, value, Icon, tone]) => (
            <article
              key={label}
              className="rounded-2xl border bg-white p-4 shadow-sm"
            >
              <span
                className={`grid h-10 w-10 place-items-center rounded-full ${tone}`}
              >
                <Icon />
              </span>
              <p className="mt-3 text-[9px] text-slate-500">{label}</p>
              <b className="text-xl">{value}</b>
              {label === "Pending customer payments" && (
                <small className="block text-slate-400">
                  {s.pendingCustomerPaymentsCount || 0} rides
                </small>
              )}
            </article>
          ))}
        </section>
        <section className="mt-4 grid gap-4 lg:grid-cols-2">
          <Breakdown
            title="Revenue composition"
            rows={[
              ["Gateway-paid rides", s.gatewayRideRevenuePaise],
              ["Wallet-paid rides", s.walletRideRevenuePaise],
              ["Wallet top-up cash collected", s.walletTopupCollectionsPaise],
            ]}
          />
          <Breakdown
            title="Outstanding and adjustments"
            rows={[
              [
                `Pending refunds (${s.pendingRefundsCount || 0})`,
                s.pendingRefundsPaise,
              ],
              [
                `Held withdrawals (${s.heldWithdrawalsCount || 0})`,
                s.heldWithdrawalsPaise,
              ],
              ["Approved manual credits", s.manualCreditsPaise],
              ["Approved manual debits", s.manualDebitsPaise],
            ]}
          />
        </section>
        <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-[10px] text-blue-900">
          <b>Accounting distinction:</b> wallet top-ups are cash collected and
          remaining balances are a liability. Wallet ride payments are ride
          revenue, but not a second cash collection. Manual wallet credits are
          shown separately and do not reduce revenue. Only completed refund
          records reduce net ride revenue.
        </div>
        <section className="mt-4 grid gap-4 xl:grid-cols-2">
          <RecordTable
            title="Recent refund records"
            empty="No refund records."
            headers={["Created", "Customer", "Amount", "Status", "Action"]}
            rows={(data?.recentRefunds || []).map((x) => [
              date(x.createdAt),
              x.customerName,
              money(Math.round((x.eligibleAmount || 0) * 100)),
              x.status,
              ["PENDING", "APPROVED", "PROCESSING", "FAILED"].includes(
                x.status,
              ) ? (
                <button
                  onClick={() => setReview({ item: x, note: "" })}
                  className="rounded-lg bg-blue-600 px-3 py-2 font-bold text-white"
                >
                  {x.status === "PENDING"
                    ? "Review"
                    : x.status === "FAILED"
                      ? "Review retry"
                      : "Check status"}
                </button>
              ) : (
                "—"
              ),
            ])}
          />
          <RecordTable
            title="Recent wallet adjustments"
            empty="No adjustments."
            headers={["Created", "Customer", "Amount", "Status"]}
            rows={(data?.recentAdjustments || []).map((x) => [
              date(x.createdAt),
              x.customerId?.name || "Customer",
              `${x.type === "CREDIT" ? "+" : "−"}${money(x.amountPaise)}`,
              x.status,
            ])}
          />
        </section>
        {review && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6">
              <h2 className="text-xl font-black">Review refund</h2>
              <p className="mt-2 text-[10px] text-slate-500">
                {review.item.customerName} ·{" "}
                {money(Math.round(review.item.eligibleAmount * 100))} ·{" "}
                {review.item.channel}
              </p>
              <p className="mt-3 rounded-xl bg-slate-50 p-3 text-[10px]">
                {review.item.reason}
              </p>
              <textarea
                value={review.note}
                onChange={(e) => setReview({ ...review, note: e.target.value })}
                className="mt-4 h-24 w-full rounded-xl border p-3 text-[10px]"
                placeholder="Required review note"
              />
              <div className="mt-4 flex gap-2">
                <button
                  disabled={busy}
                  onClick={() => setReview(null)}
                  className="h-10 flex-1 rounded-xl border text-[9px] font-bold"
                >
                  Cancel
                </button>
                {review.item.status === "PENDING" && (
                  <button
                    disabled={busy || review.note.trim().length < 3}
                    onClick={() => reviewRefund("REJECTED")}
                    className="h-10 flex-1 rounded-xl bg-red-50 text-[9px] font-bold text-red-600 disabled:opacity-40"
                  >
                    Reject
                  </button>
                )}
                <button
                  disabled={busy || review.note.trim().length < 3}
                  onClick={() => reviewRefund("APPROVED")}
                  className="h-10 flex-1 rounded-xl bg-emerald-600 text-[9px] font-bold text-white disabled:opacity-40"
                >
                  {review.item.status === "FAILED"
                    ? "Retry refund"
                    : ["APPROVED", "PROCESSING"].includes(review.item.status)
                      ? "Check Razorpay"
                      : "Approve"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </AdminLayout>
  );
}
function Breakdown({ title, rows }) {
  return (
    <article className="rounded-2xl border bg-white p-5 shadow-sm">
      <h2 className="text-sm font-black">{title}</h2>
      <div className="mt-3 divide-y">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between py-3 text-[10px]">
            <span className="text-slate-500">{label}</span>
            <b>{money(value)}</b>
          </div>
        ))}
      </div>
    </article>
  );
}
function RecordTable({ title, headers, rows, empty }) {
  return (
    <article className="overflow-hidden rounded-2xl border bg-white shadow-sm">
      <h2 className="p-5 text-sm font-black">{title}</h2>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-left text-[9px]">
          <thead className="bg-slate-50 uppercase text-slate-400">
            <tr>
              {headers.map((x) => (
                <th key={x} className="px-4 py-3">
                  {x}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((row, i) => (
                <tr key={i} className="border-t">
                  {row.map((x, j) => (
                    <td key={j} className="px-4 py-3">
                      {x}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={headers.length}
                  className="p-8 text-center text-slate-400"
                >
                  {empty}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </article>
  );
}

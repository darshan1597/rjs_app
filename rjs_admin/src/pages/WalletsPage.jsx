import { useEffect, useState } from "react";
import {
  LuArchive,
  LuChevronLeft,
  LuChevronRight,
  LuClock3,
  LuSearch,
  LuWalletCards,
  LuArrowUpFromLine,
  LuX,
} from "react-icons/lu";
import AdminLayout from "../components/AdminLayout.jsx";
import { get, post } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";

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
const badge = {
  CREDITED: "bg-emerald-50 text-emerald-700",
  APPROVED: "bg-emerald-50 text-emerald-700",
  PENDING: "bg-amber-50 text-amber-700",
  REJECTED: "bg-red-50 text-red-600",
  PROCESSING: "bg-blue-50 text-blue-700",
  PAID: "bg-emerald-50 text-emerald-700",
  FAILED: "bg-red-50 text-red-600",
  REVERSED: "bg-red-50 text-red-600",
  ARCHIVED: "bg-slate-100 text-slate-600",
};

export default function WalletsPage() {
  const { admin } = useAuth();
  const [items, setItems] = useState([]),
    [summary, setSummary] = useState({}),
    [pagination, setPagination] = useState();
  const [query, setQuery] = useState(""),
    [search, setSearch] = useState(""),
    [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [details, setDetails] = useState(null),
    [detailLoading, setDetailLoading] = useState(false);
  const [adjustments, setAdjustments] = useState([]),
    [adjustment, setAdjustment] = useState(null),
    [review, setReview] = useState(null),
    [actionBusy, setActionBusy] = useState(false),
    [refreshKey, setRefreshKey] = useState(0);
  const [withdrawals, setWithdrawals] = useState([]),
    [withdrawalReview, setWithdrawalReview] = useState(null);
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      setSearch(query.trim());
    }, 350);
    return () => clearTimeout(timer);
  }, [query]);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    const params = new URLSearchParams({ page, limit: 10 });
    if (search) params.set("search", search);
    get(`/admin/wallets?${params}`)
      .then((data) => {
        if (active) {
          setItems(data.items);
          setSummary(data.summary);
          setPagination(data.pagination);
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [page, search, refreshKey]);
  async function loadAdjustments() {
    try {
      const suffix =
        admin.accountType === "SUPER_ADMIN" ? "&status=PENDING" : "";
      setAdjustments(
        (await get(`/admin/wallets/adjustments?limit=50${suffix}`)).items,
      );
    } catch (e) {
      setError(e.message);
    }
  }
  useEffect(() => {
    loadAdjustments();
    loadWithdrawals();
  }, [admin.accountType]);
  async function loadWithdrawals() {
    try { setWithdrawals((await get('/admin/wallets/withdrawals?limit=50')).items); }
    catch (e) { setError(e.message); }
  }
  async function openWallet(customerId) {
    setDetailLoading(true);
    setError("");
    try {
      setDetails(await get(`/admin/wallets/${customerId}?limit=50`));
    } catch (e) {
      setError(e.message);
    } finally {
      setDetailLoading(false);
    }
  }
  async function submitAdjustment(event) {
    event.preventDefault();
    setActionBusy(true);
    setError("");
    try {
      await post(`/admin/wallets/${adjustment.customerId}/adjustments`, {
        type: adjustment.type,
        amountPaise: Math.round(Number(adjustment.amount) * 100),
        reason: adjustment.reason,
        idempotencyKey: adjustment.idempotencyKey,
      });
      setAdjustment(null);
      await loadAdjustments();
    } catch (e) {
      setError(e.message);
    } finally {
      setActionBusy(false);
    }
  }
  async function submitReview(decision) {
    setActionBusy(true);
    setError("");
    try {
      await post(`/admin/wallets/adjustments/${review.item._id}/review`, {
        decision,
        note: review.note,
      });
      const customerId = review.item.customerId?._id;
      setReview(null);
      await loadAdjustments();
      setRefreshKey((value) => value + 1);
      if (details?.customer?._id === customerId) await openWallet(customerId);
    } catch (e) {
      setError(e.message);
    } finally {
      setActionBusy(false);
    }
  }
  async function submitWithdrawalReview(decision) {
    setActionBusy(true); setError("");
    try {
      await post(`/admin/wallets/withdrawals/${withdrawalReview.item._id}/review`, {
        decision, note: withdrawalReview.note,
      });
      setWithdrawalReview(null);
      await loadWithdrawals();
      setRefreshKey((value) => value + 1);
    } catch (e) { setError(e.message); } finally { setActionBusy(false); }
  }
  const cards = [
    [
      "Total wallet balance",
      money(summary.balancePaise),
      LuWalletCards,
      "bg-blue-50 text-blue-600",
    ],
    [
      "Funded wallets",
      summary.fundedWallets || 0,
      LuWalletCards,
      "bg-emerald-50 text-emerald-600",
    ],
    [
      "Pending top-ups",
      summary.pendingTopups || 0,
      LuClock3,
      "bg-amber-50 text-amber-600",
    ],
    [
      "Archived unpaid",
      summary.archivedTopups || 0,
      LuArchive,
      "bg-slate-100 text-slate-600",
    ],
  ];
  return (
    <AdminLayout>
      <main className="mx-auto max-w-[1500px] p-4 sm:p-6 lg:p-7">
        <p className="text-[10px] font-bold tracking-[1.8px] text-blue-600">
          CUSTOMER FUNDS · CONTROLLED ACCESS
        </p>
        <h1 className="text-3xl font-black">Wallets</h1>
        <p className="mt-1 text-[11px] text-slate-500">
          Inspect balances and top-ups. Every adjustment requires an employee
          request and separate Super Admin approval.
        </p>
        <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map(([label, value, Icon, tone]) => (
            <article
              key={label}
              className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <span
                className={`grid h-11 w-11 place-items-center rounded-full text-lg ${tone}`}
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
        <AdjustmentQueue
          items={adjustments}
          superAdmin={admin.accountType === "SUPER_ADMIN"}
          onReview={setReview}
        />
        <WithdrawalQueue items={withdrawals} superAdmin={admin.accountType === "SUPER_ADMIN"}
          onReview={(item) => setWithdrawalReview({ item, note: "" })} />
        <section className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b p-5">
            <div className="relative max-w-md">
              <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search customer name, phone or email"
                className="h-10 w-full rounded-xl border bg-slate-50 pl-9 pr-3 text-[10px]"
              />
            </div>
          </div>
          {error && (
            <p className="m-5 rounded-xl bg-red-50 p-3 text-[10px] font-bold text-red-600">
              {error}
            </p>
          )}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-[10px]">
              <thead className="bg-slate-50 text-[9px] uppercase text-slate-400">
                <tr>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Contact</th>
                  <th className="px-5 py-3">Balance</th>
                  <th className="px-5 py-3">Wallet updated</th>
                  <th className="px-5 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" className="p-10 text-center text-slate-400">
                      Loading wallets…
                    </td>
                  </tr>
                ) : !items.length ? (
                  <tr>
                    <td colSpan="5" className="p-10 text-center text-slate-400">
                      No customers found.
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item._id} className="border-t">
                      <td className="px-5 py-4">
                        <b>{item.name || "Customer"}</b>
                        <small className="block text-slate-400">
                          {item.status}
                        </small>
                      </td>
                      <td className="px-5 py-4">
                        {item.phone}
                        <small className="block text-slate-400">
                          {item.email || "No email"}
                        </small>
                      </td>
                      <td className="px-5 py-4 text-sm font-black">
                        {money(item.balancePaise)}
                      </td>
                      <td className="px-5 py-4">
                        {date(item.walletUpdatedAt)}
                      </td>
                      <td className="px-5 py-4">
                        <button
                          disabled={detailLoading}
                          onClick={() => openWallet(item._id)}
                          className="rounded-lg bg-blue-600 px-3 py-2 font-bold text-white disabled:opacity-40 cursor-pointer"
                        >
                          View details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {pagination && (
            <div className="flex items-center justify-between border-t p-4 text-[9px]">
              <span>
                {pagination.total} customers · Page {pagination.page} of{" "}
                {pagination.pages}
              </span>
              <div className="flex gap-2">
                <button
                  aria-label="Previous page"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="grid h-8 w-8 place-items-center rounded border disabled:opacity-30"
                >
                  <LuChevronLeft />
                </button>
                <button
                  aria-label="Next page"
                  disabled={page >= pagination.pages}
                  onClick={() => setPage((p) => p + 1)}
                  className="grid h-8 w-8 place-items-center rounded border disabled:opacity-30"
                >
                  <LuChevronRight />
                </button>
              </div>
            </div>
          )}
        </section>
      </main>
      {details && (
        <WalletDetails
          data={details}
          onClose={() => setDetails(null)}
          onRequest={
            admin.accountType === "EMPLOYEE"
              ? () =>
                  setAdjustment({
                    customerId: details.customer._id,
                    customerName: details.customer.name || "Customer",
                    type: "CREDIT",
                    amount: "",
                    reason: "",
                    idempotencyKey: crypto.randomUUID().replaceAll("-", ""),
                  })
              : null
          }
        />
      )}
      {adjustment && (
        <AdjustmentDialog
          value={adjustment}
          setValue={setAdjustment}
          busy={actionBusy}
          onSubmit={submitAdjustment}
        />
      )}
      {review && (
        <ReviewDialog
          value={review}
          setValue={setReview}
          busy={actionBusy}
          onDecision={submitReview}
        />
      )}
      {withdrawalReview && <WithdrawalReviewDialog value={withdrawalReview} setValue={setWithdrawalReview}
        busy={actionBusy} onDecision={submitWithdrawalReview} />}
    </AdminLayout>
  );
}

function WithdrawalQueue({ items, superAdmin, onReview }) {
  return <section className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
    <div className="flex items-center gap-3 border-b p-4"><span className="grid h-9 w-9 place-items-center rounded-full bg-violet-50 text-violet-600"><LuArrowUpFromLine /></span>
      <div><h2 className="text-sm font-black">Wallet withdrawals</h2><p className="text-[9px] text-slate-500">Only verified real-money balances can leave the wallet.</p></div></div>
    <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-[9px]"><thead className="bg-slate-50 uppercase text-slate-400"><tr>
      {['Created','Customer','Amount','UPI ID','Status','Action'].map((x)=><th key={x} className="px-4 py-3">{x}</th>)}</tr></thead><tbody>
      {items.length ? items.map((x)=><tr key={x._id} className="border-t"><td className="px-4 py-3">{date(x.createdAt)}</td>
        <td className="px-4 py-3"><b>{x.customerId?.name || 'Customer'}</b><small className="block text-slate-400">{x.customerId?.phone}</small></td>
        <td className="px-4 py-3 font-bold">{money(x.amountPaise)}</td><td className="px-4 py-3">{x.vpa}</td>
        <td className="px-4 py-3"><span className={`rounded-full px-2 py-1 font-bold ${badge[x.status] || 'bg-blue-50 text-blue-700'}`}>{x.status}</span></td>
        <td className="px-4 py-3">{superAdmin && ['PENDING','PROCESSING'].includes(x.status)
          ? <button onClick={()=>onReview(x)} className="rounded-lg bg-blue-600 px-3 py-2 font-bold text-white">{x.status === 'PENDING' ? 'Review' : 'Check payout'}</button> : '—'}</td></tr>)
        : <tr><td colSpan="6" className="p-8 text-center text-slate-400">No withdrawal requests.</td></tr>}
    </tbody></table></div></section>;
}

function WithdrawalReviewDialog({ value, setValue, busy, onDecision }) {
  return <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/60 p-4"><div className="w-full max-w-md rounded-2xl bg-white p-6">
    <h2 className="text-xl font-black">Review withdrawal</h2><p className="mt-2 text-[10px] text-slate-500">{money(value.item.amountPaise)} to {value.item.vpa}</p>
    <textarea value={value.note} onChange={(e)=>setValue({...value,note:e.target.value})} className="mt-4 h-24 w-full rounded-xl border p-3 text-[10px]" placeholder="Required review note"/>
    <div className="mt-4 flex gap-2"><button disabled={busy} onClick={()=>setValue(null)} className="h-10 flex-1 rounded-xl border text-[9px] font-bold">Cancel</button>
      {value.item.status === 'PENDING' && <button disabled={busy || value.note.trim().length < 3} onClick={()=>onDecision('REJECTED')} className="h-10 flex-1 rounded-xl bg-red-50 text-[9px] font-bold text-red-600 disabled:opacity-40">Reject</button>}
      <button disabled={busy || value.note.trim().length < 3} onClick={()=>onDecision('APPROVED')} className="h-10 flex-1 rounded-xl bg-emerald-600 text-[9px] font-bold text-white disabled:opacity-40">{value.item.status === 'PROCESSING' ? 'Check RazorpayX' : 'Approve & pay'}</button>
    </div></div></div>;
}

function WalletDetails({ data, onClose, onRequest }) {
  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-950/50 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <aside className="h-full w-full max-w-2xl overflow-y-auto bg-[#f6f8fc] p-5 shadow-2xl sm:p-7">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[9px] font-bold tracking-widest text-blue-600">
              CONTROLLED WALLET RECORD
            </p>
            <h2 className="text-2xl font-black">
              {data.customer.name || "Customer"}
            </h2>
            <p className="text-[10px] text-slate-500">
              {data.customer.phone} · {data.customer.email || "No email"}
            </p>
          </div>
          <button
            aria-label="Close wallet details"
            onClick={onClose}
            className="grid h-10 w-10 place-items-center rounded-xl border bg-white cursor-pointer"
          >
            <LuX />
          </button>
        </div>
        <div className="my-5 rounded-2xl bg-gradient-to-br from-blue-700 to-indigo-800 p-5 text-white">
          <p className="text-[9px] text-blue-200">AVAILABLE BALANCE</p>
          <b className="text-3xl">{money(data.wallet.balancePaise)}</b>
          <div className="mt-3 flex items-end justify-between gap-3">
            <p className="text-[9px] text-blue-200">
              Last wallet update: {date(data.wallet.updatedAt)}
            </p>
            {onRequest && (
              <button
                onClick={onRequest}
                className="rounded-lg bg-white px-3 py-2 text-[9px] font-black text-blue-700 cursor-pointer"
              >
                Request adjustment
              </button>
            )}
          </div>
        </div>
        <DetailTable
          title="Wallet ledger"
          empty="No wallet transactions."
          headers={["Date", "Type / Reference", "Amount", "Balance after"]}
          rows={data.ledger.map((x) => [
            date(x.createdAt),
            <span>
              <b>{x.type.replaceAll("_", " ")}</b>
              <small className="block max-w-48 truncate text-slate-400">
                {x.reference}
              </small>
            </span>,
            <span
              className={
                ["TOPUP", "ADMIN_CREDIT", "REFUND_CREDIT"].includes(x.type)
                  ? "font-bold text-emerald-600"
                  : "font-bold text-red-500"
              }
            >
              {["TOPUP", "ADMIN_CREDIT", "REFUND_CREDIT"].includes(x.type) ? "+" : "−"}
              {money(x.amountPaise)}
            </span>,
            money(x.balanceAfterPaise),
          ])}
        />
        <DetailTable
          title="Top-up attempts"
          empty="No top-up attempts."
          headers={["Created", "Amount", "State", "Gateway reference"]}
          rows={data.topups.map((x) => {
            const state =
              x.status === "CREDITED"
                ? "CREDITED"
                : x.archivedAt
                  ? "ARCHIVED"
                  : "PENDING";
            return [
              date(x.createdAt),
              money(x.amountPaise),
              <span
                className={`rounded-full px-2 py-1 font-bold ${badge[state]}`}
              >
                {state}
              </span>,
              <span>
                <span className="block max-w-44 truncate">
                  {x.orderId || "Order not created"}
                </span>
                <small className="block max-w-44 truncate text-slate-400">
                  {x.paymentId || x.archiveReason || "—"}
                </small>
              </span>,
            ];
          })}
        />
      </aside>
    </div>
  );
}

function AdjustmentQueue({ items, superAdmin, onReview }) {
  const [selected, setSelected] = useState(null);
  return (
    <>
      <section className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b p-4">
          <div>
            <h2 className="text-sm font-black">
              {superAdmin
                ? "Pending adjustment approvals"
                : "Your adjustment requests"}
            </h2>
            <p className="text-[9px] text-slate-500">
              {superAdmin
                ? "Approval applies the balance change atomically."
                : "A Super Admin must approve every request."}
            </p>
          </div>
          <span className="rounded-full bg-amber-50 px-3 py-1 text-[9px] font-bold text-amber-700">
            {items.length}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] text-left text-[9px]">
            <thead className="bg-slate-50 uppercase text-slate-400">
              <tr>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Request</th>
                <th className="px-4 py-3">Reason</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Review outcome</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {items.length ? (
                items.map((x) => (
                  <tr key={x._id} className="border-t">
                    <td className="px-4 py-3">{date(x.createdAt)}</td>
                    <td className="px-4 py-3">
                      <b>{x.customerId?.name || "Customer"}</b>
                      <small className="block text-slate-400">
                        {x.customerId?.phone}
                      </small>
                    </td>
                    <td
                      className={`px-4 py-3 font-black ${x.type === "CREDIT" ? "text-emerald-600" : "text-red-500"}`}
                    >
                      {x.type} {money(x.amountPaise)}
                    </td>
                    <td className="max-w-64 px-4 py-3">
                      <p className="line-clamp-2 break-words">{x.reason}</p>
                      <button
                        onClick={() => setSelected(x)}
                        className="mt-1 font-bold text-blue-600 cursor-pointer"
                      >
                        View full details
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-1 font-bold ${badge[x.status] || "bg-slate-100"}`}
                      >
                        {x.status}
                      </span>
                    </td>
                    <td className="max-w-72 px-4 py-3">
                      {x.status === "PENDING" ? (
                        <span className="text-slate-400">
                          Awaiting Super Admin review
                        </span>
                      ) : (
                        <span>
                          <b
                            className={`block line-clamp-2 break-words ${x.status === "APPROVED" ? "text-emerald-700" : "text-red-600"}`}
                          >
                            {x.reviewNote || "No review note recorded"}
                          </b>
                          <small className="mt-1 block text-slate-400">
                            {x.reviewedBy?.name || "Super Admin"} ·{" "}
                            {date(x.reviewedAt)}
                          </small>
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {superAdmin && x.status === "PENDING" ? (
                        <button
                          onClick={() => onReview({ item: x, note: "" })}
                          className="rounded-lg bg-blue-600 px-3 py-2 font-bold text-white cursor-pointer"
                        >
                          Review
                        </button>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="p-7 text-center text-slate-400">
                    No adjustment requests.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      {selected && (
        <AdjustmentDetailsDialog
          item={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}

function AdjustmentDetailsDialog({ item, onClose }) {
  return (
    <div
      className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/60 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[9px] font-bold tracking-widest text-blue-600">
              WALLET ADJUSTMENT
            </p>
            <h2 className="text-xl font-black">
              {item.type} {money(item.amountPaise)}
            </h2>
            <p className="text-[10px] text-slate-500">
              {item.customerId?.name || "Customer"} · {date(item.createdAt)}
            </p>
          </div>
          <button
            aria-label="Close adjustment details"
            onClick={onClose}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border cursor-pointer"
          >
            <LuX />
          </button>
        </div>
        <div className="mt-5">
          <p className="text-[9px] font-bold text-slate-400">EMPLOYEE REASON</p>
          <p className="mt-1 whitespace-pre-wrap break-words rounded-xl bg-slate-50 p-3 text-[11px]">
            {item.reason}
          </p>
        </div>
        <div className="mt-4">
          <p className="text-[9px] font-bold text-slate-400">REVIEW OUTCOME</p>
          {item.status === "PENDING" ? (
            <p className="mt-1 text-[11px] text-amber-700">
              Awaiting Super Admin review
            </p>
          ) : (
            <div className="mt-1 rounded-xl bg-slate-50 p-3">
              <p className="whitespace-pre-wrap break-words text-[11px]">
                {item.reviewNote || "No review note recorded"}
              </p>
              <p className="mt-2 text-[9px] text-slate-400">
                {item.reviewedBy?.name || "Super Admin"} ·{" "}
                {date(item.reviewedAt)}
              </p>
            </div>
          )}
        </div>
        <button
          onClick={onClose}
          className="mt-5 h-10 w-full rounded-xl bg-blue-600 text-[10px] font-bold text-white cursor-pointer"
        >
          Close
        </button>
      </div>
    </div>
  );
}

function AdjustmentDialog({ value, setValue, busy, onSubmit }) {
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/60 p-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-2xl bg-white p-6"
      >
        <h2 className="text-xl font-black">Request wallet adjustment</h2>
        <p className="mt-1 text-[10px] text-slate-500">
          {value.customerName} · No balance changes until approval.
        </p>
        <label className="mt-4 block text-[9px] font-bold">TYPE</label>
        <select
          value={value.type}
          onChange={(e) => setValue({ ...value, type: e.target.value })}
          className="mt-1 h-11 w-full rounded-xl border px-3 text-[10px]"
        >
          <option value="CREDIT">Credit wallet</option>
          <option value="DEBIT">Debit wallet</option>
        </select>
        <label className="mt-3 block text-[9px] font-bold">AMOUNT (₹)</label>
        <input
          required
          type="number"
          min="1"
          max="10000"
          step="0.01"
          value={value.amount}
          onChange={(e) => setValue({ ...value, amount: e.target.value })}
          className="mt-1 h-11 w-full rounded-xl border px-3 text-[10px]"
        />
        <label className="mt-3 block text-[9px] font-bold">REASON</label>
        <textarea
          required
          minLength="10"
          maxLength="500"
          value={value.reason}
          onChange={(e) => setValue({ ...value, reason: e.target.value })}
          className="mt-1 h-24 w-full rounded-xl border p-3 text-[10px]"
          placeholder="Explain why this adjustment is required"
        />
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => setValue(null)}
            className="h-10 flex-1 rounded-xl border text-[9px] font-bold cursor-pointer"
          >
            Cancel
          </button>
          <button
            disabled={busy || !value.amount || value.reason.trim().length < 10}
            className="h-10 flex-1 rounded-xl bg-blue-600 text-[9px] font-bold text-white disabled:opacity-40 cursor-pointer"
          >
            {busy ? "Submitting…" : "Submit for approval"}
          </button>
        </div>
      </form>
    </div>
  );
}

function ReviewDialog({ value, setValue, busy, onDecision }) {
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/60 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6">
        <h2 className="text-xl font-black">Review adjustment</h2>
        <p className="mt-2 text-[10px] text-slate-500">
          {value.item.type} {money(value.item.amountPaise)} for{" "}
          {value.item.customerId?.name || "customer"}
        </p>
        <p className="mt-3 rounded-xl bg-slate-50 p-3 text-[10px]">
          {value.item.reason}
        </p>
        <textarea
          value={value.note}
          onChange={(e) => setValue({ ...value, note: e.target.value })}
          className="mt-4 h-24 w-full rounded-xl border p-3 text-[10px]"
          placeholder="Required review note"
        />
        <div className="mt-4 flex gap-2">
          <button
            disabled={busy}
            onClick={() => setValue(null)}
            className="h-10 flex-1 rounded-xl border text-[9px] font-bold cursor-pointer"
          >
            Cancel
          </button>
          <button
            disabled={busy || value.note.trim().length < 3}
            onClick={() => onDecision("REJECTED")}
            className="h-10 flex-1 rounded-xl bg-red-50 text-[9px] font-bold text-red-600 disabled:opacity-40 cursor-pointer"
          >
            Reject
          </button>
          <button
            disabled={busy || value.note.trim().length < 3}
            onClick={() => onDecision("APPROVED")}
            className="h-10 flex-1 rounded-xl bg-emerald-600 text-[9px] font-bold text-white disabled:opacity-40 cursor-pointer"
          >
            Approve
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailTable({ title, headers, rows, empty }) {
  return (
    <section className="mb-5 overflow-hidden rounded-2xl border bg-white shadow-sm">
      <h3 className="border-b px-4 py-3 text-sm font-black">{title}</h3>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[570px] text-left text-[9px]">
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
                  {row.map((cell, j) => (
                    <td key={j} className="px-4 py-3">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={headers.length}
                  className="p-7 text-center text-slate-400"
                >
                  {empty}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

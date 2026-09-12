import { useEffect, useState } from "react";
import {
  LuCalendarClock,
  LuCarFront,
  LuChevronLeft,
  LuChevronRight,
  LuCircleCheck,
  LuClock3,
  LuSearch,
  LuUserRoundCheck,
  LuX,
} from "react-icons/lu";
import AdminLayout from "../components/AdminLayout.jsx";
import { get, post } from "../services/api.js";

const types = {
  IMMEDIATE_RIDE: "Nearby ride",
  SCHEDULED_RIDE: "Scheduled ride",
  CITY_ROUND_TRIP: "City round trip",
  RENTAL_PACKAGE: "Rental package",
  TOUR_PACKAGE: "Tour package",
  CUSTOM_TRIP: "Custom trip",
};
const statusTone = {
  NEW: "bg-slate-100 text-slate-600",
  PAYMENT_CONFIRMED: "bg-blue-50 text-blue-600",
  ASSIGNMENT_PENDING: "bg-orange-50 text-orange-600",
  ASSIGNED: "bg-violet-50 text-violet-600",
  DRIVER_EN_ROUTE: "bg-cyan-50 text-cyan-700",
  ARRIVED: "bg-cyan-50 text-cyan-700",
  IN_PROGRESS: "bg-emerald-50 text-emerald-700",
  COMPLETED: "bg-green-50 text-green-700",
  CANCELLED: "bg-red-50 text-red-600",
  NO_DRIVER_AVAILABLE: "bg-red-50 text-red-600",
  NO_SHOW: "bg-amber-50 text-amber-700",
};
const formatDate = (value) =>
  value
    ? new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "—";
const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);

function AssignmentPanel({ booking, close, assigned }) {
  const [drivers, setDrivers] = useState([]);
  const [selected, setSelected] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    get(`/admin/bookings/${booking._id}/eligible-drivers`)
      .then((data) => setDrivers(data.items))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [booking._id]);
  async function assign() {
    setSaving(true);
    setError("");
    try {
      await post(`/admin/bookings/${booking._id}/assign`, {
        driverId: selected,
        reason,
      });
      assigned();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }
  return (
    <div className="fixed inset-0 z-[80] flex justify-end bg-slate-950/45 backdrop-blur-sm">
      <button className="absolute inset-0" onClick={close} />
      <aside className="relative h-full w-full max-w-lg overflow-y-auto bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[9px] font-bold tracking-[1.5px] text-orange-500">
              DRIVER ASSIGNMENT
            </p>
            <h2 className="mt-1 text-2xl font-black">Assign a driver</h2>
            <p className="mt-1 text-[10px] text-slate-500">
              {booking.bookingNumber} · {types[booking.serviceType]}
            </p>
          </div>
          <button
            onClick={close}
            className="grid h-9 w-9 place-items-center rounded-xl bg-slate-100"
          >
            <LuX />
          </button>
        </div>
        <div className="mt-5 rounded-xl bg-slate-50 p-4 text-[10px]">
          <b>{booking.pickup.address}</b>
          <span className="mx-2 text-slate-400">→</span>
          <b>
            {booking.destination?.address ||
              booking.packageName ||
              "Destination after trip starts"}
          </b>
          <p className="mt-2 text-slate-500">
            {formatDate(booking.scheduledStartAt)} · {booking.passengerCount}{" "}
            passenger(s) · {booking.requestedVehicleType.replaceAll("_", " ")}
          </p>
        </div>
        <h3 className="mt-6 text-sm font-black">Eligible drivers</h3>
        <p className="mt-1 text-[9px] text-slate-400">
          Only verified, compatible and non-overlapping drivers are shown.
        </p>
        <div className="mt-4 space-y-3">
          {loading ? (
            Array.from({ length: 3 }, (_, i) => (
              <div
                key={i}
                className="h-20 animate-pulse rounded-xl bg-slate-100"
              />
            ))
          ) : drivers.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-[10px] text-slate-400">
              No eligible drivers are currently available.
            </div>
          ) : (
            drivers.map((driver) => (
              <button
                key={driver._id}
                onClick={() => setSelected(driver._id)}
                className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left ${selected === driver._id ? "border-blue-500 bg-blue-50" : "border-slate-200"}`}
              >
                <span className="grid h-10 w-10 place-items-center rounded-full bg-emerald-50 font-black text-emerald-600">
                  {driver.personal.fullName[0]}
                </span>
                <span className="flex-1">
                  <b className="block text-[11px]">
                    {driver.personal.fullName}
                  </b>
                  <small className="text-[8px] text-slate-500">
                    {driver.driverCode} · {driver.vehicle.registrationNumber} ·{" "}
                    {driver.vehicle.model}
                  </small>
                </span>
                {selected === driver._id && (
                  <LuCircleCheck className="text-blue-600" />
                )}
              </button>
            ))
          )}
        </div>
        {drivers.length > 0 && (
          <label className="mt-5 block text-[10px] font-bold">
            Assignment note (optional)
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-2 h-20 w-full rounded-xl border border-slate-200 p-3 text-[10px] font-normal outline-none focus:border-blue-400"
              placeholder="Add handover or reassignment context"
            />
          </label>
        )}
        {error && (
          <p className="mt-4 rounded-xl bg-red-50 p-3 text-[9px] font-bold text-red-600">
            {error}
          </p>
        )}
        <button
          disabled={!selected || saving}
          onClick={assign}
          className="mt-6 h-11 w-full rounded-xl bg-orange-500 text-[10px] font-extrabold text-white disabled:opacity-40"
        >
          {saving ? "Assigning..." : "Confirm driver assignment"}
        </button>
      </aside>
    </div>
  );
}

export default function BookingsPage() {
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState({});
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [status, setStatus] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [payment, setPayment] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [assignment, setAssignment] = useState(null);
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      setDebounced(query);
    }, 350);
    return () => clearTimeout(timer);
  }, [query]);
  async function load() {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page, limit: 10 });
      if (debounced) params.set("search", debounced);
      if (status) params.set("status", status);
      if (serviceType) params.set("serviceType", serviceType);
      if (payment) params.set("paymentStatus", payment);
      const data = await get(`/admin/bookings?${params}`);
      setItems(data.items);
      setSummary(data.summary);
      setPagination(data.pagination);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, [page, debounced, status, serviceType, payment]);
  const cards = [
    [
      "New",
      (summary.NEW || 0) + (summary.PAYMENT_CONFIRMED || 0),
      LuCalendarClock,
      "text-blue-600 bg-blue-50",
    ],
    [
      "Unassigned",
      summary.ASSIGNMENT_PENDING || 0,
      LuUserRoundCheck,
      "text-orange-600 bg-orange-50",
    ],
    [
      "Live",
      (summary.DRIVER_EN_ROUTE || 0) +
        (summary.ARRIVED || 0) +
        (summary.IN_PROGRESS || 0),
      LuCarFront,
      "text-emerald-600 bg-emerald-50",
    ],
    [
      "Upcoming",
      summary.ASSIGNED || 0,
      LuClock3,
      "text-violet-600 bg-violet-50",
    ],
    [
      "Completed",
      summary.COMPLETED || 0,
      LuCircleCheck,
      "text-green-600 bg-green-50",
    ],
  ];
  return (
    <AdminLayout>
      <main className="mx-auto max-w-[1500px] p-4 sm:p-6 lg:p-7">
        <div className="mb-6">
          <p className="mb-1 text-[10px] font-bold tracking-[1.8px] text-blue-600">
            OPERATIONS
          </p>
          <h1 className="text-3xl font-black">Bookings</h1>
          <p className="mt-1 text-[11px] text-slate-500">
            Monitor every ride and assign drivers to scheduled and package
            bookings.
          </p>
        </div>
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
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
                <strong className="text-xl font-black">{value}</strong>
              </div>
            </article>
          ))}
        </section>
        <section className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
              <div>
                <h2 className="text-sm font-extrabold">All bookings</h2>
                <p className="text-[9px] text-slate-400">
                  {pagination?.total || 0} bookings
                </p>
              </div>
              <div className="relative xl:ml-auto xl:w-72">
                <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-[10px] outline-none"
                  placeholder="ID, customer, phone or pickup"
                />
              </div>
              <select
                value={serviceType}
                onChange={(e) => {
                  setServiceType(e.target.value);
                  setPage(1);
                }}
                className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-[9px]"
              >
                <option value="">All booking types</option>
                {Object.entries(types).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
                className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-[9px]"
              >
                <option value="">All statuses</option>
                {Object.keys(statusTone).map((key) => (
                  <option key={key} value={key}>
                    {key.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
              <select
                value={payment}
                onChange={(e) => {
                  setPayment(e.target.value);
                  setPage(1);
                }}
                className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-[9px]"
              >
                <option value="">All payments</option>
                {["PENDING", "PAID", "REFUNDED", "FAILED"].map((key) => (
                  <option key={key}>{key}</option>
                ))}
              </select>
            </div>
          </div>
          {error && (
            <p className="m-5 rounded-xl bg-red-50 p-3 text-[10px] font-bold text-red-600">
              {error}
            </p>
          )}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1150px] text-left text-[9px]">
              <thead className="bg-slate-50 text-[8px] uppercase tracking-wider text-slate-400">
                <tr>
                  {[
                    "Booking",
                    "Customer",
                    "Trip",
                    "Schedule",
                    "Driver",
                    "Payment",
                    "Status",
                    "Action",
                  ].map((label) => (
                    <th key={label} className="px-5 py-3">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }, (_, i) => (
                    <tr key={i}>
                      <td
                        colSpan="8"
                        className="border-t border-slate-100 px-5 py-3"
                      >
                        <div className="h-12 animate-pulse rounded-lg bg-slate-100" />
                      </td>
                    </tr>
                  ))
                ) : items.length === 0 ? (
                  <tr>
                    <td
                      colSpan="8"
                      className="py-16 text-center text-slate-400"
                    >
                      No bookings found.
                    </td>
                  </tr>
                ) : (
                  items.map((booking) => (
                    <tr
                      key={booking._id}
                      className="border-t border-slate-100 hover:bg-slate-50"
                    >
                      <td className="px-5 py-4">
                        <b className="text-blue-600">{booking.bookingNumber}</b>
                        <small className="mt-1 block text-[8px] text-slate-400">
                          {types[booking.serviceType]}
                        </small>
                      </td>
                      <td className="px-5 py-4">
                        <b className="block">{booking.customer.name}</b>
                        <small className="text-[8px] text-slate-400">
                          {booking.customer.phone}
                        </small>
                      </td>
                      <td className="max-w-60 px-5 py-4">
                        <b className="block truncate">
                          {booking.pickup.address}
                        </b>
                        <small className="block truncate text-[8px] text-slate-400">
                          to{" "}
                          {booking.destination?.address ||
                            booking.packageName ||
                            "Hidden until start"}
                        </small>
                      </td>
                      <td className="px-5 py-4">
                        {formatDate(booking.scheduledStartAt)}
                      </td>
                      <td className="px-5 py-4">
                        {booking.currentDriverId ? (
                          <>
                            <b className="block">
                              {booking.currentDriverId.personal?.fullName}
                            </b>
                            <small className="text-[8px] text-slate-400">
                              {
                                booking.currentDriverId.vehicle
                                  ?.registrationNumber
                              }
                            </small>
                          </>
                        ) : (
                          <span className="font-bold text-orange-500">
                            Not assigned
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <b className="block">{money(booking.totalAmount)}</b>
                        <small
                          className={`text-[8px] font-bold ${booking.paymentStatus === "PAID" ? "text-emerald-600" : "text-slate-400"}`}
                        >
                          {booking.paymentStatus}
                        </small>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-2 py-1 text-[8px] font-bold ${statusTone[booking.status] || statusTone.NEW}`}
                        >
                          {booking.status.replaceAll("_", " ")}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {!booking.currentDriverId &&
                        booking.assignmentMode === "MANUAL" ? (
                          <button
                            onClick={() => setAssignment(booking)}
                            className="rounded-lg bg-orange-500 px-3 py-2 text-[8px] font-bold text-white"
                          >
                            Assign driver
                          </button>
                        ) : !booking.currentDriverId ? (
                          <span className="text-[8px] font-bold text-blue-600">
                            Auto assigning
                          </span>
                        ) : (
                          <button
                            onClick={() => setAssignment(booking)}
                            className="rounded-lg border border-slate-200 px-3 py-2 text-[8px] font-bold"
                          >
                            Reassign
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {pagination?.pages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4 text-[9px] text-slate-500">
              <span>
                Page {pagination.page} of {pagination.pages} ·{" "}
                {pagination.total} bookings
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="grid h-8 w-8 place-items-center rounded-lg border disabled:opacity-30"
                >
                  <LuChevronLeft />
                </button>
                <button
                  disabled={page >= pagination.pages}
                  onClick={() => setPage(page + 1)}
                  className="grid h-8 w-8 place-items-center rounded-lg border disabled:opacity-30"
                >
                  <LuChevronRight />
                </button>
              </div>
            </div>
          )}
        </section>
        {assignment && (
          <AssignmentPanel
            booking={assignment}
            close={() => setAssignment(null)}
            assigned={() => {
              setAssignment(null);
              load();
            }}
          />
        )}
      </main>
    </AdminLayout>
  );
}

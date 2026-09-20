import { useEffect, useState } from "react";
import Brand from "../components/Brand.jsx";
import AdminLayout from "../components/AdminLayout.jsx";
import { LuArrowRight, LuArrowUp, LuChevronDown } from "react-icons/lu";
import { useAuth } from "../context/AuthContext.jsx";
import { get } from "../services/api.js";
import { Link } from "react-router-dom";

const paths = {
  menu: "M4 6h16M4 12h16M4 18h16",
  search: "m21 21-4.3-4.3M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z",
  dashboard: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",
  users:
    "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm13 10v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8",
  shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z",
  drivers: "M5 17h14M6 17l1-5h10l1 5M8 12l1-4h6l1 4M7 17v2M17 17v2",
  bookings: "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14H3V6a2 2 0 0 1 2-2Z",
  wallet:
    "M20 7V5a2 2 0 0 0-2-2H5a3 3 0 0 0 0 6h16v10H5a3 3 0 0 1-3-3V6M16 13h2",
  packages: "M21 8 12 3 3 8l9 5 9-5ZM3 8v8l9 5 9-5V8M12 13v8",
  audit:
    "M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11",
  settings:
    "M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM19 15a2 2 0 0 0 1 2l-2 2a2 2 0 0 0-2-1 2 2 0 0 0-2 2h-3a2 2 0 0 0-2-2 2 2 0 0 0-2 1l-2-2a2 2 0 0 0 1-2 2 2 0 0 0-2-2v-3a2 2 0 0 0 2-2 2 2 0 0 0-1-2l2-2a2 2 0 0 0 2 1 2 2 0 0 0 2-2h3a2 2 0 0 0 2 2 2 2 0 0 0 2-1l2 2a2 2 0 0 0-1 2 2 2 0 0 0 2 2v3a2 2 0 0 0-2 2Z",
  bell: "M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4",
  chevron: "m9 18 6-6-6-6",
};
function Icon({ name, size = 18, className = "" }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={paths[name]} />
    </svg>
  );
}

const superAdminNav = [
  ["dashboard", "Dashboard"],
  ["users", "Employees"],
  ["shield", "Roles & permissions"],
  ["audit", "Audit logs"],
];
const employeeNav = [
  ["dashboard", "Dashboard"],
  ["drivers", "Drivers"],
  ["bookings", "Bookings"],
  ["packages", "Tour packages"],
  ["wallet", "Payments"],
];
const metrics = [
  [
    "users",
    "Total customers",
    "1,248",
    "12.5%",
    "bg-violet-50 text-violet-600",
  ],
  ["drivers", "Active drivers", "486", "8.3%", "bg-blue-50 text-blue-600"],
  [
    "wallet",
    "Total revenue",
    "₹28.96L",
    "15.7%",
    "bg-emerald-50 text-emerald-600",
  ],
  ["bookings", "Total bookings", "678", "9.1%", "bg-orange-50 text-orange-500"],
  [
    "packages",
    "Package bookings",
    "234",
    "11.4%",
    "bg-amber-50 text-amber-500",
  ],
];
const rides = [
  ["#RJS1001", "Darshan R", "City ride", "Completed", "₹850"],
  ["#RJS1002", "Nayana S", "Rental package", "In progress", "₹3,200"],
  ["#RJS1003", "Arjun K", "Tour package", "Scheduled", "₹9,999"],
  ["#RJS1004", "Meera P", "Round trip", "Pending", "₹1,450"],
];
const drivers = [
  ["RK", "Ramesh Kumar", "Auto · KA 05 AB 1234", "Online"],
  ["SK", "Suresh K", "Sedan · KA 01 MJ 9201", "On trip"],
  ["AM", "Ahmed M", "Bus · KA 53 C 7712", "Offline"],
  ["RP", "Ravi Prakash", "Tempo · KA 04 T 3042", "Online"],
];
const status = {
  Completed: "bg-emerald-50 text-emerald-600",
  "In progress": "bg-blue-50 text-blue-600",
  Scheduled: "bg-violet-50 text-violet-600",
  Pending: "bg-amber-50 text-amber-600",
  Online: "text-emerald-600",
  "On trip": "text-blue-600",
  Offline: "text-slate-400",
};

function Sidebar({ open, setOpen, profile, logout, logoutAll }) {
  const nav =
    profile?.accountType === "SUPER_ADMIN" ? superAdminNav : employeeNav;
  return (
    <>
      {open && (
        <button
          aria-label="Close menu"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm lg:hidden"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[248px] flex-col overflow-hidden bg-[#071332] text-white transition-transform duration-300 lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_5%,rgba(45,75,255,.24),transparent_33%),linear-gradient(180deg,transparent,rgba(0,5,22,.35))]" />
        <div className="relative border-b border-white/10 px-6 py-6">
          <Brand light />
        </div>
        <nav className="relative flex-1 overflow-y-auto px-3 py-5">
          <p className="px-3 pb-2 text-[9px] font-bold tracking-[1.8px] text-slate-500">
            MANAGEMENT
          </p>
          {nav.map(([icon, label], i) => (
            <button
              key={label}
              onClick={() => setOpen(false)}
              className={`mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-[12px] font-semibold cursor-pointer ${i === 0 ? "bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg shadow-blue-950/50" : "text-slate-300 hover:bg-white/8 hover:text-white"}`}
            >
              <Icon name={icon} size={17} />
              {label}
              {label === "Drivers" && (
                <span className="ml-auto rounded-full bg-orange-500 px-2 py-0.5 text-[8px]">
                  12
                </span>
              )}
            </button>
          ))}
          <p className="mt-6 px-3 pb-2 text-[9px] font-bold tracking-[1.8px] text-slate-500">
            SETTINGS
          </p>
          {[
            ["settings", "System settings"],
            ["bell", "Notifications"],
          ].map(([icon, label]) => (
            <button
              key={label}
              className="mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-[12px] font-semibold text-slate-300 hover:bg-white/8 cursor-pointer"
            >
              <Icon name={icon} size={17} />
              {label}
            </button>
          ))}
        </nav>
        <div className="relative border-t border-white/10 p-3">
          <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3 cursor-pointer">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-sm font-black">
              {profile?.name?.[0] || "D"}
            </span>
            <div className="min-w-0 flex-1">
              <strong className="block truncate text-[11px]">
                {profile?.name}
              </strong>
              <small className="text-[9px] text-slate-400">Super Admin</small>
            </div>
            <button onClick={logout}>
              <Icon name="chevron" size={14} />
            </button>
          </div>
          <button
            onClick={logoutAll}
            className="mt-2 w-full py-1 text-[9px] text-slate-500 hover:text-orange-300 cursor-pointer"
          >
            Sign out on all devices
          </button>
        </div>
      </aside>
    </>
  );
}

function Chart({ data = [] }) {
  const maximum = Math.max(...data.map((item) => item.value), 1);
  const points = data.map((item, index) => `${30 + index * (660 / Math.max(data.length - 1, 1))},${190 - (item.value / maximum) * 130}`).join(" ");
  const areaPoints = points ? `30,190 ${points} 690,190` : "30,190 690,190";
  return (
    <svg
      className="mt-5 h-52 w-full overflow-visible"
      viewBox="0 0 700 220"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#405cff" stopOpacity=".24" />
          <stop offset="1" stopColor="#405cff" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[35, 80, 125, 170].map((y) => (
        <line
          key={y}
          x1="30"
          x2="690"
          y1={y}
          y2={y}
          stroke="#e8edf5"
          strokeDasharray="4 5"
        />
      ))}
      <polygon points={areaPoints} fill="url(#area)" />
      <polyline points={points} fill="none" stroke="#405cff" strokeWidth="3" />
      {data.map((item, i) => (
        <text key={`${item.label}-${i}`} x={30 + i * (660 / Math.max(data.length - 1, 1))} y="214" fontSize="11" fill="#8b95aa" textAnchor={i === 0 ? "start" : i === data.length - 1 ? "end" : "middle"}>
          {item.label}
        </text>
      ))}
    </svg>
  );
}
function Donut({ items = [] }) {
  const colors = ["#24c875", "#5267f8", "#ff8a25", "#f9c21b", "#a7b0c5", "#ef4444"];
  const total = items.reduce((sum, item) => sum + item.count, 0);
  let cursor = 0;
  const segments = items.map((item, index) => { const start = cursor; cursor += total ? (item.count / total) * 100 : 0; return `${colors[index % colors.length]} ${start}% ${cursor}%`; });
  return (
    <div
      className="relative h-36 w-36 shrink-0 rounded-full"
      style={{
        background: total ? `conic-gradient(${segments.join(",")})` : "#e8edf5",
      }}
    >
      <div className="absolute inset-[25px] grid place-items-center rounded-full bg-white text-center">
        <div>
          <strong className="block text-xl">{total.toLocaleString("en-IN")}</strong>
          <span className="text-[9px] text-slate-400">total trips</span>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { session } = useAuth();
  const [profile, setProfile] = useState(session.admin);
  const [dashboard, setDashboard] = useState(null);
  const isSuperAdmin = profile?.accountType === "SUPER_ADMIN";
  useEffect(() => {
    const dashboardPath = session.admin.accountType === "SUPER_ADMIN" ? "/admin/dashboard" : "/admin/employee-dashboard";
    let active = true;
    const load = () => Promise.all([get("/admin/auth/me", session.tokens.accessToken), get(dashboardPath, session.tokens.accessToken)])
      .then(([account, snapshot]) => { if (active) { setProfile(account.admin); setDashboard(snapshot); } })
      .catch(() => {});
    load();
    const timer = setInterval(load, 30000);
    return () => { active = false; clearInterval(timer); };
  }, [session.admin.accountType, session.tokens.accessToken]);
  const dynamicMetrics = dashboard && isSuperAdmin ? [
    ["wallet", "Net ride revenue", new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(dashboard.metrics.totalRevenue), "Live", "bg-emerald-50 text-emerald-600"],
    ["users", "Total employees", dashboard.metrics.totalEmployees, "Live", "bg-violet-50 text-violet-600"],
    ["users", "Active employees", dashboard.metrics.activeEmployees, "Live", "bg-blue-50 text-blue-600"],
    ["shield", "MFA enabled", dashboard.metrics.mfaEnabledEmployees, "Live", "bg-orange-50 text-orange-500"],
    ["audit", "Audit events", dashboard.metrics.auditEvents, "Last 30 days", "bg-amber-50 text-amber-500"],
  ] : dashboard ? [
    ["bookings", "Today's bookings", dashboard.metrics.todayBookings, "Live", "bg-blue-50 text-blue-600"],
    ["drivers", "Live trips", dashboard.metrics.liveTrips, "Live", "bg-emerald-50 text-emerald-600"],
    ["shield", "Drivers to review", dashboard.metrics.pendingDrivers, "Live", "bg-orange-50 text-orange-500"],
    ["audit", "Completed today", dashboard.metrics.completedToday, "Live", "bg-violet-50 text-violet-600"],
    ["wallet", "Collected today", new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(dashboard.metrics.todayRevenue), "Live", "bg-amber-50 text-amber-500"],
  ] : isSuperAdmin ? [
    ["wallet", "Net ride revenue", null, "", "bg-emerald-50 text-emerald-600"],
    ["users", "Total employees", null, "", "bg-violet-50 text-violet-600"],
    ["users", "Active employees", null, "", "bg-blue-50 text-blue-600"],
    ["shield", "MFA enabled", null, "", "bg-orange-50 text-orange-500"],
    ["audit", "Audit events", null, "", "bg-amber-50 text-amber-500"],
  ] : [
    ["bookings", "Today's bookings", null, "", "bg-blue-50 text-blue-600"],
    ["drivers", "Live trips", null, "", "bg-emerald-50 text-emerald-600"],
    ["shield", "Drivers to review", null, "", "bg-orange-50 text-orange-500"],
    ["audit", "Completed today", null, "", "bg-violet-50 text-violet-600"],
    ["wallet", "Collected today", null, "", "bg-amber-50 text-amber-500"],
  ];
  const bookingStatuses = dashboard?.bookingStatuses || [];
  const statusColors = ["bg-emerald-500", "bg-blue-500", "bg-orange-500", "bg-amber-400", "bg-slate-400", "bg-red-500"];
  const recentRows = dashboard?.recentBookings?.map((booking) => [booking.bookingNumber || `#${String(booking._id).slice(-6).toUpperCase()}`, booking.customer?.name || "Customer", booking.serviceType || "Ride", booking.status || "PENDING", new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(booking.totalAmount || booking.amount || 0)]) || [];
  const driverRows = dashboard?.drivers?.map((driver) => {
    const name = driver.personal?.fullName || "Driver";
    const category = driver.vehicle?.category?.replaceAll("_", " ");
    return [name.split(" ").map((part) => part[0]).join("").slice(0, 2), name, [category, driver.vehicle?.registrationNumber].filter(Boolean).join(" · ") || "Vehicle not assigned", driver.operationalStatus || "OFFLINE"];
  }) || [];
  return (
    <AdminLayout>
        <main className="mx-auto max-w-[1500px] p-4 sm:p-6 lg:p-7">
          <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="mb-1 text-[10px] font-bold tracking-[1.8px] text-blue-600">
                OPERATIONS OVERVIEW
              </p>
              <h1 className="text-3xl font-black tracking-tight">Dashboard</h1>
              <p className="mt-1 text-[11px] text-slate-500">
                Welcome back, {profile?.name}. Here's what's happening today.
              </p>
            </div>
          </div>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {dynamicMetrics.map(([icon, label, value, change, color]) => (
              <article
                key={label}
                className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_6px_24px_rgba(15,23,42,.045)] transition hover:-translate-y-0.5"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`grid h-11 w-11 place-items-center rounded-full ${color}`}
                  >
                    <Icon name={icon} />
                  </span>
                  <div>
                    <p className="text-[10px] text-slate-500">{label}</p>
                    {value === null ? (
                      <span className="mt-2 block h-6 w-16 animate-pulse rounded-md bg-slate-100" />
                    ) : (
                      <strong className="mt-1 block text-xl font-black">{value}</strong>
                    )}
                  </div>
                </div>
                {value === null ? (
                  <div className="mt-4 h-3 w-24 animate-pulse rounded bg-slate-100" />
                ) : (
                  <p className="mt-4 text-[10px]">
                    <b className="text-emerald-600">{change}</b>
                    <span className="ml-2 text-slate-400">from Database</span>
                  </p>
                )}
              </article>
            ))}
          </section>
          <section
            className={`mt-4 grid gap-4 ${isSuperAdmin ? "" : "xl:grid-cols-[1.65fr_1fr]"}`}
          >
            <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <div className="flex justify-between">
                <div>
                  <h2 className="text-sm font-extrabold">{isSuperAdmin ? "Revenue overview" : "Booking activity"}</h2>
                  <p className="mt-1 text-[10px] text-slate-400">
                    {isSuperAdmin ? "Monthly booking revenue" : "Bookings created during the last seven days"}
                  </p>
                </div>
                <button className="h-8 rounded-lg border border-slate-200 px-3 text-[9px] font-bold">
                  {isSuperAdmin ? "This year" : "Last 7 days"} <LuChevronDown className="inline" />
                </button>
              </div>
              <Chart data={isSuperAdmin ? dashboard?.revenue || [] : dashboard?.activity || []} />
            </article>
            {!isSuperAdmin && (
              <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
                <h2 className="text-sm font-extrabold">Bookings by status</h2>
                <p className="mt-1 text-[10px] text-slate-400">
                  Current booking distribution
                </p>
                <div className="mt-7 flex flex-col items-center gap-7 sm:flex-row">
                  <Donut items={bookingStatuses} />
                  <div className="w-full space-y-3">
                    {bookingStatuses.length === 0 ? <p className="text-[9px] text-slate-400">No booking data available yet.</p> : bookingStatuses.map((item, index) => (
                      <div
                        key={item.status}
                        className="flex items-center gap-2 text-[10px]"
                      >
                        <i className={`h-2 w-2 rounded-full ${statusColors[index % statusColors.length]}`} />
                        <span className="text-slate-500">{item.status.replaceAll("_", " ")}</span>
                        <b className="ml-auto">{item.count.toLocaleString("en-IN")}</b>
                      </div>
                    ))}
                  </div>
                </div>
              </article>
            )}
          </section>
          {!isSuperAdmin && (
            <section className="mt-4 grid gap-4 xl:grid-cols-[1.2fr_1fr]">
              <article className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                <div className="flex justify-between p-5">
                  <div>
                    <h2 className="text-sm font-extrabold">Recent bookings</h2>
                    <p className="mt-1 text-[10px] text-slate-400">
                      Latest customer reservations
                    </p>
                  </div>
                  <Link to="/bookings" className="text-[10px] font-bold text-blue-600">
                    View all <LuArrowRight className="inline" />
                  </Link>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px] text-left text-[10px]">
                    <thead className="border-y border-slate-100 bg-slate-50 text-slate-400">
                      <tr>
                        {[
                          "Booking ID",
                          "Customer",
                          "Service",
                          "Status",
                          "Amount",
                        ].map((x) => (
                          <th key={x} className="px-5 py-3">
                            {x}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {recentRows.length === 0 ? <tr><td colSpan="5" className="px-5 py-12 text-center text-slate-400">No bookings available yet.</td></tr> : recentRows.map((row) => (
                        <tr
                          key={row[0]}
                          className="border-b border-slate-100 last:border-0"
                        >
                          {row.map((v, i) => (
                            <td
                              key={v}
                              className={`px-5 py-3.5 ${i === 0 ? "font-bold text-blue-600" : i === 4 ? "font-extrabold" : ""}`}
                            >
                              {i === 3 ? (
                                <span
                                  className={`rounded-full px-2 py-1 text-[8px] font-bold ${status[v] || (v === "COMPLETED" ? "bg-emerald-50 text-emerald-600" : v === "IN_PROGRESS" ? "bg-blue-50 text-blue-600" : v === "CANCELLED" ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600")}`}
                                >
                                  {v}
                                </span>
                              ) : (
                                v
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </article>
              <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
                <div className="flex justify-between">
                  <div>
                    <h2 className="text-sm font-extrabold">Driver activity</h2>
                    <p className="mt-1 text-[10px] text-slate-400">
                      Live fleet availability
                    </p>
                  </div>
                  <Link to="/drivers" className="text-[10px] font-bold text-blue-600">
                    Manage <LuArrowRight className="inline" />
                  </Link>
                </div>
                <div className="mt-4 divide-y divide-slate-100">
                  {driverRows.length === 0 ? <div className="py-12 text-center text-[9px] text-slate-400">No driver records available yet.</div> : driverRows.map(([ini, name, vehicle, state], i) => (
                    <div key={name} className="flex items-center gap-3 py-3">
                      <span
                        className={`grid h-9 w-9 place-items-center rounded-full text-[9px] font-black ${i % 2 ? "bg-blue-50 text-blue-600" : "bg-orange-50 text-orange-600"}`}
                      >
                        {ini}
                      </span>
                      <div className="min-w-0">
                        <strong className="block text-[11px]">{name}</strong>
                        <small className="block truncate text-[9px] text-slate-400">
                          {vehicle}
                        </small>
                      </div>
                      <span
                        className={`ml-auto text-[9px] font-bold ${status[state] || (state === "ONLINE" ? "text-emerald-600" : state === "ON_TRIP" ? "text-blue-600" : "text-slate-400")}`}
                      >
                        <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-current" />{state}
                      </span>
                    </div>
                  ))}
                </div>
              </article>
            </section>
          )}
        </main>
    </AdminLayout>
  );
}

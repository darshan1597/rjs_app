import { useEffect, useMemo, useState } from "react";
import {
  LuActivity,
  LuChevronRight,
  LuChevronLeft,
  LuClock3,
  LuSearch,
  LuShieldCheck,
  LuUser,
  LuUsers,
} from "react-icons/lu";
import AdminLayout from "../components/AdminLayout.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { get } from "../services/api.js";

const actionLabels = {
  "admin.login": "Signed in successfully",
  "admin.mfa.enabled": "Enabled authenticator verification",
  "admin.password.changed": "Changed account password",
  "admin.sessions.revoked": "Signed out on all devices",
  "employee.create": "Created an employee account",
  "employee.update": "Updated an employee account",
  "employee.mfa.reset": "Reset employee authenticator verification",
  "employee.sessions.revoked_all": "Signed out every employee",
  "system.settings.updated": "Updated system settings",
};
const formatAction = (action) =>
  actionLabels[action] ||
  action
    ?.split(".")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
const actorIdOf = (actor) => actor?.id || actor?._id;
const formatDate = (value) =>
  new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

export default function AuditLogsPage() {
  const { admin } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [selectedId, setSelectedId] = useState("all");
  const [query, setQuery] = useState("");
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [action, setAction] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loadingPeople, setLoadingPeople] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [error, setError] = useState("");
  const people = useMemo(
    () => [
      { ...admin, label: "Super Admin" },
      ...employees.map((employee) => ({ ...employee, label: "Employee" })),
    ],
    [admin, employees],
  );
  const filteredPeople = useMemo(
    () =>
      people.filter((person) =>
        `${person.name} ${person.email}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [people, query],
  );
  const selectedPerson =
    selectedId === "all"
      ? null
      : people.find((person) => actorIdOf(person) === selectedId);

  useEffect(() => {
    get("/admin/employees?page=1&limit=100")
      .then((data) => setEmployees(data.items))
      .catch((err) => setError(err.message))
      .finally(() => setLoadingPeople(false));
  }, []);
  useEffect(() => {
    setLoadingLogs(true);
    setError("");
    const parameters = new URLSearchParams({ page: String(page), limit: "15" });
    if (selectedId !== "all") parameters.set("actorId", selectedId);
    if (action) parameters.set("action", action);
    if (from) parameters.set("from", new Date(`${from}T00:00:00`).toISOString());
    if (to) parameters.set("to", new Date(`${to}T23:59:59`).toISOString());
    get(`/admin/audit-logs?${parameters}`)
      .then((result) => {
        setLogs(result.items);
        setPagination(result.pagination);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoadingLogs(false));
  }, [selectedId, page, action, from, to]);

  return (
    <AdminLayout>
      <main className="mx-auto max-w-[1500px] p-4 sm:p-6 lg:p-7">
        <div className="mb-6">
          <p className="mb-1 text-[10px] font-bold tracking-[1.8px] text-blue-600">
            SECURITY & COMPLIANCE
          </p>
          <h1 className="text-3xl font-black tracking-tight">Audit logs</h1>
          <p className="mt-1 text-[11px] text-slate-500">
            Review security-sensitive activity performed by the Super Admin and
            employees.
          </p>
        </div>
        {error && (
          <div className="mb-4 rounded-xl border border-red-100 bg-red-50 p-3 text-[10px] font-semibold text-red-600">
            {error}
          </div>
        )}
        <section className="grid min-h-[650px] overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm lg:items-start lg:overflow-visible lg:grid-cols-[310px_1fr]">
          <aside className="border-b border-slate-200 bg-slate-50/60 lg:sticky lg:top-[84px] lg:max-h-[calc(100vh-100px)] lg:overflow-hidden lg:rounded-l-2xl lg:border lg:border-r-0 lg:border-slate-200 lg:shadow-sm">
            <div className="border-b border-slate-200 p-4">
              <h2 className="text-sm font-extrabold">Accounts</h2>
              <p className="mt-1 text-[9px] text-slate-400">
                Select a person to view their activity
              </p>
              <div className="relative mt-4">
                <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-[10px] outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                  placeholder="Search name or email"
                />
              </div>
            </div>
            <div className="max-h-[430px] overflow-y-auto p-2 lg:max-h-[570px]">
              <button
                onClick={() => { setPage(1); setSelectedId("all"); }}
                className={`mb-1 flex w-full items-center gap-3 rounded-xl p-3 text-left transition ${selectedId === "all" ? "bg-blue-600 text-white shadow-lg shadow-blue-100" : "hover:bg-white"}`}
              >
                <span
                  className={`grid h-10 w-10 place-items-center rounded-xl ${selectedId === "all" ? "bg-white/15" : "bg-blue-50 text-blue-600"}`}
                >
                  <LuActivity />
                </span>
                <div className="min-w-0 flex-1 cursor-pointer">
                  <strong className="block text-[11px]">All activity</strong>
                  <small
                    className={`text-[9px] ${selectedId === "all" ? "text-blue-100" : "text-slate-400"}`}
                  >
                    Every administrator account
                  </small>
                </div>
                <LuChevronRight />
              </button>
              {loadingPeople ? (
                <p className="p-6 text-center text-[10px] text-slate-400">
                  Loading accounts...
                </p>
              ) : (
                filteredPeople.map((person) => {
                  const id = actorIdOf(person);
                  const active = selectedId === id;
                  return (
                    <button
                      key={id}
                      onClick={() => { setPage(1); setSelectedId(id); }}
                      className={`mb-1 flex w-full items-center gap-3 rounded-xl p-3 text-left transition cursor-pointer ${active ? "bg-blue-600 text-white shadow-lg shadow-blue-100" : "hover:bg-white"}`}
                    >
                      <span
                        className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-[11px] font-black ${active ? "bg-white/15" : person.accountType === "SUPER_ADMIN" ? "bg-orange-50 text-orange-600" : "bg-violet-50 text-violet-600"}`}
                      >
                        {person.name?.[0]}
                      </span>
                      <div className="min-w-0 flex-1">
                        <strong className="block truncate text-[11px]">
                          {person.name}
                        </strong>
                        <small
                          className={`block truncate text-[9px] ${active ? "text-blue-100" : "text-slate-400"}`}
                        >
                          {person.email}
                        </small>
                        <span
                          className={`mt-1 inline-block text-[8px] font-bold ${active ? "text-white" : person.accountType === "SUPER_ADMIN" ? "text-orange-500" : "text-blue-500"}`}
                        >
                          {person.label}
                        </span>
                      </div>
                      <LuChevronRight className="shrink-0" />
                    </button>
                  );
                })
              )}
              {!loadingPeople && filteredPeople.length === 0 && (
                <p className="p-6 text-center text-[10px] text-slate-400">
                  No matching accounts.
                </p>
              )}
            </div>
          </aside>
          <div className="min-w-0">
            <header className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center">
              <span
                className={`grid h-11 w-11 place-items-center rounded-xl ${selectedPerson?.accountType === "SUPER_ADMIN" ? "bg-orange-50 text-orange-600" : "bg-blue-50 text-blue-600"}`}
              >
                {selectedId === "all" ? (
                  <LuUsers />
                ) : selectedPerson?.accountType === "SUPER_ADMIN" ? (
                  <LuShieldCheck />
                ) : (
                  <LuUser />
                )}
              </span>
              <div>
                <h2 className="text-sm font-extrabold">
                  {selectedPerson?.name || "All account activity"}
                </h2>
                <p className="mt-1 text-[9px] text-slate-400">
                  {selectedPerson?.email ||
                    "Super Admin and employee audit events"}
                </p>
              </div>
              <div className="sm:ml-auto">
                <strong className="block text-right text-lg font-black">
                  {pagination?.total || 0}
                </strong>
                <small className="text-[8px] uppercase tracking-wider text-slate-400">
                  recorded events
                </small>
              </div>
            </header>
            <div className="grid gap-2 border-b border-slate-100 bg-slate-50/60 p-4 sm:grid-cols-3">
              <select value={action} onChange={(event) => { setPage(1); setAction(event.target.value); }} className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-[9px] outline-none"><option value="">All actions</option>{Object.entries(actionLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select>
              <input type="date" value={from} onChange={(event) => { setPage(1); setFrom(event.target.value); }} className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-[9px] outline-none" title="From date"/>
              <input type="date" value={to} onChange={(event) => { setPage(1); setTo(event.target.value); }} className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-[9px] outline-none" title="To date"/>
            </div>
            <div className="p-4 sm:p-5">
              {loadingLogs ? (
                <div className="grid h-64 place-items-center text-[10px] text-slate-400">
                  Loading audit activity...
                </div>
              ) : logs.length === 0 ? (
                <div className="grid h-64 place-items-center text-center">
                  <div>
                    <LuActivity className="mx-auto mb-3 text-3xl text-slate-300" />
                    <h3 className="text-sm font-extrabold">
                      No activity recorded
                    </h3>
                    <p className="mt-1 text-[10px] text-slate-400">
                      Audit events for this account will appear here.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {logs.map((log) => {
                    const actor = log.actorId;
                    return (
                      <article
                        key={log._id}
                        className="group rounded-xl border border-slate-200 p-4 transition hover:border-blue-200 hover:bg-blue-50/30"
                      >
                        <div className="flex items-start gap-3">
                          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-600">
                            <LuActivity />
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-col justify-between gap-1 sm:flex-row">
                              <h3 className="text-[11px] font-extrabold">
                                {formatAction(log.action)}
                              </h3>
                              <span className="flex shrink-0 items-center gap-1 text-[8px] text-slate-400">
                                <LuClock3 />
                                {formatDate(log.createdAt)}
                              </span>
                            </div>
                            <p className="mt-1 text-[9px] text-slate-500">
                              Performed by{" "}
                              <strong className="text-slate-700">
                                {actor?.name || log.actorType}
                              </strong>
                              {actor?.email ? ` (${actor.email})` : ""}
                            </p>
                            <div className="mt-3 flex flex-wrap gap-2 text-[8px]">
                              <span className="rounded-md bg-slate-100 px-2 py-1 font-semibold text-slate-500">
                                {log.action}
                              </span>
                              {log.ip && (
                                <span className="rounded-md bg-slate-100 px-2 py-1 text-slate-500">
                                  IP: {log.ip}
                                </span>
                              )}
                              {log.targetType && (
                                <span className="rounded-md bg-blue-50 px-2 py-1 font-semibold text-blue-600">
                                  Target: {log.targetType}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
            {pagination?.pages > 1 && <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4 text-[9px] text-slate-500"><span>Page {pagination.page} of {pagination.pages} · {pagination.total} events</span><div className="flex gap-2"><button disabled={pagination.page<=1} onClick={()=>setPage(pagination.page-1)} className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 disabled:opacity-30"><LuChevronLeft/></button><button disabled={pagination.page>=pagination.pages} onClick={()=>setPage(pagination.page+1)} className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 disabled:opacity-30"><LuChevronRight/></button></div></div>}
          </div>
        </section>
      </main>
    </AdminLayout>
  );
}

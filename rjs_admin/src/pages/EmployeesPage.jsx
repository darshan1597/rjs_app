import { useEffect, useState } from "react";
import {
  LuChevronLeft,
  LuChevronRight,
  LuPencil,
  LuRotateCcw,
  LuSearch,
  LuUserPlus,
  LuX,
} from "react-icons/lu";
import AdminLayout from "../components/AdminLayout.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import { get, patch, post } from "../services/api.js";

const empty = { name: "", email: "", temporaryPassword: "" };
function Toast({ toast, close }) {
  if (!toast) return null;
  return (
    <div
      className={`fixed right-5 top-20 z-[90] flex items-center gap-3 rounded-xl px-4 py-3 text-[10px] font-bold text-white shadow-xl ${toast.type === "error" ? "bg-red-600" : "bg-emerald-600"}`}
    >
      {toast.text}
      <button onClick={close}>
        <LuX />
      </button>
    </div>
  );
}
function Pager({ data, setPage }) {
  if (!data || data.pages <= 1) return null;
  return (
    <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4 text-[9px] text-slate-500">
      <span>
        Page {data.page} of {data.pages} · {data.total} employees
      </span>
      <div className="flex gap-2">
        <button
          disabled={data.page <= 1}
          onClick={() => setPage(data.page - 1)}
          className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 disabled:opacity-30"
        >
          <LuChevronLeft />
        </button>
        <button
          disabled={data.page >= data.pages}
          onClick={() => setPage(data.page + 1)}
          className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 disabled:opacity-30"
        >
          <LuChevronRight />
        </button>
      </div>
    </div>
  );
}
export default function EmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [modal, setModal] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [acting, setActing] = useState(false);
  const [toast, setToast] = useState(null);
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      setDebounced(query);
    }, 350);
    return () => clearTimeout(timer);
  }, [query]);
  async function load() {
    setLoading(true);
    try {
      const data = await get(
        `/admin/employees?page=${page}&limit=10&search=${encodeURIComponent(debounced)}`,
      );
      setEmployees(data.items);
      setPagination(data.pagination);
    } catch (error) {
      setToast({ type: "error", text: error.message });
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, [page, debounced]);
  function openCreate() {
    setForm(empty);
    setModal({ type: "create" });
  }
  function openEdit(employee) {
    setForm({ name: employee.name });
    setModal({ type: "edit", employee });
  }
  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    try {
      if (modal.type === "create") {
        await post("/admin/employees", form);
        setToast({ type: "success", text: "Employee account created." });
        setPage(1);
      } else {
        await patch(`/admin/employees/${modal.employee.id}`, {
          name: form.name,
        });
        setToast({ type: "success", text: "Employee name updated." });
      }
      setModal(null);
      await load();
    } catch (error) {
      setToast({ type: "error", text: error.message });
    } finally {
      setSaving(false);
    }
  }
  async function toggleStatus(employee) {
    const verb = employee.status === "ACTIVE" ? "disable" : "enable";
    setActing(true);
    try {
      await patch(`/admin/employees/${employee.id}`, {
        status: employee.status === "ACTIVE" ? "DISABLED" : "ACTIVE",
      });
      setToast({ type: "success", text: `${employee.name} was ${verb}d.` });
      setConfirm(null);
      await load();
    } catch (error) {
      setToast({ type: "error", text: error.message });
    } finally {
      setActing(false);
    }
  }
  async function resetMfa(employee) {
    setActing(true);
    try {
      await post(`/admin/employees/${employee.id}/mfa/reset`, {});
      setToast({ type: "success", text: `MFA reset for ${employee.name}.` });
      setConfirm(null);
      await load();
    } catch (error) {
      setToast({ type: "error", text: error.message });
    } finally {
      setActing(false);
    }
  }
  return (
    <AdminLayout>
      <Toast toast={toast} close={() => setToast(null)} />
      <main className="mx-auto max-w-[1500px] p-4 sm:p-6 lg:p-7">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-1 text-[10px] font-bold tracking-[1.8px] text-blue-600">
              TEAM MANAGEMENT
            </p>
            <h1 className="text-3xl font-black">Employees</h1>
            <p className="mt-1 text-[11px] text-slate-500">
              Create employee accounts and manage their access.
            </p>
          </div>
          <button
            onClick={openCreate}
            className="flex h-11 items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 text-[11px] font-extrabold text-white shadow-lg shadow-orange-200"
          >
            <LuUserPlus />
            Add employee
          </button>
        </div>
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-sm font-extrabold">All employees</h2>
              <p className="text-[9px] text-slate-400">
                {pagination?.total || 0} accounts
              </p>
            </div>
            <div className="relative sm:ml-auto sm:w-80">
              <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-4 text-[10px] outline-none focus:border-blue-400"
                placeholder="Search name or email"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-[10px]">
              <thead className="bg-slate-50 text-[8px] uppercase tracking-wider text-slate-400">
                <tr>
                  {["Employee", "Account type", "MFA", "Status", "Actions"].map(
                    (x) => (
                      <th key={x} className="px-5 py-3">
                        {x}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }, (_, i) => (
                    <tr key={i} className="border-t border-slate-100">
                      <td colSpan="5" className="px-5 py-3">
                        <div className="h-10 animate-pulse rounded-lg bg-slate-100" />
                      </td>
                    </tr>
                  ))
                ) : employees.length === 0 ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="py-16 text-center text-slate-400"
                    >
                      No employees found.
                    </td>
                  </tr>
                ) : (
                  employees.map((employee) => (
                    <tr
                      key={employee.id}
                      className="border-t border-slate-100 hover:bg-slate-50"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span className="grid h-9 w-9 place-items-center rounded-full bg-blue-50 font-black text-blue-600">
                            {employee.name[0]}
                          </span>
                          <div>
                            <b className="block">{employee.name}</b>
                            <small className="text-[8px] text-slate-400">
                              {employee.email}
                            </small>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">Employee</td>
                      <td
                        className={`px-5 py-4 font-bold ${employee.mfaEnabled ? "text-emerald-600" : "text-amber-600"}`}
                      >
                        {employee.mfaEnabled ? "Enabled" : "Pending"}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-2 py-1 text-[8px] font-bold ${employee.status === "ACTIVE" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}
                        >
                          {employee.status}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex gap-2">
                          <button
                            title="Edit name"
                            onClick={() => openEdit(employee)}
                            className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-blue-600 cursor-pointer"
                          >
                            <LuPencil />
                          </button>
                          <button
                            title="Reset MFA"
                            disabled={!employee.mfaEnabled}
                            onClick={() =>
                              setConfirm({ type: "mfa", employee })
                            }
                            className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-violet-600 disabled:opacity-30 cursor-pointer"
                          >
                            <LuRotateCcw />
                          </button>
                          <button
                            onClick={() =>
                              setConfirm({ type: "status", employee })
                            }
                            className="rounded-lg border border-slate-200 px-3 text-[8px] font-bold cursor-pointer"
                          >
                            {employee.status === "ACTIVE"
                              ? "Disable"
                              : "Enable"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <Pager data={pagination} setPage={setPage} />
        </section>
        {modal && (
          <div className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/55 p-4 backdrop-blur-sm">
            <button
              className="absolute inset-0"
              onClick={() => setModal(null)}
            />
            <form
              onSubmit={submit}
              className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl"
            >
              <div className="flex justify-between">
                <div>
                  <p className="text-[9px] font-bold tracking-wider text-orange-500">
                    {modal.type === "create"
                      ? "NEW TEAM MEMBER"
                      : "EMPLOYEE PROFILE"}
                  </p>
                  <h2 className="mt-2 text-2xl font-black">
                    {modal.type === "create" ? "Add employee" : "Edit employee"}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setModal(null)}
                  className="grid h-9 w-9 place-items-center rounded-xl bg-slate-100 cursor-pointer"
                >
                  <LuX />
                </button>
              </div>
              <div className="mt-6 space-y-4">
                <label className="block text-[10px] font-bold">
                  Full name
                  <input
                    required
                    value={form.name || ""}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-4 text-[11px] font-normal outline-none focus:border-blue-400"
                  />
                </label>
                {modal.type === "create" && (
                  <>
                    <label className="block text-[10px] font-bold">
                      Email
                      <input
                        required
                        type="email"
                        value={form.email}
                        onChange={(e) =>
                          setForm({ ...form, email: e.target.value })
                        }
                        className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-4 text-[11px] font-normal outline-none focus:border-blue-400"
                      />
                    </label>
                    <label className="block text-[10px] font-bold">
                      Temporary password
                      <input
                        required
                        minLength="12"
                        type="password"
                        value={form.temporaryPassword}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            temporaryPassword: e.target.value,
                          })
                        }
                        className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-4 text-[11px] font-normal outline-none focus:border-blue-400"
                      />
                    </label>
                  </>
                )}
              </div>
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setModal(null)}
                  className="h-11 flex-1 rounded-xl border border-slate-200 text-[10px] font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  disabled={saving}
                  className="h-11 flex-1 rounded-xl bg-blue-600 text-[10px] font-bold text-white cursor-pointer"
                >
                  {saving
                    ? "Saving..."
                    : modal.type === "create"
                      ? "Create employee"
                      : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        )}
        <ConfirmDialog
          open={Boolean(confirm)}
          loading={acting}
          tone={
            confirm?.type === "status" &&
            confirm?.employee.status === "DISABLED"
              ? "warning"
              : "danger"
          }
          title={
            confirm?.type === "mfa"
              ? "Reset authenticator?"
              : `${confirm?.employee.status === "ACTIVE" ? "Disable" : "Enable"} employee?`
          }
          description={
            confirm?.type === "mfa"
              ? `${confirm?.employee.name}'s authenticator, recovery codes and active sessions will be invalidated.`
              : `${confirm?.employee.name} will ${confirm?.employee.status === "ACTIVE" ? "lose access immediately" : "be allowed to sign in again"}.`
          }
          confirmLabel={
            confirm?.type === "mfa"
              ? "Reset MFA"
              : confirm?.employee.status === "ACTIVE"
                ? "Disable"
                : "Enable"
          }
          onCancel={() => setConfirm(null)}
          onConfirm={() =>
            confirm?.type === "mfa"
              ? resetMfa(confirm.employee)
              : toggleStatus(confirm.employee)
          }
        />
      </main>
    </AdminLayout>
  );
}

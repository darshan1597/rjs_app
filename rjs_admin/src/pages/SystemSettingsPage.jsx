import { useEffect, useState } from "react";
import {
  LuBuilding2,
  LuClock3,
  LuLockKeyhole,
  LuMonitorSmartphone,
  LuSave,
  LuShieldCheck,
  LuSmartphone,
  LuUsers,
} from "react-icons/lu";
import AdminLayout from "../components/AdminLayout.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import { get, patch, post } from "../services/api.js";

const appDefaults = {
  status: "ACTIVE",
  maintenanceMessage: "",
  minimumVersion: "1.0.0",
  forceUpdate: false,
};
const defaults = {
  company: {
    businessName: "RJS Tours",
    supportEmail: "",
    supportPhone: "",
    headOfficeAddress: "",
    logoUrl: "",
  },
  security: { employeeLoginBlocked: false },
  apps: { customer: appDefaults, driver: appDefaults },
};
function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 rounded-full transition cursor-pointer ${checked ? "bg-blue-600" : "bg-slate-200"}`}
    >
      <span
        className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition ${checked ? "left-6" : "left-1"}`}
      />
    </button>
  );
}
function Field({ label, ...props }) {
  return (
    <label className="block text-[10px] font-bold text-slate-700">
      {label}
      <input
        {...props}
        className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-4 text-[11px] font-normal outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
      />
    </label>
  );
}
function AppCard({ title, subtitle, icon: Icon, value, onChange }) {
  const set = (key, next) => onChange({ ...value, [key]: next });
  return (
    <article className="rounded-2xl border border-slate-200 p-4">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600">
          <Icon />
        </span>
        <div>
          <h3 className="text-[12px] font-extrabold">{title}</h3>
          <p className="text-[9px] text-slate-400">{subtitle}</p>
        </div>
        <span
          className={`ml-auto rounded-full px-2 py-1 text-[8px] font-bold ${value.status === "ACTIVE" ? "bg-emerald-50 text-emerald-600" : "bg-orange-50 text-orange-600"}`}
        >
          {value.status}
        </span>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="text-[10px] font-bold text-slate-700">
          Application status
          <select
            value={value.status}
            onChange={(event) => set("status", event.target.value)}
            className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-[11px] font-normal"
          >
            <option value="ACTIVE">Active</option>
            <option value="MAINTENANCE">Maintenance</option>
          </select>
        </label>
        <Field
          label="Minimum version"
          value={value.minimumVersion}
          onChange={(event) => set("minimumVersion", event.target.value)}
        />
      </div>
      <label className="mt-4 block text-[10px] font-bold text-slate-700">
        Maintenance message
        <textarea
          value={value.maintenanceMessage}
          onChange={(event) => set("maintenanceMessage", event.target.value)}
          maxLength={300}
          className="mt-2 min-h-20 w-full resize-none rounded-xl border border-slate-200 p-3 text-[11px] font-normal outline-none focus:border-blue-400"
          placeholder="Message displayed during maintenance"
        />
      </label>
      <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 p-3">
        <div>
          <strong className="block text-[10px]">
            Force application update
          </strong>
          <small className="text-[8px] text-slate-400">
            Require the minimum supported version
          </small>
        </div>
        <Toggle
          checked={value.forceUpdate}
          onChange={(next) => set("forceUpdate", next)}
        />
      </div>
    </article>
  );
}

export default function SystemSettingsPage() {
  const [form, setForm] = useState(defaults);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [confirmRevoke, setConfirmRevoke] = useState(false);
  const [revoking, setRevoking] = useState(false);
  useEffect(() => {
    get("/admin/system-settings")
      .then((data) => {
        setForm({
          company: { ...defaults.company, ...data.company },
          security: { ...defaults.security, ...data.security },
          apps: {
            customer: { ...appDefaults, ...data.apps?.customer },
            driver: { ...appDefaults, ...data.apps?.driver },
          },
        });
        setMeta(data);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);
  const company = (key) => (event) =>
    setForm((current) => ({
      ...current,
      company: { ...current.company, [key]: event.target.value },
    }));
  const setApp = (key, value) =>
    setForm((current) => ({
      ...current,
      apps: { ...current.apps, [key]: value },
    }));
  async function save(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const data = await patch("/admin/system-settings", form);
      setMeta(data);
      setMessage("System settings saved successfully.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }
  async function revoke() {
    setRevoking(true);
    setError("");
    try {
      const data = await post(
        "/admin/system-settings/revoke-employee-sessions",
        {},
      );
      setMessage(`${data.revokedSessions} employee sessions revoked.`);
      setConfirmRevoke(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setRevoking(false);
    }
  }
  return (
    <AdminLayout>
      <main className="mx-auto max-w-[1150px] p-4 sm:p-6 lg:p-7">
        <div className="mb-6">
          <p className="mb-1 text-[10px] font-bold tracking-[1.8px] text-blue-600">
            PLATFORM CONTROL
          </p>
          <h1 className="text-3xl font-black tracking-tight">
            System settings
          </h1>
          <p className="mt-1 text-[11px] text-slate-500">
            Only essential organization, security and application controls.
          </p>
        </div>
        {error && (
          <p className="mb-4 rounded-xl bg-red-50 p-3 text-[10px] font-semibold text-red-600">
            {error}
          </p>
        )}
        {message && (
          <p className="mb-4 rounded-xl bg-emerald-50 p-3 text-[10px] font-semibold text-emerald-600">
            {message}
          </p>
        )}
        {loading ? (
          <div className="grid h-72 place-items-center text-[10px] text-slate-400">
            Loading settings...
          </div>
        ) : (
          <form onSubmit={save} className="space-y-4">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-orange-50 text-orange-600">
                  <LuBuilding2 />
                </span>
                <div>
                  <h2 className="text-sm font-extrabold">Company profile</h2>
                  <p className="text-[9px] text-slate-400">
                    Public support and office information
                  </p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  required
                  label="Business name"
                  value={form.company.businessName}
                  onChange={company("businessName")}
                />
                <Field
                  required
                  type="email"
                  label="Support email"
                  value={form.company.supportEmail}
                  onChange={company("supportEmail")}
                />
                <Field
                  required
                  label="Support phone"
                  value={form.company.supportPhone}
                  onChange={company("supportPhone")}
                />
                <Field
                  label="Logo URL (optional)"
                  value={form.company.logoUrl}
                  onChange={company("logoUrl")}
                />
                <label className="text-[10px] font-bold text-slate-700 sm:col-span-2">
                  Head-office address
                  <textarea
                    required
                    value={form.company.headOfficeAddress}
                    onChange={company("headOfficeAddress")}
                    className="mt-2 min-h-20 w-full rounded-xl border border-slate-200 p-3 text-[11px] font-normal outline-none focus:border-blue-400"
                  />
                </label>
              </div>
            </section>
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-violet-50 text-violet-600">
                  <LuLockKeyhole />
                </span>
                <div>
                  <h2 className="text-sm font-extrabold">
                    Security and employee access
                  </h2>
                  <p className="text-[9px] text-slate-400">
                    High-level access controls
                  </p>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="flex items-center justify-between rounded-xl border border-slate-200 p-4">
                  <div>
                    <strong className="flex items-center gap-2 text-[10px]">
                      <LuShieldCheck className="text-emerald-600" />
                      Authenticator verification
                    </strong>
                    <small className="text-[8px] text-slate-400">
                      Required for every admin account
                    </small>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-2 py-1 text-[8px] font-bold text-emerald-600">
                    ENFORCED
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-slate-200 p-4">
                  <div>
                    <strong className="flex items-center gap-2 text-[10px]">
                      <LuClock3 className="text-blue-600" />
                      Session duration
                    </strong>
                    <small className="text-[8px] text-slate-400">
                      Automatic administrator expiry
                    </small>
                  </div>
                  <b className="text-[10px]">12 hours</b>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-slate-200 p-4">
                  <div>
                    <strong className="flex items-center gap-2 text-[10px]">
                      <LuUsers className="text-orange-500" />
                      Block employee login
                    </strong>
                    <small className="text-[8px] text-slate-400">
                      Prevent new employee sign-ins
                    </small>
                  </div>
                  <Toggle
                    checked={form.security.employeeLoginBlocked}
                    onChange={(next) =>
                      setForm((current) => ({
                        ...current,
                        security: { employeeLoginBlocked: next },
                      }))
                    }
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setConfirmRevoke(true)}
                  className="rounded-xl border border-red-100 bg-red-50 p-4 text-left"
                >
                  <strong className="block text-[10px] text-red-600">
                    Sign out all employees
                  </strong>
                  <small className="text-[8px] text-red-400">
                    Revoke every active employee session
                  </small>
                </button>
              </div>
            </section>
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-blue-50 text-blue-600">
                  <LuMonitorSmartphone />
                </span>
                <div>
                  <h2 className="text-sm font-extrabold">
                    Application control
                  </h2>
                  <p className="text-[9px] text-slate-400">
                    Availability and supported versions
                  </p>
                </div>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <AppCard
                  title="Customer app"
                  subtitle="RJS booking application"
                  icon={LuSmartphone}
                  value={form.apps.customer}
                  onChange={(value) => setApp("customer", value)}
                />
                <AppCard
                  title="Driver app"
                  subtitle="RJS driver operations"
                  icon={LuMonitorSmartphone}
                  value={form.apps.driver}
                  onChange={(value) => setApp("driver", value)}
                />
              </div>
            </section>
            <div className="sticky bottom-4 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-xl backdrop-blur sm:flex-row sm:items-center">
              <p className="text-[9px] text-slate-400">
                {meta?.updatedAt
                  ? `Last updated ${new Date(meta.updatedAt).toLocaleString("en-IN")}${meta.updatedBy?.name ? ` by ${meta.updatedBy.name}` : ""}`
                  : "Not updated yet"}
              </p>
              <button
                disabled={saving}
                className="flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 text-[10px] font-extrabold text-white sm:ml-auto cursor-pointer"
              >
                <LuSave />
                {saving ? "Saving..." : "Save changes"}
              </button>
            </div>
          </form>
        )}
        <ConfirmDialog open={confirmRevoke} loading={revoking} title="Sign out all employees?" description="Every active employee session will be revoked immediately. Employees will need to sign in and verify their authenticator again." confirmLabel="Sign out employees" onCancel={() => setConfirmRevoke(false)} onConfirm={revoke}/>
      </main>
    </AdminLayout>
  );
}

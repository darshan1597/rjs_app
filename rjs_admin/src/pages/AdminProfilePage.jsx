import { useState } from "react";
import {
  LuBadgeCheck,
  LuCalendarClock,
  LuKeyRound,
  LuLockKeyhole,
  LuLogOut,
  LuMail,
  LuShieldCheck,
  LuUser,
} from "react-icons/lu";
import AdminLayout from "../components/AdminLayout.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { post } from "../services/api.js";

function Detail({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 p-4">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600">
        <Icon />
      </span>
      <div>
        <small className="block text-[8px] uppercase tracking-wider text-slate-400">
          {label}
        </small>
        <strong className="mt-1 block text-[11px]">
          {value || "Not available"}
        </strong>
      </div>
    </div>
  );
}
export default function AdminProfilePage() {
  const { admin, session, updateAdmin, logout, logoutAll } = useAuth();
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const set = (key) => (event) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));
  async function changePassword(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    if (form.newPassword !== form.confirmPassword)
      return setError("The new passwords do not match");
    setSaving(true);
    try {
      const result = await post(
        "/admin/auth/change-password",
        {
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        },
        session.tokens.accessToken,
      );
      updateAdmin(result.admin);
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setMessage(
        "Password changed successfully. Other device sessions were revoked.",
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }
  return (
    <AdminLayout>
      <main className="mx-auto max-w-[1050px] p-4 sm:p-6 lg:p-7">
        <div className="mb-6">
          <p className="mb-1 text-[10px] font-bold tracking-[1.8px] text-blue-600">
            ACCOUNT & SECURITY
          </p>
          <h1 className="text-3xl font-black tracking-tight">My profile</h1>
          <p className="mt-1 text-[11px] text-slate-500">
            Review your administrator identity and secure active sessions.
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
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="bg-gradient-to-r from-[#081a40] via-blue-900 to-blue-700 p-6 text-white sm:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <span className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 text-3xl font-black shadow-xl ring-4 ring-white/15">
                {admin.name?.[0]}
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-2xl font-black">{admin.name}</h2>
                  <span className="flex items-center gap-1 rounded-full bg-emerald-400/15 px-2 py-1 text-[8px] font-bold text-emerald-200">
                    <LuBadgeCheck />
                    VERIFIED
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-blue-100">{admin.email}</p>
                <span className="mt-3 inline-flex items-center gap-1 rounded-lg bg-white/10 px-2 py-1 text-[9px] font-bold">
                  <LuShieldCheck />
                  Super Admin
                </span>
              </div>
            </div>
          </div>
          <div className="grid gap-3 p-5 sm:grid-cols-2">
            <Detail icon={LuUser} label="Account name" value={admin.name} />
            <Detail icon={LuMail} label="Email address" value={admin.email} />
            <Detail
              icon={LuLockKeyhole}
              label="Authenticator verification"
              value={admin.mfaEnabled ? "Enabled" : "Not configured"}
            />
            <Detail
              icon={LuCalendarClock}
              label="Last successful login"
              value={
                admin.lastLoginAt
                  ? new Date(admin.lastLoginAt).toLocaleString("en-IN")
                  : "Current session"
              }
            />
          </div>
        </section>
        <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-violet-50 text-violet-600">
              <LuKeyRound />
            </span>
            <div>
              <h2 className="text-sm font-extrabold">Change password</h2>
              <p className="text-[9px] text-slate-400">
                Changing it revokes your other active sessions
              </p>
            </div>
          </div>
          <form onSubmit={changePassword} className="grid gap-4 md:grid-cols-3">
            {[
              ["Current password", "currentPassword"],
              ["New password", "newPassword"],
              ["Confirm password", "confirmPassword"],
            ].map(([label, key]) => (
              <label key={key} className="text-[10px] font-bold text-slate-700">
                {label}
                <input
                  required
                  minLength={key === "currentPassword" ? 1 : 12}
                  type="password"
                  value={form[key]}
                  onChange={set(key)}
                  className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-4 text-[11px] font-normal outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                />
              </label>
            ))}
            <button
              disabled={saving}
              className="flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 text-[10px] font-extrabold text-white md:col-start-3"
            >
              <LuKeyRound />
              {saving ? "Changing..." : "Change password"}
            </button>
          </form>
        </section>
        <section className="mt-4 grid gap-3 sm:grid-cols-2">
          <button
            onClick={logout}
            className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm"
          >
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-orange-50 text-orange-600">
              <LuLogOut />
            </span>
            <div>
              <strong className="block text-[11px]">
                Sign out this device
              </strong>
              <small className="text-[8px] text-slate-400">
                End only the current browser session
              </small>
            </div>
          </button>
          <button
            onClick={logoutAll}
            className="flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50/60 p-5 text-left"
          >
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-red-100 text-red-600">
              <LuLogOut />
            </span>
            <div>
              <strong className="block text-[11px] text-red-600">
                Sign out all devices
              </strong>
              <small className="text-[8px] text-red-400">
                Immediately revoke every active session
              </small>
            </div>
          </button>
        </section>
      </main>
    </AdminLayout>
  );
}

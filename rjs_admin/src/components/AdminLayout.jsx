import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  LuCalendarDays,
  LuCarFront,
  LuCircleCheck,
  LuLayoutDashboard,
  LuLogOut,
  LuMenu,
  LuPackageOpen,
  LuSettings,
  LuLifeBuoy,
  LuClipboardPenLine,
  LuUsers,
  LuWalletCards,
} from "react-icons/lu";
import Brand from "./Brand.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const superLinks = [
  ["/", LuLayoutDashboard, "Dashboard"],
  ["/employees", LuUsers, "Employees"],
  ["/audit-logs", LuCircleCheck, "Audit logs"],
  ["/system-settings", LuSettings, "System settings"],
];

const employeeLinks = [
  ["/", LuLayoutDashboard, "Dashboard"],
  ["/drivers", LuCarFront, "Drivers"],
  ["/vehicles", LuCarFront, "Vehicles"],
  ["/bookings", LuCalendarDays, "Bookings"],
  ["/custom-enquiries", LuClipboardPenLine, "Custom enquiries"],
  ["/tour-packages", LuPackageOpen, "Tour packages"],
  ["/payments", LuWalletCards, "Payments"],
  ["/support-tickets", LuLifeBuoy, "Support tickets"],
];

export default function AdminLayout({ children }) {
  const { admin, logout, logoutAll } = useAuth();
  const [open, setOpen] = useState(false);
  const links =
    admin?.accountType === "SUPER_ADMIN" ? superLinks : employeeLinks;
  return (
    <div className="min-h-screen bg-[#f6f8fc] text-[#11182d]">
      {open && (
        <button
          aria-label="Close navigation"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm lg:hidden"
        />
      )}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-[248px] flex-col overflow-hidden bg-[#071332] text-white transition-transform duration-300 lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_5%,rgba(45,75,255,.24),transparent_33%),linear-gradient(180deg,transparent,rgba(0,5,22,.35))]" />
        
        <div className="relative border-b border-white/10 px-6 py-6">
          <Brand light />
        </div>
        <nav className="relative flex-1 overflow-y-auto px-3 py-5">
          <p className="px-3 pb-2 text-[9px] font-bold tracking-[1.8px] text-slate-500">
            {admin?.accountType === "SUPER_ADMIN"
              ? "ADMINISTRATION"
              : "OPERATIONS"}
          </p>
          {links.map(([to, Icon, label]) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `mb-1 flex items-center gap-3 rounded-xl px-3 py-3 text-[12px] font-semibold transition ${isActive ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-950/50" : "text-slate-300 hover:bg-white/8 hover:text-white"}`
              }
            >
              <Icon className="shrink-0 text-[18px]" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="relative border-t border-white/10 p-3">
          <NavLink to="/profile" className="flex items-center gap-3 rounded-xl bg-white/5 p-3 transition hover:bg-white/10">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-sm font-black">
              {admin?.name?.[0] || "A"}
            </span>
            <div className="min-w-0 flex-1">
              <strong className="block truncate text-[11px]">
                {admin?.name}
              </strong>
              <small className="text-[9px] text-slate-400">
                {admin?.accountType === "SUPER_ADMIN"
                  ? "Super Admin"
                  : "Employee"}
              </small>
            </div>
          </NavLink>
          <button
            onClick={logoutAll}
            className="mt-2 w-full py-1 text-[9px] text-slate-500 hover:text-orange-300 cursor-pointer"
          >
            Sign out on all devices
          </button>
        </div>
      </aside>
      <div className="lg:pl-[248px]">
        <header className="sticky top-0 z-30 flex h-[68px] items-center border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-xl sm:px-6">
          <button
            aria-label="Open navigation"
            onClick={() => setOpen(true)}
            className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-xl lg:hidden"
          >
            <LuMenu />
          </button>
          <button
            onClick={logout}
            className="ml-auto flex h-10 items-center gap-2 rounded-xl bg-orange-50 px-4 text-[10px] font-extrabold text-orange-600 transition hover:bg-orange-100 cursor-pointer"
          >
            <LuLogOut className="text-base" />
            Logout
          </button>
        </header>
        {children}
      </div>
    </div>
  );
}

import { LuShieldAlert, LuX } from "react-icons/lu";

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  tone = "danger",
  loading = false,
  onCancel,
  onConfirm,
}) {
  if (!open) return null;
  const danger = tone === "danger";
  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/55 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
    >
      <button
        aria-label="Close confirmation"
        className="absolute inset-0"
        onClick={loading ? undefined : onCancel}
      />
      <section className="relative w-full max-w-sm rounded-3xl border border-white/50 bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <span
            className={`grid h-12 w-12 place-items-center rounded-2xl text-xl ${danger ? "bg-red-50 text-red-600" : "bg-orange-50 text-orange-600"}`}
          >
            <LuShieldAlert />
          </span>
          <button
            disabled={loading}
            onClick={onCancel}
            className="grid h-9 w-9 place-items-center rounded-xl bg-slate-100 text-slate-500 disabled:opacity-40 cursor-pointer"
          >
            <LuX />
          </button>
        </div>
        <h2
          id="confirm-title"
          className="mt-5 text-xl font-black text-slate-950"
        >
          {title}
        </h2>
        <p className="mt-2 text-[10px] leading-5 text-slate-500">
          {description}
        </p>
        <div className="mt-6 flex gap-3">
          <button
            disabled={loading}
            onClick={onCancel}
            className="h-11 flex-1 rounded-xl border border-slate-200 text-[10px] font-bold text-slate-600 disabled:opacity-40 cursor-pointer"
          >
            Cancel
          </button>
          <button
            disabled={loading}
            onClick={onConfirm}
            className={`h-11 flex-1 rounded-xl text-[10px] font-extrabold text-white disabled:opacity-50 cursor-pointer ${danger ? "bg-red-600" : "bg-orange-500"}`}
          >
            {loading ? "Please wait..." : confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}

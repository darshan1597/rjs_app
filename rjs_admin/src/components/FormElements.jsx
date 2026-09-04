const cardClass =
  "mx-auto w-full max-w-[460px] rounded-3xl border border-slate-200 bg-white p-7 shadow-[0_24px_60px_rgba(21,51,101,0.08)] sm:p-10";
const wideCardClass = `${cardClass} max-w-[540px]`;
const primaryButtonClass =
  "flex min-h-12 w-full items-center justify-center gap-3 rounded-xl border-0 bg-gradient-to-r from-orange-500 to-orange-600 text-xs font-extrabold text-white shadow-lg shadow-orange-500/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50";
const inputClass =
  "mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10";

function ErrorMessage({ error }) {
  return error ? (
    <div
      className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-[10px] text-red-700"
      role="alert"
    >
      {error}
    </div>
  ) : null;
}
function Field({ label, className = "", ...props }) {
  return (
    <label className="my-4 block text-[11px] font-bold text-slate-900">
      {label}
      <input className={`${inputClass} ${className}`} {...props} />
    </label>
  );
}

export {
  ErrorMessage,
  Field,
  cardClass,
  inputClass,
  primaryButtonClass,
  wideCardClass,
};

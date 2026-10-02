export default function Brand({ light = false }) {
  return (
    <div className="relative z-10 flex items-center gap-3">
      <span className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl p-1.5 shadow-sm ${light ? 'bg-white ring-1 ring-white/20' : 'bg-slate-50 ring-1 ring-slate-200'}`}>
        <img className="h-full w-full object-contain" src="/assets/rjs-logo.png" alt="RJS" />
      </span>
      <div>
        <strong className="block text-[13px] tracking-[2px]">TOURS</strong>
        <small className={`block text-[8px] tracking-[2.6px] ${light ? 'text-blue-100' : 'text-slate-500'}`}>ADMIN CONSOLE</small>
      </div>
    </div>
  );
}

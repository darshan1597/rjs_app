export default function Brand({ light = false }) {
  return (
    <div className="relative z-10 flex items-center gap-3">
      <div className="-skew-x-6 text-3xl font-black tracking-[-5px]">
        <span className={light ? 'text-white' : 'text-orange-500'}>R</span>
        <span className={light ? 'text-white' : 'text-blue-600'}>JS</span>
      </div>
      <div>
        <strong className="block text-[13px] tracking-[2px]">RJS TOURS</strong>
        <small className={`block text-[8px] tracking-[2.6px] ${light ? 'text-blue-100' : 'text-slate-500'}`}>ADMIN CONSOLE</small>
      </div>
    </div>
  );
}

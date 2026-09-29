import RjsMapPin from './RjsMapPin.jsx';

export default function LocationSelectButton({ label, placeholder, value, destination = false, onClick }) {
  return <button type="button" onClick={onClick} className="block w-full rounded-[9px] border border-[var(--line)] bg-white px-[11px] py-[9px] text-left transition hover:border-[#b98408] hover:bg-[#fffdf7] focus:border-[#b98408] focus:shadow-[0_0_0_3px_rgba(238,178,27,.14)] focus:outline-none">
    <span className="block text-[7px] font-extrabold tracking-[1px] text-[#9a7214]">{label}</span>
    <span className="mt-0.5 flex items-center gap-1.5"><RjsMapPin type={destination ? 'destination' : 'pickup'} className="h-5 w-4 shrink-0" /><span className={`truncate text-xs ${value ? 'font-semibold text-[var(--ink)]' : 'text-[#8b94a2]'}`}>{value?.address || placeholder}</span></span>
  </button>;
}

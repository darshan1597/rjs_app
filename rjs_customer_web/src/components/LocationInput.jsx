import { useEffect, useRef, useState } from 'react';
import { LoaderCircle, MapPin } from 'lucide-react';
import { api } from '../lib/api.js';

function uuid() {
  return crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function LocationInput({ label, placeholder, value, onChange }) {
  const [text, setText] = useState(value?.address || '');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const token = useRef(uuid());
  const root = useRef(null);

  useEffect(() => setText(value?.address || ''), [value?.address]);
  useEffect(() => {
    const close = (event) => !root.current?.contains(event.target) && setResults([]);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);
  useEffect(() => {
    if (text.trim().length < 3 || text === value?.address) return setResults([]);
    const timer = setTimeout(async () => {
      setLoading(true); setError('');
      try {
        const params = new URLSearchParams({ input: text.trim(), sessionToken: token.current });
        const data = await api(`/api/v1/customer/maps/autocomplete?${params}`);
        setResults(data.predictions || []);
      } catch (err) { setError(err.message); }
      finally { setLoading(false); }
    }, 350);
    return () => clearTimeout(timer);
  }, [text, value?.address]);

  async function choose(item) {
    setLoading(true); setError(''); setResults([]);
    try {
      const data = await api(`/api/v1/customer/maps/places/${encodeURIComponent(item.placeId)}?sessionToken=${token.current}`);
      onChange(data.place);
      setText(data.place.address);
      token.current = uuid();
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  return (
    <div className="relative" ref={root}>
      <label className="block rounded-[9px] border border-[var(--line)] bg-white px-[11px] py-[9px] transition focus-within:border-[#b98408] focus-within:bg-[#fffdf7] focus-within:shadow-[0_0_0_3px_rgba(238,178,27,.14)]">
        <span className="block text-[7px] font-extrabold tracking-[1px] text-[#9a7214]">{label}</span>
        <div className="mt-0.5 flex items-center gap-1.5">
          <MapPin className="w-3.5 shrink-0 text-[#8993a2]" />
          <input className="w-full border-0 bg-transparent text-xs font-semibold outline-none" value={text} placeholder={placeholder}
            onChange={(event) => { setText(event.target.value); onChange(null); }} autoComplete="off" />
          {loading && <LoaderCircle className="w-3.5 animate-spin text-[#9a7214]" />}
        </div>
      </label>
      {results.length > 0 && <div className="absolute right-0 left-0 z-40 mt-1 max-h-60 overflow-auto rounded-xl border border-[#e5d7ad] bg-white p-1.5 shadow-[0_18px_42px_rgba(7,26,61,.18)]">
        {results.map((item) => <button key={item.placeId} type="button" onClick={() => choose(item)} className="flex w-full gap-2 rounded-lg border-0 bg-white p-3 text-left hover:bg-[#fff8e5]">
          <MapPin className="mt-0.5 w-4 shrink-0 text-[#a87808]" />
          <span><b className="block text-[11px] text-[var(--navy)]">{item.primaryText}</b><small className="text-[9px] text-[#778293]">{item.secondaryText}</small></span>
        </button>)}
      </div>}
      {error && <p className="mt-1 text-[9px] text-[#c83e3e]">{error}</p>}
    </div>
  );
}

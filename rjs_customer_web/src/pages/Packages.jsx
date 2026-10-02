import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, CalendarDays, Check, MapPin, Route, Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import { fetchTourPackages, formatPackagePrice, packageImageUrl } from '../lib/tourPackages.js';

export default function Packages() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    fetchTourPackages()
      .then((data) => { if (active) setPackages(data.items || []); })
      .catch((requestError) => { if (active) setError(requestError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const filteredPackages = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return packages;
    return packages.filter((item) => [item.title, item.originCity, item.shortDescription, ...(item.places || []).map((place) => place.name)]
      .filter(Boolean).join(' ').toLowerCase().includes(value));
  }, [packages, query]);

  return <>
    <Navbar />
    <main className="min-h-screen bg-[#f7f8fa]">
      <section className="mx-auto w-[min(1200px,calc(100%-48px))] pt-20 pb-[95px] max-[650px]:w-[min(1200px,calc(100%-28px))] max-[600px]:pt-[60px]">
        <div className="mb-8 flex items-end justify-between gap-6 max-[700px]:block">
          <div><span className="text-[9px] font-extrabold tracking-[1.5px] text-[#a4770d]">{loading ? 'LOADING PACKAGES' : `${packages.length} ${packages.length === 1 ? 'PACKAGE' : 'PACKAGES'}`}</span><h1 className="my-[9px] mb-[5px] font-[Manrope] text-[42px] leading-[1.1] font-bold tracking-[-2px] text-[var(--navy)] max-[600px]:text-[34px]">Find your next escape</h1><p className="m-0 max-w-xl text-xs leading-6 text-[#737e8d]">Admin-curated journeys with the vehicle, driver and essential trip costs planned for you.</p></div>
          <div className="m-0 flex h-[52px] w-[430px] max-w-[45%] items-center gap-[10px] rounded-[11px] border border-[#dce1e7] bg-white px-3.5 shadow-[0_7px_22px_rgba(8,28,59,.055)] focus-within:border-[#b98408] focus-within:shadow-[0_0_0_3px_rgba(238,178,27,.13)] max-[700px]:mt-5 max-[700px]:w-full max-[700px]:max-w-none"><Search className="w-[18px] text-[#9a7210]" /><input className="w-full border-0 bg-transparent text-xs text-[var(--ink)] outline-0 placeholder:text-[#9ca4af]" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search package or place..." aria-label="Search packages" />{query && <button className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-full border-0 bg-[#f0f2f5] text-[#697484] hover:bg-[var(--navy)] hover:text-white" onClick={() => setQuery('')} aria-label="Clear search"><X className="w-[13px]" /></button>}</div>
        </div>

        {loading && <div className="grid grid-cols-3 gap-[18px] max-[900px]:grid-cols-2 max-[600px]:grid-cols-1">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="overflow-hidden rounded-2xl border border-[#e1e5ea] bg-white"><div className="h-[225px] animate-pulse bg-[#e8ebef]" /><div className="space-y-3 p-5"><div className="h-3 w-1/3 animate-pulse rounded bg-[#e8ebef]" /><div className="h-6 w-2/3 animate-pulse rounded bg-[#e8ebef]" /><div className="h-3 w-full animate-pulse rounded bg-[#eef0f3]" /></div></div>)}</div>}
        {!loading && error && <div className="rounded-2xl border border-[#f0caca] bg-[#fff5f5] px-6 py-12 text-center"><p className="text-sm font-bold text-[#a83232]">Packages could not be loaded</p><p className="mt-2 text-xs text-[#7e5e5e]">{error}</p><button onClick={() => window.location.reload()} className="mt-5 rounded-lg border-0 bg-[var(--navy)] px-5 py-3 text-xs font-bold text-white">Try again</button></div>}
        {!loading && !error && filteredPackages.length > 0 && <div className="grid grid-cols-3 gap-[18px] max-[900px]:grid-cols-2 max-[600px]:grid-cols-1">{filteredPackages.map((item) => <article className="group cursor-pointer overflow-hidden rounded-2xl border border-[var(--line)] bg-white transition-all duration-300 hover:-translate-y-[5px] hover:shadow-[0_18px_42px_rgba(8,28,59,.1)]" key={item._id} onClick={() => navigate(`/packages/${item.slug}`)}>
          <div className="relative h-[235px] overflow-hidden max-[600px]:h-[220px]"><img className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" src={packageImageUrl(item.coverImageUrl)} alt={item.title} /><span className="absolute top-3 left-3 rounded-full bg-white px-3 py-1.5 text-[8px] font-extrabold text-[var(--navy)] shadow">{item.badge}</span>{item.featured && <span className="absolute top-3 right-3 rounded-full bg-[var(--gold)] px-3 py-1.5 text-[8px] font-black text-[var(--navy)]">FEATURED</span>}</div>
          <div className="p-5"><small className="flex items-center gap-1.5 text-[10px] text-[#777f8d]"><MapPin className="w-[13px] text-[#a6780b]" />From {item.originCity}</small><h2 className="my-[7px] font-[Manrope] text-[21px] font-bold text-[var(--navy)]">{item.title}</h2><p className="min-h-10 text-[10px] leading-5 text-[#777f8d]">{item.shortDescription}</p><div className="mt-3 flex flex-wrap gap-3 text-[9px] font-semibold text-[#5f6b7c]"><span className="flex items-center gap-1"><CalendarDays className="w-3.5 text-[#a6780b]" />{item.durationLabel}</span><span className="flex items-center gap-1"><Route className="w-3.5 text-[#2b8261]" />{item.distanceKm} km</span></div><div className="mt-[15px] flex flex-wrap gap-3 border-t border-[var(--line)] pt-[13px]">{(item.inclusions || []).slice(0, 2).map((inclusion) => <span key={inclusion} className="flex items-center gap-1 text-[8px] text-[#647081]"><Check className="w-[11px] text-[#2b8261]" />{inclusion}</span>)}</div><div className="mt-[17px] flex items-end justify-between"><span className="flex flex-col text-[7px] text-[#8c95a1]">PACKAGE PRICE <b className="font-[Manrope] text-lg font-extrabold text-[var(--navy)]">{formatPackagePrice(item.price)}</b></span><button className="flex items-center gap-[7px] rounded-lg border-0 bg-[var(--gold)] px-3 py-[10px] text-[9px] font-extrabold text-[var(--navy)]">View details <ArrowRight className="w-[13px]" /></button></div></div>
        </article>)}</div>}
        {!loading && !error && filteredPackages.length === 0 && <div className="rounded-2xl border border-[var(--line)] bg-white px-[25px] py-[70px] text-center"><Search className="mx-auto h-[34px] w-[34px] text-[#a77a0d]" /><h3 className="mt-[13px] mb-[5px] font-[Manrope] text-xl font-bold text-[var(--navy)]">{packages.length ? 'No packages found' : 'No published packages yet'}</h3><p className="text-[11px] text-[#7b8593]">{packages.length ? 'Try a different package or destination name.' : 'Published tour packages from the admin panel will appear here.'}</p>{query && <button className="mt-3 rounded-lg border-0 bg-[var(--gold)] px-3.5 py-[10px] text-[10px] font-extrabold text-[var(--navy)]" onClick={() => setQuery('')}>Clear search</button>}</div>}
      </section>
    </main>
    <Footer />
  </>;
}

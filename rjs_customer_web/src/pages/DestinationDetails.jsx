import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, BusFront, CarFront, Check, Clock3, Copy, Gauge, Headphones, Image as ImageIcon, LoaderCircle, MapPin, Route, ShieldCheck, UserRound, Van } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import { fetchTourPackage, formatPackagePrice, packageImageUrl } from '../lib/tourPackages.js';

const vehicleIcons = { CAR: CarFront, TEMPO_TRAVELLER: Van, BUS: BusFront };

function Panel({ title, children, className = '' }) {
  return <section className={`rounded-2xl border border-[#e6e9ee] bg-white p-6 shadow-[0_7px_22px_rgba(10,36,74,.04)] max-[600px]:p-4 ${className}`}><h2 className="mb-4 font-[Manrope] text-lg font-extrabold text-[var(--navy)]">{title}</h2>{children}</section>;
}

export default function DestinationDetails() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [tour, setTour] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true); setError(''); setTour(null); setSelectedImage(0);
    fetchTourPackage(slug)
      .then((item) => { if (active) setTour(item); })
      .catch((requestError) => { if (active) setError(requestError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [slug]);

  const images = useMemo(() => tour ? [...new Set([tour.coverImageUrl, ...(tour.gallery || [])].filter(Boolean))] : [], [tour]);

  async function sharePackage() {
    const shareData = { title: tour.title, text: tour.shortDescription, url: window.location.href };
    if (navigator.share) {
      try { await navigator.share(shareData); return; } catch (shareError) { if (shareError.name === 'AbortError') return; }
    }
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true); setTimeout(() => setCopied(false), 1800);
  }

  if (loading) return <><Navbar /><main className="grid min-h-[76vh] place-items-center bg-[#f7f8fa]"><div className="text-center"><LoaderCircle className="mx-auto h-10 w-10 animate-spin text-[#a87808]" /><p className="mt-3 text-xs text-[#718093]">Loading package details…</p></div></main><Footer /></>;
  if (!tour) return <><Navbar /><main className="grid min-h-[76vh] place-items-center bg-[#f7f8fa] px-5"><div className="max-w-md rounded-2xl border border-[#efd0d0] bg-white p-8 text-center"><h1 className="font-[Manrope] text-2xl font-bold text-[var(--navy)]">Package unavailable</h1><p className="mt-3 text-xs leading-6 text-[#758091]">{error || 'This package may no longer be published.'}</p><button onClick={() => navigate('/packages')} className="mt-6 rounded-xl border-0 bg-[var(--navy)] px-5 py-3 text-xs font-bold text-white">View tour packages</button></div></main><Footer /></>;

  const currentImage = packageImageUrl(images[selectedImage] || tour.coverImageUrl);

  return <>
    <Navbar />
    <main className="min-h-screen bg-[#f8f9fc] pb-24 max-[650px]:pb-28">
      <header className="mx-auto flex w-[min(1120px,calc(100%-40px))] items-center gap-4 py-7 max-[650px]:w-[calc(100%-28px)] max-[650px]:py-4"><button onClick={() => navigate('/packages')} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-[#e1e5eb] bg-white text-[var(--navy)] shadow-sm" aria-label="Back to tour packages"><ArrowLeft className="w-5" /></button><div className="min-w-0"><h1 className="truncate font-[Manrope] text-2xl font-extrabold text-[var(--navy)] max-[600px]:text-lg">Tour Package Details</h1><p className="truncate text-xs text-[#788393]">{tour.title}</p></div><button onClick={sharePackage} className="ml-auto flex h-11 items-center gap-2 rounded-xl border border-[#e1e5eb] bg-white px-4 text-[10px] font-bold text-[var(--navy)] shadow-sm"><Copy className="w-4" />{copied ? 'Link copied' : 'Share'}</button></header>

      <div className="mx-auto grid w-[min(1120px,calc(100%-40px))] grid-cols-[minmax(0,1fr)_320px] gap-6 max-[900px]:grid-cols-1 max-[650px]:w-[calc(100%-28px)]">
        <div className="space-y-4">
          <section className="relative overflow-hidden rounded-2xl bg-[var(--navy)] shadow-[0_18px_45px_rgba(7,26,61,.14)]"><div className="relative aspect-[2.25/1] min-h-[310px] max-[650px]:aspect-[1.25/1] max-[650px]:min-h-0"><img src={currentImage} alt={tour.title} className="h-full w-full object-cover" /><div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,15,38,.05)_25%,rgba(3,15,38,.9)_100%)]" /><span className="absolute top-4 left-4 flex items-center gap-2 rounded-full bg-white px-3 py-2 text-[9px] font-extrabold text-[var(--navy)] shadow"><i className="h-2 w-2 rounded-full bg-[#0861ed]" />{tour.badge}</span><div className="absolute right-5 bottom-5 left-5"><h2 className="font-[Manrope] text-3xl font-extrabold text-white max-[600px]:text-2xl">{tour.title}</h2><p className="mt-2 max-w-2xl text-xs leading-5 text-[#e0e7f0]">{tour.heroSubtitle}</p></div>{images.length > 1 && <span className="absolute top-4 right-4 flex items-center gap-1.5 rounded-full border border-white/25 bg-black/45 px-3 py-2 text-[9px] font-bold text-white backdrop-blur"><ImageIcon className="w-3.5" />{selectedImage + 1}/{images.length}</span>}</div>
            {images.length > 1 && <div className="flex gap-2 overflow-x-auto bg-white p-3">{images.map((image, index) => <button key={image} onClick={() => setSelectedImage(index)} className={`h-14 w-20 shrink-0 overflow-hidden rounded-lg border-2 p-0 ${index === selectedImage ? 'border-[#0861ed]' : 'border-transparent opacity-70'}`}><img src={packageImageUrl(image)} alt={`${tour.title} ${index + 1}`} className="h-full w-full object-cover" /></button>)}</div>}
          </section>

          <section className="grid grid-cols-4 overflow-hidden rounded-2xl border border-[#e6e9ee] bg-white p-4 shadow-[0_7px_22px_rgba(10,36,74,.04)] max-[650px]:grid-cols-2 max-[650px]:gap-y-5">{[
            [Clock3, '#0861ed', 'Duration', tour.durationLabel],
            [Route, '#2d9b43', 'Total distance', `${tour.distanceKm} km`],
            [UserRound, '#9747e5', 'Ideal for', tour.idealFor],
            [Headphones, '#ee7f19', 'Driver', tour.driverLabel],
          ].map(([Icon, color, label, value], index) => <div key={label} className={`flex min-w-0 flex-col items-center px-3 text-center ${index ? 'border-l border-[#e7eaf0] max-[650px]:odd:border-l max-[650px]:even:border-l-0' : ''}`}><span className="grid h-9 w-9 place-items-center rounded-full" style={{ backgroundColor: `${color}16`, color }}><Icon className="w-4.5" /></span><small className="mt-2 text-[9px] font-semibold text-[#7c8796]">{label}</small><b className="mt-1 max-w-full truncate text-xs text-[var(--navy)]">{value}</b></div>)}</section>

          <Panel title="About This Tour"><p className="whitespace-pre-line text-[11px] leading-6 text-[#687486]">{tour.about}</p></Panel>

          <Panel title="Places You’ll Visit"><div className="relative space-y-5 before:absolute before:top-9 before:bottom-9 before:left-[35px] before:w-px before:border-l-2 before:border-dashed before:border-[#ccd9eb]">{(tour.places || []).map((place, index) => <article key={place._id || `${place.name}-${index}`} className="relative flex items-center gap-4"><div className="relative z-[1] h-[72px] w-[72px] shrink-0 overflow-hidden rounded-full border-4 border-white bg-[#e8edf4] shadow-[0_5px_16px_rgba(7,26,61,.12)]">{place.imageUrl ? <img src={packageImageUrl(place.imageUrl)} alt={place.name} className="h-full w-full object-cover" /> : <span className="grid h-full place-items-center text-[#9aa6b5]"><MapPin className="w-6" /></span>}<i className="absolute top-0 left-0 grid h-5 w-5 place-items-center rounded-full bg-[#0861ed] text-[8px] font-bold not-italic text-white">{index + 1}</i></div><div className="min-w-0"><h3 className="font-[Manrope] text-sm font-extrabold text-[var(--navy)]">{place.name}</h3><p className="mt-1 text-[10px] leading-5 text-[#6f7b8c]">{place.description}</p><span className="mt-1.5 flex items-center gap-1 text-[9px] font-bold text-[#0861ed]"><Clock3 className="w-3" />{place.time}</span></div></article>)}</div><p className="mt-5 flex items-start gap-2 rounded-xl bg-[#f0f6ff] p-3 text-[9px] leading-5 text-[#65758a]"><Gauge className="mt-0.5 w-4 shrink-0 text-[#0861ed]" />{tour.itineraryNote}</p></Panel>

          <Panel title="Tour Inclusions"><div className="grid grid-cols-3 gap-2 max-[650px]:grid-cols-2">{(tour.inclusionDetails || []).map((item, index) => <div key={`${item.title}-${index}`} className="flex items-center gap-3 rounded-xl border border-[#e2e6ec] p-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#eaf8ec] text-[#25983a]"><Check className="w-4" /></span><div className="min-w-0"><b className="block truncate text-[10px] text-[var(--navy)]">{item.title}</b><small className="mt-1 block truncate text-[8px] text-[#798494]">{item.subtitle}</small></div></div>)}</div></Panel>

          <Panel title="Vehicle Type"><div className="flex items-center gap-5 max-[600px]:items-start"><span className="grid h-20 w-28 shrink-0 place-items-center rounded-xl bg-[#edf4ff] text-[#0861ed] max-[500px]:h-16 max-[500px]:w-20"><CarFront className="w-12 max-[500px]:w-9" /></span><div className="min-w-0"><h3 className="font-[Manrope] text-base font-extrabold text-[var(--navy)]">{tour.vehicleLabel}</h3><p className="mt-1 text-[10px] text-[#768191]">{tour.vehicleDescription}</p><div className="mt-3 flex flex-wrap gap-2">{(tour.vehicleTraits || []).map((trait) => <span key={trait} className="rounded-full bg-[#f2f4f7] px-3 py-1.5 text-[8px] font-semibold text-[#667284]">{trait}</span>)}</div><div className="mt-3 flex flex-wrap gap-2">{(tour.vehicleTypes || []).map((type) => { const Icon = vehicleIcons[type] || CarFront; return <span key={type} className="flex items-center gap-1.5 text-[8px] font-bold text-[#0861ed]"><Icon className="w-3.5" />{type.replaceAll('_', ' ')}</span>; })}</div></div></div></Panel>

          <Panel title="Important Notes"><div className="grid grid-cols-[1fr_240px] items-center gap-5 max-[650px]:grid-cols-1"><ul className="space-y-2 text-[10px] leading-5 text-[#697586]">{(tour.notes || []).map((note) => <li key={note} className="flex gap-2"><span className="text-[#0861ed]">•</span>{note}</li>)}</ul><div className="flex items-center gap-3 rounded-xl border border-[#ffdf9a] bg-[#fff5de] p-4"><ShieldCheck className="w-8 shrink-0 text-[#f09a00]" /><div><b className="text-[10px] text-[#d87d00]">{tour.safetyTitle}</b><p className="mt-1 text-[9px] leading-4 text-[#6f7988]">{tour.safetyMessage}</p></div></div></div></Panel>
        </div>

        <aside className="sticky top-[106px] h-fit rounded-2xl border border-[#e2e6ec] bg-white p-6 shadow-[0_14px_38px_rgba(7,26,61,.09)] max-[900px]:static max-[650px]:hidden"><small className="font-extrabold tracking-[1px] text-[#8b96a5]">TOTAL PACKAGE PRICE</small><b className="mt-2 block font-[Manrope] text-3xl font-extrabold text-[#0861ed]">{formatPackagePrice(tour.price)}</b><span className="text-[9px] text-[#2f8062]">{tour.priceNote}</span><div className="my-5 space-y-3 border-y border-[#e7eaf0] py-4">{(tour.inclusions || []).map((item) => <p key={item} className="flex items-center gap-2 text-[10px] text-[#5d697a]"><Check className="w-3.5 text-[#2e9267]" />{item}</p>)}</div><button onClick={() => navigate('/contact', { state: { package: tour } })} className="flex h-12 w-full items-center justify-between rounded-xl border-0 bg-[#0861ed] px-4 text-xs font-extrabold text-white">Book This Package <ArrowRight className="w-4" /></button><p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[8px] text-[#737f90]"><ShieldCheck className="w-3 text-[#0861ed]" />Free cancellation up to {tour.freeCancellationHours} hrs</p></aside>
      </div>

      <div className="fixed right-0 bottom-0 left-0 z-40 hidden items-center gap-3 border-t border-[#e1e5eb] bg-white/95 px-4 py-3 shadow-[0_-10px_30px_rgba(7,26,61,.13)] backdrop-blur max-[650px]:flex"><div className="min-w-0 flex-1"><small className="block text-[7px] font-bold text-[#7a8594]">TOTAL PACKAGE PRICE</small><b className="font-[Manrope] text-xl font-extrabold text-[#0861ed]">{formatPackagePrice(tour.price)}</b><span className="block truncate text-[7px] text-[#2f8062]">Free cancellation up to {tour.freeCancellationHours} hrs</span></div><button onClick={() => navigate('/contact', { state: { package: tour } })} className="flex h-12 min-w-[165px] items-center justify-between rounded-xl border-0 bg-[#0861ed] px-4 text-[10px] font-extrabold text-white">Book Package <ArrowRight className="w-4" /></button></div>
    </main>
    <Footer />
  </>;
}

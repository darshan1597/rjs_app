import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, CalendarDays, CarFront, LoaderCircle, Users } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import LocationSelectButton from '../components/LocationSelectButton.jsx';
import { api, apiAssetUrl } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';

function minDateTime() {
  const date = new Date(Date.now() + 30 * 60 * 1000);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

export default function RideBooking() {
  const location = useLocation(); const navigate = useNavigate(); const { signedIn } = useAuth();
  let stored = null;
  try { stored = JSON.parse(sessionStorage.getItem('rjs_ride_search') || 'null'); } catch { /* ignore invalid draft */ }
  const initial = location.state?.search || stored || {};
  const [pickup, setPickup] = useState(initial.pickup || null);
  const [destination, setDestination] = useState(initial.destination || null);
  const [scheduledFor, setScheduledFor] = useState(initial.scheduledFor || '');
  const [catalog, setCatalog] = useState(null); const [loading, setLoading] = useState(false); const [error, setError] = useState('');
  const variants = useMemo(() => (catalog?.categories || []).flatMap(category => category.variants.map(vehicle => ({ ...vehicle, categoryId: category.id, categoryName: category.name }))), [catalog]);

  useEffect(() => {
    if (!pickup || !destination) { setCatalog(null); return; }
    const controller = new AbortController();
    async function loadVehicles() {
      setLoading(true); setError('');
      const search = { pickup, destination, scheduledFor };
      sessionStorage.setItem('rjs_ride_search', JSON.stringify(search));
      try {
        const path = signedIn
          ? `/api/v1/customer/bookings/vehicle-catalog?${new URLSearchParams({ pickupLatitude: pickup.latitude, pickupLongitude: pickup.longitude, destinationLatitude: destination.latitude, destinationLongitude: destination.longitude })}`
          : '/api/v1/customer/bookings/public-vehicle-catalog';
        const result = await api(path, { signal: controller.signal });
        setCatalog(result);
      } catch (err) { if (err.name !== 'AbortError') setError(err.message); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    }
    loadVehicles();
    return () => controller.abort();
  }, [pickup, destination, signedIn]);

  function choose(vehicle) {
    const search = { pickup, destination, scheduledFor };
    const review = { search, vehicle, route: catalog?.route || null };
    sessionStorage.setItem('rjs_ride_review', JSON.stringify(review));
    navigate('/ride-review', { state: review });
  }

  return <><Navbar /><main className="min-h-[75vh] bg-[#f5f6f8] py-12"><div className="mx-auto w-[min(900px,calc(100%-32px))]"><button onClick={() => navigate('/')} className="mb-6 flex items-center gap-2 border-0 bg-transparent text-xs font-bold text-[#657084]"><ArrowLeft className="w-4" /> Back home</button>
    <section className="rounded-2xl border border-white bg-white p-6 shadow-[0_20px_55px_rgba(7,26,61,.08)]"><small className="font-extrabold tracking-[1.4px] text-[#9a7010]">LOCAL CAB</small><h1 className="mt-2 mb-5 font-[Manrope] text-2xl font-bold text-[var(--navy)]">Where are you going?</h1><div className="grid grid-cols-2 gap-3 max-[650px]:grid-cols-1"><LocationSelectButton label="PICKUP" placeholder="Enter pickup location" value={pickup} onClick={() => navigate('/select-location/pickup', { state: { returnTo: '/available-vehicles', draft: { pickup, destination, scheduledFor } } })} /><LocationSelectButton destination label="DESTINATION" placeholder="Enter destination" value={destination} onClick={() => navigate('/select-location/destination', { state: { returnTo: '/available-vehicles', draft: { pickup, destination, scheduledFor } } })} /></div><label className="mt-3 block max-w-sm rounded-[9px] border border-[var(--line)] px-3 py-2"><span className="text-[7px] font-extrabold tracking-[1px] text-[#9a7214]">SCHEDULE (OPTIONAL)</span><div className="flex items-center gap-2"><CalendarDays className="w-4 text-[#8993a2]" /><input className="w-full border-0 bg-transparent py-1 text-xs outline-none" type="datetime-local" min={minDateTime()} value={scheduledFor} onChange={event => { setScheduledFor(event.target.value); sessionStorage.setItem('rjs_ride_search', JSON.stringify({ pickup, destination, scheduledFor: event.target.value })); }} /></div></label></section>
    <section className="mt-8"><small className="font-extrabold tracking-[1.4px] text-[#9a7010]">AVAILABLE CABS</small><h2 className="mt-2 mb-5 font-[Manrope] text-3xl font-bold text-[var(--navy)]">Choose your vehicle</h2>
      {!pickup || !destination ? <div className="grid min-h-52 place-items-center rounded-2xl border border-dashed border-[#ccd3dd] bg-white p-8 text-center"><div><CarFront className="mx-auto mb-3 h-9 w-9 text-[#aab2bf]" /><p className="text-sm font-bold text-[var(--navy)]">Enter pickup and destination</p><small className="text-[#7b8492]">Available cabs will load automatically.</small></div></div> : null}
      {loading && <div className="grid gap-3">{[1,2,3].map(item => <div key={item} className="h-24 animate-pulse rounded-2xl bg-white"><div className="m-4 h-16 rounded-xl bg-[#edf0f3]" /></div>)}</div>}
      {error && <p className="rounded-xl bg-[#fff0f0] p-4 text-xs text-[#b83232]">{error}</p>}
      {!loading && catalog && variants.length === 0 && <p className="rounded-xl bg-white p-8 text-center text-sm">No configured cabs are available.</p>}
      {!loading && <div className="grid gap-3">{variants.map(vehicle => <button key={vehicle.id} type="button" onClick={() => choose(vehicle)} className="grid grid-cols-[76px_1fr_auto] items-center gap-4 rounded-2xl border border-[#e5e8ed] bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-[#d0a844] hover:shadow-[0_10px_30px_rgba(7,26,61,.08)] max-[520px]:grid-cols-[58px_1fr]"><div className="grid h-16 w-16 place-items-center overflow-hidden rounded-xl bg-[#f3f5f7] max-[520px]:h-12 max-[520px]:w-12">{vehicle.photoUrl ? <img src={apiAssetUrl(vehicle.photoUrl)} className="h-full w-full object-contain" alt="" /> : <CarFront className="w-8 text-[#7d8796]" />}</div><div><b className="font-[Manrope] text-base text-[var(--navy)]">{vehicle.name}</b><p className="mt-1 flex gap-3 text-[10px] text-[#788291]"><span>{vehicle.categoryName}</span><span className="flex items-center gap-1"><Users className="w-3" />{vehicle.temporarySeats} seats</span></p><small className={vehicle.available ? 'text-[#23835e]' : scheduledFor ? 'text-[#9a7010]' : 'text-[#b83232]'}>{vehicle.available ? `${vehicle.availableDrivers} available now` : scheduledFor ? 'Available for scheduling' : 'Currently unavailable'}</small></div><span className="flex items-center gap-1 text-[10px] font-extrabold text-[#8d6507] max-[520px]:col-start-2">View ride <ArrowRight className="w-4" /></span></button>)}</div>}
    </section>
  </div></main><Footer /></>;
}

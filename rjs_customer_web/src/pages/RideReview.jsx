import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Clock3, LoaderCircle, Navigation, Users, X } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../lib/api.js';
import { decodePolyline, loadGoogleMaps } from '../lib/googleMaps.js';
import { rjsPinDataUrl } from '../lib/mapPins.js';

const money = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value || 0);

export default function RideReview() {
  const location = useLocation(); const navigate = useNavigate(); const { signedIn } = useAuth();
  let saved = null;
  try { saved = JSON.parse(sessionStorage.getItem('rjs_ride_review') || 'null'); } catch { /* ignore invalid draft */ }
  const data = location.state || saved;
  const search = data?.search; const initialVehicle = data?.vehicle;
  const mapNode = useRef(null); const mapInstance = useRef(null);
  const [vehicle, setVehicle] = useState(() => initialVehicle ? { ...initialVehicle, ...(!signedIn ? { temporaryAmount: undefined, pricing: undefined, onRoadPrice: undefined } : {}) } : null);
  const [route, setRoute] = useState(data?.route || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(''); const [showLogin, setShowLogin] = useState(false);

  const query = useMemo(() => search ? new URLSearchParams({ pickupLatitude: search.pickup.latitude, pickupLongitude: search.pickup.longitude, destinationLatitude: search.destination.latitude, destinationLongitude: search.destination.longitude }) : null, [search]);

  useEffect(() => {
    if (!search || !initialVehicle) { navigate('/available-vehicles', { replace: true }); return; }
    sessionStorage.setItem('rjs_ride_review', JSON.stringify(data));
    async function load() {
      setLoading(true); setError('');
      try {
        if (signedIn) {
          const catalog = await api(`/api/v1/customer/bookings/vehicle-catalog?${query}`);
          const priced = catalog.categories.flatMap(category => category.variants.map(item => ({ ...item, categoryId: category.id, categoryName: category.name }))).find(item => item.id === initialVehicle.id);
          if (!priced) throw new Error('This vehicle is no longer available.');
          setVehicle(priced); setRoute(catalog.route);
        } else if (!route) {
          const result = await api('/api/v1/customer/maps/route', { method: 'POST', body: JSON.stringify({ origin: { latitude: search.pickup.latitude, longitude: search.pickup.longitude }, destination: { latitude: search.destination.latitude, longitude: search.destination.longitude } }) });
          setRoute(result.route);
        }
      } catch (err) { setError(err.message); }
      finally { setLoading(false); }
    }
    load();
  }, [signedIn]);

  useEffect(() => {
    if (!route || !search || !mapNode.current) return;
    let cancelled = false;
    loadGoogleMaps().then((maps) => {
      if (cancelled) return;
      const pickup = { lat: Number(search.pickup.latitude), lng: Number(search.pickup.longitude) };
      const destination = { lat: Number(search.destination.latitude), lng: Number(search.destination.longitude) };
      const map = new maps.Map(mapNode.current, { center: pickup, zoom: 13, mapId: import.meta.env.VITE_GOOGLE_MAPS_WEB_MAP_ID || undefined, disableDefaultUI: true, zoomControl: true, gestureHandling: 'greedy' });
      mapInstance.current = map;
      const points = decodePolyline(route.encodedPolyline);
      new maps.Polyline({ map, path: points, strokeColor: '#0756f8', strokeOpacity: .9, strokeWeight: 6 });
      new maps.Marker({ map, position: pickup, icon: { url: rjsPinDataUrl('pickup'), scaledSize: new maps.Size(42, 53), anchor: new maps.Point(21, 49) }, title: 'Pickup' });
      new maps.Marker({ map, position: destination, icon: { url: rjsPinDataUrl('destination'), scaledSize: new maps.Size(42, 53), anchor: new maps.Point(21, 49) }, title: 'Destination' });
      const bounds = new maps.LatLngBounds();
      (points.length ? points : [pickup, destination]).forEach(point => bounds.extend(point));
      map.fitBounds(bounds, 65);
    }).catch(err => setError(err.message));
    return () => { cancelled = true; mapInstance.current = null; };
  }, [route, search]);

  async function book() {
    if (!signedIn) { setShowLogin(true); return; }
    setLoading(true); setError('');
    try {
      const result = await api('/api/v1/customer/bookings', { method: 'POST', body: JSON.stringify({ pickupAddress: search.pickup.address, destinationAddress: search.destination.address, pickupLatitude: search.pickup.latitude, pickupLongitude: search.pickup.longitude, destinationLatitude: search.destination.latitude, destinationLongitude: search.destination.longitude, categoryId: vehicle.categoryId, variantId: vehicle.id, ...(search.scheduledFor ? { scheduledFor: new Date(search.scheduledFor).toISOString() } : {}), idempotencyKey: `web_${crypto.randomUUID().replaceAll('-', '')}` }) });
      sessionStorage.removeItem('rjs_ride_search'); sessionStorage.removeItem('rjs_ride_review');
      navigate(`/booking-status/${result.booking.id}`, { replace: true, state: { booking: result.booking } });
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  if (!search || !vehicle) return null;
  return <><Navbar /><main className="min-h-[76vh] bg-[#f5f6f8] py-10"><div className="mx-auto w-[min(980px,calc(100%-32px))]"><button onClick={() => navigate(-1)} className="mb-5 flex items-center gap-2 border-0 bg-transparent text-xs font-bold text-[#657084]"><ArrowLeft className="w-4" /> Change vehicle</button><div className="overflow-hidden rounded-3xl border border-[#e1e5eb] bg-white shadow-[0_18px_55px_rgba(7,26,61,.1)]"><div ref={mapNode} className="h-[420px] bg-[#e9edf2] max-[650px]:h-[330px]" /><section className="grid grid-cols-[1fr_auto] items-center gap-6 p-7 max-[650px]:grid-cols-1 max-[650px]:p-5"><div><small className="font-extrabold tracking-[1.3px] text-[#9a7010]">YOUR RIDE</small><h1 className="mt-2 font-[Manrope] text-2xl font-bold text-[var(--navy)]">{vehicle.name}</h1><p className="mt-2 flex flex-wrap gap-4 text-[10px] text-[#738092]"><span className="flex items-center gap-1"><Users className="w-3.5" />{vehicle.temporarySeats} seats</span>{route && <><span className="flex items-center gap-1"><Navigation className="w-3.5" />{route.distanceKm} km</span><span className="flex items-center gap-1"><Clock3 className="w-3.5" />about {route.durationMinutes} min</span></>}</p><div className="mt-4 grid gap-2 text-[10px] text-[#657084]"><p><b className="text-[#0756f8]">Pickup:</b> {search.pickup.address}</p><p><b className="text-[#ff5a00]">Destination:</b> {search.destination.address}</p></div></div><div className="min-w-56 rounded-2xl bg-[#f7f8fa] p-5 max-[650px]:min-w-0"><small className="text-[9px] font-bold tracking-[1px] text-[#788291]">ESTIMATED FARE</small>{signedIn && vehicle.temporaryAmount != null ? <p className="my-2 font-[Manrope] text-3xl font-extrabold text-[var(--navy)]">{money(vehicle.temporaryAmount)}</p> : <div className="my-3 h-9 w-32 animate-pulse rounded-lg bg-[linear-gradient(90deg,#e5e8ed,#f5f6f8,#e5e8ed)] bg-[length:200%_100%]" />}<button onClick={book} disabled={loading || Boolean(error)} className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl border-0 bg-[var(--gold)] px-5 text-xs font-extrabold text-[var(--navy)] disabled:opacity-50">{loading ? <LoaderCircle className="w-4 animate-spin" /> : null}{signedIn ? 'Book now' : 'Continue'}<ArrowRight className="w-4" /></button></div></section>{error && <p className="mx-7 mb-6 rounded-lg bg-[#fff0f0] p-3 text-[10px] text-[#b83232]">{error}</p>}</div></div></main><Footer />
    {showLogin && <div className="fixed inset-0 z-50 grid place-items-center bg-[#031027]/60 p-5 backdrop-blur-sm"><div className="relative w-full max-w-sm rounded-2xl bg-white p-7 text-center shadow-2xl"><button onClick={() => setShowLogin(false)} className="absolute top-4 right-4 grid h-8 w-8 place-items-center rounded-full border-0 bg-[#f1f3f6]"><X className="w-4" /></button><h2 className="font-[Manrope] text-2xl font-bold text-[var(--navy)]">Login first to continue</h2><p className="mt-3 text-xs leading-6 text-[#718093]">Sign in with your mobile number to reveal the fare and confirm this booking.</p><button onClick={() => navigate('/login', { state: { returnTo: '/ride-review' } })} className="mt-6 h-12 w-full rounded-xl border-0 bg-[var(--navy)] text-xs font-bold text-white">Login / Sign up</button></div></div>}
  </>;
}

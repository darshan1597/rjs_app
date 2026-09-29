import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, CalendarDays, CarFront, Check, Copy, LoaderCircle, MapPin, Phone, ShieldCheck, Smartphone, X } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../lib/api.js';
import { decodePolyline, loadGoogleMaps } from '../lib/googleMaps.js';
import { rjsPinDataUrl } from '../lib/mapPins.js';

const finalStatuses = new Set(['COMPLETED', 'CANCELLED', 'NO_SHOW', 'NO_DRIVER_AVAILABLE']);
const acceptedStatuses = new Set(['DRIVER_ACCEPTED', 'DRIVER_EN_ROUTE', 'ARRIVED', 'IN_PROGRESS', 'PAYMENT_PENDING', 'COMPLETED']);
const immediatelyCancellableStatuses = new Set(['SEARCHING_DRIVER', 'AWAITING_PAYMENT', 'NO_DRIVER_AVAILABLE']);
const confirmedStatuses = new Set(['ASSIGNED', 'DRIVER_ACCEPTED', 'DRIVER_EN_ROUTE']);
const cancellationReasons = [
  ['DRIVER_LATE', 'Driver is late'],
  ['DRIVER_NOT_MOVING', 'Driver is not moving'],
  ['CANNOT_CONTACT_DRIVER', 'Cannot contact driver'],
];
const statusCopy = {
  SEARCHING_DRIVER: ['Searching for a driver', 'We sent your request to nearby RJS drivers. Please wait for one to accept.'],
  NO_DRIVER_AVAILABLE: ['No driver accepted', 'No matching driver accepted within the search window. Please try booking again.'],
  NEW: ['Ride scheduled', 'Your scheduled request is recorded and is awaiting driver assignment.'],
  ASSIGNED: ['Driver assigned', 'The assigned driver is reviewing your ride.'],
  DRIVER_ACCEPTED: ['Driver confirmed', 'Your driver accepted the ride and is preparing for pickup.'],
  DRIVER_EN_ROUTE: ['Driver is on the way', 'Your driver is travelling to your pickup location.'],
  ARRIVED: ['Driver has arrived', 'Share the ride OTP only when you are ready to begin.'],
  IN_PROGRESS: ['Ride in progress', 'Your ride has started. Have a safe journey.'],
  PAYMENT_PENDING: ['Final payment due', 'The final bill is ready. Complete payment in the RJS customer app or scan the driver QR.'],
  COMPLETED: ['Ride completed', 'Thank you for travelling with RJS.'],
  CANCELLED: ['Ride cancelled', 'This ride has been cancelled.'],
  NO_SHOW: ['Ride closed as no-show', 'Contact RJS support if you believe this is incorrect.'],
};

export default function BookingStatus() {
  const { bookingId } = useParams(); const navigate = useNavigate(); const { signedIn } = useAuth();
  const [booking, setBooking] = useState(null); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [copied, setCopied] = useState(false);
  const [showCancel, setShowCancel] = useState(false); const [cancelReason, setCancelReason] = useState(''); const [cancelling, setCancelling] = useState(false); const [cancelError, setCancelError] = useState('');
  const mapNode = useRef(null); const map = useRef(null); const driverMarker = useRef(null); const mapReadyFor = useRef('');

  useEffect(() => {
    if (!signedIn) { navigate('/login', { replace: true, state: { returnTo: `/booking-status/${bookingId}` } }); return; }
    let active = true; let timer;
    async function refresh() {
      try {
        const data = await api(`/api/v1/customer/bookings/${bookingId}`);
        if (!active) return;
        setBooking(data.booking); setError(''); setLoading(false);
        if (!finalStatuses.has(data.booking.status)) timer = setTimeout(refresh, 2500);
      } catch (err) { if (active) { setError(err.message); setLoading(false); timer = setTimeout(refresh, 5000); } }
    }
    refresh();
    return () => { active = false; clearTimeout(timer); };
  }, [signedIn, bookingId, navigate]);

  useEffect(() => {
    if (!booking?.pickup || !booking?.destination || !mapNode.current || mapReadyFor.current === booking.id) return;
    let cancelled = false;
    async function buildMap() {
      try {
        const [maps, routeData] = await Promise.all([
          loadGoogleMaps(),
          api('/api/v1/customer/maps/route', { method: 'POST', body: JSON.stringify({ origin: { latitude: booking.pickup.latitude, longitude: booking.pickup.longitude }, destination: { latitude: booking.destination.latitude, longitude: booking.destination.longitude } }) }),
        ]);
        if (cancelled) return;
        const pickup = { lat: Number(booking.pickup.latitude), lng: Number(booking.pickup.longitude) };
        const destination = { lat: Number(booking.destination.latitude), lng: Number(booking.destination.longitude) };
        map.current = new maps.Map(mapNode.current, { center: pickup, zoom: 13, mapId: import.meta.env.VITE_GOOGLE_MAPS_WEB_MAP_ID || undefined, disableDefaultUI: true, zoomControl: true });
        const points = decodePolyline(routeData.route.encodedPolyline);
        new maps.Polyline({ map: map.current, path: points, strokeColor: '#0756f8', strokeOpacity: .9, strokeWeight: 6 });
        new maps.Marker({ map: map.current, position: pickup, icon: { url: rjsPinDataUrl('pickup'), scaledSize: new maps.Size(42, 53), anchor: new maps.Point(21, 49) }, title: 'Pickup' });
        new maps.Marker({ map: map.current, position: destination, icon: { url: rjsPinDataUrl('destination'), scaledSize: new maps.Size(42, 53), anchor: new maps.Point(21, 49) }, title: 'Destination' });
        const bounds = new maps.LatLngBounds(); (points.length ? points : [pickup, destination]).forEach(point => bounds.extend(point)); map.current.fitBounds(bounds, 60);
        const current = booking.driver?.currentLocation;
        if (current) driverMarker.current = new maps.Marker({ map: map.current, position: { lat: Number(current.latitude), lng: Number(current.longitude) }, label: { text: '🚕', fontSize: '24px' }, title: 'Your driver' });
        mapReadyFor.current = booking.id;
      } catch (err) { if (!cancelled) setError(err.message); }
    }
    buildMap();
    return () => { cancelled = true; };
  }, [booking?.id]);

  useEffect(() => {
    const current = booking?.driver?.currentLocation;
    if (!map.current || !current || !window.google?.maps) return;
    const point = { lat: Number(current.latitude), lng: Number(current.longitude) };
    if (!driverMarker.current) driverMarker.current = new window.google.maps.Marker({ map: map.current, position: point, label: { text: '🚕', fontSize: '24px' }, title: 'Your driver' });
    else driverMarker.current.setPosition(point);
  }, [booking?.driver?.currentLocation?.latitude, booking?.driver?.currentLocation?.longitude]);

  async function copyOtp() {
    await navigator.clipboard.writeText(booking.tripStartOtp); setCopied(true); setTimeout(() => setCopied(false), 1800);
  }

  async function cancelRide() {
    const lateConfirmedRide = confirmedStatuses.has(booking.status);
    if (lateConfirmedRide && !cancelReason) {
      setCancelError('Select a valid reason before cancelling the ride.');
      return;
    }
    setCancelling(true); setCancelError('');
    try {
      const data = await api(`/api/v1/customer/bookings/${booking.id}/cancel`, {
        method: 'POST',
        body: JSON.stringify(lateConfirmedRide ? { reason: cancelReason } : {}),
      });
      setBooking(data.booking); setShowCancel(false); setCancelReason(''); setError('');
    } catch (err) {
      setCancelError(err.message);
    } finally {
      setCancelling(false);
    }
  }

  if (loading) return <><Navbar /><main className="grid min-h-[70vh] place-items-center bg-[#f5f6f8]"><div className="text-center"><LoaderCircle className="mx-auto h-10 w-10 animate-spin text-[#a87808]" /><p className="mt-3 text-xs text-[#718093]">Loading your ride…</p></div></main><Footer /></>;
  if (!booking) return <><Navbar /><main className="min-h-[70vh] bg-[#f5f6f8] p-10"><p className="mx-auto max-w-xl rounded-xl bg-[#fff0f0] p-5 text-sm text-[#b83232]">{error || 'Booking could not be loaded.'}</p></main><Footer /></>;
  const [title, subtitle] = statusCopy[booking.status] || [booking.status, 'Your ride status was updated.'];
  const searching = booking.status === 'SEARCHING_DRIVER'; const accepted = acceptedStatuses.has(booking.status);
  const lateConfirmedRide = confirmedStatuses.has(booking.status) && booking.canCancelLatePickup === true;
  const canCancel = immediatelyCancellableStatuses.has(booking.status) || lateConfirmedRide;

  return <><Navbar /><main className="min-h-[76vh] bg-[#f5f6f8] py-10"><div className="mx-auto w-[min(980px,calc(100%-32px))]"><div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><small className="font-extrabold tracking-[1.3px] text-[#9a7010]">BOOKING {booking.bookingNumber}</small><h1 className="mt-2 font-[Manrope] text-3xl font-bold text-[var(--navy)]">{title}</h1><p className="mt-2 text-xs text-[#6e7989]">{subtitle}</p></div><span className={`rounded-full px-4 py-2 text-[10px] font-extrabold ${accepted ? 'bg-[#e9f8f1] text-[#23765a]' : searching ? 'bg-[#fff5d6] text-[#896307]' : 'bg-[#edf0f4] text-[#617083]'}`}>{searching ? 'WAITING FOR DRIVER' : booking.status.replaceAll('_',' ')}</span></div>
    {searching && <div className="mb-5 overflow-hidden rounded-full bg-[#e1e5eb]"><div className="h-1.5 w-1/2 animate-[bookingSearch_1.5s_ease-in-out_infinite] rounded-full bg-[var(--gold)]" /></div>}
    <div className="overflow-hidden rounded-3xl border border-[#e1e5eb] bg-white shadow-[0_18px_55px_rgba(7,26,61,.1)]"><div ref={mapNode} className="h-[390px] bg-[#e9edf2] max-[650px]:h-[300px]" /><section className="grid grid-cols-[1fr_330px] gap-6 p-7 max-[760px]:grid-cols-1 max-[650px]:p-5"><div><h2 className="font-[Manrope] text-lg font-bold text-[var(--navy)]">Ride details</h2><div className="mt-4 grid gap-3 text-[11px] leading-5 text-[#667284]"><p className="flex gap-2"><MapPin className="w-4 shrink-0 text-[#0756f8]" /><span><b>Pickup</b><br />{booking.pickup.address}</span></p><p className="flex gap-2"><MapPin className="w-4 shrink-0 text-[#ff5a00]" /><span><b>Destination</b><br />{booking.destination.address}</span></p><p className="flex gap-2"><CalendarDays className="w-4 shrink-0" /><span>{new Date(booking.scheduledStartAt || booking.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span></p></div>{booking.driver && <div className="mt-5 rounded-2xl bg-[#f6f8fb] p-4"><small className="font-extrabold tracking-[1px] text-[#8b6508]">YOUR DRIVER</small><div className="mt-2 flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-full bg-[#e5ebf4]"><CarFront className="w-5 text-[var(--navy)]" /></span><div><b className="text-sm text-[var(--navy)]">{booking.driver.name || 'RJS driver'}</b><p className="text-[10px] text-[#718093]">{booking.driver.vehicle?.registrationNumber || booking.driver.vehicle?.variantName || 'Vehicle details updating'}</p></div>{booking.driver.phone && <a href={`tel:${booking.driver.phone}`} className="ml-auto grid h-9 w-9 place-items-center rounded-full bg-[var(--navy)] text-white"><Phone className="w-4" /></a>}</div></div>}</div>
      <aside className="rounded-2xl bg-[#071a3d] p-5 text-white"><small className="font-extrabold tracking-[1px] text-[#f2c75b]">RIDE PROGRESS</small><div className="mt-4 space-y-4">{[['Driver confirmation', accepted],['Pickup journey', ['DRIVER_EN_ROUTE','ARRIVED','IN_PROGRESS','PAYMENT_PENDING','COMPLETED'].includes(booking.status)],['Ride started', ['IN_PROGRESS','PAYMENT_PENDING','COMPLETED'].includes(booking.status)],['Payment', booking.status === 'COMPLETED']].map(([label, done]) => <div key={label} className="flex items-center gap-3 text-[11px]"><span className={`grid h-6 w-6 place-items-center rounded-full ${done ? 'bg-[#2fb07f]' : 'bg-white/10'}`}>{done ? <Check className="w-3.5" /> : <span className="h-1.5 w-1.5 rounded-full bg-white/40" />}</span>{label}</div>)}</div>
        {booking.status === 'ARRIVED' && booking.tripStartOtp && <div className="mt-6 rounded-2xl border border-[#f2c75b]/40 bg-white/10 p-4 text-center"><ShieldCheck className="mx-auto w-6 text-[#f2c75b]" /><small className="mt-2 block text-[#bac6d7]">SHARE OTP WITH DRIVER</small><button onClick={copyOtp} className="mt-1 flex w-full items-center justify-center gap-2 border-0 bg-transparent font-[Manrope] text-3xl font-extrabold tracking-[6px] text-[#f2c75b]">{booking.tripStartOtp}<Copy className="w-4" /></button><small className="text-[#bac6d7]">{copied ? 'OTP copied' : 'Tap to copy'}</small></div>}
        {booking.status === 'PAYMENT_PENDING' && <div className="mt-6 rounded-xl bg-white/10 p-4"><Smartphone className="w-5 text-[#f2c75b]" /><p className="mt-2 text-[11px] leading-5 text-[#d5deea]">Open the RJS customer app to review final charges and pay securely.</p></div>}
      </aside></section>{error && <p className="mx-7 mb-6 rounded-lg bg-[#fff0f0] p-3 text-[10px] text-[#b83232]">{error}</p>}</div>
    <div className="mt-5 flex flex-wrap justify-center gap-3">{booking.status === 'NO_DRIVER_AVAILABLE' && <Link to="/available-vehicles" className="rounded-xl bg-[var(--gold)] px-6 py-3 text-xs font-bold text-[var(--navy)]">Try again</Link>}{canCancel && <button type="button" onClick={() => { setCancelError(''); setShowCancel(true); }} className="rounded-xl border border-[#e4b5b5] bg-white px-6 py-3 text-xs font-bold text-[#b83232] transition hover:bg-[#fff5f5]">Cancel ride</button>}<Link to="/my-bookings" className="rounded-xl border border-[#d9dee5] bg-white px-6 py-3 text-xs font-bold text-[var(--navy)]">View all bookings</Link></div>
  </div></main>
  {showCancel && <div className="fixed inset-0 z-[100] grid place-items-center bg-[#071a3d]/55 p-4 backdrop-blur-[2px]" onMouseDown={(event) => { if (event.target === event.currentTarget && !cancelling) setShowCancel(false); }}><section role="dialog" aria-modal="true" aria-labelledby="cancel-ride-title" className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"><div className="flex items-start gap-4"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#fff1e8] text-[#e35616]"><AlertTriangle className="h-5 w-5" /></span><div className="min-w-0 flex-1"><h2 id="cancel-ride-title" className="font-[Manrope] text-xl font-bold text-[var(--navy)]">Cancel this ride?</h2><p className="mt-1 text-xs leading-5 text-[#6e7989]">{lateConfirmedRide ? 'Tell us why you need to cancel. This helps RJS review the delayed pickup.' : 'Your driver search will stop and this booking will be cancelled.'}</p></div><button type="button" disabled={cancelling} onClick={() => setShowCancel(false)} aria-label="Close cancellation dialog" className="grid h-9 w-9 shrink-0 place-items-center rounded-full border-0 bg-[#f2f4f7] text-[#526174]"><X className="h-4 w-4" /></button></div>
    {lateConfirmedRide && <fieldset className="mt-5 grid gap-2"><legend className="mb-2 text-[10px] font-extrabold tracking-[1px] text-[#69768a]">SELECT A REASON</legend>{cancellationReasons.map(([value, label]) => <label key={value} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-xs font-semibold transition ${cancelReason === value ? 'border-[#d99d16] bg-[#fff9e9] text-[var(--navy)]' : 'border-[#e1e5eb] text-[#526174] hover:bg-[#f8f9fb]'}`}><input type="radio" name="cancelReason" value={value} checked={cancelReason === value} onChange={(event) => { setCancelReason(event.target.value); setCancelError(''); }} className="accent-[#b68108]" />{label}</label>)}</fieldset>}
    {cancelError && <p className="mt-4 rounded-xl bg-[#fff0f0] p-3 text-[11px] text-[#b83232]">{cancelError}</p>}
    <div className="mt-6 grid grid-cols-2 gap-3"><button type="button" disabled={cancelling} onClick={() => setShowCancel(false)} className="rounded-xl border border-[#d9dee5] bg-white px-4 py-3 text-xs font-bold text-[var(--navy)] disabled:opacity-50">Keep ride</button><button type="button" disabled={cancelling || (lateConfirmedRide && !cancelReason)} onClick={cancelRide} className="flex items-center justify-center gap-2 rounded-xl border-0 bg-[#c43d32] px-4 py-3 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">{cancelling && <LoaderCircle className="h-4 w-4 animate-spin" />}{cancelling ? 'Cancelling…' : 'Confirm cancellation'}</button></div></section></div>}
  <Footer /></>;
}

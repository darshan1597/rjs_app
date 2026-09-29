import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, Check, Crosshair, LoaderCircle, MapPin } from 'lucide-react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import LocationInput from '../components/LocationInput.jsx';
import { api } from '../lib/api.js';
import RjsMapPin from '../components/RjsMapPin.jsx';
import { loadGoogleMaps } from '../lib/googleMaps.js';

const BENGALURU = { latitude: 12.9716, longitude: 77.5946 };
export default function MapLocationPicker() {
  const { field } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const draft = location.state?.draft || {};
  const returnTo = location.state?.returnTo || '/available-vehicles';
  const initial = draft[field] || null;
  const mapNode = useRef(null);
  const map = useRef(null);
  const mapListeners = useRef([]);
  const lockedPoint = useRef(initial || null);
  const zooming = useRef(false);
  const resolveSequence = useRef(0);
  const [selected, setSelected] = useState(initial);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState('');
  const [permissionState, setPermissionState] = useState('requesting');
  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState('');

  const resolveCenter = useCallback(async (latitude, longitude) => {
    const sequence = ++resolveSequence.current;
    setResolving(true); setError('');
    try {
      const params = new URLSearchParams({ latitude, longitude });
      const data = await api(`/api/v1/customer/maps/reverse-geocode?${params}`);
      if (sequence === resolveSequence.current) { lockedPoint.current = data.place; setSelected(data.place); }
    } catch (err) {
      if (sequence === resolveSequence.current) {
        const pinned = { address: 'Pinned location', latitude, longitude };
        lockedPoint.current = pinned; setSelected(pinned);
        setError(err.message);
      }
    } finally { if (sequence === resolveSequence.current) setResolving(false); }
  }, []);

  const moveMap = useCallback((place, zoom = 17) => {
    if (!place || !map.current) return;
    map.current.panTo({ lat: Number(place.latitude), lng: Number(place.longitude) });
    map.current.setZoom(zoom);
  }, []);

  const requestCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) { setPermissionState('unsupported'); setError('Location is not supported by this browser.'); return; }
    setPermissionState('requesting'); setError('');
    navigator.geolocation.getCurrentPosition(async (position) => {
      setPermissionState('granted');
      const point = { latitude: position.coords.latitude, longitude: position.coords.longitude };
      moveMap(point);
      await resolveCenter(point.latitude, point.longitude);
    }, (geoError) => {
      setPermissionState(geoError.code === 1 ? 'denied' : 'unavailable');
      setError(geoError.code === 1 ? 'Location permission was denied. Enable it in your browser or search for a place.' : 'Your current location could not be detected. Search for a place instead.');
    }, { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 });
  }, [moveMap, resolveCenter]);

  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps().then((googleMaps) => {
      if (cancelled || !mapNode.current) return;
      const center = initial || BENGALURU;
      map.current = new googleMaps.Map(mapNode.current, {
        center: { lat: Number(center.latitude), lng: Number(center.longitude) }, zoom: initial ? 17 : 12,
        mapId: import.meta.env.VITE_GOOGLE_MAPS_WEB_MAP_ID || undefined,
        disableDefaultUI: true, zoomControl: true, gestureHandling: 'greedy', clickableIcons: false,
      });
      mapListeners.current.push(map.current.addListener('dragend', () => {
        const centerPoint = map.current.getCenter();
        if (centerPoint) resolveCenter(centerPoint.lat(), centerPoint.lng());
      }));
      mapListeners.current.push(map.current.addListener('zoom_changed', () => { zooming.current = true; }));
      mapListeners.current.push(map.current.addListener('idle', () => {
        if (!zooming.current || !lockedPoint.current) return;
        zooming.current = false;
        map.current.panTo({ lat: Number(lockedPoint.current.latitude), lng: Number(lockedPoint.current.longitude) });
      }));
      setMapReady(true);
      if (!initial) requestCurrentLocation();
      else setPermissionState('idle');
    }).catch((err) => { setMapError(err.message); requestCurrentLocation(); });
    return () => { cancelled = true; mapListeners.current.forEach(listener => listener.remove()); mapListeners.current = []; };
  }, []); // The picker is remounted for each field.

  function chooseSearchPlace(place) {
    lockedPoint.current = place;
    setSelected(place);
    moveMap(place);
  }

  function confirm() {
    if (!selected || resolving) return;
    navigate(returnTo, { replace: true, state: { search: { ...draft, [field]: selected } } });
  }

  const title = field === 'pickup' ? 'Choose Pickup' : 'Choose Destination';
  return <main className="flex h-screen min-h-[620px] flex-col bg-[#f7f9fc]">
    <header className="z-20 flex items-center gap-4 border-b border-[#e6e9ee] bg-white px-5 py-3 shadow-sm"><button onClick={() => navigate(-1)} className="grid h-11 w-11 place-items-center rounded-full border-0 bg-[#f2f4f7] text-[var(--navy)]"><ArrowLeft className="w-5" /></button><div><h1 className="font-[Manrope] text-xl font-extrabold text-[var(--navy)]">{title}</h1><p className="text-[10px] text-[#778293]">Search a real place or position the pin on the map</p></div></header>
    <section className="relative flex-1 overflow-hidden">
      <div ref={mapNode} className="absolute inset-0 bg-[#e9edf2]" />
      {!mapReady && <div className="absolute inset-0 grid place-items-center bg-[#eef1f4]"><div className="max-w-md px-6 text-center">{mapError ? <><MapPin className="mx-auto h-10 w-10 text-[#a87808]" /><p className="mt-3 text-sm font-bold text-[var(--navy)]">Map setup required</p><p className="mt-2 text-[10px] leading-5 text-[#6e7989]">{mapError}</p></> : <LoaderCircle className="mx-auto h-9 w-9 animate-spin text-[#a87808]" />}</div></div>}
      {mapReady && <div className="pointer-events-none absolute top-1/2 left-1/2 z-10 -translate-x-1/2 -translate-y-[78%]"><RjsMapPin type={field === 'pickup' ? 'pickup' : 'destination'} animated={field === 'pickup'} className="h-[68px] w-[54px] drop-shadow-lg" /></div>}
      <div className="absolute top-4 right-4 left-4 z-20 mx-auto max-w-2xl"><div className="rounded-2xl bg-white p-2 shadow-[0_14px_40px_rgba(7,26,61,.2)]"><LocationInput label="SEARCH LOCATION" placeholder={`Search ${field === 'pickup' ? 'pickup' : 'destination'}`} value={selected} onChange={chooseSearchPlace} /></div></div>
      <button onClick={requestCurrentLocation} disabled={permissionState === 'requesting'} className="absolute right-5 bottom-40 z-20 grid h-12 w-12 place-items-center rounded-full border border-[#e0e5eb] bg-white text-[#1460a8] shadow-[0_8px_24px_rgba(7,26,61,.18)] disabled:opacity-60" title="Use current location">{permissionState === 'requesting' ? <LoaderCircle className="w-5 animate-spin" /> : <Crosshair className="w-5" />}</button>
      <div className="absolute right-4 bottom-4 left-4 z-20 mx-auto max-w-2xl rounded-2xl bg-white p-4 shadow-[0_16px_45px_rgba(7,26,61,.22)]"><div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#fff3cf] text-[#a87808]">{resolving ? <LoaderCircle className="w-5 animate-spin" /> : <MapPin className="w-5" />}</span><div className="min-w-0"><small className="font-extrabold tracking-[1px] text-[#9a7010]">SELECTED LOCATION</small><p className="mt-1 line-clamp-2 text-xs font-bold leading-5 text-[var(--navy)]">{resolving ? 'Finding address…' : selected?.address || 'Move the map or search to choose a location'}</p></div></div>{error && <p className="mt-2 text-[9px] leading-4 text-[#b83232]">{error}</p>}<button onClick={confirm} disabled={!selected || resolving} className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-xl border-0 bg-[var(--gold)] text-xs font-extrabold text-[var(--navy)] disabled:opacity-50"><Check className="w-4" /> Confirm {field === 'pickup' ? 'pickup' : 'destination'}</button></div>
    </section>
  </main>;
}

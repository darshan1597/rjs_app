import { useEffect, useRef, useState } from 'react';
import { ArrowRight, LogOut, Menu, Smartphone, UserRound, X } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signedIn, customer, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [homeSection, setHomeSection] = useState(location.hash);
  const profileMenu = useRef(null);

  useEffect(() => {
    setMenuOpen(false); setProfileOpen(false); setHomeSection(location.hash);
  }, [location.pathname, location.hash]);

  useEffect(() => {
    if (location.pathname !== '/') return undefined;
    const fleet = document.querySelector('#fleet');
    if (!fleet) return undefined;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setHomeSection('#fleet');
      else if (entry.boundingClientRect.top < 0 || window.scrollY < fleet.offsetTop / 2) setHomeSection('');
    }, { threshold: 0.2 });
    observer.observe(fleet);
    return () => observer.disconnect();
  }, [location.pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const closeOnEscape = (event) => event.key === 'Escape' && setMenuOpen(false);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', closeOnEscape);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener('keydown', closeOnEscape); };
  }, [menuOpen]);

  useEffect(() => {
    if (!profileOpen) return;
    const close = (event) => {
      if (event.key === 'Escape' || (event.type === 'pointerdown' && !profileMenu.current?.contains(event.target))) setProfileOpen(false);
    };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', close);
    return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', close); };
  }, [profileOpen]);

  const goHomeSection = (section) => {
    setMenuOpen(false); setProfileOpen(false); setHomeSection(section);
    if (location.pathname === '/') {
      window.history.replaceState(null, '', `/${section}`);
      document.querySelector(section)?.scrollIntoView({ behavior: 'smooth' });
    } else navigate(`/${section}`);
  };
  const go = (path) => { setMenuOpen(false); setProfileOpen(false); navigate(path); };
  const openLogin = () => navigate('/login', { state: { returnTo: `${location.pathname}${location.search}${location.hash}` } });
  const isPath = (path) => path === '/packages' ? location.pathname.startsWith('/packages') : location.pathname === path;
  const isFleet = location.pathname === '/' && homeSection === '#fleet';
  const itemClass = (active) => `relative border-0 bg-transparent py-2 text-left text-[13px] font-semibold transition-colors after:absolute after:right-0 after:bottom-0 after:left-0 after:h-0.5 after:origin-center after:scale-x-0 after:rounded-full after:bg-[#ce9000] after:transition-transform hover:text-[#b98308] ${active ? 'text-[#ce9000] after:scale-x-100' : 'text-[var(--ink)]'}`;

  async function logout() {
    setProfileOpen(false);
    await signOut();
    navigate('/');
  }

  return <header className="sticky top-0 z-20 h-[82px] border-b border-[var(--line)] bg-white/95 backdrop-blur-[14px] max-[1000px]:backdrop-blur-none max-[650px]:h-[68px]">
    <nav className="relative mx-auto flex h-full w-[min(1200px,calc(100%-48px))] items-center justify-between max-[650px]:w-[min(1200px,calc(100%-28px))]">
      <button className="border-0 bg-transparent p-0 text-inherit" onClick={() => go('/')} aria-label="RJS home"><span className="block h-[68px] w-[72px] shrink-0 overflow-hidden max-[650px]:h-[58px] max-[650px]:w-[62px]"><img className="block h-full w-full object-contain" src="/assets/rjs-logo.png" alt="RJS" /></span></button>

      <button className={`fixed inset-0 z-30 hidden border-0 bg-[#031027]/55 p-0 backdrop-blur-[2px] transition-opacity duration-300 max-[1000px]:block ${menuOpen ? 'max-[1000px]:pointer-events-auto max-[1000px]:opacity-100' : 'max-[1000px]:pointer-events-none max-[1000px]:opacity-0'}`} onClick={() => setMenuOpen(false)} aria-label="Close navigation" tabIndex={menuOpen ? 0 : -1} />
      <div className={`flex items-center gap-[34px] max-[1000px]:fixed max-[1000px]:top-0 max-[1000px]:right-0 max-[1000px]:z-40 max-[1000px]:h-[100dvh] max-[1000px]:w-[min(360px,86vw)] max-[1000px]:flex-col max-[1000px]:items-stretch max-[1000px]:gap-0 max-[1000px]:overflow-y-auto max-[1000px]:bg-white max-[1000px]:px-7 max-[1000px]:pb-8 max-[1000px]:shadow-[-22px_0_55px_rgba(3,16,39,.2)] max-[1000px]:transition-transform max-[1000px]:duration-300 ${menuOpen ? 'max-[1000px]:translate-x-0' : 'max-[1000px]:translate-x-full'}`}>
        <div className="hidden h-[82px] shrink-0 items-center justify-between border-b border-[var(--line)] max-[1000px]:flex max-[650px]:h-[68px]"><span className="font-[Manrope] text-sm font-extrabold text-[var(--navy)]">Menu</span><button className="grid h-9 w-9 place-items-center rounded-full border-0 bg-[#f2f4f7]" onClick={() => setMenuOpen(false)} aria-label="Close menu"><X className="w-[18px]" /></button></div>
        <button className={`${itemClass(isFleet)} max-[1000px]:border-b max-[1000px]:border-[#edf0f3] max-[1000px]:py-[18px] max-[1000px]:after:hidden ${isFleet ? 'max-[1000px]:bg-[#fff8e7] max-[1000px]:px-3' : ''}`} onClick={() => goHomeSection('#fleet')}>Vehicles</button>
        <button className={`${itemClass(isPath('/packages'))} max-[1000px]:border-b max-[1000px]:border-[#edf0f3] max-[1000px]:py-[18px] max-[1000px]:after:hidden ${isPath('/packages') ? 'max-[1000px]:bg-[#fff8e7] max-[1000px]:px-3' : ''}`} onClick={() => go('/packages')}>Tour Packages</button>
        <button className={`${itemClass(isPath('/contact'))} max-[1000px]:border-b max-[1000px]:border-[#edf0f3] max-[1000px]:py-[18px] max-[1000px]:after:hidden ${isPath('/contact') ? 'max-[1000px]:bg-[#fff8e7] max-[1000px]:px-3' : ''}`} onClick={() => go('/contact')}>Contact Us</button>
        <button className={`${itemClass(isPath('/about'))} max-[1000px]:border-b max-[1000px]:border-[#edf0f3] max-[1000px]:py-[18px] max-[1000px]:after:hidden ${isPath('/about') ? 'max-[1000px]:bg-[#fff8e7] max-[1000px]:px-3' : ''}`} onClick={() => go('/about')}>About Us</button>
        {signedIn && <button className={`${itemClass(isPath('/my-bookings'))} max-[1000px]:border-b max-[1000px]:border-[#edf0f3] max-[1000px]:py-[18px] max-[1000px]:after:hidden ${isPath('/my-bookings') ? 'max-[1000px]:bg-[#fff8e7] max-[1000px]:px-3' : ''}`} onClick={() => go('/my-bookings')}>My Bookings</button>}
        <div className="mt-auto hidden border-t border-[var(--line)] pt-5 max-[1000px]:flex max-[1000px]:flex-col max-[1000px]:gap-3">{!signedIn && <button className="rounded-lg border border-[var(--line)] px-4 py-3 text-left text-xs font-bold" onClick={openLogin}>Login / Sign up</button>}<button className="relative flex w-full items-center gap-2 overflow-hidden rounded-[10px] border border-[#e4a700] bg-[linear-gradient(135deg,#ffd45f,#f3b516_52%,#e89a0b)] py-[9px] pr-[14px] pl-[9px] text-xs font-extrabold text-[#071a3d] shadow-[0_9px_24px_rgba(211,151,7,.34)]" onClick={() => goHomeSection('#download')}><Smartphone className="h-[34px] w-[34px] rounded-lg bg-[#071a3d] p-2 text-white" />Get the App<ArrowRight className="ml-auto w-[15px]" /></button></div>
      </div>

      <div className="flex items-center gap-3">
        {!signedIn && <button className="border-0 bg-transparent py-[10px] text-xs font-bold text-[var(--ink)] hover:text-[#c58a00] max-[1000px]:hidden" onClick={openLogin}>Login / Sign up</button>}
        {signedIn && <div className="relative" ref={profileMenu}><button onClick={() => setProfileOpen((open) => !open)} className={`grid h-10 w-10 place-items-center rounded-full border transition ${profileOpen || isPath('/profile') ? 'border-[#c58a00] bg-[#fff5d8] text-[#a87300]' : 'border-[#dce1e7] bg-[#f5f7fa] text-[var(--navy)] hover:border-[#c58a00] hover:text-[#b67e00]'}`} aria-label="Open profile menu" aria-expanded={profileOpen}><UserRound className="w-[18px]" /></button><div className={`absolute top-[calc(100%+12px)] right-0 w-52 origin-top-right rounded-2xl border border-[#e1e5eb] bg-white p-2 shadow-[0_18px_45px_rgba(7,26,61,.16)] transition duration-200 ${profileOpen ? 'pointer-events-auto translate-y-0 scale-100 opacity-100' : 'pointer-events-none -translate-y-2 scale-95 opacity-0'}`}><div className="border-b border-[#edf0f3] px-3 py-2"><small className="block text-[8px] font-bold tracking-[.8px] text-[#8993a1]">SIGNED IN</small><b className="mt-1 block truncate text-xs text-[var(--navy)]">{customer?.name || 'RJS customer'}</b></div><button onClick={() => go('/profile')} className="mt-1 flex w-full items-center gap-2 rounded-xl border-0 bg-transparent px-3 py-2.5 text-left text-[11px] font-bold text-[var(--navy)] hover:bg-[#f4f7fb]"><UserRound className="w-4" />Profile</button><button onClick={logout} className="flex w-full items-center gap-2 rounded-xl border-0 bg-transparent px-3 py-2.5 text-left text-[11px] font-bold text-[#b13d35] hover:bg-[#fff1f0]"><LogOut className="w-4" />Logout</button></div></div>}
        <button className="relative flex items-center gap-2 overflow-hidden rounded-[10px] border border-[#e4a700] bg-[linear-gradient(135deg,#ffd45f_0%,#f3b516_52%,#e89a0b_100%)] py-[9px] pr-[14px] pl-[9px] text-xs font-extrabold text-[#071a3d] shadow-[0_7px_20px_rgba(211,151,7,.28)] hover:-translate-y-0.5 max-[650px]:hidden" onClick={() => goHomeSection('#download')}><Smartphone className="h-[30px] w-[30px] rounded-lg bg-[#071a3d] p-[7px] text-white" />Get the App<ArrowRight className="w-[15px]" /></button>
        <button className="hidden h-10 w-10 place-items-center rounded-full border-0 bg-[#f2f4f7] max-[1000px]:grid" onClick={() => setMenuOpen((open) => !open)} aria-label="Toggle navigation"><Menu className="w-5" /></button>
      </div>
    </nav>
  </header>;
}

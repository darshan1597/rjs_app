import { ArrowRight, MapPin, MessageCircle, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';

const linkClass = 'text-[11px] leading-6 text-[#a7b2c4] transition hover:translate-x-0.5 hover:text-[#f2c75b]';

export default function Footer() {
  return <footer className="relative overflow-hidden bg-[#050f25] text-white">
    <div className="pointer-events-none absolute top-[-180px] left-[-120px] h-[420px] w-[420px] rounded-full bg-[#123a75]/20 blur-3xl" />
    <div className="relative mx-auto grid w-[min(1200px,calc(100%-48px))] grid-cols-[1.25fr_.7fr_.8fr_1.15fr] gap-12 pt-16 pb-12 max-[950px]:grid-cols-2 max-[650px]:w-[calc(100%-28px)] max-[650px]:grid-cols-1 max-[650px]:gap-9 max-[650px]:pt-12">
      <section>
        <Link className="inline-flex items-center gap-3" to="/" aria-label="RJS home"><span className="grid h-[72px] w-[72px] place-items-center rounded-2xl bg-white p-1.5 shadow-[0_10px_25px_rgba(0,0,0,.22)]"><img className="h-full w-full object-contain" src="/assets/rjs-logo.png" alt="RJS" /></span><span><b className="block font-[Manrope] text-sm tracking-[1.5px]">TOURS & TRAVELS</b><small className="mt-1 block text-[8px] tracking-[1.8px] text-[#f2c75b]">SAFE · RELIABLE · EVERYWHERE</small></span></Link>
        <p className="mt-5 max-w-[300px] text-[11px] leading-6 text-[#9aa8bc]">Reliable city rides and thoughtfully managed journeys from Bengaluru to destinations across India.</p>
        <div className="mt-5 flex flex-col gap-2.5"><a href="tel:+918971190666" className="flex items-center gap-2 text-[10px] text-[#c5cfdd] hover:text-white"><Phone className="w-3.5 text-[#f2c75b]" />+91 89711 90666</a><span className="flex items-center gap-2 text-[10px] text-[#c5cfdd]"><MapPin className="w-3.5 text-[#f2c75b]" />Bengaluru, Karnataka</span></div>
      </section>

      <section className="flex flex-col items-start gap-1"><h2 className="mb-3 text-[10px] font-extrabold tracking-[1.4px] text-white">EXPLORE</h2><Link className={linkClass} to="/">Book a ride</Link><Link className={linkClass} to="/packages">Tour packages</Link><Link className={linkClass} to="/my-bookings">My bookings</Link><Link className={linkClass} to="/about">About RJS</Link><Link className={linkClass} to="/contact">Contact us</Link></section>

      <section className="flex flex-col items-start gap-1"><h2 className="mb-3 text-[10px] font-extrabold tracking-[1.4px] text-white">SUPPORT & LEGAL</h2><Link className={linkClass} to="/privacy">Privacy policy</Link><Link className={linkClass} to="/terms">Terms and conditions</Link><Link className={linkClass} to="/cancellation-refunds">Cancellation and refunds</Link><Link className={linkClass} to="/account-deletion">Account deletion</Link></section>

      <section className="self-start rounded-2xl border border-white/10 bg-[#0c2147] p-6 shadow-[0_16px_35px_rgba(0,0,0,.16)]"><small className="text-[8px] font-extrabold tracking-[1.3px] text-[#f2c75b]">READY TO TRAVEL?</small><h2 className="mt-3 font-[Manrope] text-xl font-bold leading-7">Let’s plan your next journey.</h2><p className="mt-2 text-[10px] leading-5 text-[#a9b6c9]">Speak directly with the RJS travel desk for booking and trip support.</p><a className="mt-5 flex h-12 items-center gap-2 rounded-xl bg-[var(--gold)] px-4 text-[10px] font-extrabold text-[var(--navy)] shadow-[0_8px_22px_rgba(238,178,27,.18)] hover:-translate-y-0.5" href="https://wa.me/918971190666" target="_blank" rel="noreferrer"><MessageCircle className="w-4" />WhatsApp our team<ArrowRight className="ml-auto w-4" /></a></section>
    </div>
    <div className="relative border-t border-white/10"><div className="mx-auto flex w-[min(1200px,calc(100%-48px))] items-center justify-between gap-4 py-5 text-[9px] text-[#728198] max-[650px]:w-[calc(100%-28px)] max-[650px]:flex-col max-[650px]:items-start"><span>&copy; {new Date().getFullYear()} RJS Tours & Travels. All rights reserved.</span><span>Customer and driver services managed by RJS</span></div></div>
  </footer>;
}

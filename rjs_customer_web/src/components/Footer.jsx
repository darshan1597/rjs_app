import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function Footer() {
    return (
        <footer className="bg-[#050f25] text-white">
            <div className="mx-auto grid w-[min(1200px,calc(100%-48px))] grid-cols-[1.3fr_.7fr_.7fr_1.2fr] gap-[55px] pt-[70px] pb-[45px] max-[1000px]:grid-cols-2 max-[650px]:w-[min(1200px,calc(100%-28px))] max-[650px]:grid-cols-1 max-[650px]:gap-[35px] max-[650px]:pt-[55px]">
                <div className="flex flex-col items-start gap-[11px]">
                    <Link className="block h-[84px] w-[88px] shrink-0 overflow-hidden rounded-xl bg-white p-1" to="/" aria-label="RJS Tours App home">
                        <img className="block h-full w-full object-contain" src="/assets/rjs-logo.png" alt="RJS Tours App" />
                    </Link>
                    <p className="text-[11px] leading-[1.7] text-[#98a5bb]">
                        One trusted journey at a time,
                        <br />
                        from Bengaluru to all of India.
                    </p>
                </div>
                <div className="flex flex-col items-start gap-[11px]">
                    <b className="mb-[7px] text-xs">Services</b>
                    <Link className="text-[11px] leading-[1.7] text-[#98a5bb] hover:text-white" to="/#fleet">Cars & SUVs</Link>
                    <Link className="text-[11px] leading-[1.7] text-[#98a5bb] hover:text-white" to="/#fleet">Tempo travellers</Link>
                    <Link className="text-[11px] leading-[1.7] text-[#98a5bb] hover:text-white" to="/#fleet">Bus hire</Link>
                    <Link className="text-[11px] leading-[1.7] text-[#98a5bb] hover:text-white" to="/#book">Bengaluru autos</Link>
                </div>
                <div className="flex flex-col items-start gap-[11px]">
                    <b className="mb-[7px] text-xs">Company</b>
                    <Link className="text-[11px] leading-[1.7] text-[#98a5bb] hover:text-white" to="/about">About RJS</Link>
                    <Link className="text-[11px] leading-[1.7] text-[#98a5bb] hover:text-white" to="/#corporate">Corporate travel</Link>
                    <Link className="text-[11px] leading-[1.7] text-[#98a5bb] hover:text-white" to="/packages">Tour packages</Link>
                    <Link className="text-[11px] leading-[1.7] text-[#98a5bb] hover:text-white" to="/contact">Contact</Link>
                    <Link className="text-[11px] leading-[1.7] text-[#98a5bb] hover:text-white" to="/privacy">Privacy</Link>
                    <Link className="text-[11px] leading-[1.7] text-[#98a5bb] hover:text-white" to="/terms">Terms</Link>
                    <Link className="text-[11px] leading-[1.7] text-[#98a5bb] hover:text-white" to="/cancellation-refunds">Cancellation & refunds</Link>
                    <Link className="text-[11px] leading-[1.7] text-[#98a5bb] hover:text-white" to="/account-deletion">Account deletion</Link>
                </div>
                <div className="flex flex-col items-start gap-[11px] bg-[#0d2550] p-[22px]">
                    <small className="text-[8px] text-[#e9b629]">READY TO TRAVEL?</small>
                    <b className="font-[Manrope] text-lg font-semibold">Let's plan your journey.</b>
                    <a className="flex items-center gap-2 bg-[var(--gold)] p-3 text-[11px] leading-[1.7] font-bold text-[var(--navy)] active:scale-[.975]" href="https://wa.me/918971190666">
                        WhatsApp +91 89711 90666 <ArrowRight className="w-[15px]" />
                    </a>
                </div>
            </div>
            <div className="mx-auto flex w-[min(1200px,calc(100%-48px))] justify-between gap-0 border-t border-white/10 py-5 text-[9px] text-[#6f7e97] max-[650px]:w-[min(1200px,calc(100%-28px))] max-[650px]:flex-col max-[650px]:gap-1.5">
                <span>&copy; 2026 RJS Tours & Travels</span>
                <span>Bengaluru, Karnataka</span>
            </div>
        </footer>
    );
}

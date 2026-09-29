import { useEffect, useState } from "react";
import { ArrowRight, LogOut, Menu, Smartphone, X } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Navbar() {
    const navigate = useNavigate();
    const location = useLocation();
    const { signedIn, customer, signOut } = useAuth();
    const [menuOpen, setMenuOpen] = useState(false);
    useEffect(() => {
        if (!menuOpen) return;
        const closeOnEscape = (event) => event.key === "Escape" && setMenuOpen(false);
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        document.addEventListener("keydown", closeOnEscape);
        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener("keydown", closeOnEscape);
        };
    }, [menuOpen]);
    const goHomeSection = (section) => {
        setMenuOpen(false);
        if (window.location.pathname === "/")
        document.querySelector(section)?.scrollIntoView({ behavior: "smooth" });
        else navigate(`/${section}`);
    };
    const openLogin = () => navigate('/login', {
        state: { returnTo: `${location.pathname}${location.search}${location.hash}` },
    });
    return (
        <header className="sticky top-0 z-20 h-[82px] border-b border-[var(--line)] bg-white/95 backdrop-blur-[14px] max-[1000px]:backdrop-blur-none max-[650px]:h-[68px]">
            <nav className="relative mx-auto flex h-full w-[min(1200px,calc(100%-48px))] items-center justify-between max-[650px]:w-[min(1200px,calc(100%-28px))]">
                <button
                    className="border-0 bg-transparent p-0 text-inherit"
                    onClick={() => navigate("/")}
                    aria-label="RJS Tours App home"
                >
                    <span className="block h-[68px] w-[72px] shrink-0 overflow-hidden max-[650px]:h-[58px] max-[650px]:w-[62px]">
                        <img className="block h-full w-full object-contain" src="/assets/rjs-logo.png" alt="RJS Tours App" />
                    </span>
                </button>
                <button
                    className={`fixed inset-0 z-30 hidden border-0 bg-[#031027]/55 p-0 backdrop-blur-[2px] transition-opacity duration-300 max-[1000px]:block ${menuOpen ? "max-[1000px]:pointer-events-auto max-[1000px]:opacity-100" : "max-[1000px]:pointer-events-none max-[1000px]:opacity-0"}`}
                    onClick={() => setMenuOpen(false)}
                    aria-label="Close navigation"
                    tabIndex={menuOpen ? 0 : -1}
                />
                <div
                    className={`flex gap-[34px] text-[13px] font-semibold max-[1000px]:fixed max-[1000px]:top-0 max-[1000px]:right-0 max-[1000px]:z-40 max-[1000px]:h-[100dvh] max-[1000px]:w-[min(360px,86vw)] max-[1000px]:flex-col max-[1000px]:gap-0 max-[1000px]:overflow-y-auto max-[1000px]:bg-white max-[1000px]:px-7 max-[1000px]:pb-8 max-[1000px]:shadow-[-22px_0_55px_rgba(3,16,39,.2)] max-[1000px]:transition-transform max-[1000px]:duration-300 max-[1000px]:ease-[cubic-bezier(.22,1,.36,1)] ${menuOpen ? "max-[1000px]:translate-x-0" : "max-[1000px]:translate-x-full"} [&>button]:max-[1000px]:border-b [&>button]:max-[1000px]:border-[#edf0f3] [&>button]:max-[1000px]:py-[18px] [&_button]:border-0 [&_button]:bg-transparent [&_button]:p-0 [&_button]:text-left [&_button]:text-[13px] [&_button]:font-semibold [&_button]:text-inherit [&_button:hover]:text-[#a57500]`}
                >
                    <div className="hidden h-[82px] shrink-0 items-center justify-between border-b border-[var(--line)] max-[1000px]:flex max-[650px]:h-[68px]">
                        <span className="font-[Manrope] text-sm font-extrabold text-[var(--navy)]">Menu</span>
                        <button className="!grid h-9 w-9 place-items-center rounded-full !bg-[#f2f4f7]" onClick={() => setMenuOpen(false)} aria-label="Close menu">
                            <X className="w-[18px]" />
                        </button>
                    </div>
                    <button onClick={() => goHomeSection("#fleet")}>Vehicles</button>
                    <button onClick={() => navigate("/packages")}>Tour Packages</button>
                    <button onClick={() => { setMenuOpen(false); navigate("/contact"); }}>Contact Us</button>
                    <button onClick={() => { setMenuOpen(false); navigate("/about"); }}>About Us</button>
                    {signedIn && <button onClick={() => { setMenuOpen(false); navigate("/profile"); }}>My Profile</button>}
                    {signedIn && <button onClick={() => { setMenuOpen(false); navigate("/my-bookings"); }}>My Bookings</button>}
                    <div className="hidden mt-auto border-t border-[var(--line)] pt-5 max-[1000px]:flex max-[1000px]:flex-col max-[1000px]:gap-3">
                        {signedIn ? <>
                            <span className="px-1 text-[11px] text-[#687384]">Signed in as <b>{customer?.name}</b></span>
                            <button className="!flex !items-center !gap-2 !rounded-lg !border !border-[var(--line)] !px-4 !py-3" onClick={async () => { await signOut(); setMenuOpen(false); navigate("/"); }}><LogOut className="w-4" /> Logout</button>
                        </> : <button className="!rounded-lg !border !border-[var(--line)] !px-4 !py-3" onClick={openLogin}>Login / Sign up</button>}
                        <button className="relative !flex w-full items-center !gap-2 overflow-hidden !rounded-[10px] !border !border-[#e4a700] !bg-[linear-gradient(135deg,#ffd45f_0%,#f3b516_52%,#e89a0b_100%)] !py-[9px] !pr-[14px] !pl-[9px] !text-xs !font-extrabold !text-[#071a3d] shadow-[0_9px_24px_rgba(211,151,7,.34),inset_0_1px_0_rgba(255,255,255,.65)] before:absolute before:top-[-70%] before:bottom-[-70%] before:left-[-38%] before:w-[22%] before:-skew-x-[18deg] before:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,.58),transparent)] before:animate-[appButtonShine_4.2s_ease-in-out_infinite] hover:-translate-y-0.5 hover:!border-[#d28c00] hover:shadow-[0_13px_30px_rgba(211,151,7,.42),inset_0_1px_0_rgba(255,255,255,.72)] motion-reduce:before:animate-none [&>svg:first-child]:h-[34px] [&>svg:first-child]:w-[34px] [&>svg:first-child]:rounded-lg [&>svg:first-child]:bg-[#071a3d] [&>svg:first-child]:p-2 [&>svg:first-child]:text-white [&>svg:first-child]:shadow-[0_4px_10px_rgba(7,26,61,.24)] [&>svg:first-child]:transition-transform hover:[&>svg:first-child]:-rotate-[5deg] hover:[&>svg:first-child]:scale-[1.06] [&>svg:last-child]:ml-auto [&>svg:last-child]:w-[15px] [&>svg:last-child]:text-[#071a3d]" onClick={() => goHomeSection("#download") }>
                            <Smartphone /> Get the App <ArrowRight />
                        </button>
                    </div>
                </div>
                <div className="flex items-center gap-[19px]">
                    <button className="border-0 bg-transparent py-[10px] text-xs font-bold text-[var(--ink)] max-[1000px]:hidden" onClick={() => signedIn ? navigate('/profile') : openLogin()}> 
                        {signedIn ? `Hi, ${customer?.name?.split(' ')[0] || 'Traveller'}` : 'Login / Sign up'}
                    </button>
                    <button
                        className="relative flex items-center gap-2 overflow-hidden rounded-[10px] border border-[#e4a700] bg-[linear-gradient(135deg,#ffd45f_0%,#f3b516_52%,#e89a0b_100%)] py-[9px] pr-[14px] pl-[9px] text-xs font-extrabold text-[#071a3d] shadow-[0_7px_20px_rgba(211,151,7,.28),inset_0_1px_0_rgba(255,255,255,.6)] transition hover:-translate-y-0.5 hover:border-[#d28c00] hover:text-[#071a3d] hover:shadow-[0_11px_27px_rgba(211,151,7,.38),inset_0_1px_0_rgba(255,255,255,.7)] before:absolute before:top-[-70%] before:bottom-[-70%] before:left-[-38%] before:w-[22%] before:-skew-x-[18deg] before:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,.58),transparent)] before:animate-[appButtonShine_4.2s_ease-in-out_infinite] motion-reduce:before:animate-none max-[650px]:hidden [&>svg:first-child]:h-[30px] [&>svg:first-child]:w-[30px] [&>svg:first-child]:rounded-lg [&>svg:first-child]:bg-[#071a3d] [&>svg:first-child]:p-[7px] [&>svg:first-child]:text-white [&>svg:first-child]:shadow-[0_4px_10px_rgba(7,26,61,.24)] [&>svg:first-child]:transition-transform hover:[&>svg:first-child]:-rotate-[5deg] hover:[&>svg:first-child]:scale-[1.06] [&>svg:last-child]:ml-[3px] [&>svg:last-child]:w-[15px] [&>svg:last-child]:text-[#071a3d]"
                        onClick={() => goHomeSection("#download")}
                    >
                        <Smartphone />
                        Get the App <ArrowRight />
                    </button>
                    <button
                        className="hidden h-10 w-10 place-items-center rounded-full border-0 bg-[#f2f4f7] max-[1000px]:grid"
                        onClick={() => setMenuOpen((open) => !open)}
                        aria-label="Toggle navigation"
                    >
                        <Menu className="w-5" />
                    </button>
                </div>
            </nav>
        </header>
    );
}

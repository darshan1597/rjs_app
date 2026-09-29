import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, CalendarDays, Check, ChevronDown, Clock3, MapPin, ShieldCheck, Star, } from "lucide-react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";

const destinations = {
    coorg: {
        name: "Coorg Escape",
        place: "Coorg",
        days: "3 Days · 2 Nights",
        price: "₹12,999",
        distance: "265 km",
        image: "https://images.unsplash.com/photo-1593693411515-c20261bcad6e?auto=format&fit=crop&w=1800&q=90",
        intro: "Misty hills, coffee estates and quiet forest roads make Coorg the perfect unhurried escape.",
        highlights: [
            "Abbey Falls",
            "Raja's Seat",
            "Coffee estate visit",
            "Madikeri Fort",
        ],
    },
    ooty: {
        name: "Ooty Hills",
        place: "Ooty",
        days: "3 Days · 2 Nights",
        price: "₹14,499",
        distance: "270 km",
        image: "https://images.unsplash.com/photo-1589136777351-fdc9c9cab193?auto=format&fit=crop&w=1800&q=90",
        intro: "Cool mountain air, heritage railways and sweeping tea gardens in the heart of the Nilgiris.",
        highlights: [
            "Botanical Garden",
            "Doddabetta Peak",
            "Tea estate",
            "Ooty Lake",
        ],
    },
    goa: {
        name: "Goa Getaway",
        place: "Goa",
        days: "4 Days · 3 Nights",
        price: "₹18,999",
        distance: "562 km",
        image: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1800&q=90",
        intro: "A relaxed coastal journey filled with beaches, heritage neighbourhoods and memorable sunsets.",
        highlights: [
            "North Goa beaches",
            "Old Goa churches",
            "Panjim heritage walk",
            "Sunset cruise",
        ],
    },
    mysuru: {
        name: "Royal Mysuru",
        place: "Mysuru",
        days: "2 Days · 1 Night",
        price: "₹8,499",
        distance: "145 km",
        image: "https://images.unsplash.com/photo-1600112356915-089abb8fc71a?auto=format&fit=crop&w=1800&q=90",
        intro: "Royal architecture, cultural landmarks and an easy drive make Mysuru a classic weekend journey.",
        highlights: [
            "Mysore Palace",
            "Chamundi Hills",
            "Brindavan Gardens",
            "St. Philomena's Church",
        ],
    },
    chikmagalur: {
        name: "Chikmagalur Trails",
        place: "Chikmagalur",
        days: "3 Days · 2 Nights",
        price: "₹13,799",
        distance: "245 km",
        image: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1800&q=90",
        intro: "Rolling coffee country, mountain viewpoints and peaceful trails for travellers who love nature.",
        highlights: [
            "Mullayanagiri Peak",
            "Coffee plantation",
            "Baba Budangiri",
            "Hirekolale Lake",
        ],
    },
};

export default function DestinationDetails() {
    const { slug } = useParams(),
        navigate = useNavigate(),
        trip = destinations[slug];
    const [mobileSummaryOpen, setMobileSummaryOpen] = useState(false);
    useEffect(() => {
        if (!mobileSummaryOpen) return;
        const previousOverflow = document.body.style.overflow;
        const closeOnEscape = (event) => event.key === "Escape" && setMobileSummaryOpen(false);
        document.body.style.overflow = "hidden";
        document.addEventListener("keydown", closeOnEscape);
        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener("keydown", closeOnEscape);
        };
    }, [mobileSummaryOpen]);
    if (!trip) return <Navigate to="/packages" replace />;
    return (
        <>
            <Navbar />
            <main className="min-h-screen bg-[#f7f8fa] max-[650px]:pb-[82px]">
                <section
                    className="flex min-h-[520px] items-center bg-cover bg-center text-white max-[600px]:min-h-[560px]"
                    style={{
                        backgroundImage: `linear-gradient(90deg,rgba(2,13,34,.94),rgba(3,18,43,.48),rgba(3,18,43,.1)),url(${trip.image})`,
                    }}
                >
                    <div className="mx-auto w-[min(1200px,calc(100%-48px))] max-[650px]:w-[min(1200px,calc(100%-28px))]">
                        <button className="mb-[55px] flex items-center gap-[7px] border-0 bg-transparent text-[10px] text-[#d1d9e5] max-[600px]:mb-10 [&_svg]:w-3.5" onClick={() => navigate("/packages")}>
                            <ArrowLeft />
                            All packages
                        </button>
                        <span className="text-[9px] font-extrabold tracking-[1.5px] text-[var(--gold)]">RJS CURATED JOURNEY</span>
                        <h1 className="my-3 font-[Manrope] text-[62px] leading-none font-bold tracking-[-3px] max-[850px]:text-[50px] max-[600px]:text-[42px]">{trip.name}</h1>
                        <p className="max-w-[580px] text-sm leading-[1.7] text-[#c8d2e0]">{trip.intro}</p>
                        <div className="mt-[25px] flex gap-3 max-[600px]:flex-wrap [&>span]:flex [&>span]:items-center [&>span]:gap-[7px] [&>span]:border [&>span]:border-white/20 [&>span]:bg-white/8 [&>span]:px-3 [&>span]:py-[9px] [&>span]:text-[9px] [&>span]:backdrop-blur-lg [&_svg]:w-3.5 [&_svg]:text-[var(--gold)]">
                            <span>
                                <CalendarDays />
                                {trip.days}
                            </span>
                            <span>
                                <MapPin />
                                {trip.distance} from Bengaluru
                            </span>
                            <span>
                                <Star fill="currentColor" />
                                4.9 traveller rating
                            </span>
                        </div>
                    </div>
                </section>
                <section className="mx-auto grid w-[min(1200px,calc(100%-48px))] grid-cols-[1fr_310px] gap-8 pt-[70px] pb-[90px] max-[850px]:grid-cols-1 max-[650px]:w-[min(1200px,calc(100%-28px))] max-[600px]:pt-[55px]">
                    <div>
                        <div>
                            <span className="text-[9px] font-extrabold tracking-[1.5px] text-[var(--gold)]">TRIP OVERVIEW</span>
                            <h2 className="my-[9px] font-[Manrope] text-[35px] leading-[1.15] font-bold tracking-[-1.5px] text-[var(--navy)]">A refreshing journey to {trip.place}</h2>
                            <p className="max-w-[700px] text-xs leading-[1.75] text-[#697484]">
                                {trip.intro} Your private RJS vehicle and experienced driver
                                stay with you through the complete itinerary.
                            </p>
                        </div>
                        <div className="my-8 grid grid-cols-2 gap-[10px] max-[600px]:grid-cols-1">
                            {trip.highlights.map((item, index) => (
                                <article className="flex items-center gap-[9px] border border-[var(--line)] bg-white p-4" key={item}>
                                    <i className="text-[8px] not-italic text-[#9ca4af]">0{index + 1}</i>
                                    <Check className="w-3.5 text-[#2d8262]" />
                                    <b className="text-[11px]">{item}</b>
                                </article>
                            ))}
                        </div>
                        <div className="border border-[var(--line)] bg-white p-[25px] max-[600px]:p-[18px]">
                            <span className="text-[9px] font-extrabold tracking-[1.5px] text-[var(--gold)]">DAY-BY-DAY PLAN</span>
                            {[
                                "Depart from Bengaluru and settle into your destination",
                                "Explore the signature sights with your RJS driver",
                                "A relaxed final morning and comfortable return journey",
                            ].map((day, index) => (
                                <article className="flex gap-[15px] border-b border-[var(--line)] py-5 last:border-0 last:pb-0" key={day}>
                                    <i className="grid h-[30px] w-[30px] place-items-center rounded-full bg-[#fff1c3] font-[Manrope] text-[10px] font-bold not-italic text-[#92700f]">{index + 1}</i>
                                    <div className="flex flex-col">
                                        <small className="text-[7px] text-[#9a7210]">DAY {index + 1}</small>
                                        <b className="my-[3px] text-xs">{day}</b>
                                        <p className="m-0 text-[9px] text-[#808a98]">
                                            Flexible timings with local stops coordinated around your
                                            group.
                                        </p>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </div>
                    <aside className="sticky top-[102px] self-start border border-[var(--line)] bg-white p-6 max-[850px]:static max-[650px]:hidden">
                        <small className="text-[8px] text-[#838d9a]">PACKAGE STARTS FROM</small>
                        <b className="my-[3px] block font-[Manrope] text-[30px] font-extrabold text-[var(--navy)]">{trip.price}</b>
                        <span className="text-[9px] text-[#2f8062]">per vehicle · taxes included</span>
                        <div className="my-[18px] border-y border-[var(--line)] py-3 [&_p]:flex [&_p]:items-center [&_p]:gap-[7px] [&_p]:text-[10px] [&_p]:text-[#586375] [&_svg]:w-[13px] [&_svg]:text-[#2e8262]">
                            <p>
                                <Check />
                                Private RJS vehicle
                            </p>
                            <p>
                                <Check />
                                Driver allowance
                            </p>
                            <p>
                                <Check />
                                Pickup from Bengaluru
                            </p>
                            <p>
                                <ShieldCheck />
                                24/7 trip assistance
                            </p>
                        </div>
                        <button className="flex w-full items-center justify-between border-0 bg-[var(--gold)] p-3.5 text-[10px] font-extrabold text-[var(--navy)] [&_svg]:w-[15px]">
                            Plan this trip <ArrowRight />
                        </button>
                        <p className="flex items-center gap-1.5 text-[8px] leading-[1.5] text-[#7d8795] [&_svg]:w-[13px]">
                            <Clock3 />
                            Our travel desk responds within 15 minutes.
                        </p>
                    </aside>
                </section>
                <div className="fixed right-0 bottom-0 left-0 z-50 hidden items-center gap-2 border-t border-[var(--line)] bg-white/95 px-3.5 pt-[10px] pb-[max(10px,env(safe-area-inset-bottom))] shadow-[0_-12px_35px_rgba(7,26,61,.14)] backdrop-blur-xl max-[650px]:flex">
                    <div className="flex min-w-0 flex-1 flex-col">
                        <small className="text-[7px] font-bold tracking-[.7px] text-[#7d8795]">PACKAGE FROM</small>
                        <b className="font-[Manrope] text-xl font-extrabold text-[var(--navy)]">{trip.price}</b>
                        <span className="text-[7px] text-[#2c8061]">Per vehicle · taxes included</span>
                    </div>
                    <button className="flex h-12 min-w-[142px] items-center justify-between rounded-lg border-0 bg-[var(--gold)] px-4 text-[11px] font-extrabold text-[var(--navy)] shadow-[0_8px_20px_rgba(183,132,7,.24)] [&_svg]:w-[15px]">
                        Plan trip <ArrowRight />
                    </button>
                    <button className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[var(--line)] bg-[#f5f7fa] text-[var(--navy)] transition-all duration-300 ease-[cubic-bezier(.22,1,.36,1)] active:scale-95 [&_svg]:w-[17px] [&_svg]:transition-transform [&_svg]:duration-[450ms] [&_svg]:ease-[cubic-bezier(.22,1,.36,1)]" onClick={() => setMobileSummaryOpen((open) => !open)} aria-label={mobileSummaryOpen ? "Hide package summary" : "Show package summary"}>
                        <ChevronDown className={mobileSummaryOpen ? "rotate-0" : "rotate-180"} />
                    </button>
                </div>
                <button className={`fixed inset-0 z-[55] hidden border-0 bg-[#031027]/55 p-0 backdrop-blur-[2px] transition-opacity duration-[450ms] ease-[cubic-bezier(.22,1,.36,1)] max-[650px]:block ${mobileSummaryOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`} onClick={() => setMobileSummaryOpen(false)} aria-label="Close package summary" tabIndex={mobileSummaryOpen ? 0 : -1} />
                <section className={`fixed right-0 bottom-0 left-0 z-[60] hidden max-h-[82dvh] overflow-y-auto overscroll-contain rounded-t-[22px] bg-white px-5 pt-3 pb-[max(20px,env(safe-area-inset-bottom))] shadow-[0_-25px_70px_rgba(3,16,39,.3)] will-change-transform transition-transform duration-[500ms] ease-[cubic-bezier(.22,1,.36,1)] max-[650px]:block ${mobileSummaryOpen ? "translate-y-0" : "translate-y-[105%]"}`} aria-label="Full package summary">
                    <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[#d8dde4]"></div>
                    <div className="flex items-start justify-between border-b border-[var(--line)] pb-4">
                        <div className="flex flex-col">
                            <small className="text-[8px] font-bold tracking-[.8px] text-[#7d8795]">PACKAGE STARTS FROM</small>
                            <b className="my-1 font-[Manrope] text-[30px] font-extrabold text-[var(--navy)]">{trip.price}</b>
                            <span className="text-[9px] text-[#2c8061]">Per vehicle · applicable taxes included</span>
                        </div>
                        <button className="grid h-9 w-9 place-items-center rounded-full border-0 bg-[#f1f3f6] text-[var(--navy)] transition-all duration-300 active:scale-95 [&_svg]:w-[17px]" onClick={() => setMobileSummaryOpen(false)} aria-label="Hide package summary"><ChevronDown /></button>
                    </div>
                    <div className="my-4 border-y border-[var(--line)] py-3 [&_p]:my-3 [&_p]:flex [&_p]:items-center [&_p]:gap-2 [&_p]:text-[11px] [&_p]:text-[#586375] [&_svg]:w-3.5 [&_svg]:text-[#2e8262]">
                        <p><Check />Private RJS vehicle</p>
                        <p><Check />Driver allowance</p>
                        <p><Check />Pickup from Bengaluru</p>
                        <p><ShieldCheck />24/7 trip assistance</p>
                    </div>
                    <p className="flex items-center gap-2 bg-[#f5f7fa] p-3 text-[9px] text-[#687486] [&_svg]:w-3.5"><Clock3 />Our travel desk responds within 15 minutes.</p>
                    <button className="mt-3 flex h-[50px] w-full items-center justify-between rounded-lg border-0 bg-[var(--gold)] px-4 text-[11px] font-extrabold text-[var(--navy)] shadow-[0_8px_20px_rgba(183,132,7,.24)] [&_svg]:w-[15px]">Plan this trip <ArrowRight /></button>
                </section>
            </main>
            <Footer />
        </>
    );
}

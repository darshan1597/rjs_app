import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import LocationSelectButton from "../components/LocationSelectButton.jsx";
import { fetchTourPackages, formatPackagePrice, packageImageUrl } from "../lib/tourPackages.js";
import { ArrowRight, BadgeCheck, BusFront, CalendarDays, CarFront, Check, ChevronDown, Clock3, Headphones, MapPin, Menu, Navigation, Phone, Route, ShieldCheck, Star, Users, Van, X, Mail, LockKeyhole, UserRound, Eye, Smartphone, ArrowLeft, Snowflake, ChevronLeft, ChevronRight, } from "lucide-react";

const vehicles = [
    {
        id: "car",
        title: "Cars",
        use: "City & outstation",
        seats: "4–7",
        icon: CarFront,
        accent: "#dce9ff",
    },
    {
        id: "tt",
        title: "Tempo Traveller",
        use: "Groups & tours",
        seats: "9–26",
        icon: Van,
        accent: "#e1f3eb",
    },
    {
        id: "bus",
        title: "Buses",
        use: "Across India",
        seats: "27–56",
        icon: BusFront,
        accent: "#f5e8dc",
    },
    {
        id: "auto",
        title: "Autos",
        use: "Bengaluru only",
        seats: "3",
        icon: Navigation,
        accent: "#fff1ba",
    },
];

function Logo() {
    return (
        <a className="block h-[68px] w-[72px] shrink-0 overflow-hidden max-[650px]:h-[58px] max-[650px]:w-[62px]" href="#home" aria-label="RJS Tours App home">
            <img className="block h-full w-full object-contain" src="/assets/rjs-logo.png" alt="RJS Tours App" />
        </a>
    );
}

function Booking({ onSearch, initialSearch }) {
    const navigate = useNavigate();
    const [service, setService] = useState("local");
    const [bookingTime, setBookingTime] = useState("now");
    const [pickup, setPickup] = useState(null);
    const [destination, setDestination] = useState(null);
    const [date, setDate] = useState("");
    const [time, setTime] = useState("");
    const [timeMenuOpen, setTimeMenuOpen] = useState(false);
    const [message, setMessage] = useState("");
    const timeMenuRef = useRef(null);
    useEffect(() => {
        const closeMenu = (event) => {
        if (timeMenuRef.current && !timeMenuRef.current.contains(event.target))
            setTimeMenuOpen(false);
        };
        document.addEventListener("mousedown", closeMenu);
        return () => document.removeEventListener("mousedown", closeMenu);
    }, []);
    useEffect(() => {
        if (!initialSearch) return;
        setPickup(initialSearch.pickup || null);
        setDestination(initialSearch.destination || null);
        if (initialSearch.scheduledFor) {
            const [nextDate, nextTime] = initialSearch.scheduledFor.split('T');
            setBookingTime('schedule'); setDate(nextDate || ''); setTime((nextTime || '').slice(0, 5));
        }
    }, [initialSearch]);
    const switchService = (next) => {
        setService(next);
        setBookingTime("now");
        setPickup(null);
        setDestination(null);
        setMessage(next === 'outstation' ? 'Outstation web booking is coming soon. Contact RJS for assistance.' : '');
    };
    useEffect(() => {
        if (service !== 'local' || !pickup || !destination) return;
        const scheduledFor = bookingTime === 'schedule' && date && time ? `${date}T${time}` : '';
        onSearch({ service, pickup, destination, scheduledFor });
    }, [pickup, destination]);
    return (
        <div className="relative col-start-2 row-start-1 z-[4] block w-full translate-z-0 rounded-[18px] border border-white/90 bg-white/95 p-[25px] shadow-[0_30px_80px_rgba(10,30,61,0.18)] backdrop-blur-[18px] [backface-visibility:hidden] [text-shadow:none] animate-[bookingEnter_0.72s_cubic-bezier(0.22,1,0.36,1)_0.14s_both] motion-reduce:animate-none [&_input:focus]:shadow-none [&_input:focus]:outline-none [&_input:focus-visible]:shadow-none [&_input:focus-visible]:outline-none max-[1000px]:col-start-2 max-[1000px]:row-start-1 max-[1000px]:m-0 max-[780px]:col-start-1 max-[780px]:row-start-2 max-[780px]:mx-auto max-[780px]:max-w-[520px] max-[780px]:self-center max-[780px]:bg-white max-[650px]:row-start-1 max-[650px]:mt-4 max-[650px]:max-w-none max-[650px]:rounded-[14px] max-[650px]:p-[18px]" id="book">
            <div className="flex justify-between items-start mb-[17px] max-[650px]:mb-[13px]">
                <div>
                    <small className="text-[8px] font-extrabold tracking-[1.4px] text-[#9a7010]">BOOK YOUR RIDE</small>
                    <h2 className="mt-[5px] mb-0 font-[Manrope] text-[25px] font-bold leading-[1.15] text-[var(--navy)] max-[650px]:text-[20px]">Start your journey</h2>
                </div>
                <div className="flex items-center gap-[5px] whitespace-nowrap rounded-[20px] bg-[#edf8f2] px-[9px] py-[7px] text-[9px] text-[#358366] max-[650px]:px-[8px] max-[650px]:py-[6px] [&_svg]:w-[14px]">
                    <ShieldCheck />
                    RJS Assured
                </div>
            </div>
            <div className="col-start-2 mb-[14px] grid grid-cols-2 bg-[#f0f2f5] p-1 max-[1000px]:col-auto">
                <button
                    type="button"
                    className={`flex items-center justify-center gap-[7px] border-0 px-[6px] py-3 text-[11px] font-bold transition-colors [&_svg]:w-[15px] ${
                    service === "outstation"
                        ? "bg-[var(--navy)] text-white"
                        : "bg-transparent text-[#6d7787]"
                    }`}
                    onClick={() => switchService("outstation")}
                >
                    <Route />
                    <span>Outstation</span>
                </button>

                <button
                    type="button"
                    className={`flex items-center justify-center gap-[7px] border-0 px-[6px] py-3 text-[11px] font-bold transition-colors [&_svg]:w-[15px] ${
                    service === "local"
                        ? "bg-[var(--navy)] text-white"
                        : "bg-transparent text-[#6d7787]"
                    }`}
                    onClick={() => switchService("local")}
                >
                    <Navigation />
                    <span>Bengaluru local</span>
                </button>
            </div>
            {service === "outstation" && (
                <div className="my-[3px] mb-[13px] flex items-center justify-start gap-2">
                    <label className="relative flex min-h-[30px] cursor-pointer items-center gap-[7px] rounded-[20px] border border-transparent py-[5px] pr-[10px] pl-[7px] text-[#657083] transition hover:bg-[#f5f6f8] has-[:checked]:border-[#dfe4eb] has-[:checked]:bg-[#f5f7fa] has-[:checked]:font-bold has-[:checked]:text-[var(--navy)]">
                        <input className="peer pointer-events-none absolute opacity-0" defaultChecked type="radio" name="trip" />
                        <i className="grid h-4 w-4 flex-[0_0_16px] place-items-center rounded-full border-[1.5px] border-[#aab2bf] after:h-[7px] after:w-[7px] after:scale-0 after:rounded-full after:bg-[var(--navy)] after:content-[''] peer-checked:border-[var(--navy)] peer-checked:bg-[#eef2f8] peer-checked:after:scale-100"></i>
                        <span className="whitespace-nowrap text-[10px] leading-none">Round trip</span>
                    </label>
                    <label className="relative flex min-h-[30px] cursor-pointer items-center gap-[7px] rounded-[20px] border border-transparent py-[5px] pr-[10px] pl-[7px] text-[#657083] transition hover:bg-[#f5f6f8] has-[:checked]:border-[#dfe4eb] has-[:checked]:bg-[#f5f7fa] has-[:checked]:font-bold has-[:checked]:text-[var(--navy)]">
                        <input className="peer pointer-events-none absolute opacity-0" type="radio" name="trip" />
                        <i className="grid h-4 w-4 flex-[0_0_16px] place-items-center rounded-full border-[1.5px] border-[#aab2bf] after:h-[7px] after:w-[7px] after:scale-0 after:rounded-full after:bg-[var(--navy)] after:content-[''] peer-checked:border-[var(--navy)] peer-checked:bg-[#eef2f8] peer-checked:after:scale-100"></i>
                        <span className="whitespace-nowrap text-[10px] leading-none">One way</span>
                    </label>
                </div>
            )}
            <div className="space-y-3">
                <LocationSelectButton label="FROM" placeholder={service === "local" ? "Enter pickup location" : "Bengaluru"} value={pickup} onClick={() => navigate('/select-location/pickup', { state: { returnTo: '/', draft: { pickup, destination, scheduledFor: bookingTime === 'schedule' && date && time ? `${date}T${time}` : '' } } })} />
                <LocationSelectButton destination label="TO" placeholder="Enter destination" value={destination} onClick={() => navigate('/select-location/destination', { state: { returnTo: '/', draft: { pickup, destination, scheduledFor: bookingTime === 'schedule' && date && time ? `${date}T${time}` : '' } } })} />
            </div>
            {service === "local" && (
                <div
                    className="relative mt-[10px]"
                    ref={timeMenuRef}
                >
                <button
                    type="button"
                    className={`flex min-h-[55px] w-full items-center gap-[9px] rounded-[9px] border bg-white px-[11px] py-2 text-left transition hover:border-[#c7a553] hover:bg-[#fffdf7] ${timeMenuOpen?'border-[#b98408] bg-[#fffdf7] shadow-[0_0_0_3px_rgba(238,178,27,.14)]':'border-[var(--line)]'}`}
                    onClick={() => setTimeMenuOpen((open) => !open)}
                    aria-expanded={timeMenuOpen}
                >
                    <span className="grid h-[30px] w-[30px] flex-[0_0_30px] place-items-center rounded-lg bg-[#fff4d4] text-[#a87808]">
                        <Clock3 className="w-[15px]" />
                    </span>
                    <span className="flex flex-col gap-0.5">
                        <small className="text-[7px] font-extrabold tracking-[1px] text-[#9a7214]">WHEN DO YOU NEED THE RIDE?</small>
                        <b className="text-xs text-[var(--ink)]">{bookingTime === "now" ? "Book now" : "Schedule booking"}</b>
                    </span>
                    <ChevronDown className={`ml-auto w-[15px] text-[#778293] transition-transform ${timeMenuOpen?'rotate-180 text-[#a87808]':''}`} />
                </button>
                {timeMenuOpen && (
                    <div className="absolute top-[calc(100%+7px)] right-0 left-0 z-30 rounded-[11px] border border-[#e5d7ad] bg-white p-1.5 shadow-[0_18px_42px_rgba(7,26,61,.18)]">
                        <button
                            type="button"
                            className={`flex w-full items-center justify-between rounded-lg border-0 p-[10px] text-left text-[var(--ink)] hover:bg-[#f7f3e8] ${bookingTime==='now'?'bg-[#fff5d7]':'bg-transparent'}`}
                            onClick={() => {
                                setBookingTime("now");
                                setTimeMenuOpen(false);
                            }}
                        >
                            <span className="flex flex-col gap-0.5">
                                <b className="text-[11px]">Book now</b>
                                <small className="text-[8px] text-[#7b8492]">Get the nearest available ride</small>
                            </span>
                            {bookingTime === "now" && <Check className="w-[15px] text-[#a87808]" />}
                        </button>
                        <button
                            type="button"
                            className={`flex w-full items-center justify-between rounded-lg border-0 p-[10px] text-left text-[var(--ink)] hover:bg-[#f7f3e8] ${bookingTime==='schedule'?'bg-[#fff5d7]':'bg-transparent'}`}
                            onClick={() => {
                            setBookingTime("schedule");
                            setTimeMenuOpen(false);
                            }}
                        >
                            <span className="flex flex-col gap-0.5">
                                <b className="text-[11px]">Schedule booking</b>
                                <small className="text-[8px] text-[#7b8492]">Choose your preferred date and time</small>
                            </span>
                            {bookingTime === "schedule" && <Check className="w-[15px] text-[#a87808]" />}
                        </button>
                    </div>
                )}
                </div>
            )}
            {(service === "outstation" || bookingTime === "schedule") && (
                <div className="mt-[10px] grid grid-cols-[1.2fr_.8fr] gap-2 max-[430px]:grid-cols-1">
                    <label className="block rounded-[9px] border border-[var(--line)] px-[11px] py-[9px] transition focus-within:border-[#b98408] focus-within:bg-[#fffdf7] focus-within:shadow-[0_0_0_3px_rgba(238,178,27,.14)]">
                        <span className="block text-[7px] font-extrabold tracking-[1px] text-[#9a7214]">DEPARTURE</span>
                        <div className="mt-0.5 flex items-center gap-1.5"><CalendarDays className="w-3.5 text-[#8993a2]" />
                            <input className="w-full border-0 bg-transparent text-xs font-semibold outline-none" type="date" min={new Date().toISOString().slice(0,10)} value={date} onChange={(event) => setDate(event.target.value)} />
                        </div>
                    </label>
                    <label className="block rounded-[9px] border border-[var(--line)] px-[11px] py-[9px] transition focus-within:border-[#b98408] focus-within:bg-[#fffdf7] focus-within:shadow-[0_0_0_3px_rgba(238,178,27,.14)]">
                        <span className="block text-[7px] font-extrabold tracking-[1px] text-[#9a7214]">PICKUP TIME</span>
                        <div className="mt-0.5 flex items-center gap-1.5"><Clock3 className="w-3.5 text-[#8993a2]" />
                            <input className="w-full border-0 bg-transparent text-xs font-semibold outline-none" type="time" value={time} onChange={(event) => setTime(event.target.value)} />
                        </div>
                    </label>
                </div>
            )}
            {service === 'local' && <p className="mt-4 flex items-center gap-2 rounded-lg bg-[#edf8f2] p-3 text-[9px] text-[#28755b]"><Check className="w-3.5" />Cabs load automatically after both locations are selected.</p>}
            {message && (
                <p className="absolute right-0 bottom-[-28px] flex items-center text-[10px] text-[#24805e] max-[650px]:static max-[650px]:mt-2 max-[650px]:mb-0">
                    <Check className="w-[13px]" />
                    {message}
                </p>
            )}
        </div>
    );
}

function Home() {
    const navigate = useNavigate();
    const location = useLocation();
    const packageTrack = useRef(null);
    const [menu, setMenu] = useState(false);
    const [livePackages, setLivePackages] = useState([]);
    useEffect(() => {
        let active = true;
        fetchTourPackages({ limit: 8 })
            .then((data) => { if (active) setLivePackages(data.items || []); })
            .catch(() => { if (active) setLivePackages([]); });
        return () => { active = false; };
    }, []);
    return (
        <>
            <Navbar />

            <main id="home">
                <section className="relative overflow-hidden bg-[#f2f4f6] pt-0 pb-[55px] max-[780px]:bg-[#eef1f4] max-[650px]:pb-12">
                    <div className="relative mx-auto grid min-h-[720px] w-[min(1200px,calc(100%-48px))] grid-cols-[1fr_430px] items-center gap-[54px] max-[1000px]:grid-cols-[minmax(0,1fr)_420px] max-[1000px]:gap-[35px] max-[780px]:w-[min(1200px,calc(100%-28px))] max-[780px]:grid-cols-1 max-[780px]:items-start max-[780px]:gap-8 max-[780px]:pb-4 max-[650px]:w-[min(1200px,calc(100%-28px))] max-[650px]:gap-4">
                        <div className="relative z-[3] col-start-1 row-start-1 min-w-0 pt-0 text-white [text-shadow:0_1px_12px_rgba(2,12,31,.16)] max-[780px]:min-h-[500px] max-[780px]:pt-[65px] max-[650px]:row-start-2 max-[650px]:min-h-[410px] max-[650px]:pt-[35px] max-[420px]:min-h-[390px]">
                            <div className="flex items-center gap-[10px] text-[11px] font-extrabold tracking-[1.8px] text-[#f2c75b] max-[420px]:text-[9px] max-[420px]:tracking-[1.3px]">
                                <span className="h-px w-9 bg-[#f2c75b]"></span>ONE FLEET. EVERY JOURNEY.
                            </div>
                            <h1 className="my-[25px] font-[Manrope] text-[clamp(55px,5.2vw,78px)] leading-[.99] font-bold tracking-[-4px] text-white max-[1000px]:text-[55px] max-[650px]:text-[46px] max-[650px]:tracking-[-3px] max-[420px]:text-[39px] max-[420px]:tracking-[-2.5px]">
                                Travel anywhere.
                                <br />
                                <em className="font-medium not-italic text-[#f4c957]">Feel at home.</em>
                            </h1>
                            <p className="max-w-[550px] text-[17px] leading-[1.7] text-[#d0d9e6] max-[650px]:text-[15px] max-[650px]:text-[#d7dfeb] max-[420px]:text-sm max-[420px]:leading-[1.6]">
                                Reliable local rides in Bengaluru and thoughtfully managed
                                journeys across India—all backed by a fleet you can trust.
                            </p>
                            <div className="mt-8 flex items-center gap-[25px] max-[650px]:gap-[15px] max-[360px]:gap-[10px]">
                                <div className="flex flex-col"><b className="font-[Manrope] text-[21px] font-extrabold text-white">10K+</b>
                                    <span className="flex items-center gap-1 text-[10px] text-[#bac6d7] max-[650px]:text-[#c4cfdd]">Vehicles</span>
                                </div>
                                <i className="h-[34px] w-px bg-white/30"></i>
                                <div className="flex flex-col"><b className="font-[Manrope] text-[21px] font-extrabold text-white">500+</b>
                                    <span className="flex items-center gap-1 text-[10px] text-[#bac6d7] max-[650px]:text-[#c4cfdd]">Indian cities</span>
                                </div>
                                <i className="h-[34px] w-px bg-white/30"></i>
                                <div className="flex flex-col"><b className="font-[Manrope] text-[21px] font-extrabold text-white">4.9</b>
                                    <span className="flex items-center gap-1 text-[10px] text-[#bac6d7] max-[650px]:text-[#c4cfdd]">
                                        <Star className="w-[11px] text-[#e7aa08]" fill="currentColor" />
                                        Guest rating
                                    </span>
                                </div>
                            </div>
                            <div className="mt-[35px] flex items-center max-[650px]:hidden">
                                <div className="flex [&_i]:-ml-[7px] [&_i]:grid [&_i]:h-[34px] [&_i]:w-[34px] [&_i]:place-items-center [&_i]:rounded-full [&_i]:border-2 [&_i]:border-[#1a3158] [&_i]:bg-[#dce6f3] [&_i]:font-[Manrope] [&_i]:text-[9px] [&_i]:font-bold [&_i]:text-[var(--navy)] [&_i]:[text-shadow:none] [&_i:first-child]:ml-0">
                                    <i>AK</i><i>RM</i><i>SP</i>
                                </div>
                                <p className="m-0 ml-3 flex flex-col text-[11px]">
                                    <b>25,000+ happy travellers</b>
                                    <span className="text-[#aebbd0]">moving with RJS every year</span>
                                </p>
                            </div>
                        </div>
                        <div className="absolute top-0 bottom-0 left-1/2 z-[1] w-[78vw] -translate-x-[50vw] overflow-hidden [mask-image:linear-gradient(90deg,#000_0%,#000_48%,rgba(0,0,0,.94)_58%,rgba(0,0,0,.65)_72%,rgba(0,0,0,.18)_88%,transparent_100%)] after:absolute after:-inset-0.5 after:bg-[linear-gradient(90deg,rgba(2,13,35,.9)_0%,rgba(3,18,43,.77)_35%,rgba(5,24,52,.44)_58%,rgba(11,34,63,.12)_78%,transparent_100%)] after:content-[''] max-[1000px]:w-[82vw] max-[780px]:right-1/2 max-[780px]:bottom-auto max-[780px]:h-[590px] max-[780px]:w-screen max-[780px]:[mask-image:linear-gradient(180deg,#000_0%,#000_58%,rgba(0,0,0,.8)_73%,rgba(0,0,0,.28)_90%,transparent_100%)] max-[780px]:after:bg-[linear-gradient(90deg,rgba(2,13,35,.9),rgba(3,18,43,.36))] max-[650px]:top-auto max-[650px]:bottom-0 max-[650px]:h-[500px] max-[420px]:h-[465px]">
                            <img
                                src="/assets/rjs-fleet-hero.png"
                                className="h-full w-full scale-[1.015] object-cover object-center [filter:saturate(.88)_contrast(1.03)]"
                                alt="RJS fleet on the road"
                            />
                            <div className="hidden">
                                <span>
                                    <i></i>LIVE FLEET
                                </span>
                                <b>2,418 vehicles</b>
                                <small>ready near Bengaluru</small>
                            </div>
                            <div className="hidden">
                                <MapPin />
                                <div>
                                    <small>NOW SERVING</small>
                                    <b>Bengaluru → All India</b>
                                </div>
                            </div>
                        </div>
                        <Booking
                            initialSearch={location.state?.search}
                            onSearch={(data) =>
                                navigate("/available-vehicles", { state: { search: data } })
                            }
                        />
                    </div>
                </section>

                {livePackages.length > 0 && <section className="overflow-hidden bg-[#f7f8fa] py-[95px] max-[650px]:py-[65px]">
                    <div className="mx-auto mb-8 flex w-[min(1200px,calc(100%-48px))] items-end justify-between max-[650px]:w-[min(1200px,calc(100%-28px))] max-[650px]:items-start">
                        <div>
                            <span className="text-[9px] font-extrabold tracking-[1.5px] text-[#a4770d]">CURATED JOURNEYS</span>
                            <h2 className="mt-[9px] mb-[5px] font-[Manrope] text-[42px] leading-[1.1] font-bold tracking-[-2px] text-[var(--navy)] max-[900px]:text-4xl max-[650px]:text-[32px]">Popular packages</h2>
                            <p className="m-0 text-xs text-[#737e8d] max-[650px]:max-w-[220px] max-[650px]:leading-[1.5]">Ready-made escapes from Bengaluru, planned end to end.</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                className="ml-1.5 flex h-10 items-center gap-[9px] border-0 bg-[var(--navy)] px-[15px] text-[10px] font-extrabold text-white [&_svg]:w-4 max-[650px]:ml-0 max-[650px]:grid max-[650px]:w-10 max-[650px]:place-items-center max-[650px]:p-0 max-[650px]:text-[0px] max-[650px]:[&_svg]:w-[17px]"
                                onClick={() => navigate("/packages")}
                            >
                                <span className="max-[650px]:hidden">View all packages</span><ArrowRight />
                            </button>
                        </div>
                    </div>
                    <div className="relative mx-auto w-full">
                        <button
                            className="absolute top-1/2 left-[max(12px,calc((100vw-1200px)/2-54px))] z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-[#d9dee5] bg-white text-[var(--navy)] shadow-lg hover:bg-[var(--navy)] hover:text-white max-[650px]:hidden [&_svg]:w-[18px]"
                            aria-label="Previous packages"
                            onClick={() =>
                                packageTrack.current?.scrollBy({
                                left: -330,
                                behavior: "smooth",
                                })
                            }
                        >
                            <ChevronLeft />
                        </button>
                        <div className="mx-auto w-[min(1200px,calc(100%-48px))] overflow-hidden max-[650px]:w-[calc(100%-28px)]">
                            <div className="flex snap-x gap-4 overflow-x-auto px-px pt-1 pb-5 scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" ref={packageTrack}>
                                {livePackages.map((pkg, index) => (
                                    <article
                                        className="group min-w-[255px] flex-[0_0_calc((100%-48px)/4)] cursor-pointer snap-start border border-[#e1e5ea] bg-white transition duration-300 hover:-translate-y-[7px] hover:border-[#c9971f] hover:shadow-[0_20px_45px_rgba(8,28,59,.12)] max-[900px]:flex-[0_0_calc((100%-16px)/2)] max-[650px]:min-w-[260px] max-[650px]:flex-[0_0_84%]"
                                        key={pkg._id}
                                        onClick={() => navigate(`/packages/${pkg.slug}`)}
                                    >
                                        <div className="relative h-[225px] overflow-hidden after:absolute after:inset-0 after:bg-[linear-gradient(180deg,transparent_55%,rgba(3,14,34,.55))] after:content-[''] max-[650px]:h-[215px]">
                                            <img className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.055]" src={packageImageUrl(pkg.coverImageUrl)} alt={pkg.title} />
                                            <span className="absolute top-3 left-3 z-[2] bg-[var(--gold)] px-[7px] py-[5px] text-[7px] font-black tracking-[.7px] text-[var(--navy)]">{pkg.badge}</span>
                                            <i className="absolute right-3 bottom-[10px] z-[2] text-[10px] not-italic text-white">0{index + 1}</i>
                                        </div>
                                        <div className="p-[17px]">
                                            <small className="text-[8px] font-extrabold tracking-[1px] text-[#a4770d]">FROM {pkg.originCity.toUpperCase()}</small>
                                            <h3 className="my-[5px] font-[Manrope] text-lg font-bold text-[var(--navy)]">{pkg.title}</h3>
                                            <p className="m-0 flex items-center gap-1.5 text-[10px] text-[#76808e]">
                                                <CalendarDays className="w-[13px]" />
                                                {pkg.durationLabel}
                                            </p>
                                            <div className="mt-[15px] flex items-end justify-between border-t border-[#e4e7eb] pt-[13px]">
                                                <span className="flex flex-col text-[7px] text-[#8a93a0]">
                                                PACKAGE <b className="font-[Manrope] text-base font-extrabold text-[var(--navy)]">{formatPackagePrice(pkg.price)}</b>
                                                </span>
                                                <button className="grid h-[33px] w-[33px] place-items-center rounded-full border-0 bg-[var(--navy)] text-white" aria-label={`View ${pkg.title}`}>
                                                <ArrowRight className="w-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        </div>
                        <button
                            className="absolute top-1/2 right-[max(12px,calc((100vw-1200px)/2-54px))] z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-[#d9dee5] bg-white text-[var(--navy)] shadow-lg hover:bg-[var(--navy)] hover:text-white max-[650px]:hidden [&_svg]:w-[18px]"
                            aria-label="Next packages"
                            onClick={() =>
                                packageTrack.current?.scrollBy({
                                left: 330,
                                behavior: "smooth",
                                })
                            }
                        >
                            <ChevronRight />
                        </button>
                    </div>
                </section>}

                <section className="bg-[var(--navy)] py-[110px] text-white max-[650px]:py-[70px]" id="about">
                    <div className="mx-auto grid w-[min(1200px,calc(100%-48px))] grid-cols-[1.08fr_.92fr] items-center gap-[85px] max-[1000px]:grid-cols-1 max-[1000px]:gap-[45px] max-[650px]:w-[min(1200px,calc(100%-28px))]">
                        <div className="group relative mx-auto aspect-square w-full max-w-[500px] overflow-hidden bg-[#061a3a] max-[1000px]:order-2">
                            <img className="h-full w-full object-contain transition-transform duration-700 ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-[1.015]" src="/assets/india-travel-network.png" alt="RJS travel network connecting Bengaluru with destinations across India" />
                            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_64%,rgba(3,15,35,.42))]"></div>
                            <span className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full border border-white/15 bg-[#06172f]/75 px-3 py-2 text-[9px] font-bold text-white backdrop-blur-md">
                                <i className="h-2 w-2 animate-pulse rounded-full bg-[var(--gold)] shadow-[0_0_0_5px_rgba(238,178,27,.15)]"></i>
                                Connected across India
                            </span>
                        </div>
                        <div>
                            <span className="text-[9px] font-extrabold tracking-[1.6px] text-[#a4770d]">THE RJS STANDARD</span>
                            <h2 className="mt-[11px] mb-0 font-[Manrope] text-[46px] leading-[1.1] font-bold tracking-[-2px] text-white max-[650px]:text-[34px]">
                                More than a ride.
                                <br />A journey managed well.
                            </h2>
                            <p className="text-[13px] leading-[1.75] text-[#aebbd0]">
                                Every RJS trip is supported by verified professionals, inspected
                                vehicles and a real operations team that stays with you from
                                pickup to arrival.
                            </p>
                            <div className="my-[30px] [&>div]:flex [&>div]:gap-[13px] [&>div]:border-t [&>div]:border-white/10 [&>div]:py-4 [&_svg]:w-5 [&_svg]:text-[var(--gold)]">
                                <div><ShieldCheck /><p className="m-0 flex flex-col">
                                        <b className="text-xs">Safety checked</b><span className="mt-[3px] text-[10px] text-[#9eabc0]">
                                        Verified drivers and routinely inspected vehicles.
                                        </span>
                                    </p>
                                </div>
                                <div><Headphones /><p className="m-0 flex flex-col">
                                        <b className="text-xs">Human support, 24/7</b><span className="mt-[3px] text-[10px] text-[#9eabc0]">
                                        Talk to a real travel coordinator whenever needed.
                                        </span>
                                    </p>
                                </div>
                                <div><BadgeCheck /><p className="m-0 flex flex-col">
                                        <b className="text-xs">Clear, confirmed pricing</b><span className="mt-[3px] text-[10px] text-[#9eabc0]">
                                        Know the complete fare before your journey begins.
                                        </span>
                                    </p>
                                </div>
                            </div>
                            <a className="inline-flex items-center gap-3 bg-[var(--gold)] px-[17px] py-[13px] text-xs font-bold text-[var(--navy)]" href="#book">
                                Experience RJS <ArrowRight className="w-4" />
                            </a>
                        </div>
                    </div>
                </section>

                <section className="bg-[var(--cream)] py-[95px] max-[650px]:py-[70px]" id="corporate">
                    <div className="mx-auto grid w-[min(1200px,calc(100%-48px))] grid-cols-2 items-center gap-[100px] max-[900px]:grid-cols-1 max-[900px]:gap-[45px] max-[650px]:w-[min(1200px,calc(100%-28px))]">
                        <div>
                            <span className="text-[9px] font-extrabold tracking-[1.6px] text-[#a4770d]">RJS FOR BUSINESS</span>
                            <h2 className="mt-[11px] mb-0 font-[Manrope] text-[42px] leading-[1.1] font-bold tracking-[-2px] text-[var(--navy)] max-[650px]:text-[34px]">
                                Your people.
                                <br />
                                Our responsibility.
                            </h2>
                            <p className="max-w-[480px] text-[13px] leading-[1.7] text-[var(--muted)]">
                                Reliable employee transport, event mobility and long-term fleet
                                solutions with one dedicated account team.
                            </p>
                            <a className="mt-[15px] inline-flex items-center gap-3 bg-[var(--navy)] px-[17px] py-[13px] text-xs font-bold text-white" href="tel:+918971190666">
                                Talk to our corporate desk <ArrowRight className="w-4" />
                            </a>
                        </div>
                        <div className="grid grid-cols-2 border border-[#dcd8cc] [&>div]:flex [&>div]:flex-col [&>div]:border-r [&>div]:border-b [&>div]:border-[#dcd8cc] [&>div]:p-[30px] [&>div:nth-child(2n)]:border-r-0 [&>div:nth-child(n+3)]:border-b-0 max-[650px]:[&>div]:p-5 [&_b]:font-[Manrope] [&_b]:text-[25px] [&_b]:font-bold [&_b]:text-[var(--navy)] [&_span]:text-[10px] [&_span]:text-[#747d89]">
                            <div>
                                <b>98.7%</b>
                                <span>On-time arrivals</span>
                            </div>
                            <div>
                                <b>24 × 7</b>
                                <span>Operations team</span>
                            </div>
                            <div>
                                <b>100%</b>
                                <span>Verified drivers</span>
                            </div>
                            <div>
                                <b>1 desk</b>
                                <span>For every request</span>
                            </div>
                        </div>
                    </div>
                </section>
                <section className="bg-white py-[90px] max-[650px]:py-[65px]" id="download">
                    <div className="mx-auto grid w-[min(1100px,calc(100%-32px))] grid-cols-[1fr_auto] items-center gap-10 overflow-hidden rounded-[28px] bg-[linear-gradient(135deg,#061a3a,#0d3265)] px-12 py-11 text-white shadow-[0_25px_65px_rgba(4,22,52,.2)] max-[720px]:grid-cols-1 max-[720px]:px-7">
                        <div><small className="font-extrabold tracking-[1.5px] text-[#f2c75b]">THE COMPLETE RJS EXPERIENCE</small><h2 className="mt-3 font-[Manrope] text-4xl font-bold tracking-[-1.5px] max-[650px]:text-3xl">Track, pay and manage rides in the app.</h2><p className="mt-3 max-w-[620px] text-xs leading-6 text-[#bac6d7]">Book on the web, then use the RJS customer app for live driver tracking, secure payments, wallet, cancellation, notifications and ratings.</p></div>
                        <a href={import.meta.env.VITE_CUSTOMER_APP_URL || 'https://wa.me/918971190666?text=Please%20send%20me%20the%20RJS%20customer%20app%20download%20link'} target="_blank" rel="noreferrer" className="flex min-w-48 items-center justify-center gap-2 rounded-xl bg-[var(--gold)] px-6 py-4 text-xs font-extrabold text-[var(--navy)]"><Smartphone className="w-5" /> Get customer app <ArrowRight className="w-4" /></a>
                    </div>
                </section>
            </main>

            <Footer />
        </>
    );
}
export default Home;

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import { ArrowRight, BadgeCheck, BusFront, CalendarDays, CarFront, Check, ChevronDown, Clock3, Headphones, MapPin, Menu, Navigation, Phone, Route, ShieldCheck, SlidersHorizontal, Star, Users, Van, X, Mail, LockKeyhole, UserRound, Eye, Smartphone, ArrowLeft, Snowflake,} from "lucide-react";

const searchVehicles = [
    {
        type: "car",
        name: "Maruti Dzire",
        category: "Sedan",
        seats: 4,
        bags: 2,
        price: "₹4,850",
        rate: "₹12/km",
        rating: "4.8",
        trips: "1,240",
        image:
        "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=700&q=85",
        tags: ["AC", "Verified driver", "Free cancellation"],
    },
    {
        type: "car",
        name: "Toyota Innova Crysta",
        category: "Premium SUV",
        seats: 6,
        bags: 4,
        price: "₹7,400",
        rate: "₹17/km",
        rating: "4.9",
        trips: "980",
        image:
        "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=700&q=85",
        tags: ["AC", "Extra luggage", "Top rated"],
    },
    {
        type: "car",
        name: "Maruti Dzire",
        category: "Sedan",
        seats: 4,
        bags: 2,
        price: "₹4,850",
        rate: "₹12/km",
        rating: "4.8",
        trips: "1,240",
        image:
        "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=700&q=85",
        tags: ["AC", "Verified driver", "Free cancellation"],
    },
    {
        type: "car",
        name: "Toyota Innova Crysta",
        category: "Premium SUV",
        seats: 6,
        bags: 4,
        price: "₹7,400",
        rate: "₹17/km",
        rating: "4.9",
        trips: "980",
        image:
        "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=700&q=85",
        tags: ["AC", "Extra luggage", "Top rated"],
    },
    {
        type: "car",
        name: "Maruti Dzire",
        category: "Sedan",
        seats: 4,
        bags: 2,
        price: "₹4,850",
        rate: "₹12/km",
        rating: "4.8",
        trips: "1,240",
        image:
        "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=700&q=85",
        tags: ["AC", "Verified driver", "Free cancellation"],
    },
    {
        type: "car",
        name: "Toyota Innova Crysta",
        category: "Premium SUV",
        seats: 6,
        bags: 4,
        price: "₹7,400",
        rate: "₹17/km",
        rating: "4.9",
        trips: "980",
        image:
        "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=700&q=85",
        tags: ["AC", "Extra luggage", "Top rated"],
    },
    {
        type: "car",
        name: "Maruti Dzire",
        category: "Sedan",
        seats: 4,
        bags: 2,
        price: "₹4,850",
        rate: "₹12/km",
        rating: "4.8",
        trips: "1,240",
        image:
        "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=700&q=85",
        tags: ["AC", "Verified driver", "Free cancellation"],
    },
    {
        type: "car",
        name: "Toyota Innova Crysta",
        category: "Premium SUV",
        seats: 6,
        bags: 4,
        price: "₹7,400",
        rate: "₹17/km",
        rating: "4.9",
        trips: "980",
        image:
        "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=700&q=85",
        tags: ["AC", "Extra luggage", "Top rated"],
    },
    {
        type: "tt",
        name: "Force Traveller",
        category: "Tempo Traveller",
        seats: 12,
        bags: 8,
        price: "₹12,800",
        rate: "₹25/km",
        rating: "4.7",
        trips: "615",
        image:
        "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=700&q=85",
        tags: ["Pushback seats", "Music system", "Group friendly"],
    },
    {
        type: "bus",
        name: "Volvo Multi-Axle",
        category: "Luxury Bus",
        seats: 45,
        bags: 30,
        price: "₹28,500",
        rate: "₹48/km",
        rating: "4.8",
        trips: "430",
        image:
        "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=700&q=85",
        tags: ["AC", "Recliner seats", "Large luggage bay"],
    },
];

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

const routes = [
    {
        place: "Coorg",
        detail: "Nature escape",
        from: "₹4,800",
        image:
        "https://images.unsplash.com/photo-1593693411515-c20261bcad6e?auto=format&fit=crop&w=900&q=85",
    },
    {
        place: "Ooty",
        detail: "Hills & heritage",
        from: "₹6,200",
        image:
        "https://images.unsplash.com/photo-1589136777351-fdc9c9cab193?auto=format&fit=crop&w=900&q=85",
    },
    {
        place: "Goa",
        detail: "Coastal getaway",
        from: "₹8,900",
        image:
        "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=900&q=85",
    },
];

function TripDetails({ vehicle, onBack }) {
    const navigate = useNavigate();
    const v = vehicle || searchVehicles[0];
    const [passengers, setPassengers] = useState(Math.min(2, v.seats));
    const [saved, setSaved] = useState(null);
    const [redirectSeconds, setRedirectSeconds] = useState(30);
    const submissionAction = useRef("payment");
    const tripFormRef = useRef(null);
    const submit = (e) => {
        e.preventDefault();
        setSaved(submissionAction.current);
        submissionAction.current = "payment";
    };
    const contactSupport = () => {
        const form = tripFormRef.current;
        if (!form) return;
        const requiredFields = [...form.querySelectorAll("input[required], textarea[required]")];
        const firstMissing = requiredFields.find((field) => !field.value.trim());
        if (firstMissing) {
            setSaved("validation");
            firstMissing.focus();
            firstMissing.scrollIntoView({ behavior: "smooth", block: "center" });
            firstMissing.setCustomValidity("Please fill out this field.");
            firstMissing.reportValidity();
            firstMissing.setCustomValidity("");
            return;
        }
        setSaved("contact");
    };
    useEffect(() => {
        if (saved !== "contact") return;
        setRedirectSeconds(30);
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        const countdown = window.setInterval(() => setRedirectSeconds((seconds) => Math.max(0, seconds - 1)), 1000);
        const redirect = window.setTimeout(() => navigate("/", { replace: true }), 30000);
        return () => {
            document.body.style.overflow = previousOverflow;
            window.clearInterval(countdown);
            window.clearTimeout(redirect);
        };
    }, [saved, navigate]);
    return (
        <>
            <Navbar />
            <main className="min-h-screen bg-[#f6f7f9]">
                <div className="flex min-h-[62px] w-full items-center gap-2 bg-[var(--navy)] px-[max(24px,calc((100%-1200px)/2))] py-3 text-[9px] text-[#91a0b8] max-[650px]:px-3.5">
                    <button className="mr-2 flex items-center gap-1.5 border-0 bg-transparent p-0 text-[10px] font-bold text-white" onClick={onBack}>
                        <ArrowLeft className="w-3.5" />
                        Back to vehicle
                    </button>
                    <span>Booking</span>
                    <i>/</i>
                    <b className="text-white">Booking &amp; Payment</b>
                </div>
                <section className="border-b border-[var(--line)] bg-white">
                    <div className="mx-auto flex min-h-[66px] w-[min(1200px,calc(100%-48px))] items-center justify-center gap-[10px] max-[650px]:min-h-[58px] max-[650px]:w-[min(1200px,calc(100%-28px))] max-[650px]:gap-1 [&>b]:h-px [&>b]:w-[58px] [&>b]:bg-[var(--gold)] max-[650px]:[&>b]:w-[16px] [&>span]:flex [&>span]:items-center [&>span]:gap-[7px] [&>span]:text-[11px] [&>span]:font-bold [&>span]:whitespace-nowrap [&>span]:text-[var(--navy)] max-[650px]:[&>span]:gap-1 max-[650px]:[&>span]:text-[9px] [&>span>i]:grid [&>span>i]:h-6 [&>span>i]:w-6 [&>span>i]:shrink-0 [&>span>i]:place-items-center [&>span>i]:rounded-full [&>span>i]:bg-[var(--gold)] [&>span>i]:not-italic max-[650px]:[&>span>i]:h-5 max-[650px]:[&>span>i]:w-5 [&_svg]:w-3">
                        <span><i><Check /></i>Choose vehicle</span><b></b>
                        <span><i><Check /></i>Vehicle details</span><b></b>
                        <span><i>3</i>Booking &amp; Payment</span>
                    </div>
                </section>
                <section className="mx-auto grid w-[min(1200px,calc(100%-48px))] grid-cols-[1fr_320px] gap-7 pb-[70px] max-[850px]:grid-cols-1 max-[650px]:w-[min(1200px,calc(100%-28px))]">
                    <form className="flex flex-col gap-4" ref={tripFormRef} onSubmit={submit}>
                        <div className="mt-2 mb-[25px]">
                            <span className="text-[10px] font-extrabold tracking-[1.4px] text-[#9b7210]">PAYMENT OR INQUIRY</span>
                            <h1 className="my-[7px] font-[Manrope] text-[34px] font-bold tracking-[-1.4px] text-[var(--navy)] max-[600px]:text-[28px]">Complete your booking</h1>
                            <p className="m-0 text-xs text-[#747f8e]">
                                We'll use these details to coordinate your pickup and keep you
                                updated.
                            </p>
                        </div>
                        <article className="border border-[var(--line)] bg-white p-[25px] max-[600px]:p-[18px]">
                            <div className="mb-[22px] flex gap-3">
                                <i className="grid h-[27px] w-[27px] place-items-center rounded-full bg-[#fff3cf] text-[9px] font-extrabold not-italic text-[#97700f]">01</i>
                                <div>
                                    <h2 className="m-0 font-[Manrope] text-lg font-bold text-[var(--navy)]">Contact details</h2>
                                    <p className="mt-1 mb-0 text-[10px] text-[#808a98] max-[600px]:leading-[1.5]">
                                        Booking confirmation and driver updates will be sent here.
                                    </p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3.5 max-[600px]:grid-cols-1 [&_label>span]:mb-[7px] [&_label>span]:block [&_label>span]:text-[9px] [&_label>span]:font-extrabold [&_label>span]:tracking-[.8px] [&_label>span]:text-[#667183] [&_label>div]:flex [&_label>div]:min-h-12 [&_label>div]:items-center [&_label>div]:gap-[9px] [&_label>div]:rounded-lg [&_label>div]:border [&_label>div]:border-[var(--line)] [&_label>div]:px-3 [&_label>div:focus-within]:border-[#b78611] [&_label>div:focus-within]:shadow-[0_0_0_3px_rgba(238,178,27,.12)] [&_svg]:w-4 [&_svg]:text-[#8b95a4] [&_input]:w-full [&_input]:border-0 [&_input]:bg-transparent [&_input]:text-[11px] [&_input]:outline-none">
                                <label>
                                    <span>FULL NAME</span>
                                    <div>
                                        <UserRound />
                                        <input required placeholder="Enter traveller's full name" />
                                    </div>
                                </label>
                                <label>
                                    <span>MOBILE NUMBER</span>
                                    <div>
                                        <Phone />
                                        <input required type="tel" placeholder="+91 98765 43210" />
                                    </div>
                                </label>
                                <label className="col-span-2 max-[600px]:col-auto">
                                    <span>EMAIL ADDRESS</span>
                                    <div>
                                        <Mail />
                                        <input
                                            required
                                            type="email"
                                            placeholder="you@example.com"
                                        />
                                    </div>
                                </label>
                            </div>
                        </article>
                        <article className="border border-[var(--line)] bg-white p-[25px] max-[600px]:p-[18px]">
                            <div className="mb-[22px] flex gap-3">
                                <i className="grid h-[27px] w-[27px] place-items-center rounded-full bg-[#fff3cf] text-[9px] font-extrabold not-italic text-[#97700f]">02</i>
                                <div>
                                    <h2 className="m-0 font-[Manrope] text-lg font-bold text-[var(--navy)]">Pickup and drop</h2>
                                    <p className="mt-1 mb-0 text-[10px] text-[#808a98] max-[600px]:leading-[1.5]">
                                        Add exact addresses so your driver reaches the right spot.
                                    </p>
                                </div>
                            </div>
                            <div className="grid grid-cols-[1fr_28px_1fr] items-center max-[600px]:block [&_label>span]:mb-[7px] [&_label>span]:block [&_label>span]:text-[9px] [&_label>span]:font-extrabold [&_label>span]:tracking-[.8px] [&_label>span]:text-[#667183] [&_label>div]:flex [&_label>div]:min-h-12 [&_label>div]:items-start [&_label>div]:gap-[9px] [&_label>div]:rounded-lg [&_label>div]:border [&_label>div]:border-[var(--line)] [&_label>div]:px-3 [&_label>div]:pt-[10px] [&_label>div:focus-within]:border-[#b78611] [&_label>div:focus-within]:shadow-[0_0_0_3px_rgba(238,178,27,.12)] [&_svg]:w-4 [&_svg]:text-[#8b95a4] [&_textarea]:w-full [&_textarea]:resize-none [&_textarea]:border-0 [&_textarea]:bg-transparent [&_textarea]:text-[11px] [&_textarea]:outline-none">
                                <label><span>PICKUP ADDRESS</span><div><MapPin />
                                        <textarea
                                            required
                                            rows="2"
                                            placeholder="House, street, landmark, Bengaluru"
                                        ></textarea>
                                    </div>
                                </label>
                                <em className="h-px bg-[repeating-linear-gradient(90deg,#bba56f_0_4px,transparent_4px_8px)] max-[600px]:ml-5 max-[600px]:block max-[600px]:h-4 max-[600px]:w-px max-[600px]:border-l max-[600px]:border-dashed max-[600px]:border-[#bba56f]"></em>
                                <label>
                                    <span>DESTINATION ADDRESS</span>
                                    <div>
                                        <Navigation />
                                        <textarea
                                            required
                                            rows="2"
                                            placeholder="Hotel, resort or landmark in Coorg"
                                        ></textarea>
                                    </div>
                                </label>
                            </div>
                            <button type="button" className="border-0 bg-transparent px-0 pt-[13px] text-[10px] font-bold text-[#8e6809]">
                                + Add a stop along the way
                            </button>
                        </article>
                        <article className="border border-[var(--line)] bg-white p-[25px] max-[600px]:p-[18px]">
                            <div className="mb-[22px] flex gap-3">
                                <i className="grid h-[27px] w-[27px] place-items-center rounded-full bg-[#fff3cf] text-[9px] font-extrabold not-italic text-[#97700f]">03</i>
                                <div>
                                    <h2 className="m-0 font-[Manrope] text-lg font-bold text-[var(--navy)]">Passengers and preferences</h2>
                                    <p className="mt-1 mb-0 text-[10px] text-[#808a98] max-[600px]:leading-[1.5]">Help us prepare the vehicle for your group.</p>
                                </div>
                            </div>
                            <div className="flex items-center justify-between bg-[#f7f8fa] p-3.5 max-[600px]:items-start max-[600px]:gap-3">
                                <div className="flex items-center gap-[10px]">
                                    <Users className="w-[19px] text-[#98700e]" />
                                    <span className="flex flex-col"><b className="text-[11px]">Number of passengers</b>
                                        <small className="mt-0.5 text-[9px] text-[#838d9a]">Maximum {v.seats} for this vehicle</small>
                                    </span>
                                </div>
                                <div className="flex items-center gap-3.5 [&_button]:h-[30px] [&_button]:w-[30px] [&_button]:rounded-full [&_button]:border [&_button]:border-[#d6dbe2] [&_button]:bg-white [&_button]:text-[17px] [&_button]:text-[var(--navy)] [&>b]:min-w-[15px] [&>b]:text-center">
                                    <button
                                        type="button"
                                        onClick={() => setPassengers(Math.max(1, passengers - 1))}
                                    >
                                        -
                                    </button>
                                    <b>{passengers}</b>
                                    <button
                                        type="button"
                                        onClick={() =>
                                        setPassengers(Math.min(v.seats, passengers + 1))
                                        }
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                            <label className="mt-4 block">
                                <span className="mb-[7px] block text-[9px] font-extrabold tracking-[.8px] text-[#667183]">
                                    SPECIAL REQUESTS <small className="ml-1 text-[8px] text-[#a0a7b1]">OPTIONAL</small>
                                </span>
                                <textarea className="w-full resize-none rounded-lg border border-[var(--line)] bg-transparent p-3 text-[11px] outline-none focus:border-[#b78611] focus:shadow-[0_0_0_3px_rgba(238,178,27,.12)]"
                                    rows="3"
                                    placeholder="Child seat, extra luggage, elderly passenger assistance..."
                                ></textarea>
                            </label>
                        </article>
                        <article className="border border-[var(--line)] bg-white px-[22px] py-[17px]">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-[9px]">
                                    <BadgeCheck className="w-[18px] text-[#9a7210]" />
                                    <span className="flex flex-col"><b className="text-[11px]">Need a GST invoice?</b>
                                        <small className="text-[9px] text-[#858e9b]">Add company details after booking confirmation.</small>
                                    </span>
                                </div>
                                <label><input className="peer absolute opacity-0" type="checkbox" />
                                    <i className="relative block h-[21px] w-[38px] rounded-[20px] bg-[#cbd1d9] after:absolute after:top-0.5 after:left-0.5 after:h-[17px] after:w-[17px] after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-[var(--navy)] peer-checked:after:left-[19px]"></i>
                                </label>
                            </div>
                        </article>
                        <div className="hidden grid-cols-2 gap-2 max-[850px]:grid">
                            <button className="flex h-12 items-center justify-center gap-2 border-0 bg-[var(--gold)] text-[11px] font-extrabold text-[var(--navy)] [&_svg]:w-[15px]" type="submit" onClick={()=>{submissionAction.current="payment"}}>
                                Pay Now <ArrowRight />
                            </button>
                            <button className="flex h-12 items-center justify-center gap-2 border border-[var(--navy)] bg-white text-[11px] font-extrabold text-[var(--navy)] hover:bg-[var(--navy)] hover:text-white [&_svg]:w-[15px]" type="button" onClick={contactSupport}>
                                <Phone />Contact Us
                            </button>
                        </div>
                        {saved && saved !== "contact" && 
                            <div className={`mt-3 flex items-start gap-2 border p-[11px] text-[9px] leading-[1.5] ${saved==='validation'?'border-[#ead18b] bg-[#fff6df] text-[#795a0b]':'border-[#b9dfcf] bg-[#eaf7f1] text-[#236c52]'} max-[850px]:flex min-[851px]:hidden [&>svg]:w-4 [&>span]:flex [&>span]:flex-col [&_b]:text-[11px]`}>
                                <Check/>
                                <span>
                                    <b>
                                        {saved === "validation" ? "Complete the required details" : "Payment initiated"}
                                    </b>
                                    {saved === "validation" ? "Please complete the required fields before submitting your request." : "Your booking details have been submitted successfully."}
                                </span>
                            </div>
                        }
                    </form>
                    <aside className="sticky top-[102px] mt-[146px] self-start border border-[var(--line)] bg-white p-[18px] max-[850px]:static max-[850px]:mt-0">
                        <div className="flex gap-[11px] border-b border-[var(--line)] pb-[15px]">
                            <img className="h-[65px] w-[84px] object-cover" src={v.image} alt={v.name} />
                            <div className="flex flex-col">
                                <small className="text-[9px] text-[#99700e]">{v.category}</small>
                                <b className="my-[3px] text-[13px]">{v.name}</b>
                                <span className="flex items-center gap-1 text-[9px] text-[#76808e] [&_svg]:w-[11px] [&_svg]:text-[#dfa500]">
                                    <Users />
                                    {v.seats} seats · <Star fill="currentColor" />
                                    {v.rating}
                                </span>
                            </div>
                        </div>
                        <div className="px-[5px] py-[18px] [&>div]:flex [&>div]:gap-2 [&>div>i]:mt-[3px] [&>div>i]:h-2 [&>div>i]:w-2 [&>div>i]:rounded-full [&>div>i]:bg-[var(--gold)] [&>div>i]:shadow-[0_0_0_4px_#fff2c8] [&>div>span]:flex [&>div>span]:flex-col [&_small]:text-[8px] [&_small]:text-[#9a7210] [&_b]:my-0.5 [&_b]:text-[11px] [&_p]:m-0 [&_p]:text-[9px] [&_p]:text-[#808a98]">
                            <div>
                                <i></i>
                                <span>
                                    <small>PICKUP</small>
                                    <b>Bengaluru</b>
                                    <p>08 Aug · 09:30 AM</p>
                                </span>
                            </div>
                            <span aria-hidden="true" className="my-[3px] ml-1 block h-[22px] w-px bg-[repeating-linear-gradient(to_bottom,#b8c0cb_0_3px,transparent_3px_6px)]"></span>
                            <div>
                                <i></i>
                                <span>
                                    <small>DESTINATION</small>
                                    <b>Coorg</b>
                                    <p>Round trip · 2 days</p>
                                </span>
                            </div>
                        </div>
                        <div className="grid grid-cols-[1fr_auto] border-t border-[var(--line)] py-[15px]">
                            <span className="text-[10px] font-bold">Total fare</span>
                            <b className="font-[Manrope] text-xl font-extrabold text-[var(--navy)]">{v.price}</b>
                            <small className="text-[8px] text-[#2c8061]">Taxes included</small>
                        </div>
                        <div className="grid grid-cols-2 gap-2 max-[850px]:hidden [&_button]:flex [&_button]:h-12 [&_button]:items-center [&_button]:justify-center [&_button]:gap-2 [&_button]:text-[11px] [&_button]:font-extrabold [&_button>svg]:w-[15px]">
                            <button className="border-0 bg-[var(--gold)] text-[var(--navy)]" onClick={() => {submissionAction.current="payment";tripFormRef.current?.requestSubmit()}}>
                                Pay Now <ArrowRight />
                            </button>
                            <button className="border border-[var(--navy)] bg-white text-[var(--navy)] hover:bg-[var(--navy)] hover:text-white" type="button" onClick={contactSupport}>
                                <Phone />Contact Us
                            </button>
                        </div>
                        {saved && saved !== "contact" && 
                            <div className={`mt-3 flex items-start gap-2 border p-[11px] text-[9px] leading-[1.5] ${saved==='validation'?'border-[#ead18b] bg-[#fff6df] text-[#795a0b]':'border-[#b9dfcf] bg-[#eaf7f1] text-[#236c52]'} max-[850px]:hidden [&>svg]:w-4 [&>span]:flex [&>span]:flex-col [&_b]:text-[11px]`}>
                                <Check/>
                                <span>
                                    <b>
                                        {saved === "validation" ? "Complete the required details" : "Payment initiated"}
                                    </b>
                                    {saved === "validation" ? "Please complete the required fields before submitting your request." : "Your booking details have been submitted successfully."}
                                </span>
                            </div>
                        }
                        <p className="flex items-center justify-center gap-[5px] text-[8px] text-[#7b8593]">
                            <ShieldCheck className="w-3 text-[#2d8061]" />
                            Your details are encrypted and secure.
                        </p>
                    </aside>
                </section>
            </main>
            <Footer />
            {saved === "contact" && createPortal(
                <div className="fixed inset-0 z-[1000] grid place-items-center bg-[rgba(3,13,32,.72)] p-5 backdrop-blur-[7px]" role="dialog" aria-modal="true" aria-labelledby="contact-success-title">
                    <div className="w-[min(460px,100%)] bg-white p-[38px] text-center shadow-[0_28px_80px_rgba(2,12,30,.35)] max-[520px]:px-[22px] max-[520px]:py-[30px]">
                        <div className="mx-auto mb-[18px] grid h-[58px] w-[58px] place-items-center rounded-full bg-[#e8f7f0] text-[#26785a] shadow-[0_0_0_9px_#f3fbf7]">
                            <Check className="w-[27px]"/>
                        </div>
                        <span className="block text-[9px] font-black tracking-[1.5px] text-[#9a7210]">REQUEST RECEIVED</span>
                        <h2 className="my-3 mt-[9px] font-[Manrope] text-[27px] leading-[1.2] font-bold text-[var(--navy)] max-[520px]:text-[23px]" id="contact-success-title">
                            Thank you for choosing RJS.
                        </h2>
                        <p className="m-0 text-xs leading-[1.7] text-[#687486]">
                            Your trip details have been submitted successfully. Our customer support team will contact you shortly to assist with your booking.
                        </p>
                        <div className="mt-[22px] mb-4 flex items-center justify-center gap-2 bg-[#f5f7fa] p-3 text-[10px] text-[#687486]">
                            <Clock3 className="w-[15px] text-[#a4770d]"/>
                            <span>
                                Returning to the homepage in 
                                <b className="text-[var(--navy)]">{redirectSeconds} seconds</b>
                            </span>
                        </div>
                        <button className="flex h-[49px] w-full items-center justify-between border-0 bg-[var(--gold)] px-4 text-[11px] font-black text-[var(--navy)]" onClick={()=>navigate("/",{replace:true})}>
                            Go to Home <ArrowRight className="w-4"/>
                        </button>
                    </div>
                </div>, document.body
            )}
        </>
    );
}

function VehicleDetails({ vehicle, onBack, onContinue }) {
    const [expanded, setExpanded] = useState(false);
    const [galleryOpen, setGalleryOpen] = useState(false);
    const [mobileSummaryOpen, setMobileSummaryOpen] = useState(false);
    useEffect(() => {
        if (!galleryOpen) return;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        const closeOnEscape = (event) => event.key === "Escape" && setGalleryOpen(false);
        document.addEventListener("keydown", closeOnEscape);
        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener("keydown", closeOnEscape);
        };
    }, [galleryOpen]);
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
    const v = vehicle || searchVehicles[0];
    return (
        <>
            <Navbar />
            <main className="min-h-screen bg-[#f7f8fa] max-[650px]:pb-[82px]">
                <div className="flex min-h-[62px] w-full items-center gap-[9px] bg-[var(--navy)] px-[max(24px,calc((100%-1200px)/2))] py-3 text-[9px] text-[#91a0b8] max-[650px]:px-3.5 max-[650px]:[&>i]:hidden max-[650px]:[&>span]:hidden">
                    <button className="mr-3 flex items-center gap-1.5 border-0 bg-transparent font-bold text-white [&_svg]:w-3.5" onClick={onBack}>
                        <ArrowLeft />
                        Back to results
                    </button>
                    <span>Available Vehicles</span>
                    <i>/</i>
                    <b className="text-white">{v.name}</b>
                </div>
                <section className="border-b border-[var(--line)] bg-white">
                    <div className="mx-auto flex min-h-[66px] w-[min(1200px,calc(100%-48px))] items-center justify-center gap-[10px] max-[650px]:min-h-[58px] max-[650px]:w-[min(1200px,calc(100%-28px))] max-[650px]:gap-1 [&>b]:h-px [&>b]:w-[58px] max-[650px]:[&>b]:w-[16px] [&>span]:flex [&>span]:items-center [&>span]:gap-[7px] [&>span]:text-[11px] [&>span]:font-bold [&>span]:whitespace-nowrap max-[650px]:[&>span]:gap-1 max-[650px]:[&>span]:text-[9px] [&>span>i]:grid [&>span>i]:h-6 [&>span>i]:w-6 [&>span>i]:shrink-0 [&>span>i]:place-items-center [&>span>i]:rounded-full [&>span>i]:not-italic max-[650px]:[&>span>i]:h-5 max-[650px]:[&>span>i]:w-5 [&_svg]:w-3">
                        <span className="text-[var(--navy)] [&>i]:bg-[var(--gold)]"><i><Check /></i>Choose vehicle</span>
                        <b className="bg-[var(--gold)]"></b>
                        <span className="text-[var(--navy)] [&>i]:bg-[var(--gold)]"><i>2</i>Vehicle details</span>
                        <b className="bg-[#dfe3e8]"></b>
                        <span className="text-[#8b94a2] [&>i]:bg-[#edf0f4]"><i>3</i>Booking &amp; Payment</span>
                    </div>
                </section>
                <section className="mx-auto grid min-h-[390px] w-[min(1200px,calc(100%-48px))] grid-cols-[1.12fr_.88fr] border border-[var(--line)] bg-white max-[900px]:grid-cols-1 max-[650px]:w-[min(1200px,calc(100%-28px))]">
                    <div className="grid grid-cols-[1.5fr_.7fr] gap-[5px] p-[5px] max-[650px]:block [&_img]:h-full [&_img]:w-full [&_img]:object-cover">
                        <div className="relative min-h-[375px] max-[900px]:min-h-[330px] max-[650px]:min-h-[240px]">
                            <img src={v.image} alt={v.name} />
                            <span className="absolute bottom-3 left-3 bg-[rgba(5,19,43,.78)] px-2 py-1.5 text-[7px] text-white">Actual vehicle may vary</span>
                            <button className="absolute right-3 bottom-3 hidden items-center gap-2 rounded-lg border border-white/55 bg-[rgba(4,17,40,.78)] px-3 py-2 text-[9px] font-bold text-white backdrop-blur-sm max-[650px]:flex [&_svg]:w-[13px]" onClick={() => setGalleryOpen(true)}>
                                View all photos <ArrowRight />
                            </button>
                        </div>
                        <div className="grid grid-rows-2 gap-[5px] max-[650px]:hidden">
                            <img src={v.image} alt={`${v.name} side view`} />
                            <div className="relative overflow-hidden">
                                <img className="brightness-[.72]" src={v.image} alt={`${v.name} interior`} />
                                <button className="absolute right-3 bottom-3 left-3 flex items-center justify-between border border-white/55 bg-[rgba(4,17,40,.72)] p-[9px] text-[8px] text-white [&_svg]:w-[13px]" onClick={() => setGalleryOpen(true)}>
                                    View all photos <ArrowRight />
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="p-[42px] max-[900px]:p-7 max-[650px]:p-[22px]">
                        <span className="text-[8px] font-extrabold tracking-[1.2px] text-[#9b7110]">{v.category} · RJS ASSURED</span>
                        <h1 className="mt-[10px] mb-0.5 font-[Manrope] text-4xl font-bold tracking-[-1.5px] text-[var(--navy)] max-[650px]:text-[28px]">{v.name}</h1>
                        <p className="text-[9px] text-[#89929f]">or an equivalent vehicle in the same category</p>
                        <div className="my-5 flex items-center gap-1.5 [&_svg]:w-3.5 [&_svg]:text-[#e5a900]">
                            <Star fill="currentColor" />
                            <b className="text-[11px]">{v.rating}</b>
                            <span className="text-[8px] text-[#77818f]">{v.trips} verified trips</span>
                            <i className="mx-1.5 h-[18px] w-px bg-[var(--line)]"></i>
                            <BadgeCheck />
                            <span className="text-[8px] text-[#77818f]">Verified vehicle</span>
                        </div>
                        <div className="grid grid-cols-2 border-t border-l border-[var(--line)] [&>div]:flex [&>div]:items-center [&>div]:gap-[9px] [&>div]:border-r [&>div]:border-b [&>div]:border-[var(--line)] [&>div]:px-3 [&>div]:py-4 [&_svg]:w-[18px] [&_svg]:text-[#98700f] [&_span]:flex [&_span]:flex-col [&_span]:text-[8px] [&_span]:text-[#8992a0] [&_b]:text-[10px] [&_b]:text-[var(--navy)]">
                            <div>
                                <Users />
                                <span>
                                    <b>{v.seats}</b>Passengers
                                </span>
                            </div>
                            <div>
                                <Van />
                                <span>
                                    <b>{v.bags}</b>Large bags
                                </span>
                            </div>
                            <div>
                                <Snowflake />
                                <span>
                                    <b>AC</b>Climate control
                                </span>
                            </div>
                            <div>
                                <ShieldCheck />
                                <span>
                                    <b>Inspected</b>Before every trip
                                </span>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="fixed right-0 bottom-0 left-0 z-50 hidden items-center gap-2 border-t border-[var(--line)] bg-white/95 px-3.5 pt-[10px] pb-[max(10px,env(safe-area-inset-bottom))] shadow-[0_-12px_35px_rgba(7,26,61,.14)] backdrop-blur-xl max-[650px]:flex">
                    <div className="flex min-w-0 flex-1 flex-col">
                        <small className="text-[7px] font-bold tracking-[.7px] text-[#7d8795]">TOTAL FARE</small>
                        <b className="font-[Manrope] text-xl font-extrabold text-[var(--navy)]">{v.price}</b>
                        <span className="text-[7px] text-[#2c8061]">Taxes included</span>
                    </div>
                    <button className="flex h-12 min-w-[168px] items-center justify-between rounded-lg border-0 bg-[var(--gold)] px-4 text-[11px] font-extrabold text-[var(--navy)] shadow-[0_8px_20px_rgba(183,132,7,.24)] [&_svg]:w-[15px]" onClick={() => onContinue(v)}>
                        Confirm booking <ArrowRight />
                    </button>
                    <button className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[var(--line)] bg-[#f5f7fa] text-[var(--navy)] transition-all duration-300 ease-[cubic-bezier(.22,1,.36,1)] hover:bg-[#fff4d4] active:scale-95 [&_svg]:w-[17px] [&_svg]:transition-transform [&_svg]:duration-[450ms] [&_svg]:ease-[cubic-bezier(.22,1,.36,1)]" onClick={() => setMobileSummaryOpen((open) => !open)} aria-label={mobileSummaryOpen ? "Hide fare summary" : "Show fare summary"}>
                        <ChevronDown className={mobileSummaryOpen ? "rotate-0" : "rotate-180"} />
                    </button>
                </div>
                <section className="mx-auto grid w-[min(1200px,calc(100%-48px))] grid-cols-[1fr_310px] gap-7 pt-8 pb-[75px] max-[900px]:grid-cols-1 max-[650px]:w-[min(1200px,calc(100%-28px))] max-[650px]:gap-[15px] max-[650px]:pt-[15px]">
                    <div className="flex flex-col gap-[18px]">
                        <article className="border border-[var(--line)] bg-white p-[27px] max-[650px]:p-[18px]">
                            <div className="mb-[25px] flex items-start gap-3">
                                <span className="grid h-[26px] w-[26px] place-items-center rounded-full bg-[#fff4d2] text-[8px] font-extrabold text-[#97700f]">01</span>
                                <div>
                                    <small className="text-[7px] tracking-[1px] text-[#9b7210]">COMFORT & FEATURES</small>
                                    <h2 className="my-[3px] font-[Manrope] text-xl font-bold text-[var(--navy)]">Everything you need on the road</h2>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-[10px] max-[650px]:grid-cols-2 [&>div]:flex [&>div]:gap-2 [&>div]:border [&>div]:border-[var(--line)] [&>div]:p-[13px] [&_svg]:w-3.5 [&_svg]:shrink-0 [&_svg]:text-[#298060] [&_p]:m-0 [&_p]:flex [&_p]:flex-col [&_b]:text-[9px] [&_span]:mt-[3px] [&_span]:text-[7px] [&_span]:text-[#8992a0]">
                                {[
                                    ["Air-conditioned cabin", "Comfortable in every season"],
                                    ["Professional driver", "Verified and experienced"],
                                    ["Clean interiors", "Sanitised before pickup"],
                                    ["Music system", "Entertainment on the way"],
                                    ["Charging points", "Stay connected"],
                                    ["Luggage space", `${v.bags} large bags`],
                                ].map(([a, b]) => (
                                    <div key={a}>
                                        <Check />
                                        <p>
                                            <b>{a}</b>
                                            <span>{b}</span>
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </article>
                        <article className="border border-[var(--line)] bg-white p-[27px] max-[650px]:p-[18px]">
                            <div className="mb-[25px] flex items-start gap-3">
                                <span className="grid h-[26px] w-[26px] place-items-center rounded-full bg-[#fff4d2] text-[8px] font-extrabold text-[#97700f]">02</span>
                                <div>
                                    <small className="text-[7px] tracking-[1px] text-[#9b7210]">YOUR JOURNEY</small>
                                    <h2 className="my-[3px] font-[Manrope] text-xl font-bold text-[var(--navy)]">Bengaluru to Coorg</h2>
                                </div>
                            </div>
                            <div className="grid grid-cols-[auto_1fr_auto] items-center bg-[#f7f8fa] p-[18px] [&>div]:flex [&>div]:items-start [&>div]:gap-[9px] [&>div>i]:mt-[5px] [&>div>i]:h-[9px] [&>div>i]:w-[9px] [&>div>i]:rounded-full [&>div>i]:bg-[var(--gold)] [&>div>i]:shadow-[0_0_0_4px_#fff1c2] [&>div>span]:flex [&>div>span]:flex-col [&_small]:text-[7px] [&_small]:text-[#9b7210] [&_b]:my-0.5 [&_b]:text-[11px] [&_b]:text-[var(--navy)] [&_p]:m-0 [&_p]:text-[8px] [&_p]:text-[#87909e]">
                                <div>
                                    <i></i>
                                    <span>
                                        <small>PICKUP</small>
                                        <b>Bengaluru</b>
                                        <p>08 Aug · 09:30 AM</p>
                                    </span>
                                </div>
                                <em className="mx-[22px] h-px bg-[repeating-linear-gradient(90deg,#c0a86d_0_5px,transparent_5px_9px)] max-[650px]:mx-2"></em>
                                <div>
                                    <i></i>
                                    <span>
                                        <small>DESTINATION</small>
                                        <b>Coorg</b>
                                        <p>Round trip · 2 days</p>
                                    </span>
                                </div>
                            </div>
                        </article>
                        <article className="border border-[var(--line)] bg-white p-[27px] max-[650px]:p-[18px]">
                            <div className="mb-[25px] flex items-start gap-3">
                                <span className="grid h-[26px] w-[26px] place-items-center rounded-full bg-[#fff4d2] text-[8px] font-extrabold text-[#97700f]">03</span>
                                <div>
                                    <small className="text-[7px] tracking-[1px] text-[#9b7210]">GOOD TO KNOW</small>
                                    <h2 className="my-[3px] font-[Manrope] text-xl font-bold text-[var(--navy)]">Inclusions and policies</h2>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 border border-[var(--line)] max-[650px]:grid-cols-1 [&>div]:flex [&>div]:flex-col [&>div]:gap-[9px] [&>div]:p-[17px] [&>div:first-child]:border-r [&>div:first-child]:border-[var(--line)] max-[650px]:[&>div:first-child]:border-r-0 max-[650px]:[&>div:first-child]:border-b [&_b]:mb-[3px] [&_b]:text-[10px] [&_span]:flex [&_span]:items-center [&_span]:gap-1.5 [&_span]:text-[8px] [&_span]:text-[#687282] [&_svg]:w-3 [&_svg]:text-[#298060] [&>div:last-child_svg]:text-[#a1a9b4]">
                                <div>
                                    <b>Included in your fare</b>
                                    <span>
                                        <Check />
                                        Driver allowance
                                    </span>
                                    <span>
                                        <Check />
                                        Fuel charges
                                    </span>
                                    <span>
                                        <Check />
                                        State and road taxes
                                    </span>
                                </div>
                                <div>
                                    <b>Not included</b>
                                    <span>
                                        <X />
                                        Parking charges
                                    </span>
                                    <span>
                                        <X />
                                        Toll charges
                                    </span>
                                    <span>
                                        <X />
                                        Extra kilometres
                                    </span>
                                </div>
                            </div>
                            <button
                                className="flex items-center gap-[5px] border-0 bg-transparent px-0 pt-[15px] text-[9px] font-bold text-[#916a0a] [&_svg]:w-3"
                                onClick={() => setExpanded(!expanded)}
                            >
                                {expanded ? "Hide" : "Read"} cancellation policy <ChevronDown />
                            </button>
                            {expanded && (
                                <p className="bg-[#f7f8fa] p-3 text-[8px] leading-[1.6] text-[#6d7787]">
                                    Free cancellation is available until 24 hours before pickup.
                                    Later cancellations may attract a charge based on the time
                                    remaining before departure.
                                </p>
                            )}
                        </article>
                    </div>
                    <aside className="sticky top-[102px] self-start border border-[var(--line)] bg-white p-[22px] max-[900px]:static max-[650px]:hidden">
                        <div className="flex flex-col border-b border-[var(--line)] pb-4">
                            <small className="text-[7px] text-[#8a93a0]">ROUND TRIP FARE</small>
                            <b className="my-[3px] font-[Manrope] text-[29px] font-extrabold text-[var(--navy)]">{v.price}</b>
                            <span className="text-[8px] text-[#2c8061]">Inclusive of taxes</span>
                        </div>
                        <div className="border-b border-[var(--line)] py-3 [&_p]:flex [&_p]:justify-between [&_p]:text-[8px] [&_p]:text-[#737d8c] [&_b]:text-[#4c5768]">
                            <p>
                                <span>Base fare</span>
                                <b>{v.price}</b>
                            </p>
                            <p>
                                <span>Driver allowance</span>
                                <b>Included</b>
                            </p>
                            <p>
                                <span>Taxes</span>
                                <b>Included</b>
                            </p>
                        </div>
                        <div className="flex items-center justify-between py-3.5">
                            <span className="text-[10px] font-bold">Total payable</span>
                            <b className="font-[Manrope] text-lg font-extrabold">{v.price}</b>
                        </div>
                        <p className="flex items-center gap-1.5 bg-[#edf8f2] p-[9px] text-[7px] text-[#2a765c]">
                            <ShieldCheck className="w-[13px]" />
                            Price locked for the next 10 minutes
                        </p>
                        <button className="flex h-12 w-full items-center justify-between border-0 bg-[var(--gold)] px-3.5 text-[10px] font-extrabold text-[var(--navy)] hover:-translate-y-0.5 hover:shadow-[0_10px_25px_rgba(183,132,7,.22)] [&_svg]:w-[15px]" onClick={() => onContinue(v)}>
                            Confirm booking <ArrowRight />
                        </button>
                        <small className="mt-2 block text-center text-[7px] text-[#8b94a0]">You won't be charged yet</small>
                        <div className="mt-[18px] flex gap-[9px] border-t border-[var(--line)] pt-[15px]">
                            <Headphones className="w-[18px] text-[#9b7210]" />
                            <span className="flex flex-col">
                                <b className="text-[9px]">Need help?</b>
                                <a className="mt-0.5 text-[8px] text-[#8b6509]" href="tel:+918971190666">Call +91 89711 90666</a>
                            </span>
                        </div>
                    </aside>
                </section>
                <button
                    className={`fixed inset-0 z-[55] hidden border-0 bg-[#031027]/55 p-0 backdrop-blur-[2px] transition-opacity duration-[450ms] ease-[cubic-bezier(.22,1,.36,1)] max-[650px]:block ${mobileSummaryOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`}
                    onClick={() => setMobileSummaryOpen(false)}
                    aria-label="Close fare summary"
                    tabIndex={mobileSummaryOpen ? 0 : -1}
                />
                <section className={`fixed right-0 bottom-0 left-0 z-[60] hidden max-h-[82dvh] overflow-y-auto overscroll-contain rounded-t-[22px] bg-white px-5 pt-3 pb-[max(20px,env(safe-area-inset-bottom))] shadow-[0_-25px_70px_rgba(3,16,39,.3)] will-change-transform transition-transform duration-[500ms] ease-[cubic-bezier(.22,1,.36,1)] max-[650px]:block ${mobileSummaryOpen ? "translate-y-0" : "translate-y-[105%]"}`} aria-label="Full fare summary">
                    <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[#d8dde4]"></div>
                    <div className="flex items-start justify-between border-b border-[var(--line)] pb-4">
                        <div className="flex flex-col">
                            <small className="text-[8px] font-bold tracking-[.8px] text-[#7d8795]">ROUND TRIP FARE</small>
                            <b className="my-1 font-[Manrope] text-[30px] font-extrabold text-[var(--navy)]">{v.price}</b>
                            <span className="text-[9px] text-[#2c8061]">Inclusive of applicable taxes</span>
                        </div>
                        <button className="grid h-9 w-9 place-items-center rounded-full border-0 bg-[#f1f3f6] text-[var(--navy)] transition-all duration-300 hover:bg-[#fff4d4] active:scale-95 [&_svg]:w-[17px] [&_svg]:transition-transform [&_svg]:duration-[450ms] [&_svg]:ease-[cubic-bezier(.22,1,.36,1)]" onClick={() => setMobileSummaryOpen(false)} aria-label="Hide fare summary">
                            <ChevronDown />
                        </button>
                    </div>
                    <div className="border-b border-[var(--line)] py-3 [&_p]:my-2.5 [&_p]:flex [&_p]:justify-between [&_p]:text-[11px] [&_p]:text-[#737d8c] [&_b]:text-[#4c5768]">
                        <p><span>Base fare</span><b>{v.price}</b></p>
                        <p><span>Driver allowance</span><b>Included</b></p>
                        <p><span>Taxes</span><b>Included</b></p>
                    </div>
                    <div className="flex items-center justify-between py-4">
                        <span className="text-xs font-bold text-[var(--navy)]">Total payable</span>
                        <b className="font-[Manrope] text-xl font-extrabold text-[var(--navy)]">{v.price}</b>
                    </div>
                    <p className="flex items-center gap-2 bg-[#edf8f2] p-3 text-[9px] text-[#2a765c] [&_svg]:w-3.5">
                        <ShieldCheck /> Price locked for the next 10 minutes
                    </p>
                    <button className="mt-3 flex h-[50px] w-full items-center justify-between rounded-lg border-0 bg-[var(--gold)] px-4 text-[11px] font-extrabold text-[var(--navy)] shadow-[0_8px_20px_rgba(183,132,7,.24)] [&_svg]:w-[15px]" onClick={() => onContinue(v)}>
                        Confirm booking <ArrowRight />
                    </button>
                    <small className="mt-2 block text-center text-[8px] text-[#8b94a0]">You won't be charged yet</small>
                </section>
                {galleryOpen && (
                    <div
                        className="fixed inset-0 z-[100] h-screen max-h-[100dvh] overflow-x-hidden overflow-y-scroll bg-[rgba(3,13,32,.96)] px-[max(28px,calc((100vw-1180px)/2))] py-8 text-white [overscroll-behavior-y:contain] [scrollbar-color:#eeb21b_rgba(255,255,255,.08)] [touch-action:pan-y] max-[700px]:px-3.5 max-[700px]:py-5"
                        role="dialog"
                        aria-modal="true"
                        aria-label={`${v.name} photo gallery`}
                    >
                        <div className="mb-[22px] flex items-center justify-between">
                            <div>
                                <small className="text-[10px] tracking-[1.4px] text-[var(--gold)]">RJS VEHICLE GALLERY</small>
                                <h2 className="my-[5px] font-[Manrope] text-[29px] font-bold max-[700px]:text-[23px]">{v.name}</h2>
                            </div>
                            <button className="grid h-[42px] w-[42px] place-items-center rounded-full border border-white/25 bg-transparent text-white [&_svg]:w-[19px]"
                                onClick={() => setGalleryOpen(false)}
                                aria-label="Close gallery"
                            >
                                <X />
                            </button>
                        </div>
                        <div className="grid grid-cols-[1.35fr_.65fr] grid-rows-[280px_280px] gap-[10px] max-[700px]:grid-cols-1 max-[700px]:grid-rows-[260px_repeat(3,180px)] [&_img]:h-full [&_img]:w-full [&_img]:object-cover [&_img:first-child]:row-span-2 max-[700px]:[&_img:first-child]:row-auto">
                            <img src={v.image} alt={`${v.name} front view`} />
                            <img src={v.image} alt={`${v.name} side view`} />
                            <img src={v.image} alt={`${v.name} passenger view`} />
                            <img src={v.image} alt={`${v.name} luggage space`} />
                        </div>
                        <p className="mt-4 text-[11px] text-[#9eacc1]">
                            Images are representative. The assigned vehicle will be from the
                            same category and quality standard.
                        </p>
                    </div>
                )}
            </main>
            <Footer />
        </>
    );
}

function CustomSelect({ label, value, onChange, options, icon: Icon, className = "min-w-0 w-full" }) {
    const [open, setOpen] = useState(false);
    const root = useRef(null);
    useEffect(() => {
        const close = (e) => {
            if (root.current && !root.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener("mousedown", close);
        return () => document.removeEventListener("mousedown", close);
    }, []);
    const selected =
        options.find((option) => option.value === value) || options[0];
    return (
        <div className={`relative ${className}`} ref={root}>
            {label && 
                <span className="mb-[7px] block text-[9px] font-extrabold tracking-[1px] text-[#7a8492]">{label}</span>
            }
            <button
                type="button"
                className={`flex min-h-[43px] w-full items-center gap-2 rounded-lg border bg-white px-[10px] py-[9px] text-left text-[var(--ink)] transition hover:border-[#c69a32] hover:bg-[#fffdf7] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgba(238,178,27,.9)] ${open?'border-[#b98408] shadow-[0_0_0_3px_rgba(238,178,27,.13)]':'border-[var(--line)]'} [&>svg:first-child]:w-[17px] [&>svg:first-child]:text-[#9a7110] [&>b]:overflow-hidden [&>b]:text-ellipsis [&>b]:whitespace-nowrap [&>b]:text-[11px] max-[650px]:[&>b]:text-[10px]`}
                onClick={() => setOpen(!open)}
                aria-expanded={open}
            >
                {Icon && <Icon />}
                <b>{selected.label}</b>
                <ChevronDown className={`ml-auto w-3.5 text-[#7b8593] transition-transform ${open?'rotate-180 text-[#9a7110]':''}`} />
            </button>
            {open && (
                <div className="absolute top-[calc(100%+7px)] right-0 left-0 z-[45] rounded-[10px] border border-[#e5d8b3] bg-white p-[5px] shadow-[0_17px_38px_rgba(7,26,61,.18)] animate-[menuIn_.16s_ease-out]">
                    {options.map((option) => (
                        <button
                            type="button"
                            key={option.value}
                            className={`flex w-full items-center justify-between rounded-[7px] border-0 p-[10px] text-left text-[11px] hover:bg-[#f7f4ea] ${option.value===value?'bg-[#fff4d4] font-bold text-[var(--navy)]':'bg-transparent text-[#4f5a6c]'}`}
                            onClick={() => {
                                onChange(option.value);
                                setOpen(false);
                            }}
                        >
                            <span>{option.label}</span>
                            {option.value === value && <Check className="w-3.5 text-[#9a7110]" />}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

function SearchResults({ onBack, search, onSelect }) {
    const [sort, setSort] = useState("recommended");
    const [subtype, setSubtype] = useState("all");
    const [passengerSize, setPassengerSize] = useState("any");
    const [filtersOpen, setFiltersOpen] = useState(false);
    useEffect(() => {
        if (!filtersOpen) return;
        const previousOverflow = document.body.style.overflow;
        const closeOnEscape = (event) => event.key === "Escape" && setFiltersOpen(false);
        document.body.style.overflow = "hidden";
        document.addEventListener("keydown", closeOnEscape);
        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener("keydown", closeOnEscape);
        };
    }, [filtersOpen]);
    const matchingVehicles = searchVehicles.filter(
        (v) => v.type === (search?.vehicle || "car"),
    );
    const selectedLabel =
        vehicles.find((v) => v.id === (search?.vehicle || "car"))?.title || "Cars";
    const SelectedIcon =
        vehicles.find((v) => v.id === (search?.vehicle || "car"))?.icon || CarFront;
    const type = search?.vehicle || "car";
    const subtypeOptions =
        type === "car"
        ? [
            { value: "all", label: "All car types" },
            { value: "sedan", label: "Sedan" },
            { value: "suv", label: "SUV" },
        ]
        : type === "tt"
            ? [
                { value: "all", label: "All traveller types" },
                { value: "9-12", label: "9–12 Seater" },
                { value: "13-17", label: "13–17 Seater" },
                { value: "18-26", label: "18–26 Seater" },
            ]
            : [
                { value: "all", label: "All bus types" },
                { value: "mini", label: "Mini Bus" },
                { value: "seater", label: "AC Seater" },
                { value: "sleeper", label: "Sleeper Bus" },
                { value: "luxury", label: "Luxury Coach" },
            ];
    const passengerOptions = [
        { value: "any", label: "Any passenger size" },
        ...[1, 4, 6, 12, 18, 26, 40]
        .filter((n) => n <= Math.max(...matchingVehicles.map((v) => v.seats), 4))
        .map((n) => ({ value: String(n), label: `${n}+ passengers` })),
    ];
    const visibleVehicles = matchingVehicles
        .filter((v) => {
            const passengerMatch =
                passengerSize === "any" || v.seats >= Number(passengerSize);
            const subtypeMatch =
                subtype === "all" ||
                (subtype === "sedan" && v.category.toLowerCase().includes("sedan")) ||
                (subtype === "suv" && v.category.toLowerCase().includes("suv")) ||
                (subtype === "luxury" && v.category.toLowerCase().includes("luxury")) ||
                (subtype.includes("-") &&
                v.seats >= Number(subtype.split("-")[0]) &&
                v.seats <= Number(subtype.split("-")[1]));
            return passengerMatch && subtypeMatch;
        })
        .sort((a, b) =>
            sort === "low"
                ? Number(a.price.replace(/\D/g, "")) -
                Number(b.price.replace(/\D/g, ""))
                : sort === "rating"
                ? Number(b.rating) - Number(a.rating)
                : 0,
        );
    const clearFilters = () => {
        setSubtype("all");
        setPassengerSize("any");
        setSort("recommended");
    };
    return (
        <>
            <Navbar />
            <main className="min-h-screen bg-[#f5f6f8]">
                <section className="bg-[var(--navy)] py-5 text-white max-[1000px]:py-[15px] max-[650px]:py-3.5">
                    <div className="mx-auto grid w-[min(1200px,calc(100%-48px))] grid-cols-[165px_minmax(280px,1fr)_auto_76px] items-center gap-6 max-[1000px]:grid-cols-[145px_1fr_76px] max-[650px]:w-[min(1200px,calc(100%-28px))] max-[650px]:grid-cols-[1fr_auto] max-[650px]:gap-3">
                        <div className="flex min-w-0 items-center gap-[10px] max-[650px]:col-start-1">
                            <button className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/20 bg-white/[.06] text-white [&_svg]:w-3.5" onClick={onBack}>
                                <ArrowLeft />
                            </button>
                            <span className="flex flex-col max-[650px]:hidden"><small className="text-[9px] tracking-[1px] text-[#8fa0ba]">YOUR TRIP</small><b className="mt-0.5 text-xs text-[#dce4ef]">Outstation booking</b>
                            </span>
                        </div>
                        <div className="grid min-w-0 grid-cols-[auto_1fr_auto] items-center gap-3.5 border-x border-white/14 px-[18px] py-3 max-[1000px]:border-r-0 max-[650px]:col-span-2 max-[650px]:col-start-1 max-[650px]:row-start-2 max-[650px]:w-full max-[650px]:border-x-0 max-[650px]:border-t max-[650px]:border-white/13 max-[650px]:px-0 max-[650px]:pt-[13px] max-[650px]:pb-0">
                            <div className="flex min-w-[85px] flex-col max-[650px]:min-w-[70px]"><small className="text-[9px] tracking-[1px] text-[#8fa0ba]">PICKUP</small><b className="mt-[3px] font-[Manrope] text-base font-bold text-white max-[650px]:text-sm">Bengaluru</b>
                            </div>
                            <span className="grid grid-cols-[1fr_28px_1fr] items-center text-[var(--gold)] max-[650px]:grid-cols-[1fr_25px_1fr] [&_i]:h-px [&_i]:bg-[repeating-linear-gradient(90deg,rgba(238,178,27,.8)_0_5px,transparent_5px_9px)] [&_svg]:h-7 [&_svg]:w-7 [&_svg]:animate-[routeCar_2.7s_ease-in-out_infinite] [&_svg]:rounded-full [&_svg]:bg-[var(--gold)] [&_svg]:p-1.5 [&_svg]:text-[var(--navy)] max-[650px]:[&_svg]:h-[25px] max-[650px]:[&_svg]:w-[25px]">
                                <i></i><CarFront /><i></i>
                            </span>
                            <div className="flex min-w-[85px] flex-col text-right max-[650px]:min-w-[70px]">
                                <small className="text-[9px] tracking-[1px] text-[#8fa0ba]">DESTINATION</small>
                                <b className="mt-[3px] font-[Manrope] text-base font-bold text-white max-[650px]:text-sm">Coorg</b>
                            </div>
                        </div>
                        <div className="flex min-w-0 items-center gap-[9px] max-[1000px]:col-start-2 max-[1000px]:row-start-2 max-[650px]:col-span-2 max-[650px]:col-start-1 max-[650px]:row-start-3 max-[650px]:w-full max-[650px]:justify-center max-[650px]:overflow-visible [&_b]:mt-0.5 [&_b]:text-[11px] [&_b]:text-white">
                            <span className="flex min-w-[125px] items-center gap-2 rounded-lg border border-white/14 bg-white/[.055] px-[11px] py-[9px] max-[650px]:min-w-0 max-[650px]:flex-1">
                                <Route className="w-[15px] text-[var(--gold)]" />
                                <i className="flex flex-col not-italic">
                                    <small className="text-[9px] tracking-[1px] text-[#8fa0ba]">TRIP TYPE</small>
                                    <b className="mt-0.5 text-[11px] text-white">Round trip</b>
                                </i>
                            </span>
                            <span className="flex min-w-[125px] items-center gap-2 rounded-lg border border-white/14 bg-white/[.055] px-[11px] py-[9px] max-[650px]:min-w-0 max-[650px]:flex-1">
                                <CalendarDays className="w-[15px] text-[var(--gold)]" />
                                <i className="flex flex-col not-italic">
                                    <small className="text-[9px] tracking-[1px] text-[#8fa0ba]">DEPARTURE</small>
                                    <b>08 Aug · 09:30 AM</b>
                                </i>
                            </span>
                        </div>
                        <button className="m-0 w-[76px] self-center justify-self-end rounded-lg border border-white/35 bg-transparent px-2 py-[11px] text-[11px] text-white hover:border-white hover:bg-white hover:text-[var(--navy)] max-[1000px]:col-start-3 max-[1000px]:row-span-2 max-[1000px]:row-start-1 max-[650px]:col-start-2 max-[650px]:row-span-1 max-[650px]:row-start-1 max-[650px]:block max-[650px]:w-[68px] max-[650px]:px-1.5 max-[650px]:py-[9px]" onClick={onBack}>
                            Edit trip
                        </button>
                    </div>
                </section>
                <section className="border-b border-[var(--line)] bg-white">
                    <div className="mx-auto flex min-h-[66px] w-[min(1200px,calc(100%-48px))] items-center justify-center gap-[10px] max-[650px]:min-h-[58px] max-[650px]:w-[min(1200px,calc(100%-28px))] max-[650px]:gap-1 [&>b]:h-px [&>b]:w-[58px] [&>b]:bg-[#dfe3e8] max-[650px]:[&>b]:w-[16px] [&>span]:flex [&>span]:items-center [&>span]:gap-[7px] [&>span]:text-[11px] [&>span]:font-bold [&>span]:whitespace-nowrap [&>span]:text-[#8b94a2] max-[650px]:[&>span]:gap-1 max-[650px]:[&>span]:text-[9px] [&>span>i]:grid [&>span>i]:h-6 [&>span>i]:w-6 [&>span>i]:shrink-0 [&>span>i]:place-items-center [&>span>i]:rounded-full [&>span>i]:bg-[#edf0f4] [&>span>i]:not-italic max-[650px]:[&>span>i]:h-5 max-[650px]:[&>span>i]:w-5">
                        <span className="!text-[var(--navy)]">
                            <i className="!bg-[var(--gold)]">1</i>Choose vehicle
                        </span>
                        <b></b>
                        <span><i>2</i>Vehicle details</span>
                        <b></b>
                        <span><i>3</i>Booking &amp; Payment</span>
                    </div>
                </section>
                <section className="mx-auto grid w-[min(1200px,calc(100%-48px))] grid-cols-[225px_1fr] gap-[30px] pt-[29px] pb-[70px] max-[900px]:grid-cols-1 max-[650px]:w-[min(1200px,calc(100%-28px))] max-[650px]:pt-[23px]">
                    <button
                        className={`fixed inset-0 z-40 hidden border-0 bg-[#031027]/55 p-0 backdrop-blur-[2px] transition-opacity duration-300 max-[900px]:block ${filtersOpen ? "max-[900px]:pointer-events-auto max-[900px]:opacity-100" : "max-[900px]:pointer-events-none max-[900px]:opacity-0"}`}
                        onClick={() => setFiltersOpen(false)}
                        aria-label="Close filters"
                        tabIndex={filtersOpen ? 0 : -1}
                    />
                    <aside className={`rjs-filter-scrollbar sticky top-5 max-h-[calc(100vh-40px)] self-start overflow-y-auto border border-[var(--line)] bg-white max-[900px]:fixed max-[900px]:top-0 max-[900px]:left-0 max-[900px]:z-50 max-[900px]:h-[100dvh] max-[900px]:max-h-none max-[900px]:w-[min(330px,88vw)] max-[900px]:border-y-0 max-[900px]:border-l-0 max-[900px]:shadow-[22px_0_55px_rgba(3,16,39,.22)] max-[900px]:transition-transform max-[900px]:duration-300 max-[900px]:ease-[cubic-bezier(.22,1,.36,1)] ${filtersOpen ? "max-[900px]:translate-x-0" : "max-[900px]:-translate-x-full"}`}>
                        <div className="flex justify-between border-b border-[var(--line)] p-[17px]">
                            <b className="text-[15px]">Refine results</b>
                            <div className="flex items-center gap-3">
                                <button className="border-0 bg-transparent text-[11px] text-[#9a710f]" onClick={clearFilters}>Clear all</button>
                                <button className="hidden h-8 w-8 place-items-center rounded-full border-0 bg-[#f1f3f6] max-[900px]:grid [&_svg]:w-4" onClick={() => setFiltersOpen(false)} aria-label="Close filters">
                                    <X />
                                </button>
                            </div>
                        </div>
                        <div className="border-b border-[var(--line)] bg-[#fbf8ef] px-[17px] py-4">
                            <small className="mb-2 block text-[9px] font-extrabold tracking-[1px] text-[#9b7210]">VEHICLE SELECTED</small>
                            <span className="flex items-center gap-2 text-[var(--navy)] [&_svg:first-child]:w-[19px] [&_svg:first-child]:text-[#a77a0d] [&_svg:last-child]:ml-auto [&_svg:last-child]:w-3.5 [&_svg:last-child]:text-[#2c8462]"><SelectedIcon /><b className="text-[13px]">{selectedLabel}</b><Check />
                            </span>
                            <p className="mt-[7px] mb-0 text-[11px] leading-[1.4] text-[#858e9b]">Change this from the homepage search.</p>
                        </div>
                        <div className="overflow-visible border-b border-[var(--line)] p-[17px] [&>div]:min-w-0">
                            <CustomSelect
                                label={`${selectedLabel.toUpperCase()} TYPE`}
                                value={subtype}
                                onChange={setSubtype}
                                options={subtypeOptions}
                                icon={SelectedIcon}
                            />
                        </div>
                        <div className="overflow-visible border-b border-[var(--line)] p-[17px] [&>div]:min-w-0">
                            <CustomSelect
                                label="PASSENGER SIZE"
                                value={passengerSize}
                                onChange={setPassengerSize}
                                options={passengerOptions}
                                icon={Users}
                            />
                        </div>
                        <div className="border-b border-[var(--line)] p-[17px]">
                            <span className="mb-3 block text-[9px] font-extrabold tracking-[1px] text-[#7a8492]">PRICE RANGE</span>
                            <input
                                className="w-full accent-[var(--navy)]"
                                type="range"
                                min="3000"
                                max="30000"
                                defaultValue="20000"
                            />
                            <div className="flex justify-between text-[#7a8492] [&_small]:text-[10px]">
                                <small>₹3,000</small>
                                <small>₹30,000+</small>
                            </div>
                        </div>
                        <div className="border-b border-[var(--line)] p-[17px]">
                            <span className="mb-3 block text-[9px] font-extrabold tracking-[1px] text-[#7a8492]">AMENITIES</span>
                            {["Air conditioning", "Extra luggage", "Pushback seats"].map(
                                (x) => (
                                <label className="relative my-[11px] flex items-center gap-2 text-xs text-[#4e596b] [&_input]:absolute [&_input]:opacity-0 [&_input:checked+i]:border-[var(--navy)] [&_input:checked+i]:bg-[var(--navy)] [&_input:checked+i]:shadow-[inset_0_0_0_3px_white]" key={x}>
                                    <input type="checkbox" /><i className="h-[15px] w-[15px] rounded-[3px] border border-[#b8c0cb]"></i>
                                    {x}
                                </label>
                                ),
                            )}
                        </div>
                        <div className="m-3.5 bg-[#f8f2df] p-4 [&>svg]:w-5 [&>svg]:text-[#a8790c]">
                            <Headphones />
                            <b className="mt-2 block text-[13px]">Need help choosing?</b>
                            <p className="text-[11px] leading-[1.5] text-[#6f7887]">
                                Our travel expert can find the right vehicle for your group.
                            </p>
                            <a className="text-[11px] font-extrabold text-[#946b0b]" href="tel:+918971190666">Call 89711 90666</a>
                        </div>
                    </aside>
                    <div>
                        <div className="mb-[17px] flex items-end justify-between max-[650px]:block">
                            <div>
                                <span className="text-[11px] font-bold text-[#328062]">
                                    {visibleVehicles.length * 8} {selectedLabel.toLowerCase()}{" "}
                                    available
                                </span>
                                <h1 className="my-1 font-[Manrope] text-[30px] font-bold text-[var(--navy)]">Choose your {selectedLabel.toLowerCase()}</h1>
                                <p className="m-0 text-xs text-[#7d8693]">Prices include driver allowance and applicable taxes.</p>
                            </div>
                            <div className="flex items-end gap-2 max-[650px]:mt-3.5 max-[650px]:w-full">
                                <button className="hidden h-[43px] items-center gap-2 rounded-lg border border-[var(--line)] bg-white px-3 text-[11px] font-bold text-[var(--navy)] max-[900px]:flex [&_svg]:w-4 [&_svg]:text-[#9a7110]" onClick={() => setFiltersOpen(true)}>
                                    <SlidersHorizontal /> Filters
                                </button>
                                <CustomSelect
                                    label="SORT BY"
                                    className="w-[215px] min-w-[205px] max-[650px]:w-auto max-[650px]:min-w-0 max-[650px]:flex-1"
                                    value={sort}
                                    onChange={setSort}
                                    options={[
                                    { value: "recommended", label: "Recommended" },
                                    { value: "low", label: "Price: low to high" },
                                    { value: "rating", label: "Highest rated" },
                                    ]}
                                />
                            </div>
                        </div>
                        {visibleVehicles.map((v, i) => (
                            <article data-result-card className={`mb-[13px] grid min-h-[210px] grid-cols-[210px_1fr_175px] border border-[var(--line)] bg-white [backface-visibility:hidden] [transform:translateZ(0)] animate-[cardRise_.46s_cubic-bezier(.22,1,.36,1)_both] transition-all duration-200 hover:-translate-y-1 hover:border-[#c6a34d] hover:shadow-[0_12px_35px_rgba(8,27,57,.08)] [&:hover_img]:scale-[1.035] max-[900px]:grid-cols-[190px_1fr_160px] max-[650px]:block ${i===1?'[animation-delay:.055s]':i===2?'[animation-delay:.11s]':i===3?'[animation-delay:.165s]':''}`} key={v.name}>
                                <div className="relative overflow-hidden max-[650px]:h-[190px]">
                                    <img className="h-full w-full object-cover transition-[transform,filter] duration-[550ms] ease-[cubic-bezier(.22,1,.36,1)]" src={v.image} alt={v.name} />
                                    {i === 1 && <span className="absolute top-[11px] left-[10px] bg-[var(--gold)] px-[7px] py-[5px] text-[10px] font-extrabold text-[var(--navy)]">MOST POPULAR</span>}
                                    <button className="absolute bottom-[10px] left-[10px] border-0 bg-[rgba(4,17,40,.78)] px-2 py-1.5 text-[10px] text-white">View {i + 5} photos</button>
                                </div>
                                <div className="flex flex-col border-r border-[var(--line)] p-[18px] max-[650px]:border-r-0">
                                    <div className="flex justify-between">
                                        <div>
                                            <small className="text-[10px] tracking-[.8px] text-[#9a7010] uppercase">{v.category}</small>
                                            <h2 className="my-[3px] font-[Manrope] text-xl font-bold">{v.name}</h2>
                                            <p className="m-0 text-[10px] text-[#929aa5]">or equivalent vehicle</p>
                                        </div>
                                        <div className="grid grid-cols-[auto_auto] items-center gap-[3px]">
                                            <Star className="w-3 text-[#e6a800]" fill="currentColor" />
                                            <b className="text-[13px]">{v.rating}</b>
                                            <span className="col-span-2 text-[10px] text-[#8c95a2]">{v.trips} trips</span>
                                        </div>
                                    </div>
                                    <div className="mt-[18px] mb-[11px] flex gap-[17px]">
                                        <span className="flex items-center gap-[5px] text-[11px] [&_svg]:w-3.5 [&_svg]:text-[#7d8795]"><Users />
                                            {v.seats} passengers
                                        </span>
                                        <span className="flex items-center gap-[5px] text-[11px] [&_svg]:w-3.5 [&_svg]:text-[#7d8795]">
                                            <Van />
                                            {v.bags} bags
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-x-3 gap-y-1.5">
                                        {v.tags.map((t) => (
                                            <span className="flex items-center gap-1 text-[10px] text-[#657083] [&_svg]:w-[11px] [&_svg]:text-[#27805e]" key={t}>
                                                <Check />
                                                {t}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex flex-col items-end px-4 py-5 text-right max-[650px]:items-start max-[650px]:border-t max-[650px]:border-[var(--line)] max-[650px]:text-left">
                                    <small className="text-[9px] text-[#858e9b]">ROUND TRIP TOTAL</small>
                                    <b className="my-[3px] font-[Manrope] text-[23px] font-extrabold text-[var(--navy)]">{v.price}</b>
                                    <span className="text-[10px] text-[#8a93a0]">{v.rate} after included km</span>
                                    <p className="flex items-center gap-[3px] text-[10px] text-[#27805e] [&_svg]:w-[11px]">
                                        <Check />
                                        No hidden charges
                                    </p>
                                    <button className="relative mt-auto flex w-full items-center justify-between overflow-hidden border-0 bg-[var(--gold)] px-[10px] py-[11px] text-[11px] font-extrabold transition-transform duration-200 after:absolute after:top-[-60%] after:bottom-[-60%] after:left-[-45%] after:w-[24%] after:skew-x-[-18deg] after:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,.48),transparent)] after:content-[''] after:animate-[buttonShine_4.8s_ease-in-out_infinite] hover:-translate-y-0.5 hover:shadow-[0_10px_25px_rgba(183,132,7,.22)] max-[650px]:mt-3 [&_svg]:w-[13px] [&_svg]:transition-transform [&_svg]:duration-200 hover:[&_svg]:translate-x-1" onClick={() => onSelect(v)}>
                                        Select vehicle <ArrowRight />
                                    </button>
                                </div>
                            </article>
                        ))}
                        {!visibleVehicles.length && (
                            <div className="border border-[var(--line)] bg-white px-[25px] py-[55px] text-center">
                                <SelectedIcon className="h-[34px] w-[34px] text-[#a87a0d]" />
                                <h3 className="mt-3 mb-[5px] font-[Manrope] text-lg font-bold text-[var(--navy)]">No exact match found</h3>
                                <p className="text-[11px] text-[#77818f]">
                                    Try increasing passenger capacity or selecting another{" "}
                                    {selectedLabel.toLowerCase()} type.
                                </p>
                                <button className="mt-2 border-0 bg-[var(--gold)] px-[15px] py-[10px] text-[10px] font-extrabold text-[var(--navy)]" onClick={clearFilters}>Clear filters</button>
                            </div>
                        )}
                    </div>
                </section>
            </main>
            <Footer />
        </>
    );
}

function AvailableVehicles() {
    const navigate = useNavigate();
    const location = useLocation();
    const search = location.state?.search || {
        service: "outstation",
        vehicle: "car",
    };
    const isDetailsPage = location.pathname === "/vehicle-details";
    const isTripDetailsPage = location.pathname === "/booking-payment" || location.pathname === "/trip-details";
    const selectedVehicle = location.state?.vehicle;
    if (isTripDetailsPage)
        return (
            <TripDetails
                vehicle={selectedVehicle}
                onBack={() =>
                navigate("/vehicle-details", {
                    state: { vehicle: selectedVehicle, search },
                })
                }
            />
        );
    if (isDetailsPage && selectedVehicle)
        return (
            <VehicleDetails
                vehicle={selectedVehicle}
                onBack={() => navigate(-1)}
                onContinue={(vehicle) =>
                navigate("/booking-payment", { state: { vehicle, search } })
                }
            />
        );
    return (
        <SearchResults
            search={search}
            onBack={() => navigate("/")}
            onSelect={(vehicle) =>
                navigate("/vehicle-details", { state: { vehicle, search } })
            }
        />
    );
}
export default AvailableVehicles;

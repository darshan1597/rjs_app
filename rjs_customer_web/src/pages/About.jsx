import { useEffect, useRef } from "react";
import { ArrowRight, BadgeCheck, BusFront, CarFront, Headphones, MapPinned, ShieldCheck, Users, Van } from "lucide-react";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";

const standards = [
    { icon: ShieldCheck, title: "Safety first", text: "Verified drivers and routinely inspected vehicles for every journey." },
    { icon: Headphones, title: "Support", text: "A travel coordinator is available whenever your trip needs assistance." },
    { icon: BadgeCheck, title: "Clear commitments", text: "Confirmed vehicle details and transparent pricing before departure." },
];

const fleetJourney = [
    { icon: MapPinned, eyebrow: "BENGALURU LOCAL", title: "Auto", text: "Quick, dependable city rides for everyday travel across Bengaluru.", note: "Local rides" },
    { icon: CarFront, eyebrow: "CITY & OUTSTATION", title: "Car", text: "Comfortable sedans and SUVs for airport transfers, family trips and long journeys.", note: "1-7 passengers" },
    { icon: Van, eyebrow: "GROUP JOURNEYS", title: "Tempo Traveller", text: "A spacious choice for families, teams and groups travelling together.", note: "9-26 passengers" },
    { icon: BusFront, eyebrow: "ANYWHERE IN INDIA", title: "Bus", text: "Coordinated coaches for tours, corporate movement, weddings and large groups.", note: "27-55 passengers" },
];

function FleetJourney() {
    const sectionRef = useRef(null);
    const glowLineRef = useRef(null);

    useEffect(() => {
        const cards = sectionRef.current?.querySelectorAll("[data-fleet-reveal]");
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => entry.target.toggleAttribute("data-visible", entry.isIntersecting));
        }, { threshold: 0.28, rootMargin: "0px 0px -8%" });
        cards?.forEach((card) => observer.observe(card));

        let frameId = 0;
        const updateProgress = () => {
            if (!sectionRef.current) return;
            const rect = sectionRef.current.getBoundingClientRect();
            const travel = rect.height + window.innerHeight * 0.35;
            const passed = window.innerHeight * 0.72 - rect.top;
            const progress = Math.min(1, Math.max(0, passed / travel));
            if (glowLineRef.current) glowLineRef.current.style.height = `${progress * 100}%`;
        };
        const requestProgressUpdate = () => {
            cancelAnimationFrame(frameId);
            frameId = requestAnimationFrame(updateProgress);
        };
        requestProgressUpdate();
        window.addEventListener("scroll", requestProgressUpdate, { passive: true });
        window.addEventListener("resize", requestProgressUpdate);
        return () => {
            observer.disconnect();
            cancelAnimationFrame(frameId);
            window.removeEventListener("scroll", requestProgressUpdate);
            window.removeEventListener("resize", requestProgressUpdate);
        };
    }, []);

    return (
        <section ref={sectionRef} className="relative overflow-hidden bg-[#f7f8fa] py-[100px] max-[650px]:py-[70px]">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_28%,rgba(244,183,27,.09),transparent_34%)]" />
            <div className="relative mx-auto w-[min(1120px,calc(100%-48px))] max-[650px]:w-[min(1120px,calc(100%-28px))]">
                <div className="mx-auto mb-20 max-w-[650px] text-center max-[650px]:mb-14 max-[650px]:pl-8 max-[650px]:text-left">
                    <span className="text-[20px] font-extrabold tracking-[1.7px] text-[#a4770d]">ONE FLEET. EVERY JOURNEY.</span>
                </div>

                <div className="relative">
                    <div className="absolute top-0 bottom-0 left-1/2 w-px -translate-x-1/2 bg-[#dce1e8] max-[700px]:left-[18px]" />
                    <div ref={glowLineRef} className="absolute top-0 left-1/2 h-0 w-[3px] -translate-x-1/2 bg-gradient-to-b from-[#fff4b8] via-[var(--gold)] to-[#ff8a00] shadow-[0_0_8px_#f4b71b,0_0_20px_rgba(244,183,27,.85),0_0_42px_rgba(244,183,27,.45)] will-change-[height] max-[700px]:left-[18px]" />

                    <div className="space-y-20 max-[700px]:space-y-10">
                        {fleetJourney.map((vehicle, index) => (
                            <article
                                key={vehicle.title}
                                data-fleet-reveal
                                className={`group relative grid grid-cols-2 items-center gap-[90px] opacity-0 blur-[2px] transition-all duration-700 ease-out data-[visible]:translate-x-0 data-[visible]:translate-y-0 data-[visible]:opacity-100 data-[visible]:blur-none max-[700px]:ml-[46px] max-[700px]:grid-cols-1 max-[700px]:gap-0 ${index % 2 ? "translate-x-12" : "-translate-x-12"}`}
                            >
                                <div className={`${index % 2 ? "col-start-2" : "col-start-1 text-right max-[700px]:text-left"}`}>
                                    <div className="relative overflow-hidden border border-[#e1e4e9] bg-white p-7 shadow-[0_18px_50px_rgba(7,26,61,.06)] transition duration-500 group-data-[visible]:shadow-[0_22px_60px_rgba(7,26,61,.11)] max-[700px]:p-5">
                                        <div className="absolute inset-x-0 top-0 h-[2px] origin-left scale-x-0 bg-gradient-to-r from-transparent via-[var(--gold)] to-transparent transition-transform delay-300 duration-1000 group-data-[visible]:scale-x-100" />
                                        <div className={`mb-5 flex items-center gap-4 ${index % 2 ? "" : "justify-end max-[700px]:justify-start"}`}>
                                            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[#fff4d3] text-[#a4770d] shadow-[0_0_0_7px_rgba(244,183,27,.08)] [&_svg]:w-7"><vehicle.icon /></span>
                                            <div className={index % 2 ? "" : "max-[700px]:text-left"}><small className="block text-[8px] font-extrabold tracking-[1.4px] text-[#a4770d]">{vehicle.eyebrow}</small><h3 className="font-[Manrope] text-[27px] font-extrabold text-[var(--navy)]">{vehicle.title}</h3></div>
                                        </div>
                                        <p className="text-[12px] leading-[1.75] text-[#6f7a8a]">{vehicle.text}</p>
                                        <span className="mt-5 inline-flex border border-[#e5dfcf] bg-[#fffaf0] px-3 py-2 text-[9px] font-extrabold tracking-[.6px] text-[#735913]">{vehicle.note}</span>
                                    </div>
                                </div>
                                <span className="absolute top-1/2 left-1/2 z-10 h-4 w-4 -translate-x-1/2 -translate-y-1/2 scale-50 rounded-full border-[3px] border-white bg-[#b7bec8] shadow-[0_0_0_1px_#d0d5dc] transition-all duration-500 group-data-[visible]:scale-100 group-data-[visible]:bg-[var(--gold)] group-data-[visible]:shadow-[0_0_0_1px_#d29a0d,0_0_18px_rgba(244,183,27,.8)] max-[700px]:left-[-28px]" />
                            </article>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

export default function About() {
    return (
        <>
            <Navbar />
            <main className="min-h-screen bg-[#f7f8fa]">
                <section className="overflow-hidden bg-[var(--navy)] py-[95px] text-white max-[650px]:py-[62px]">
                    <div className="mx-auto grid w-[min(1200px,calc(100%-48px))] grid-cols-[1fr_430px] items-center gap-[70px] max-[950px]:grid-cols-1 max-[650px]:w-[min(1200px,calc(100%-28px))]">
                        <div>
                            <span className="text-[9px] font-extrabold tracking-[1.7px] text-[var(--gold)]">ABOUT RJS TOURS &amp; TRAVELS</span>
                            <h1 className="my-4 font-[Manrope] text-[58px] leading-[1.03] font-bold tracking-[-3px] max-[700px]:text-[43px] max-[420px]:text-[36px]">
                                One trusted fleet.<br />Every kind of journey.
                            </h1>
                            <p className="max-w-[620px] text-sm leading-[1.8] text-[#b7c4d7]">
                                RJS brings local Bengaluru travel and journeys across India together under one dependable travel team—from quick city rides to family tours, corporate movement and large-group transport.
                            </p>
                            <div className="mt-8 flex flex-wrap gap-3">
                                <a className="flex items-center gap-2 bg-[var(--gold)] px-4 py-3 text-[11px] font-extrabold text-[var(--navy)] [&_svg]:w-4" href="/#book">Book a journey <ArrowRight /></a>
                                <a className="flex items-center gap-2 border border-white/25 px-4 py-3 text-[11px] font-bold text-white [&_svg]:w-4" href="/contact">Contact our team <ArrowRight /></a>
                            </div>
                        </div>
                        <div className="relative mx-auto aspect-square w-full max-w-[430px] overflow-hidden rounded-full border border-white/10 bg-[#061a3a] shadow-[0_25px_80px_rgba(0,0,0,.28)]">
                            <img className="h-full w-full object-cover" src="/assets/india-travel-network.png" alt="RJS travel network across India" />
                        </div>
                    </div>
                </section>

                <FleetJourney />

                <section className="bg-white py-[90px] max-[650px]:py-[65px]">
                    <div className="mx-auto w-[min(1200px,calc(100%-48px))] max-[650px]:w-[min(1200px,calc(100%-28px))]">
                        <div className="mb-9 max-w-[600px]">
                            <span className="text-[9px] font-extrabold tracking-[1.5px] text-[#a4770d]">THE RJS STANDARD</span>
                            <h2 className="my-3 font-[Manrope] text-[40px] leading-[1.1] font-bold tracking-[-2px] text-[var(--navy)] max-[650px]:text-[33px]">What every RJS journey should feel like.</h2>
                        </div>
                        <div className="grid grid-cols-3 gap-4 max-[800px]:grid-cols-1">
                            {standards.map((item, index) => (
                                <article className="border border-[var(--line)] bg-[#fafbfc] p-6 transition hover:-translate-y-1 hover:border-[#d3b66d] hover:shadow-[0_16px_35px_rgba(7,26,61,.07)]" key={item.title}>
                                    <div className="mb-6 flex items-start justify-between"><span className="grid h-12 w-12 place-items-center rounded-full bg-[#fff2c9] text-[#98700f] [&_svg]:w-5"><item.icon /></span><small className="text-[9px] text-[#a2a9b2]">0{index + 1}</small></div>
                                    <h3 className="mb-2 font-[Manrope] text-xl font-bold text-[var(--navy)]">{item.title}</h3>
                                    <p className="m-0 text-[11px] leading-[1.7] text-[#707b8b]">{item.text}</p>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="bg-[var(--navy)] py-[65px] text-white">
                    <div className="mx-auto flex w-[min(1200px,calc(100%-48px))] items-center justify-between gap-8 max-[700px]:flex-col max-[700px]:items-start max-[650px]:w-[min(1200px,calc(100%-28px))]">
                        <div><span className="text-[9px] font-extrabold tracking-[1.5px] text-[var(--gold)]">TRAVEL WITH RJS</span><h2 className="my-2 font-[Manrope] text-[34px] font-bold">Where can we take you next?</h2></div>
                        <a className="flex shrink-0 items-center gap-3 bg-[var(--gold)] px-5 py-3.5 text-xs font-extrabold text-[var(--navy)] [&_svg]:w-4" href="/contact">Plan with our team <ArrowRight /></a>
                    </div>
                </section>
            </main>
            <Footer />
        </>
    );
}

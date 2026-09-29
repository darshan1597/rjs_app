import { useState } from "react";
import { ArrowRight, CheckCircle2, Clock3, Headphones, MapPin, MessageCircle, Phone, Send } from "lucide-react";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";

export default function Contact() {
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (event) => {
        event.preventDefault();
        setSubmitted(true);
        event.currentTarget.reset();
    };

    return (
        <>
            <Navbar />
            <main className="min-h-screen bg-[#f6f7f9]">
                <section className="relative overflow-hidden bg-[var(--navy)] py-[44px] text-white max-[650px]:py-[30px]">
                    <div className="absolute top-[-180px] right-[-120px] h-[430px] w-[430px] rounded-full border border-white/10 shadow-[0_0_0_80px_rgba(255,255,255,.025),0_0_0_160px_rgba(255,255,255,.015)]"></div>
                    <div className="relative mx-auto w-[min(1200px,calc(100%-48px))] max-[650px]:w-[min(1200px,calc(100%-28px))]">
                        <span className="text-[9px] font-extrabold tracking-[1.7px] text-[var(--gold)]">CONTACT RJS</span>
                        <h1 className="my-4 max-w-[720px] font-[Manrope] text-[56px] leading-[1.03] font-bold tracking-[-3px] max-[700px]:text-[42px] max-[420px]:text-[36px]">
                            Let's plan a journey that feels effortless.
                        </h1>
                        <p className="max-w-[590px] text-sm leading-[1.75] text-[#b8c5d8]">
                            Tell us where you want to go and what you need. Our Bengaluru travel desk will help with the right vehicle, itinerary and fare.
                        </p>
                        <div className="mt-7 flex flex-wrap gap-3">
                            <a className="flex items-center gap-2.5 bg-[var(--gold)] px-4 py-3 text-[11px] font-extrabold text-[var(--navy)] [&_svg]:w-4" href="tel:+918971190666">
                                <Phone /> Call 89711 90666
                            </a>
                            <a className="flex items-center gap-2.5 border border-white/25 bg-white/[.06] px-4 py-3 text-[11px] font-bold text-white backdrop-blur-lg [&_svg]:w-4" href="https://wa.me/918971190666" target="_blank" rel="noreferrer">
                                <MessageCircle /> WhatsApp us
                            </a>
                        </div>
                    </div>
                </section>

                <section className="mx-auto grid w-[min(1200px,calc(100%-48px))] grid-cols-[.78fr_1.22fr] gap-8 py-[80px] max-[900px]:grid-cols-1 max-[650px]:w-[min(1200px,calc(100%-28px))] max-[650px]:py-[55px]">
                    <aside className="flex flex-col gap-4 max-[900px]:order-2">
                        <div className="border border-[var(--line)] bg-white p-6">
                            <span className="text-[9px] font-extrabold tracking-[1.4px] text-[#9a7210]">QUICK SUPPORT</span>
                            <h2 className="my-2 font-[Manrope] text-[28px] leading-[1.15] font-bold tracking-[-1px] text-[var(--navy)]">Talk to a travel expert.</h2>
                            <p className="text-xs leading-[1.7] text-[#707b8b]">No automated queues. Our team helps with local rides, outstation travel, group tours and vehicle selection.</p>
                        </div>
                        {[
                            { icon: Phone, title: "Call our travel desk", copy: "+91 89711 90666", href: "tel:+918971190666" },
                            { icon: MessageCircle, title: "Chat on WhatsApp", copy: "Fast help with bookings", href: "https://wa.me/918971190666" },
                            { icon: MapPin, title: "Based in Bengaluru", copy: "Local rides and journeys across India" },
                            { icon: Clock3, title: "Available every day", copy: "24/7 trip and booking assistance" },
                        ].map((item) => {
                            const content = (
                                <>
                                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#fff3cf] text-[#9a7110] [&_svg]:w-[19px]"><item.icon /></span>
                                    <span className="flex flex-col">
                                        <b className="text-xs text-[var(--navy)]">{item.title}</b>
                                        <small className="mt-1 text-[10px] leading-[1.5] text-[#778292]">{item.copy}</small>
                                    </span>
                                    {item.href && <ArrowRight className="ml-auto w-4 text-[#a4770d]" />}
                                </>
                            );
                            return item.href ? (
                                <a className="flex items-center gap-3 border border-[var(--line)] bg-white p-4 hover:-translate-y-0.5 hover:border-[#d2b466] hover:shadow-[0_10px_25px_rgba(7,26,61,.07)]" href={item.href} key={item.title} target={item.href.startsWith("http") ? "_blank" : undefined} rel={item.href.startsWith("http") ? "noreferrer" : undefined}>{content}</a>
                            ) : <div className="flex items-center gap-3 border border-[var(--line)] bg-white p-4" key={item.title}>{content}</div>;
                        })}
                    </aside>

                    <div className="border border-[var(--line)] bg-white p-8 shadow-[0_18px_50px_rgba(7,26,61,.06)] max-[900px]:order-1 max-[650px]:p-[20px]">
                        <div className="mb-7 flex items-start justify-between gap-4">
                            <div>
                                <span className="text-[9px] font-extrabold tracking-[1.4px] text-[#9a7210]">SEND AN ENQUIRY</span>
                                <h2 className="my-2 font-[Manrope] text-[32px] font-bold tracking-[-1.3px] text-[var(--navy)] max-[500px]:text-[27px]">How can we help?</h2>
                                <p className="m-0 text-xs text-[#778292]">We usually respond within 15 minutes.</p>
                            </div>
                            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#edf8f2] text-[#2d8061] [&_svg]:w-5"><Headphones /></span>
                        </div>
                        <form className="grid grid-cols-2 gap-4 max-[600px]:grid-cols-1 [&_label>span]:mb-1.5 [&_label>span]:block [&_label>span]:text-[9px] [&_label>span]:font-extrabold [&_label>span]:tracking-[.8px] [&_label>span]:text-[#667183] [&_input]:h-[50px] [&_input]:w-full [&_input]:rounded-lg [&_input]:border [&_input]:border-[var(--line)] [&_input]:px-3.5 [&_input]:text-xs [&_input]:outline-0 [&_input:focus]:border-[#b88711] [&_input:focus]:shadow-[0_0_0_3px_rgba(238,178,27,.12)]" onSubmit={handleSubmit}>
                            <label><span>FULL NAME</span><input required placeholder="Enter your full name" /></label>
                            <label><span>MOBILE NUMBER</span><input required type="tel" placeholder="+91 98765 43210" /></label>
                            <label><span>EMAIL ADDRESS</span><input required type="email" placeholder="you@example.com" /></label>
                            <label><span>TRAVEL TYPE</span><input required placeholder="Local, outstation or package" /></label>
                            <label className="col-span-2 max-[600px]:col-auto">
                                <span>HOW CAN WE HELP?</span>
                                <textarea className="min-h-[130px] w-full resize-y rounded-lg border border-[var(--line)] p-3.5 text-xs outline-0 focus:border-[#b88711] focus:shadow-[0_0_0_3px_rgba(238,178,27,.12)]" required placeholder="Tell us your destination, travel date, passengers and vehicle preference..." />
                            </label>
                            <button className="col-span-2 flex h-[52px] items-center justify-between rounded-lg border-0 bg-[var(--gold)] px-4 text-[11px] font-extrabold text-[var(--navy)] hover:-translate-y-0.5 hover:shadow-[0_10px_25px_rgba(183,132,7,.22)] max-[600px]:col-auto" type="submit">
                                Submit enquiry <Send className="w-4" />
                            </button>
                        </form>
                        {submitted && (
                            <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-[#b9dfcf] bg-[#eaf7f1] p-3.5 text-[#236c52] [&_svg]:mt-0.5 [&_svg]:w-4">
                                <CheckCircle2 />
                                <span className="flex flex-col"><b className="text-[11px]">Enquiry submitted successfully</b><small className="mt-1 text-[9px]">Our travel desk will contact you shortly.</small></span>
                            </div>
                        )}
                    </div>
                </section>
            </main>
            <Footer />
        </>
    );
}

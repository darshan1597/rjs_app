import { useState } from "react";
import { ArrowRight, CalendarDays, Check, MapPin, Search, Star, X,} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";

const packages = [
    {
        slug: "coorg",
        name: "Coorg Escape",
        place: "Coorg",
        days: "3 Days · 2 Nights",
        price: "₹12,999",
        rating: "4.9",
        image: "https://images.unsplash.com/photo-1593693411515-c20261bcad6e?auto=format&fit=crop&w=1200&q=85",
    },
    {
        slug: "ooty",
        name: "Ooty Hills",
        place: "Ooty",
        days: "3 Days · 2 Nights",
        price: "₹14,499",
        rating: "4.8",
        image: "https://images.unsplash.com/photo-1589136777351-fdc9c9cab193?auto=format&fit=crop&w=1200&q=85",
    },
    {
        slug: "goa",
        name: "Goa Getaway",
        place: "Goa",
        days: "4 Days · 3 Nights",
        price: "₹18,999",
        rating: "4.9",
        image: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=85",
    },
    {
        slug: "mysuru",
        name: "Royal Mysuru",
        place: "Mysuru",
        days: "2 Days · 1 Night",
        price: "₹8,499",
        rating: "4.7",
        image: "https://images.unsplash.com/photo-1600112356915-089abb8fc71a?auto=format&fit=crop&w=1200&q=85",
    },
    {
        slug: "chikmagalur",
        name: "Chikmagalur Trails",
        place: "Chikmagalur",
        days: "3 Days · 2 Nights",
        price: "₹13,799",
        rating: "4.8",
        image: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=85",
    },
];

export default function Packages() {
    const navigate = useNavigate();
    const [query, setQuery] = useState("");
    const filteredPackages = packages.filter((pkg) =>
        `${pkg.name} ${pkg.place}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
    );
    return (
        <>
            <Navbar />
            <main className="min-h-screen bg-[#f7f8fa]">
                <section className="mx-auto w-[min(1200px,calc(100%-48px))] pt-20 pb-[95px] max-[650px]:w-[min(1200px,calc(100%-28px))] max-[600px]:pt-[60px]">
                    <div className="mb-8 flex items-end justify-between max-[600px]:block">
                        <div>
                            <span className="text-[9px] font-extrabold tracking-[1.5px] text-[#a4770d]">10 PACKAGES</span>
                            <h2 className="my-[9px] mb-[5px] font-[Manrope] text-[42px] leading-[1.1] font-bold tracking-[-2px] text-[var(--navy)]">Find your next escape</h2>
                        </div>
                        <div className="m-0 flex h-[52px] w-[430px] max-w-[45%] items-center gap-[10px] rounded-[11px] border border-[#dce1e7] bg-white px-3.5 shadow-[0_7px_22px_rgba(8,28,59,.055)] transition-all duration-200 focus-within:border-[#b98408] focus-within:shadow-[0_0_0_3px_rgba(238,178,27,.13),0_9px_25px_rgba(8,28,59,.07)] max-[600px]:mt-5 max-[600px]:w-full max-[600px]:max-w-none [&>svg]:w-[18px] [&>svg]:text-[#9a7210]">
                            <Search />
                            <input
                                className="w-full border-0 bg-transparent text-xs text-[var(--ink)] outline-0 placeholder:text-[#9ca4af]"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search by destination or package name..."
                                aria-label="Search packages"
                            />
                            {query && (
                                <button className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-full border-0 bg-[#f0f2f5] text-[#697484] hover:bg-[var(--navy)] hover:text-white [&_svg]:w-[13px]" onClick={() => setQuery("")} aria-label="Clear search">
                                    <X />
                                </button>
                            )}
                        </div>
                    </div>
                    {filteredPackages.length ? (
                        <div className="grid grid-cols-3 gap-[18px] max-[900px]:grid-cols-2 max-[600px]:grid-cols-1">
                            {filteredPackages.map((pkg) => (
                                <article
                                    className="cursor-pointer border border-[var(--line)] bg-white transition-all duration-300 hover:-translate-y-[5px] hover:shadow-[0_18px_42px_rgba(8,28,59,.1)] [&:hover_img]:scale-[1.04]"
                                    key={pkg.name}
                                    onClick={() => navigate(`/packages/${pkg.slug}`)}
                                >
                                    <div className="relative h-[235px] overflow-hidden max-[600px]:h-[220px]">
                                        <img className="h-full w-full object-cover transition-transform duration-500" src={pkg.image} alt={pkg.name} />
                                        <span className="absolute top-3 right-3 flex items-center gap-1 bg-white px-2 py-1.5 text-[9px] font-bold [&_svg]:w-3 [&_svg]:text-[#e1a600]">
                                            <Star fill="currentColor" />
                                            {pkg.rating}
                                        </span>
                                    </div>
                                    <div className="p-5 [&>p]:flex [&>p]:items-center [&>p]:gap-1.5 [&>p]:text-[10px] [&>p]:text-[#777f8d] [&>small]:flex [&>small]:items-center [&>small]:gap-1.5 [&>small]:text-[10px] [&>small]:text-[#777f8d] [&>small_svg]:w-[13px] [&>small_svg]:text-[#a6780b] [&>p_svg]:w-[13px] [&>p_svg]:text-[#a6780b]">
                                        <small>
                                            <MapPin />
                                            {pkg.place}
                                        </small>
                                        <h3 className="my-[7px] font-[Manrope] text-[21px] font-bold text-[var(--navy)]">{pkg.name}</h3>
                                        <p>
                                            <CalendarDays />
                                            {pkg.days}
                                        </p>
                                        <div className="mt-[15px] flex gap-3 border-t border-[var(--line)] pt-[13px]">
                                            <span className="flex items-center gap-1 text-[8px] text-[#647081] [&_svg]:w-[11px] [&_svg]:text-[#2b8261]">
                                                <Check />
                                                Private vehicle
                                            </span>
                                            <span className="flex items-center gap-1 text-[8px] text-[#647081] [&_svg]:w-[11px] [&_svg]:text-[#2b8261]">
                                                <Check />
                                                Driver allowance
                                            </span>
                                        </div>
                                        <div className="mt-[17px] flex items-end justify-between">
                                            <span className="flex flex-col text-[7px] text-[#8c95a1]">
                                                FROM <b className="font-[Manrope] text-lg font-extrabold text-[var(--navy)]">{pkg.price}</b>
                                            </span>
                                            <button className="flex items-center gap-[7px] border-0 bg-[var(--gold)] px-3 py-[10px] text-[9px] font-extrabold text-[var(--navy)] [&_svg]:w-[13px]">
                                                View package <ArrowRight />
                                            </button>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    ) : (
                        <div className="border border-[var(--line)] bg-white px-[25px] py-[70px] text-center [&>svg]:h-[34px] [&>svg]:w-[34px] [&>svg]:text-[#a77a0d]">
                            <Search />
                            <h3 className="mt-[13px] mb-[5px] font-[Manrope] text-xl font-bold text-[var(--navy)]">No packages found</h3>
                            <p className="text-[11px] text-[#7b8593]">Try searching for Coorg, Goa, Ooty or another destination.</p>
                            <button className="mt-2 border-0 bg-[var(--gold)] px-3.5 py-[10px] text-[10px] font-extrabold text-[var(--navy)]" onClick={() => setQuery("")}>Clear search</button>
                        </div>
                    )}
                </section>
            </main>
            <Footer />
        </>
    );
}

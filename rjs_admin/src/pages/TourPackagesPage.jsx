import { useEffect, useState } from "react";
import {
    LuChevronLeft,
    LuChevronRight,
    LuClock3,
    LuMapPin,
    LuPencil,
    LuPlus,
    LuSearch,
} from "react-icons/lu";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../components/AdminLayout.jsx";
import { get, patch } from "../services/api.js";
const tone = {
    PUBLISHED: "bg-emerald-50 text-emerald-700",
    DRAFT: "bg-amber-50 text-amber-700",
    ARCHIVED: "bg-slate-100 text-slate-500",
};
export default function TourPackagesPage() {
    const navigate = useNavigate();
    const [items, setItems] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [page, setPage] = useState(1);
    const [query, setQuery] = useState("");
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    useEffect(() => {
        const timer = setTimeout(() => {
            setPage(1);
            setSearch(query);
        }, 350);
        return () => clearTimeout(timer);
    }, [query]);
    async function load() {
        setLoading(true);
        setError("");
        try {
            const params = new URLSearchParams({ page, limit: 9 });
            if (search) params.set("search", search);
            if (status) params.set("status", status);
            const data = await get(`/admin/tour-packages?${params}`);
            setItems(data.items);
            setPagination(data.pagination);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }
    useEffect(() => {
        load();
    }, [page, search, status]);
    async function changeStatus(item, next) {
        try {
            await patch(`/admin/tour-packages/${item._id}`, { status: next });
            await load();
        } catch (e) {
            setError(e.message);
        }
    }
    return (
        <AdminLayout>
            <main className="mx-auto max-w-[1500px] p-4 sm:p-6 lg:p-7">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="mb-1 text-[10px] font-bold tracking-[1.8px] text-blue-600">
                            CATALOG MANAGEMENT
                        </p>
                        <h1 className="text-3xl font-black">Tour Packages</h1>
                        <p className="mt-1 text-[11px] text-slate-500">
                            Create and publish curated trips shown in the customer app.
                        </p>
                    </div>
                    <button
                        onClick={() => navigate("/tour-packages/add")}
                        className="flex h-11 items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 text-[11px] font-extrabold text-white shadow-lg shadow-orange-200 cursor-pointer"
                    >
                        <LuPlus />
                        Add package
                    </button>
                </div>
                <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center">
                        <div>
                            <h2 className="text-sm font-extrabold">Package catalog</h2>
                            <p className="text-[9px] text-slate-400">
                                {pagination?.total || 0} packages
                            </p>
                        </div>
                        <div className="relative sm:ml-auto sm:w-72">
                            <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-[10px] outline-none"
                                placeholder="Search package or city"
                            />
                        </div>
                        <select
                            value={status}
                            onChange={(e) => {
                                setStatus(e.target.value);
                                setPage(1);
                            }}
                            className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-[9px]"
                        >
                            <option value="">All statuses</option>
                            <option>DRAFT</option>
                            <option>PUBLISHED</option>
                            <option>ARCHIVED</option>
                        </select>
                    </div>
                    {error && (
                        <p className="m-5 rounded-xl bg-red-50 p-3 text-[10px] font-bold text-red-600">
                            {error}
                        </p>
                    )}
                    <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
                        {loading ? (
                            Array.from({ length: 6 }, (_, i) => (
                                <div
                                key={i}
                                className="h-72 animate-pulse rounded-2xl bg-slate-100"
                                />
                            ))
                        ) : items.length === 0 ? (
                            <div className="col-span-full py-16 text-center text-[10px] text-slate-400">
                                No tour packages found. Add the first package to begin.
                            </div>
                        ) : (
                            items.map((item) => (
                                <article
                                    key={item._id}
                                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:shadow-lg"
                                >
                                    <div className="relative h-36 bg-gradient-to-br from-blue-100 to-emerald-50">
                                        {item.coverImageUrl ? (
                                            <img
                                                src={item.coverImageUrl}
                                                alt=""
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <div className="grid h-full place-items-center text-[10px] text-slate-400">
                                                Cover image preview
                                            </div>
                                        )}
                                        <span
                                            className={`absolute left-3 top-3 rounded-full px-2 py-1 text-[8px] font-bold ${tone[item.status]}`}
                                        >
                                            {item.status}
                                        </span>
                                        {item.featured && (
                                            <span className="absolute right-3 top-3 rounded-full bg-orange-500 px-2 py-1 text-[8px] font-bold text-white">
                                                Featured
                                            </span>
                                        )}
                                    </div>
                                    <div className="p-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="text-[8px] font-bold text-blue-600">
                                                    {item.badge}
                                                </p>
                                                <h3 className="mt-1 text-base font-black">
                                                    {item.title}
                                                </h3>
                                            </div>
                                            <b className="text-base text-orange-500">
                                                ₹{item.price.toLocaleString("en-IN")}
                                            </b>
                                        </div>
                                        <p className="mt-2 line-clamp-2 min-h-8 text-[9px] leading-4 text-slate-500">
                                            {item.shortDescription}
                                        </p>
                                        <div className="mt-3 flex gap-4 text-[8px] font-bold text-slate-500">
                                            <span className="flex items-center gap-1">
                                                <LuClock3 />
                                                {item.durationLabel}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <LuMapPin />
                                                {item.distanceKm} KM
                                            </span>
                                        </div>
                                        <div className="mt-4 flex gap-2">
                                            <button
                                                onClick={() =>
                                                    navigate(`/tour-packages/${item._id}/edit`)
                                                }
                                                className="flex h-9 flex-1 items-center justify-center gap-2 rounded-lg border border-blue-200 text-[9px] font-bold text-blue-600"
                                            >
                                                <LuPencil />
                                                Edit
                                            </button>
                                            <select
                                                value={item.status}
                                                onChange={(e) => changeStatus(item, e.target.value)}
                                                className="h-9 rounded-lg border border-slate-200 px-2 text-[8px] font-bold"
                                            >
                                                <option>DRAFT</option>
                                                <option>PUBLISHED</option>
                                                <option>ARCHIVED</option>
                                            </select>
                                        </div>
                                    </div>
                                </article>
                            ))
                        )}
                    </div>
                    {pagination?.pages > 1 && (
                        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4 text-[9px] text-slate-500">
                            <span>
                                Page {pagination.page} of {pagination.pages}
                            </span>
                            <div className="flex gap-2">
                                    <button
                                    disabled={page <= 1}
                                    onClick={() => setPage(page - 1)}
                                    className="grid h-8 w-8 place-items-center rounded-lg border disabled:opacity-30"
                                >
                                    <LuChevronLeft />
                                </button>
                                <button
                                    disabled={page >= pagination.pages}
                                    onClick={() => setPage(page + 1)}
                                    className="grid h-8 w-8 place-items-center rounded-lg border disabled:opacity-30"
                                >
                                    <LuChevronRight />
                                </button>
                            </div>
                        </div>
                    )}
                </section>
            </main>
        </AdminLayout>
    );
}

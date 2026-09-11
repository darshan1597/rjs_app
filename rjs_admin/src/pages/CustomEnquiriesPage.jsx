import { useEffect, useState } from "react";
import {
    LuChevronLeft,
    LuChevronRight,
    LuClipboardPenLine,
    LuPlus,
    LuSearch,
} from "react-icons/lu";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../components/AdminLayout.jsx";
import { get } from "../services/api.js";
const tone = {
    DRAFT: "bg-slate-100 text-slate-600",
    QUOTED: "bg-blue-50 text-blue-600",
    CONFIRMED: "bg-emerald-50 text-emerald-600",
    CANCELLED: "bg-red-50 text-red-600",
};
export default function CustomEnquiriesPage() {
    const nav = useNavigate();
    const [items, setItems] = useState([]),
        [pagination, setPagination] = useState(null),
        [page, setPage] = useState(1),
        [query, setQuery] = useState(""),
        [search, setSearch] = useState(""),
        [status, setStatus] = useState(""),
        [loading, setLoading] = useState(true),
        [error, setError] = useState("")
    ;
    useEffect(() => {
        const t = setTimeout(() => {
            setPage(1);
            setSearch(query);
        }, 350);
        return () => clearTimeout(t);
    }, [query]);
    useEffect(() => {
        let active = true;
        setLoading(true);
        const p = new URLSearchParams({ page, limit: 10 });
        if (search) p.set("search", search);
        if (status) p.set("status", status);
        get(`/admin/enquiries?${p}`)
        .then((d) => {
            if (active) {
                setItems(d.items);
                setPagination(d.pagination);
                setError("");
            }
        })
        .catch((e) => active && setError(e.message))
        .finally(() => active && setLoading(false));
        return () => {
        active = false;
        };
    }, [page, search, status]);
    return (
        <AdminLayout>
            <main className="mx-auto max-w-[1500px] p-4 sm:p-6 lg:p-7">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end">
                    <div>
                        <p className="text-[10px] font-bold tracking-[1.8px] text-blue-600">
                            OFFLINE SALES
                        </p>
                        <h1 className="text-3xl font-black">Custom enquiries</h1>
                        <p className="mt-1 text-[11px] text-slate-500">
                            Manage office and phone enquiries, quotations and booking
                            conversions.
                        </p>
                    </div>
                    <button
                        onClick={() => nav("/custom-enquiries/add")}
                        className="flex h-11 items-center gap-2 rounded-xl bg-orange-500 px-5 text-[10px] font-extrabold text-white sm:ml-auto cursor-pointer"
                    >
                        <LuPlus />
                        New enquiry
                    </button>
                </div>
                <section className="overflow-hidden rounded-2xl border bg-white shadow-sm">
                    <div className="flex flex-col gap-3 border-b p-5 sm:flex-row">
                        <div className="relative sm:w-80">
                            <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search name, phone, ID or place"
                                className="h-10 w-full rounded-xl border bg-slate-50 pl-9 pr-3 text-[10px]"
                            />
                        </div>
                        <select
                            value={status}
                            onChange={(e) => {
                                setStatus(e.target.value);
                                setPage(1);
                            }}
                            className="h-10 rounded-xl border bg-slate-50 px-3 text-[10px]"
                        >
                            <option value="">All statuses</option>
                            {Object.keys(tone).map((x) => (
                                <option key={x}>{x}</option>
                            ))}
                        </select>
                    </div>
                    {error && (
                        <p className="m-5 rounded-xl bg-red-50 p-3 text-[10px] font-bold text-red-600">
                            {error}
                        </p>
                    )}
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[900px] text-left text-[10px]">
                            <thead className="bg-slate-50 text-[8px] uppercase text-slate-400">
                                <tr>
                                    {[
                                        "Enquiry",
                                        "Customer",
                                        "Route",
                                        "Schedule",
                                        "Vehicle",
                                        "Quote",
                                        "Status",
                                    ].map((x) => (
                                        <th key={x} className="px-5 py-3">
                                            {x}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    Array.from({ length: 5 }, (_, i) => (
                                        <tr key={i}>
                                        <td colSpan="7" className="border-t p-3">
                                            <div className="h-12 animate-pulse rounded bg-slate-100" />
                                        </td>
                                        </tr>
                                    ))
                                ) : items.length ? (
                                    items.map((x) => (
                                        <tr
                                        key={x._id}
                                        onClick={() => nav(`/custom-enquiries/${x._id}`)}
                                        className="cursor-pointer border-t hover:bg-slate-50"
                                        >
                                        <td className="px-5 py-4 font-bold text-blue-600">
                                            {x.enquiryNumber}
                                        </td>
                                        <td className="px-5 py-4">
                                            <b>{x.customer.name}</b>
                                            <small className="block text-slate-400">
                                            {x.customer.phone}
                                            </small>
                                        </td>
                                        <td className="max-w-64 px-5 py-4">
                                            <b className="block truncate">
                                            {x.locations[0]?.address}
                                            </b>
                                            <small className="block truncate text-slate-400">
                                            to {x.locations.at(-1)?.address} ·{" "}
                                            {x.locations.length - 2} stops
                                            </small>
                                        </td>
                                        <td className="px-5 py-4">
                                            {new Date(x.startDate).toLocaleDateString("en-IN")}
                                            <small className="block text-slate-400">
                                            {x.numberOfDays} day(s)
                                            </small>
                                        </td>
                                        <td className="px-5 py-4">
                                            {x.categoryId?.name}
                                            <small className="block text-slate-400">
                                            {x.variantId?.name}
                                            </small>
                                        </td>
                                        <td className="px-5 py-4 font-black">
                                            ₹{x.estimatedPrice.toLocaleString("en-IN")}
                                        </td>
                                        <td className="px-5 py-4">
                                            <span
                                            className={`rounded-full px-2 py-1 text-[8px] font-bold ${tone[x.status]}`}
                                            >
                                            {x.status}
                                            </span>
                                        </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan="7"
                                            className="py-16 text-center text-slate-400"
                                        >
                                            <LuClipboardPenLine className="mx-auto mb-2 text-3xl" />
                                            No enquiries found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {pagination?.pages > 1 && (
                        <div className="flex justify-between border-t p-4 text-[9px]">
                            <span>
                                Page {pagination.page} of {pagination.pages}
                            </span>
                            <div className="flex gap-2">
                                <button
                                    disabled={page <= 1}
                                    onClick={() => setPage(page - 1)}
                                    className="grid h-8 w-8 place-items-center rounded border disabled:opacity-30"
                                >
                                    <LuChevronLeft />
                                </button>
                                <button
                                    disabled={page >= pagination.pages}
                                    onClick={() => setPage(page + 1)}
                                    className="grid h-8 w-8 place-items-center rounded border disabled:opacity-30"
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

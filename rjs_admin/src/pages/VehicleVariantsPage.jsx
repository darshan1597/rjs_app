import { useEffect, useState } from "react";
import { LuArrowLeft, LuCarFront, LuPlus, LuSave, LuSearch } from "react-icons/lu";
import { useNavigate, useParams } from "react-router-dom";
import AdminLayout from "../components/AdminLayout.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import { get, patch } from "../services/api.js";
export default function VehicleVariantsPage() {
    const navigate = useNavigate(),
        { categoryId } = useParams()
    ;
    const [category, setCategory] = useState(null),
        [items, setItems] = useState([]),
        [query, setQuery] = useState(""),
        [loading, setLoading] = useState(true),
        [error, setError] = useState(""),
        [confirm, setConfirm] = useState(null),
        [acting, setActing] = useState(false),
        [prices, setPrices] = useState({}),
        [savingPrice, setSavingPrice] = useState("")
    ;
    async function load() {
        setLoading(true);
        try {
            const data = await get(
                `/admin/vehicles/categories/${categoryId}/variants?limit=100&search=${encodeURIComponent(query)}`,
            );
            setCategory(data.category);
            setItems(data.items);
            setError("");
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }
    useEffect(() => {
        const timer = setTimeout(load, 300);
        return () => clearTimeout(timer);
    }, [categoryId, query]);
    async function toggle() {
        if (!confirm) return;
        setActing(true);
        try {
            const data = await patch(
                `/admin/vehicles/categories/${categoryId}/variants/${confirm._id}/status`,
                { isActive: !confirm.isActive },
            );
            setItems((all) =>
                all.map((x) => (x._id === confirm._id ? data.variant : x)),
            );
            setConfirm(null);
        } catch (e) {
            setError(e.message);
        } finally {
            setActing(false);
        }
    }
    async function savePrice(item) {
        const value = Number(prices[item._id] ?? item.onRoadPrice);
        if (!Number.isFinite(value) || value <= 0) {
            setError("Enter a valid on-road vehicle price.");
            return;
        }
        setSavingPrice(item._id);
        try {
            const data = await patch(
                `/admin/vehicles/categories/${categoryId}/variants/${item._id}/price`,
                { onRoadPrice: value },
            );
            setItems((all) => all.map((x) => x._id === item._id ? data.variant : x));
            setPrices((all) => ({ ...all, [item._id]: data.variant.onRoadPrice }));
            setError("");
        } catch (e) {
            setError(e.message);
        } finally {
            setSavingPrice("");
        }
    }
    return (
        <AdminLayout>
            <main className="mx-auto max-w-[1500px] p-4 sm:p-6 lg:p-7">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end">
                    <button
                        onClick={() => navigate("/vehicles")}
                        className="grid h-11 w-11 place-items-center rounded-xl border bg-white shadow-sm cursor-pointer"
                    >
                        <LuArrowLeft />
                    </button>
                    <div>
                        <p className="text-[10px] font-bold tracking-[1.8px] text-blue-600">
                            VEHICLE CATEGORY
                        </p>
                        <h1 className="text-3xl font-black">
                            {category?.name || "Variants"}
                        </h1>
                        <p className="text-[11px] text-slate-500">
                            Manage the selectable variants inside this category.
                        </p>
                    </div>
                    <button
                        onClick={() =>
                        navigate(`/vehicles/categories/${categoryId}/variants/add`)
                        }
                        className="flex h-11 items-center gap-2 rounded-xl bg-orange-500 px-5 text-[11px] font-extrabold text-white shadow-lg shadow-orange-200 sm:ml-auto cursor-pointer"
                    >
                        <LuPlus />
                        Add variant
                    </button>
                </div>
                    <div className="mb-5 flex max-w-md items-center gap-3 rounded-xl border bg-white px-4 shadow-sm">
                    <LuSearch className="text-slate-400" />
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search variants"
                        className="h-11 w-full text-[11px] outline-none"
                    />
                </div>
                {error && (
                    <p className="mb-4 rounded-xl bg-red-50 p-3 text-[10px] font-semibold text-red-600">
                        {error}
                    </p>
                )}
                <section className="overflow-hidden rounded-2xl border bg-white shadow-sm">
                    <div className="grid grid-cols-[100px_1fr_150px_100px] gap-4 border-b bg-slate-50 px-5 py-3 text-[9px] font-bold uppercase tracking-wider text-slate-400">
                        <span>Image</span>
                        <span>Variant</span>
                        <span>On-road price</span>
                        <span>Status</span>
                    </div>
                    {loading ? (
                        Array.from({ length: 4 }, (_, i) => (
                            <div
                                key={i}
                                className="m-4 h-20 animate-pulse rounded-xl bg-slate-100"
                            />
                        ))
                    ) : items.length ? (
                        items.map((item) => (
                            <div
                                key={item._id}
                                className="grid grid-cols-[100px_1fr_150px_100px] items-center gap-4 border-b px-5 py-4 last:border-0"
                            >
                                <div className="grid h-16 w-24 place-items-center rounded-xl bg-slate-50 p-2">
                                    <img
                                        src={item.photoUrl}
                                        alt={item.name}
                                        className="h-full w-full object-contain"
                                    />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <input type="number" min="1" value={prices[item._id] ?? item.onRoadPrice ?? ""} onChange={(e) => setPrices((all) => ({ ...all, [item._id]: e.target.value }))} placeholder="On-road price" className="h-9 w-28 rounded-lg border bg-slate-50 px-2 text-[9px] outline-none focus:border-blue-400" />
                                        <button disabled={savingPrice === item._id} onClick={() => savePrice(item)} title="Save on-road price" className="grid h-9 w-9 place-items-center rounded-lg bg-blue-600 text-white disabled:opacity-50 cursor-pointer"><LuSave /></button>
                                    </div>
                                    <p className="mt-1 text-[8px] text-slate-400">{!item.onRoadPrice ? "Required for local rides" : item.onRoadPrice <= 1000000 ? "₹100 base · ₹24/km" : item.onRoadPrice <= 1500000 ? "₹115 base · ₹28/km" : "₹130 base · ₹32/km"}</p>
                                </div>
                                <div>
                                    <h2 className="text-sm font-black">{item.name}</h2>
                                    <p className="mt-1 text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                                        {item.code}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setConfirm(item)}
                                    className={`rounded-full px-3 py-2 text-[9px] font-extrabold cursor-pointer ${item.isActive ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"}`}
                                >
                                    {item.isActive ? "Active" : "Inactive"}
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className="py-20 text-center text-slate-400">
                            <LuCarFront className="mx-auto mb-3 text-4xl" />
                            No variants added yet.
                        </div>
                    )}
                </section>
                <ConfirmDialog
                    open={Boolean(confirm)}
                    loading={acting}
                    tone={confirm?.isActive ? "danger" : "warning"}
                    title={confirm?.isActive ? "Deactivate variant?" : "Activate variant?"}
                    description={confirm?.isActive
                        ? `${confirm?.name} will stop appearing as an available vehicle option for new assignments and bookings.`
                        : `${confirm?.name} will become available when its parent category is active.`}
                    confirmLabel={confirm?.isActive ? "Deactivate" : "Activate"}
                    onCancel={() => setConfirm(null)}
                    onConfirm={toggle}
                />
            </main>
        </AdminLayout>
    );
}

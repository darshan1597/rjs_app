import { useEffect, useMemo, useState } from "react";
import {
  LuCalculator,
    LuCalendarDays,
    LuCarFront,
    LuCircleCheck,
    LuMapPin,
    LuPlus,
    LuTrash2,
    LuUserRound,
} from "react-icons/lu";
import AdminLayout from "../components/AdminLayout.jsx";
import { useNavigate, useParams } from "react-router-dom";
import { get, post, put } from "../services/api.js";
const input = "mt-2 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-[10px] outline-none focus:border-blue-400";
export default function CustomEnquiryPage() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [form, setForm] = useState({
        name: "",
        phone: "",
        email: "",
        startDate: "",
        numberOfDays: 1,
        passengerCount: 1,
        estimatedDistanceKm: "",
        ratePerKm: "",
        dailyCharge: "",
        extraCharges: "0",
        notes: "",
    });
    const [locations, setLocations] = useState(["", ""]);
    const [categories, setCategories] = useState([]),
        [categoryId, setCategoryId] = useState(""),
        [variants, setVariants] = useState([]),
        [variantId, setVariantId] = useState(""),
        [loading, setLoading] = useState(true),
        [saving, setSaving] = useState(false),
        [error, setError] = useState(""),
        [created, setCreated] = useState(null),
        [pendingVariantId, setPendingVariantId] = useState("")
    ;
    const change = (key) => (e) => setForm({ ...form, [key]: e.target.value });
    useEffect(() => {
        get("/admin/vehicles/categories?limit=100")
        .then((d) => setCategories(d.items.filter((x) => x.isActive)))
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
    }, []);
    useEffect(() => {
        if (!id) return;
        get(`/admin/enquiries/${id}`).then(({ enquiry }) => {
            setForm({
                name: enquiry.customer.name,
                phone: enquiry.customer.phone,
                email: enquiry.customer.email || "",
                startDate: new Date(enquiry.startDate).toISOString().slice(0, 16),
                numberOfDays: enquiry.numberOfDays,
                passengerCount: enquiry.passengerCount,
                estimatedDistanceKm: enquiry.estimatedDistanceKm || "",
                ratePerKm: enquiry.pricing?.ratePerKm || "",
                dailyCharge: enquiry.pricing?.dailyCharge || "",
                extraCharges: enquiry.pricing?.extraCharges || "0",
                notes: enquiry.notes || "",
            });
            setLocations([...enquiry.locations].sort((a,b) => a.order-b.order).map((x) => x.address));
            setPendingVariantId(enquiry.variantId._id);
            setCategoryId(enquiry.categoryId._id);
        }).catch((e) => setError(e.message));
    }, [id]);
    useEffect(() => {
        setVariantId("");
        setVariants([]);
        if (categoryId)
        get(`/admin/vehicles/categories/${categoryId}/variants?limit=100`)
            .then((d) => {
                setVariants(d.items.filter((x) => x.isActive));
                if (pendingVariantId) {
                    setVariantId(pendingVariantId);
                    setPendingVariantId("");
                }
            })
            .catch((e) => setError(e.message));
    }, [categoryId]);
    const estimate = useMemo(() => {
        const distance = Number(form.estimatedDistanceKm) || 0,
        rate = Number(form.ratePerKm) || 0,
        days = Number(form.numberOfDays) || 1,
        daily = Number(form.dailyCharge) || 0,
        extra = Number(form.extraCharges) || 0;
        return distance * rate + days * daily + extra;
    }, [form]);
    function setLocation(index, value) {
        setLocations((all) => all.map((item, i) => (i === index ? value : item)));
    }
    function removeLocation(index) {
        if (locations.length > 2)
        setLocations((all) => all.filter((_, i) => i !== index));
    }
    async function submit(e) {
        e.preventDefault();
        setError("");
        if (locations.some((x) => x.trim().length < 2))
        return setError("Complete every location field.");
        if (!variantId) return setError("Choose a vehicle variant.");
        if (estimate <= 0)
        return setError("Enter pricing details to calculate an estimated quote.");
        setSaving(true);
        try {
            const payload = {
                customer: { name: form.name, phone: form.phone, email: form.email },
                locations: locations.map((address, order) => ({ address, order })),
                startDate: form.startDate,
                numberOfDays: Number(form.numberOfDays),
                passengerCount: Number(form.passengerCount),
                categoryId,
                variantId,
                estimatedDistanceKm:
                form.estimatedDistanceKm === ""
                    ? undefined
                    : Number(form.estimatedDistanceKm),
                estimatedPrice: estimate,
                pricing: {
                    ratePerKm: Number(form.ratePerKm) || 0,
                    dailyCharge: Number(form.dailyCharge) || 0,
                    extraCharges: Number(form.extraCharges) || 0,
                },
                notes: form.notes,
            };
            const data = id
                ? await put(`/admin/enquiries/${id}`, payload)
                : await post("/admin/enquiries", payload);
            if (id) navigate(`/custom-enquiries/${id}`, { replace: true });
            else setCreated(data.enquiry);
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    }
    return (
        <AdminLayout>
            <main className="mx-auto max-w-[1300px] p-4 sm:p-6 lg:p-7">
                <div className="mb-6">
                    <p className="text-[10px] font-bold tracking-[1.8px] text-blue-600">
                        OFFLINE CUSTOMER ENQUIRY
                    </p>
                    <h1 className="text-3xl font-black">{id ? "Edit custom trip quote" : "Create custom trip quote"}</h1>
                    <p className="mt-1 text-[11px] text-slate-500">
                        For customers calling RJS or visiting the office. Maps and automatic
                        routing can be connected later.
                    </p>
                </div>
                {created ? (
                    <section className="mx-auto max-w-xl rounded-3xl border bg-white p-10 text-center shadow-sm">
                        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-50 text-3xl text-emerald-600">
                            <LuCircleCheck />
                        </span>
                        <h2 className="mt-5 text-2xl font-black">Quote created</h2>
                        <p className="mt-2 text-sm text-slate-500">
                            {created.enquiryNumber}
                        </p>
                        <p className="mt-5 text-3xl font-black text-orange-500">
                            ₹{created.estimatedPrice.toLocaleString("en-IN")}
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="mt-7 h-11 rounded-xl bg-blue-600 px-6 text-[10px] font-extrabold text-white"
                        >
                            Create another enquiry
                        </button>
                    </section>
                ) : (
                    <form
                        onSubmit={submit}
                        className="grid gap-5 xl:grid-cols-[1fr_360px]"
                    >
                        <div className="space-y-5">
                            <Panel title="Customer details" icon={LuUserRound}>
                                <div className="grid gap-4 md:grid-cols-3">
                                    <Field label="Customer name">
                                        <input
                                            required
                                            value={form.name}
                                            onChange={change("name")}
                                            className={input}
                                        />
                                    </Field>
                                    <Field label="Phone number">
                                        <input
                                            required
                                            value={form.phone}
                                            onChange={change("phone")}
                                            className={input}
                                        />
                                    </Field>
                                    <Field label="Email (optional)">
                                        <input
                                            type="email"
                                            value={form.email}
                                            onChange={change("email")}
                                            className={input}
                                        />
                                    </Field>
                                </div>
                            </Panel>
                            <Panel title="Trip route" icon={LuMapPin}>
                                <p className="mb-4 text-[9px] text-slate-400">
                                    Add as many stops as required. The first is pickup and the
                                    last is drop.
                                </p>
                                <div className="space-y-3">
                                    {locations.map((location, index) => (
                                        <div key={index} className="flex items-center gap-3">
                                            <span
                                                className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-[9px] font-black ${index === 0 ? "bg-orange-50 text-orange-600" : index === locations.length - 1 ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-500"}`}
                                            >
                                                {index + 1}
                                            </span>
                                            <input
                                                required
                                                value={location}
                                                onChange={(e) => setLocation(index, e.target.value)}
                                                placeholder={
                                                index === 0
                                                    ? "Pickup location"
                                                    : index === locations.length - 1
                                                    ? "Final drop location"
                                                    : `Stop ${index}`
                                                }
                                                className="h-11 flex-1 rounded-xl border bg-slate-50 px-4 text-[10px] outline-none focus:border-blue-400"
                                            />
                                            {locations.length > 2 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeLocation(index)}
                                                    className="grid h-10 w-10 place-items-center rounded-xl bg-red-50 text-red-500 cursor-pointer"
                                                >
                                                    <LuTrash2 />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setLocations((all) => [...all.slice(0, -1), "", all.at(-1)])
                                    }
                                    className="mt-4 flex h-10 items-center gap-2 rounded-xl border border-blue-200 px-4 text-[9px] font-bold text-blue-600 cursor-pointer"
                                >
                                    <LuPlus />
                                    Add another stop
                                </button>
                            </Panel>
                            <Panel title="Schedule and passengers" icon={LuCalendarDays}>
                                <div className="grid gap-4 md:grid-cols-3">
                                    <Field label="Journey start">
                                        <input
                                            required
                                            type="datetime-local"
                                            value={form.startDate}
                                            onChange={change("startDate")}
                                            className={input}
                                        />
                                    </Field>
                                    <Field label="Number of days">
                                        <input
                                            required
                                            min="1"
                                            type="number"
                                            value={form.numberOfDays}
                                            onChange={change("numberOfDays")}
                                            className={input}
                                        />
                                    </Field>
                                    <Field label="Passengers">
                                        <input
                                            required
                                            min="1"
                                            type="number"
                                            value={form.passengerCount}
                                            onChange={change("passengerCount")}
                                            className={input}
                                        />
                                    </Field>
                                </div>
                            </Panel>
                            <Panel title="Choose vehicle" icon={LuCarFront}>
                                {loading ? (
                                    <div className="h-24 animate-pulse rounded-xl bg-slate-100" />
                                ) : (
                                    <>
                                        <div className="flex flex-wrap gap-2">
                                            {categories.map((item) => (
                                                <button
                                                    key={item._id}
                                                    type="button"
                                                    onClick={() => setCategoryId(item._id)}
                                                    className={`rounded-xl border px-4 py-3 text-[10px] font-bold cursor-pointer ${categoryId === item._id ? "border-blue-500 bg-blue-50 text-blue-600" : "border-slate-200"}`}
                                                >
                                                    {item.name}
                                                </button>
                                            ))}
                                        </div>
                                        {categoryId && (
                                            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                                {variants.map((item) => (
                                                    <button
                                                        key={item._id}
                                                        type="button"
                                                        onClick={() => setVariantId(item._id)}
                                                        className={`flex items-center gap-3 rounded-xl border p-3 text-left cursor-pointer ${variantId === item._id ? "border-orange-500 bg-orange-50" : "border-slate-200"}`}
                                                    >
                                                        <img
                                                            src={item.photoUrl}
                                                            className="h-12 w-20 object-contain"
                                                        />
                                                        <b className="text-[11px]">{item.name}</b>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                )}
                            </Panel>
                        </div>
                        <aside className="space-y-5">
                            <Panel title="Quote calculator" icon={LuCalculator}>
                                <p className="rounded-lg bg-amber-50 p-3 text-[9px] leading-4 text-amber-700">
                                    Distance is entered manually until route maps are integrated.
                                </p>
                                <Field label="Estimated total distance (km)">
                                    <input
                                        min="0"
                                        step="0.1"
                                        type="number"
                                        value={form.estimatedDistanceKm}
                                        onChange={change("estimatedDistanceKm")}
                                        className={input}
                                    />
                                </Field>
                                <Field label="Rate per km">
                                    <input
                                        min="0"
                                        type="number"
                                        value={form.ratePerKm}
                                        onChange={change("ratePerKm")}
                                        className={input}
                                    />
                                </Field>
                                <Field label="Driver/daily charge">
                                    <input
                                        min="0"
                                        type="number"
                                        value={form.dailyCharge}
                                        onChange={change("dailyCharge")}
                                        className={input}
                                    />
                                </Field>
                                <Field label="Tolls, parking and other charges">
                                    <input
                                        min="0"
                                        type="number"
                                        value={form.extraCharges}
                                        onChange={change("extraCharges")}
                                        className={input}
                                    />
                                </Field>
                                <div className="mt-5 rounded-2xl bg-slate-950 p-5 text-white">
                                    <p className="text-[9px] text-slate-400">
                                        Estimated customer price
                                    </p>
                                    <b className="mt-1 block text-3xl">
                                        ₹{estimate.toLocaleString("en-IN")}
                                    </b>
                                    <small className="text-[8px] text-slate-400">
                                        Distance × rate + days × daily charge + extras
                                    </small>
                                </div>
                                <Field label="Internal notes">
                                    <textarea
                                        value={form.notes}
                                        onChange={change("notes")}
                                        className="mt-2 h-24 w-full rounded-xl border bg-slate-50 p-3 text-[10px]"
                                    />
                                </Field>
                            </Panel>
                            {error && (
                                <p className="rounded-xl bg-red-50 p-4 text-[10px] font-bold text-red-600">
                                    {error}
                                </p>
                            )}
                            <button
                                disabled={saving}
                                className="h-12 w-full rounded-xl bg-orange-500 text-[11px] font-extrabold text-white shadow-lg shadow-orange-200 disabled:opacity-50 cursor-pointer"
                            >
                                {saving ? "Creating quote..." : "Save custom quote"}
                            </button>
                        </aside>
                    </form>
                )}
            </main>
        </AdminLayout>
    );
}
function Panel({ title, icon: Icon, children }) {
    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-5 flex items-center gap-2 text-sm font-black">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-50 text-blue-600">
                    <Icon />
                </span>
                {title}
            </h2>
            {children}
        </section>
    );
}
function Field({ label, children }) {
    return (
        <label className="mt-4 block text-[10px] font-bold text-slate-700">
            {label}
            {children}
        </label>
    );
}

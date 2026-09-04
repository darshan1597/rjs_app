import { useEffect, useState } from "react";
import { LuArrowLeft, LuCheck, LuImagePlus, LuPlus, LuTrash2 } from "react-icons/lu";
import { useNavigate, useParams } from "react-router-dom";
import AdminLayout from "../components/AdminLayout.jsx";
import { get, patch, post, upload } from "../services/api.js";
const blank = {
    title: "",
    slug: "",
    badge: "One Day Tour",
    shortDescription: "",
    heroSubtitle: "",
    about: "",
    originCity: "Bengaluru",
    durationLabel: "",
    durationMinutes: "",
    distanceKm: "",
    price: "",
    coverImageUrl: "",
    gallery: [],
    idealFor: "1 - 4 People",
    driverLabel: "Included",
    vehicleLabel: "Any Car",
    vehicleDescription: "Sedan / Hatchback / SUV",
    vehicleTraits: ["AC", "Clean & Sanitized", "Well Maintained"],
    vehicleTypes: ["CAR"],
    inclusions: ["Car", "Driver", "Fuel", "Toll & Parking", "Taxes"],
    inclusionDetails: [
        { title: "Car", subtitle: "AC Vehicle" },
        { title: "Driver", subtitle: "Experienced" },
        { title: "Fuel", subtitle: "Included" },
        { title: "Toll & Parking", subtitle: "Included" },
        { title: "Taxes", subtitle: "All Taxes" },
    ],
    places: [{ name: "", time: "", description: "", imageUrl: "" }],
    itineraryNote: "The above is a suggested itinerary. Timings may vary based on your preference.",
    notes: [
        "Package price is for the entire vehicle, not per person.",
        "Entry tickets, personal expenses and meals are not included.",
        "Extra kilometre charges apply beyond the package limit.",
        "Pickup and drop will be at the same location.",
    ],
    safetyTitle: "Safe & Trusted",
    safetyMessage: "Your safety is our priority",
    priceNote: "All taxes included",
    freeCancellationHours: 24,
    featured: false,
    status: "DRAFT",
};
const input =
    "mt-2 h-11 w-full rounded-xl border border-slate-200 px-4 text-[10px] font-normal outline-none focus:border-blue-500";
function Field({ label, children, className = "" }) {
    return (
        <label className={`block text-[10px] font-bold ${className}`}>
            {label}
            {children}
        </label>
    );
}
function ImagePicker({ label, value, onChange, width, height, multiple = false }) {
    const [uploading, setUploading] = useState(false);
    const values = multiple ? value : value ? [value] : [];
    async function choose(event) {
        const files = [...event.target.files];
        if (!files.length) return;
        setUploading(true);
        try {
            const uploaded = [];
            for (const file of files) {
                const body = new FormData();
                body.append("image", file);
                const result = await upload("/admin/media/tour-package-image", body);
                uploaded.push(result.url);
            }
            onChange(multiple ? [...values, ...uploaded] : uploaded[0]);
        } finally {
            setUploading(false);
            event.target.value = "";
        }
    }
    return <div>
        <p className="text-[10px] font-bold">{label}</p>
        <p className="mt-1 text-[8px] text-slate-400">Recommended {width} × {height}px · JPG, PNG or WebP · Max 8 MB</p>
        <div className="mt-2 flex flex-wrap gap-3">
            {values.map((url, index) => <div key={`${url}-${index}`} className="group relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50" style={{ aspectRatio: `${width}/${height}`, width: multiple ? 130 : 220 }}><img src={url} alt="Uploaded preview" className="h-full w-full object-cover"/><button type="button" onClick={() => onChange(multiple ? values.filter((_, i) => i !== index) : "")} className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-lg bg-white/90 text-red-500 shadow"><LuTrash2/></button></div>)}
            <label className="flex min-h-24 w-40 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-blue-300 bg-blue-50 text-blue-600"><LuImagePlus className="text-xl"/><b className="mt-2 text-[9px]">{uploading ? "Uploading..." : multiple ? "Add images" : value ? "Replace image" : "Choose image"}</b><input disabled={uploading} type="file" accept="image/jpeg,image/png,image/webp" multiple={multiple} onChange={choose} className="hidden"/></label>
        </div>
    </div>;
}
export default function TourPackageEditorPage() {
    const { id } = useParams();
    const editing = Boolean(id);
    const navigate = useNavigate();
    const [form, setForm] = useState(blank);
    const [loading, setLoading] = useState(editing);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    useEffect(() => {
        if (!id) return;
        get(`/admin/tour-packages/${id}`)
        .then((data) => setForm({ ...blank, ...data }))
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
    }, [id]);
    const set = (key, value) => setForm((old) => ({ ...old, [key]: value }));
    const place = (index, key, value) =>
        setForm((old) => ({
            ...old,
            places: old.places.map((item, i) =>
                i === index ? { ...item, [key]: value } : item,
            ),
        }));
    function toggleVehicle(value) {
        set(
            "vehicleTypes",
            form.vehicleTypes.includes(value)
                ? form.vehicleTypes.filter((x) => x !== value)
                : [...form.vehicleTypes, value],
        );
    }
    async function submit(e) {
        e.preventDefault();
        setSaving(true);
        setError("");
        try {
            const payload = {
                ...form,
                durationMinutes: Number(form.durationMinutes),
                distanceKm: Number(form.distanceKm),
            price: Number(form.price),
            freeCancellationHours: Number(form.freeCancellationHours),
            };
            delete payload._id;
            delete payload.__v;
            delete payload.createdAt;
            delete payload.updatedAt;
            delete payload.createdBy;
            delete payload.updatedBy;
            if (editing) await patch(`/admin/tour-packages/${id}`, payload);
            else await post("/admin/tour-packages", payload);
            navigate("/tour-packages", { replace: true });
        } catch (e) {
            setError(e.message);
        } finally {
            setSaving(false);
        }
    }
    return (
        <AdminLayout>
            <main className="mx-auto max-w-[1100px] p-4 sm:p-6 lg:p-7">
                <div className="mb-6 flex items-center gap-4">
                    <button
                        onClick={() => navigate("/tour-packages")}
                        className="grid h-11 w-11 place-items-center rounded-xl border border-slate-200 bg-white cursor-pointer"
                    >
                        <LuArrowLeft />
                    </button>
                    <div>
                        <p className="text-[9px] font-bold tracking-[1.5px] text-blue-600">
                            TOUR PACKAGE
                        </p>
                        <h1 className="text-2xl font-black">
                            {editing ? "Edit package" : "Add package"}
                        </h1>
                        <p className="text-[10px] text-slate-500">
                            This information will be shown in the customer app.
                        </p>
                    </div>
                </div>
                {loading ? (
                    <div className="h-96 animate-pulse rounded-2xl bg-white" />
                ) : (
                    <form onSubmit={submit} className="space-y-4">
                        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            <h2 className="mb-5 text-sm font-black">Package information</h2>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Field label="Package title">
                                    <input
                                        required
                                        value={form.title}
                                        onChange={(e) => {
                                        set("title", e.target.value);
                                        if (!editing)
                                            set(
                                                "slug",
                                                e.target.value
                                                    .toLowerCase()
                                                    .trim()
                                                    .replace(/[^a-z0-9]+/g, "-")
                                                    .replace(/(^-|-$)/g, ""),
                                            );
                                        }}
                                        className={input}
                                    />
                                </Field>
                                <Field label="URL slug">
                                    <input
                                        required
                                        value={form.slug}
                                        onChange={(e) => set("slug", e.target.value)}
                                        className={input}
                                    />
                                </Field>
                                <Field label="Badge">
                                    <input
                                        required
                                        value={form.badge}
                                        onChange={(e) => set("badge", e.target.value)}
                                        className={input}
                                        placeholder="One Day or 2 Days / 1 Night"
                                    />
                                </Field>
                                <Field label="Origin city">
                                    <input
                                        required
                                        value={form.originCity}
                                        onChange={(e) => set("originCity", e.target.value)}
                                        className={input}
                                    />
                                </Field>
                                <Field label="Short description" className="sm:col-span-2">
                                    <input
                                        required
                                        value={form.shortDescription}
                                        onChange={(e) => set("shortDescription", e.target.value)}
                                        className={input}
                                    />
                                </Field>
                                <Field label="Hero subtitle" className="sm:col-span-2">
                                    <input
                                        required
                                        value={form.heroSubtitle}
                                        onChange={(e) => set("heroSubtitle", e.target.value)}
                                        className={input}
                                        placeholder="Explore the best of Bangalore in a day"
                                    />
                                </Field>
                                <Field label="About this tour" className="sm:col-span-2">
                                    <textarea
                                        required
                                        value={form.about}
                                        onChange={(e) => set("about", e.target.value)}
                                        className={`${input} h-28 py-3`}
                                    />
                                </Field>
                                <Field label="Duration label">
                                    <input
                                        required
                                        value={form.durationLabel}
                                        onChange={(e) => set("durationLabel", e.target.value)}
                                        className={input}
                                        placeholder="8 Hours"
                                    />
                                </Field>
                                <Field label="Duration in minutes">
                                    <input
                                        required
                                        min="60"
                                        type="number"
                                        value={form.durationMinutes}
                                        onChange={(e) => set("durationMinutes", e.target.value)}
                                        className={input}
                                    />
                                </Field>
                                <Field label="Distance (KM)">
                                    <input
                                        required
                                        min="1"
                                        type="number"
                                        value={form.distanceKm}
                                        onChange={(e) => set("distanceKm", e.target.value)}
                                        className={input}
                                    />
                                </Field>
                                <Field label="Package price">
                                    <input
                                        required
                                        min="0"
                                        type="number"
                                        value={form.price}
                                        onChange={(e) => set("price", e.target.value)}
                                        className={input}
                                    />
                                </Field>
                                <Field label="Ideal for">
                                    <input required value={form.idealFor} onChange={(e) => set("idealFor", e.target.value)} className={input} placeholder="1 - 4 People" />
                                </Field>
                                <Field label="Driver display">
                                    <input required value={form.driverLabel} onChange={(e) => set("driverLabel", e.target.value)} className={input} placeholder="Included" />
                                </Field>
                                <div className="sm:col-span-2"><ImagePicker label="Hero cover image" value={form.coverImageUrl} onChange={(value) => set("coverImageUrl", value)} width={1392} height={600} /></div>
                                <div className="sm:col-span-2"><ImagePicker label="Package gallery" value={form.gallery} onChange={(value) => set("gallery", value)} width={1392} height={600} multiple /></div>
                            </div>
                            <div className="mt-5">
                                <p className="text-[10px] font-bold">Allowed vehicle types</p>
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {["CAR", "TEMPO_TRAVELLER", "BUS"].map((value) => (
                                        <button
                                            type="button"
                                            key={value}
                                            onClick={() => toggleVehicle(value)}
                                            className={`rounded-xl border px-4 py-2 text-[9px] font-bold ${form.vehicleTypes.includes(value) ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-200"}`}
                                        >
                                            {value.replaceAll("_", " ")}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </section>
                        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            <h2 className="text-sm font-black">Vehicle, inclusions and booking details</h2>
                            <p className="mb-5 mt-1 text-[9px] text-slate-400">These values appear below the itinerary and in the booking bar.</p>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Field label="Vehicle heading"><input required value={form.vehicleLabel} onChange={(e) => set("vehicleLabel", e.target.value)} className={input} /></Field>
                                <Field label="Vehicle description"><input required value={form.vehicleDescription} onChange={(e) => set("vehicleDescription", e.target.value)} className={input} /></Field>
                                <Field label="Vehicle traits" className="sm:col-span-2"><input required value={form.vehicleTraits.join(", ")} onChange={(e) => set("vehicleTraits", e.target.value.split(",").map((x) => x.trim()).filter(Boolean))} className={input} placeholder="AC, Clean & Sanitized, Well Maintained" /></Field>
                                <Field label="Price note"><input required value={form.priceNote} onChange={(e) => set("priceNote", e.target.value)} className={input} /></Field>
                                <Field label="Free cancellation (hours)"><input required min="0" type="number" value={form.freeCancellationHours} onChange={(e) => set("freeCancellationHours", e.target.value)} className={input} /></Field>
                                <Field label="Safety title"><input required value={form.safetyTitle} onChange={(e) => set("safetyTitle", e.target.value)} className={input} /></Field>
                                <Field label="Safety message"><input required value={form.safetyMessage} onChange={(e) => set("safetyMessage", e.target.value)} className={input} /></Field>
                                <Field label="Important notes" className="sm:col-span-2"><textarea required value={form.notes.join("\n")} onChange={(e) => set("notes", e.target.value.split("\n").map((x) => x.trim()).filter(Boolean))} className={`${input} h-28 py-3`} placeholder="One note per line" /></Field>
                            </div>
                            <h3 className="mb-3 mt-6 text-[10px] font-black">Tour inclusion cards</h3>
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {form.inclusionDetails.map((item, index) => <div key={index} className="rounded-xl border border-slate-200 p-3"><input required value={item.title} onChange={(e) => set("inclusionDetails", form.inclusionDetails.map((x, i) => i === index ? { ...x, title: e.target.value } : x))} className={input} placeholder="Title" /><input required value={item.subtitle} onChange={(e) => set("inclusionDetails", form.inclusionDetails.map((x, i) => i === index ? { ...x, subtitle: e.target.value } : x))} className={input} placeholder="Subtitle" /></div>)}
                            </div>
                        </section>
                        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="mb-4 flex items-center justify-between">
                                <div>
                                    <h2 className="text-sm font-black">
                                        Places visitors will see
                                    </h2>
                                    <p className="text-[9px] text-slate-400">
                                        Shown as the vertical itinerary in package details.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() =>
                                        set("places", [
                                        ...form.places,
                                        { name: "", time: "", description: "", imageUrl: "" },
                                        ])
                                    }
                                    className="flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-2 text-[9px] font-bold text-blue-600 cursor-pointer"
                                >
                                    <LuPlus />
                                    Add place
                                </button>
                            </div>
                            <div className="space-y-3">
                                {form.places.map((item, index) => (
                                    <div
                                        key={index}
                                        className="rounded-xl border border-slate-200 p-4"
                                    >
                                        <div className="grid gap-3 sm:grid-cols-2">
                                            <Field label={`Place ${index + 1}`}>
                                                <input
                                                    required
                                                    value={item.name}
                                                    onChange={(e) => place(index, "name", e.target.value)}
                                                    className={input}
                                                />
                                            </Field>
                                            <Field label="Suggested time">
                                                <input
                                                    required
                                                    value={item.time}
                                                    onChange={(e) => place(index, "time", e.target.value)}
                                                    className={input}
                                                    placeholder="9:00 AM - 9:45 AM"
                                                />
                                            </Field>
                                            <Field label="Description" className="sm:col-span-2">
                                                <textarea
                                                    required
                                                    value={item.description}
                                                    onChange={(e) =>
                                                        place(index, "description", e.target.value)
                                                    }
                                                    className={`${input} h-20 py-3`}
                                                />
                                            </Field>
                                            <div className="sm:col-span-2"><ImagePicker label="Place image" value={item.imageUrl} onChange={(value) => place(index, "imageUrl", value)} width={600} height={600} /></div>
                                        </div>
                                        {form.places.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                set(
                                                    "places",
                                                    form.places.filter((_, i) => i !== index),
                                                )
                                                }
                                                className="mt-3 flex items-center gap-1 text-[9px] font-bold text-red-500 cursor-pointer"
                                            >
                                                <LuTrash2 />
                                                Remove place
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <Field label="Itinerary footer note" className="mt-4">
                                <input required value={form.itineraryNote} onChange={(e) => set("itineraryNote", e.target.value)} className={input} />
                            </Field>
                        </section>
                        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            <h2 className="mb-4 text-sm font-black">Publishing</h2>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Field label="Status">
                                    <select
                                        value={form.status}
                                        onChange={(e) => set("status", e.target.value)}
                                        className={input}
                                    >
                                        <option>DRAFT</option>
                                        <option>PUBLISHED</option>
                                        <option>ARCHIVED</option>
                                    </select>
                                </Field>
                                <label className="mt-6 flex items-center gap-3 rounded-xl bg-orange-50 p-3 text-[10px] font-bold">
                                    <input
                                        type="checkbox"
                                        checked={form.featured}
                                        onChange={(e) => set("featured", e.target.checked)}
                                    />
                                    Feature this package in the customer app
                                </label>
                            </div>
                        </section>
                        {error && (
                            <p className="rounded-xl bg-red-50 p-4 text-[10px] font-bold text-red-600">
                                {error}
                            </p>
                        )}
                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => navigate("/tour-packages")}
                                className="h-11 rounded-xl border border-slate-200 px-6 text-[10px] font-bold cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                disabled={saving || form.vehicleTypes.length === 0}
                                className="flex h-11 items-center gap-2 rounded-xl bg-orange-500 px-6 text-[10px] font-bold text-white disabled:opacity-50 cursor-pointer"
                            >
                                <LuCheck />
                                {saving
                                ? "Saving..."
                                : editing
                                    ? "Save changes"
                                    : "Create package"}
                            </button>
                        </div>
                    </form>
                )}
            </main>
        </AdminLayout>
    );
}

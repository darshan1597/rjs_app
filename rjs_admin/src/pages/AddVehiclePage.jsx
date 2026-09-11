import { useEffect, useState } from "react";
import { LuArrowLeft, LuImagePlus, LuSave, LuX } from "react-icons/lu";
import { useNavigate, useParams } from "react-router-dom";
import AdminLayout from "../components/AdminLayout.jsx";
import { get, post, upload } from "../services/api.js";
export default function AddVehiclePage({ variant = false }) {
  const navigate = useNavigate(),
    { categoryId } = useParams();
  const [category, setCategory] = useState(null),
    [name, setName] = useState(""),
    [onRoadPrice, setOnRoadPrice] = useState(""),
    [file, setFile] = useState(null),
    [preview, setPreview] = useState(""),
    [saving, setSaving] = useState(false),
    [error, setError] = useState("");
  const code = name
    .trim()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toUpperCase();
  useEffect(() => {
    if (variant)
      get(`/admin/vehicles/categories/${categoryId}`)
        .then((d) => setCategory(d.category))
        .catch((e) => setError(e.message));
  }, [variant, categoryId]);
  useEffect(() => {
    if (!file) {
      setPreview("");
      return undefined;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  const back = variant ? `/vehicles/categories/${categoryId}` : "/vehicles";
  async function save(e) {
    e.preventDefault();
    setError("");
    if (name.trim().length < 2) return setError("Enter a name.");
    if (code.length < 2) return setError("Enter a valid name.");
    if (variant && (!Number.isFinite(Number(onRoadPrice)) || Number(onRoadPrice) <= 0))
      return setError("Enter a valid on-road vehicle price.");
    if (!file) return setError("Choose an image.");
    setSaving(true);
    try {
      const form = new FormData();
      form.append("image", file);
      const media = await upload("/admin/media/vehicle-image", form);
      await post(
        variant
          ? `/admin/vehicles/categories/${categoryId}/variants`
          : "/admin/vehicles/categories",
        {
          name: name.trim(),
          code,
          photoUrl: media.url,
          isActive: true,
          ...(variant ? { onRoadPrice: Number(onRoadPrice) } : {}),
        },
      );
      navigate(back, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }
  return (
    <AdminLayout>
      <main className="mx-auto max-w-4xl p-4 sm:p-6 lg:p-7">
        <div className="mb-6 flex items-center gap-4">
          <button
            onClick={() => navigate(back)}
            className="grid h-11 w-11 place-items-center rounded-xl border bg-white shadow-sm cursor-pointer"
          >
            <LuArrowLeft />
          </button>
          <div>
            <p className="text-[10px] font-bold tracking-[1.8px] text-blue-600">
              VEHICLE MANAGEMENT
            </p>
            <h1 className="text-3xl font-black">
              Add {variant ? "variant" : "category"}
            </h1>
            <p className="text-[11px] text-slate-500">
              {variant
                ? `Add a variant under ${category?.name || "this category"}`
                : "Add a main vehicle type such as Car or Bus"}
            </p>
          </div>
        </div>
        <form
          onSubmit={save}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-5">
              <label className="block">
                <span className="mb-2 block text-[10px] font-bold">Name</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={variant ? "e.g. Sedan" : "e.g. Car"}
                  className="h-12 w-full rounded-xl border bg-slate-50 px-4 text-[11px] outline-none focus:border-blue-400"
                />
              </label>
              {variant && (
                <label className="block">
                  <span className="mb-2 block text-[10px] font-bold">
                    On-road vehicle price (₹)
                  </span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={onRoadPrice}
                    onChange={(e) => setOnRoadPrice(e.target.value)}
                    placeholder="e.g. 1200000"
                    className="h-12 w-full rounded-xl border bg-slate-50 px-4 text-[11px] outline-none focus:border-blue-400"
                  />
                  <small className="mt-2 block text-[9px] text-slate-400">
                    The local fare band is selected automatically from this value.
                  </small>
                </label>
              )}
              <label className="block">
                <span className="mb-2 block text-[10px] font-bold">
                  Internal code (generated automatically)
                </span>
                <input
                  value={code}
                  readOnly
                  placeholder="Generated from the name"
                  className="h-12 w-full cursor-not-allowed rounded-xl border bg-slate-100 px-4 text-[11px] font-bold uppercase text-slate-500 outline-none"
                />
                <small className="mt-2 block text-[9px] text-slate-400">
                  Employees do not need to enter this. It lets the apps identify
                  this vehicle even if its displayed name changes later.
                </small>
              </label>
            </div>
            <div>
              <span className="mb-2 block text-[10px] font-bold">
                Master image
              </span>
              {preview ? (
                <div className="relative grid h-56 place-items-center rounded-2xl border bg-slate-50 p-5">
                  <img
                    src={preview}
                    alt="Preview"
                    className="h-full w-full object-contain"
                  />
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-slate-900 text-white"
                  >
                    <LuX />
                  </button>
                </div>
              ) : (
                <label className="flex h-56 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed bg-slate-50">
                  <LuImagePlus className="text-3xl text-blue-600" />
                  <strong className="mt-3 text-[11px]">
                    Choose transparent vehicle image
                  </strong>
                  <span className="mt-1 text-[9px] text-slate-400">
                    PNG or WebP preferred · maximum 8 MB
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                </label>
              )}
              <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-[9px] leading-5 text-blue-700">
                <strong className="block text-[10px]">
                  Required canvas: 1200 × 800 px (3:2)
                </strong>
                Use a transparent background, centre the complete vehicle, and leave
                about 10% empty space around every side. This master image will be
                reused across the website, customer app and driver app.
              </div>
            </div>
          </div>
          {error && (
            <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-[10px] font-semibold text-red-600">
              {error}
            </p>
          )}
          <div className="mt-6 flex justify-end gap-3 border-t pt-5">
            <button
              type="button"
              onClick={() => navigate(back)}
              className="h-11 rounded-xl border px-5 text-[10px] font-bold cursor-pointer"
            >
              Cancel
            </button>
            <button
              disabled={saving}
              className="flex h-11 items-center gap-2 rounded-xl bg-orange-500 px-6 text-[10px] font-extrabold text-white disabled:opacity-50 cursor-pointer"
            >
              <LuSave />
              {saving ? "Saving..." : `Add ${variant ? "variant" : "category"}`}
            </button>
          </div>
        </form>
      </main>
    </AdminLayout>
  );
}

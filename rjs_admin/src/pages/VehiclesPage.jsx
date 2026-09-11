import { useEffect, useState } from "react";
import {
  LuCarFront,
  LuChevronLeft,
  LuChevronRight,
  LuPlus,
  LuSearch,
} from "react-icons/lu";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../components/AdminLayout.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import { get, patch } from "../services/api.js";
export default function VehiclesPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]),
    [pagination, setPagination] = useState(null),
    [query, setQuery] = useState(""),
    [search, setSearch] = useState(""),
    [page, setPage] = useState(1),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [confirm, setConfirm] = useState(null),
    [acting, setActing] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      setSearch(query);
    }, 350);
    return () => clearTimeout(timer);
  }, [query]);
  useEffect(() => {
    let active = true;
    setLoading(true);
    get(
      `/admin/vehicles/categories?page=${page}&limit=12&search=${encodeURIComponent(search)}`,
    )
      .then((data) => {
        if (active) {
          setItems(data.items);
          setPagination(data.pagination);
          setError("");
        }
      })
      .catch((e) => active && setError(e.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [page, search]);
  async function toggle() {
    if (!confirm) return;
    setActing(true);
    try {
      const data = await patch(
        `/admin/vehicles/categories/${confirm._id}/status`,
        { isActive: !confirm.isActive },
      );
      setItems((all) =>
        all.map((x) =>
          x._id === confirm._id ? { ...x, isActive: data.category.isActive } : x,
        ),
      );
      setConfirm(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setActing(false);
    }
  }
  return (
    <AdminLayout>
      <main className="mx-auto max-w-[1500px] p-4 sm:p-6 lg:p-7">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-1 text-[10px] font-bold tracking-[1.8px] text-blue-600">
              VEHICLE MANAGEMENT
            </p>
            <h1 className="text-3xl font-black">Vehicle categories</h1>
            <p className="mt-1 text-[11px] text-slate-500">
              Manage Car, Bus, Auto, Tempo Traveller and their variants.
            </p>
          </div>
          <button
            onClick={() => navigate("/vehicles/categories/add")}
            className="flex h-11 items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 text-[11px] font-extrabold text-white shadow-lg shadow-orange-200 cursor-pointer"
          >
            <LuPlus />
            Add category
          </button>
        </div>
        <div className="mb-5 flex max-w-md items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 shadow-sm">
          <LuSearch className="text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search categories"
            className="h-11 w-full text-[11px] outline-none"
          />
        </div>
        {error && (
          <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-[10px] font-semibold text-red-600">
            {error}
          </p>
        )}
        <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {loading ? (
            Array.from({ length: 6 }, (_, i) => (
              <div
                key={i}
                className="h-72 animate-pulse rounded-2xl bg-slate-100"
              />
            ))
          ) : items.length ? (
            items.map((item) => (
              <button
                key={item._id}
                onClick={() => navigate(`/vehicles/categories/${item._id}`)}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg cursor-pointer"
              >
                <div className="grid h-44 place-items-center bg-slate-50 p-5">
                  <img
                    src={item.photoUrl}
                    alt={item.name}
                    className="h-full w-full object-contain"
                  />
                </div>
                <div className="flex items-center gap-4 p-5">
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-black">{item.name}</h2>
                    <p className="mt-1 text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                      {item.code} · {item.variantCount || 0} variants
                    </p>
                  </div>
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirm(item);
                    }}
                    className={`rounded-full px-3 py-2 text-[9px] font-extrabold ${item.isActive ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"}`}
                  >
                    {item.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </button>
            ))
          ) : (
            <div className="col-span-full py-20 text-center text-slate-400">
              <LuCarFront className="mx-auto mb-3 text-4xl" />
              No vehicle categories found.
            </div>
          )}
        </section>
        {pagination?.pages > 1 && (
          <div className="mt-6 flex items-center justify-end gap-3 text-[10px] text-slate-500">
            <span>
              Page {pagination.page} of {pagination.pages}
            </span>
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="grid h-9 w-9 place-items-center rounded-lg border bg-white disabled:opacity-30"
            >
              <LuChevronLeft />
            </button>
            <button
              disabled={page >= pagination.pages}
              onClick={() => setPage(page + 1)}
              className="grid h-9 w-9 place-items-center rounded-lg border bg-white disabled:opacity-30"
            >
              <LuChevronRight />
            </button>
          </div>
        )}
        <ConfirmDialog
          open={Boolean(confirm)}
          loading={acting}
          tone={confirm?.isActive ? "danger" : "warning"}
          title={confirm?.isActive ? "Deactivate category?" : "Activate category?"}
          description={confirm?.isActive
            ? `${confirm?.name} and its variants will stop being available for new assignments and bookings.`
            : `${confirm?.name} will become available again. Individual inactive variants will remain inactive.`}
          confirmLabel={confirm?.isActive ? "Deactivate" : "Activate"}
          onCancel={() => setConfirm(null)}
          onConfirm={toggle}
        />
      </main>
    </AdminLayout>
  );
}

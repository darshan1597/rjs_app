import { useEffect, useState } from "react";
import {
  LuChevronLeft,
  LuChevronRight,
  LuEye,
  LuPlus,
  LuSearch,
} from "react-icons/lu";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../components/AdminLayout.jsx";
import { get, patch } from "../services/api.js";

const statusStyle = {
  ACTIVE: "bg-emerald-50 text-emerald-700",
  PENDING: "bg-amber-50 text-amber-700",
  SUSPENDED: "bg-red-50 text-red-700",
};
const vehicleName = {
  AUTO: "Auto",
  CAR: "Car",
  TEMPO_TRAVELLER: "Tempo Traveller",
  BUS: "Bus",
};

export default function DriversPage() {
  const navigate = useNavigate();
  const [drivers, setDrivers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      setDebounced(query);
    }, 350);
    return () => clearTimeout(timer);
  }, [query]);
  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await get(
        `/admin/drivers?page=${page}&limit=10&search=${encodeURIComponent(debounced)}${status ? `&status=${status}` : ""}`,
      );
      setDrivers(data.items);
      setPagination(data.pagination);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, [page, debounced, status]);
  async function changeStatus(driver, nextStatus) {
    try {
      await patch(`/admin/drivers/${driver.id}/status`, { status: nextStatus });
      await load();
    } catch (requestError) {
      setError(requestError.message);
    }
  }
  return (
    <AdminLayout>
      <main className="mx-auto max-w-[1500px] p-4 sm:p-6 lg:p-7">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-1 text-[10px] font-bold tracking-[1.8px] text-blue-600">
              DRIVER MANAGEMENT
            </p>
            <h1 className="text-3xl font-black">Drivers</h1>
            <p className="mt-1 text-[11px] text-slate-500">
              Register drivers and manage their approval and vehicle details.
            </p>
          </div>
          <button
            onClick={() => navigate("/drivers/add")}
            className="flex h-11 items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 text-[11px] font-extrabold text-white shadow-lg shadow-orange-200 cursor-pointer"
          >
            <LuPlus className="text-base" />
            Add driver
          </button>
        </div>
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-5 md:flex-row md:items-center">
            <div>
              <h2 className="text-sm font-extrabold">All drivers</h2>
              <p className="text-[9px] text-slate-400">
                {pagination?.total || 0} registered drivers
              </p>
            </div>
            <div className="relative md:ml-auto md:w-72">
              <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-4 text-[10px] outline-none focus:border-blue-400"
                placeholder="Search name, phone, ID or vehicle"
              />
            </div>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-[10px] outline-none"
            >
              <option value="">All statuses</option>
              <option value="PENDING">Pending</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>
          {error && (
            <p className="m-5 rounded-xl bg-red-50 px-4 py-3 text-[10px] font-semibold text-red-600">
              {error}
            </p>
          )}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-[10px]">
              <thead className="bg-slate-50 text-[8px] uppercase tracking-wider text-slate-400">
                <tr>
                  {[
                    "Driver",
                    "Driver ID",
                    "Vehicle",
                    "Licence",
                    "Status",
                    "Actions",
                  ].map((item) => (
                    <th key={item} className="px-5 py-3">
                      {item}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }, (_, i) => (
                    <tr key={i} className="border-t border-slate-100">
                      <td colSpan="6" className="px-5 py-3">
                        <div className="h-10 animate-pulse rounded-lg bg-slate-100" />
                      </td>
                    </tr>
                  ))
                ) : drivers.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="py-16 text-center text-slate-400"
                    >
                      No drivers found.
                    </td>
                  </tr>
                ) : (
                  drivers.map((driver) => (
                    <tr
                      key={driver.id}
                      className="border-t border-slate-100 hover:bg-slate-50"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span className="grid h-9 w-9 place-items-center rounded-full bg-blue-50 font-black text-blue-600">
                            {driver.personal.fullName[0]}
                          </span>
                          <div>
                            <b className="block">{driver.personal.fullName}</b>
                            <small className="text-[8px] text-slate-400">
                              {driver.personal.phone}
                            </small>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-bold text-blue-600">
                        {driver.driverCode}
                      </td>
                      <td className="px-5 py-4">
                        <b className="block">
                          {vehicleName[driver.vehicle.category]}
                        </b>
                        <small className="text-[8px] text-slate-400">
                          {driver.vehicle.registrationNumber}
                        </small>
                      </td>
                      <td className="px-5 py-4">{driver.licence.number}</td>
                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-2 py-1 text-[8px] font-bold ${statusStyle[driver.status]}`}
                        >
                          {driver.status}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => navigate(`/drivers/${driver.id}`)}
                            className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-blue-600 cursor-pointer"
                            title="View driver"
                          >
                            <LuEye />
                          </button>
                          <select
                            value={driver.status}
                            onChange={(e) =>
                              changeStatus(driver, e.target.value)
                            }
                            className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-[8px] font-bold"
                          >
                            <option value="PENDING">Pending</option>
                            <option value="ACTIVE">Activate</option>
                            <option value="SUSPENDED">Suspend</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {pagination?.pages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4 text-[9px] text-slate-500">
              <span>
                Page {pagination.page} of {pagination.pages} ·{" "}
                {pagination.total} drivers
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 disabled:opacity-30"
                >
                  <LuChevronLeft />
                </button>
                <button
                  disabled={page >= pagination.pages}
                  onClick={() => setPage(page + 1)}
                  className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 disabled:opacity-30"
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

import { useEffect, useState } from "react";
import {
  LuArrowLeft,
  LuCalendarDays,
  LuCarFront,
  LuCircleCheck,
  LuMapPin,
  LuPrinter,
  LuReceiptIndianRupee,
  LuUserRound,
} from "react-icons/lu";
import { useNavigate, useParams } from "react-router-dom";
import AdminLayout from "../components/AdminLayout.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import { get, patch, post } from "../services/api.js";
const tone = {
  DRAFT: "bg-slate-100 text-slate-600",
  QUOTED: "bg-blue-50 text-blue-600",
  CONFIRMED: "bg-emerald-50 text-emerald-600",
  CANCELLED: "bg-red-50 text-red-600",
};
export default function CustomEnquiryDetailsPage() {
    const nav = useNavigate(),
        { id } = useParams()
    ;
    const [data, setData] = useState(null),
        [error, setError] = useState(""),
        [confirm, setConfirm] = useState(null),
        [acting, setActing] = useState(false)
    ;
    async function load() {
        try {
            const d = await get(`/admin/enquiries/${id}`);
            setData(d.enquiry);
            setError("");
        } catch (e) {
            setError(e.message);
        }
    }
    useEffect(() => {
        load();
    }, [id]);
    async function act() {
        setActing(true);
        try {
            if (confirm === "convert") {
                const d = await post(`/admin/enquiries/${id}/convert`, {});
                setData({ ...data, bookingId: d.booking });
            } else {
                const d = await patch(`/admin/enquiries/${id}/status`, {
                    status: confirm,
                });
                setData({ ...data, status: d.enquiry.status });
            }
            setConfirm(null);
        } catch (e) {
            setError(e.message);
        } finally {
            setActing(false);
        }
    }
    if (!data)
        return (
            <AdminLayout>
                <main className="p-8">
                    {error ? (
                        <p className="text-red-600">{error}</p>
                    ) : (
                        <div className="h-72 animate-pulse rounded-2xl bg-slate-100" />
                    )}
                </main>
            </AdminLayout>
        );
    const p = data.pricing || {};
    return (
        <AdminLayout>
            <main className="mx-auto max-w-[1200px] p-4 sm:p-6 lg:p-7">
                <div className="mb-6 flex flex-wrap items-center gap-3">
                    <button
                        onClick={() => nav("/custom-enquiries")}
                        className="grid h-11 w-11 place-items-center rounded-xl border bg-white"
                    >
                        <LuArrowLeft />
                    </button>
                    <div>
                        <p className="text-[10px] font-bold text-blue-600">
                            {data.enquiryNumber}
                        </p>
                        <h1 className="text-3xl font-black">Custom quotation</h1>
                    </div>
                    <span
                        className={`ml-2 rounded-full px-3 py-2 text-[9px] font-bold ${tone[data.status]}`}
                    >
                        {data.status}
                    </span>
                    {!data.bookingId && (
                        <button
                            onClick={() => nav(`/custom-enquiries/${id}/edit`)}
                            className="ml-auto flex h-10 items-center gap-2 rounded-xl border bg-white px-4 text-[9px] font-bold"
                        >
                            <LuReceiptIndianRupee />
                            Edit quote
                        </button>
                    )}
                    <button
                        onClick={() => window.print()}
                        className={`${data.bookingId ? "ml-auto " : ""}flex h-10 items-center gap-2 rounded-xl border bg-white px-4 text-[9px] font-bold`}
                    >
                        <LuPrinter />
                        Print quotation
                    </button>
                </div>
                {error && (
                    <p className="mb-4 rounded-xl bg-red-50 p-3 text-[10px] font-bold text-red-600">
                        {error}
                    </p>
                )}
                <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
                    <div className="space-y-5">
                        <Panel title="Customer" icon={LuUserRound}>
                            <b>{data.customer.name}</b>
                            <p className="mt-1 text-[10px] text-slate-500">
                                {data.customer.phone}
                                {data.customer.email && ` Â· ${data.customer.email}`}
                            </p>
                        </Panel>
                        <Panel title="Route" icon={LuMapPin}>
                            <div className="space-y-3">
                                {[...data.locations]
                                .sort((a, b) => a.order - b.order)
                                .map((x, i) => (
                                    <div key={x._id || i} className="flex gap-3">
                                        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-blue-50 text-[9px] font-black text-blue-600">
                                            {i + 1}
                                        </span>
                                        <div>
                                            <b className="text-[10px]">
                                                {i === 0
                                                    ? "Pickup"
                                                    : i === data.locations.length - 1
                                                    ? "Final drop"
                                                    : `Stop ${i}`
                                                }
                                            </b>
                                            <p className="text-[10px] text-slate-500">
                                                {x.address}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Panel>
                        <Panel title="Trip information" icon={LuCalendarDays}>
                            <div className="grid grid-cols-2 gap-4 text-[10px]">
                                <Info
                                    label="Starts"
                                    value={new Date(data.startDate).toLocaleString("en-IN")}
                                />
                                <Info label="Duration" value={`${data.numberOfDays} day(s)`} />
                                <Info label="Passengers" value={data.passengerCount} />
                                <Info
                                    label="Estimated distance"
                                    value={
                                        data.estimatedDistanceKm
                                        ? `${data.estimatedDistanceKm} km`
                                        : "Not entered"
                                    }
                                />
                            </div>
                        </Panel>
                        <Panel title="Vehicle" icon={LuCarFront}>
                            <div className="flex items-center gap-4">
                                <img
                                    src={data.variantId?.photoUrl}
                                    className="h-20 w-32 object-contain"
                                />
                                <div>
                                    <b className="text-lg">{data.categoryId?.name}</b>
                                    <p className="text-[10px] text-slate-500">
                                        {data.variantId?.name}
                                    </p>
                                </div>
                            </div>
                        </Panel>
                        {data.notes && (
                            <Panel title="Notes" icon={LuReceiptIndianRupee}>
                                <p className="whitespace-pre-wrap text-[10px] leading-5 text-slate-600">
                                    {data.notes}
                                </p>
                            </Panel>
                        )}
                    </div>
                    <aside>
                        <Panel title="Price breakdown" icon={LuReceiptIndianRupee}>
                            <div className="space-y-3 text-[10px]">
                                <Row
                                    label={`${data.estimatedDistanceKm || 0} km × ₹${p.ratePerKm || 0}`}
                                    value={(data.estimatedDistanceKm || 0) * (p.ratePerKm || 0)}
                                />
                                <Row
                                    label={`${data.numberOfDays} day(s) × ₹${p.dailyCharge || 0}`}
                                    value={data.numberOfDays * (p.dailyCharge || 0)}
                                />
                                <Row label="Additional charges" value={p.extraCharges || 0} />
                                <div className="border-t pt-4">
                                    <p className="text-slate-500">Estimated total</p>
                                    <b className="text-3xl text-orange-500">
                                        ₹{data.estimatedPrice.toLocaleString("en-IN")}
                                    </b>
                                </div>
                            </div>
                        </Panel>
                        <div className="mt-5 space-y-2">
                            {!data.bookingId && data.status === "QUOTED" && (
                                <button
                                    onClick={() => setConfirm("CONFIRMED")}
                                    className="h-11 w-full rounded-xl bg-emerald-600 text-[10px] font-extrabold text-white"
                                >
                                    Mark customer confirmed
                                </button>
                            )}
                            {!data.bookingId && data.status === "CONFIRMED" && (
                                <button
                                    onClick={() => setConfirm("convert")}
                                    className="h-11 w-full rounded-xl bg-orange-500 text-[10px] font-extrabold text-white"
                                >
                                    Convert to booking
                                </button>
                            )}
                                {!data.bookingId && !["CANCELLED"].includes(data.status) && (
                                    <button
                                        onClick={() => setConfirm("CANCELLED")}
                                        className="h-11 w-full rounded-xl border border-red-200 text-[10px] font-bold text-red-600"
                                    >
                                        Cancel enquiry
                                    </button>
                                )
                            }
                            {data.bookingId && (
                                <button
                                    onClick={() =>
                                        nav(`/bookings/${data.bookingId._id || data.bookingId}`)
                                    }
                                    className="h-11 w-full rounded-xl bg-blue-600 text-[10px] font-extrabold text-white"
                                >
                                    <LuCircleCheck className="mr-2 inline" />
                                    View {data.bookingId.bookingNumber || "booking"}
                                </button>
                            )}
                        </div>
                    </aside>
                </div>
                <ConfirmDialog
                    open={Boolean(confirm)}
                    loading={acting}
                    tone={confirm === "CANCELLED" ? "danger" : "warning"}
                    title={
                        confirm === "convert"
                        ? "Convert to booking?"
                        : confirm === "CONFIRMED"
                            ? "Confirm customer acceptance?"
                            : "Cancel enquiry?"
                    }
                    description={
                        confirm === "convert"
                        ? "A scheduled booking will be created with manual driver assignment and pending online payment."
                        : confirm === "CONFIRMED"
                            ? "This records that the customer accepted the quoted price."
                            : "This enquiry will be marked as cancelled."
                    }
                    confirmLabel={
                        confirm === "convert"
                        ? "Create booking"
                        : confirm === "CONFIRMED"
                            ? "Confirm"
                            : "Cancel enquiry"
                    }
                    onCancel={() => setConfirm(null)}
                    onConfirm={act}
                />
            </main>
        </AdminLayout>
    );
}
function Panel({ title, icon: Icon, children }) {
    return (
        <section className="rounded-2xl border bg-white p-5 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-black">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-50 text-blue-600">
                    <Icon />
                </span>
                {title}
            </h2>
            {children}
        </section>
    );
}
function Info({ label, value }) {
    return (
        <div className="rounded-xl bg-slate-50 p-3">
            <small className="block text-[8px] text-slate-400">{label}</small>
            <b>{value}</b>
        </div>
    );
}
function Row({ label, value }) {
    return (
        <div className="flex justify-between">
            <span className="text-slate-500">{label}</span>
            <b>₹{Number(value).toLocaleString("en-IN")}</b>
        </div>
    );
}

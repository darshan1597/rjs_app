import { useEffect, useState } from "react";
import {
    LuArrowLeft,
    LuBanknote,
    LuCalendarClock,
    LuCarFront,
    LuMessageSquare,
    LuPhone,
    LuRoute,
    LuUserRound,
} from "react-icons/lu";
import { useNavigate, useParams } from "react-router-dom";
import AdminLayout from "../components/AdminLayout.jsx";
import { get, post } from "../services/api.js";

const money = (v) =>
    new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(v || 0)
;

const date = (v) =>
    v
        ? new Intl.DateTimeFormat("en-IN", {
            dateStyle: "medium",
            timeStyle: "short",
        }).format(new Date(v))
        : "—"
;

function Panel({ title, icon: Icon, children }) {
    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-black">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-blue-50 text-blue-600">
                    <Icon />
                </span>
                {title}
            </h2>
            {children}
        </section>
    );
}

function Item({ label, value }) {
    return (
        <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-[8px] uppercase text-slate-400">{label}</p>
            <b className="mt-1 block text-[10px]">{value || "—"}</b>
        </div>
    );
}

export default function BookingDetailsPage() {
    const { id } = useParams();
    const nav = useNavigate();
    const [data, setData] = useState(null);
    const [note, setNote] = useState("");
    const [error, setError] = useState("");
    async function load() {
        try {
            setData(await get(`/admin/bookings/${id}`));
        } catch (e) {
            setError(e.message);
        }
    }
    useEffect(() => {
        load();
    }, [id]);
    async function addNote() {
        if (!note.trim()) return;
        try {
            await post(`/admin/bookings/${id}/notes`, { text: note });
            setNote("");
            load();
        } catch (e) {
            setError(e.message);
        }
    }
    if (!data)
        return (
            <AdminLayout>
                <main className="p-7">
                    <div className="mx-auto h-96 max-w-6xl animate-pulse rounded-2xl bg-white" />
                    {error && <p>{error}</p>}
                </main>
            </AdminLayout>
        );
    const { booking, payment, refunds } = data;
    return (
        <AdminLayout>
            <main className="mx-auto max-w-[1250px] p-4 sm:p-6 lg:p-7">
                <div className="mb-6 flex items-center gap-4">
                    <button
                        onClick={() => nav("/bookings")}
                        className="grid h-11 w-11 place-items-center rounded-xl border bg-white"
                    >
                        <LuArrowLeft />
                    </button>
                    <div className="flex-1">
                        <p className="text-[9px] font-bold text-blue-600">
                            {booking.bookingNumber}
                        </p>
                        <h1 className="text-2xl font-black">Booking Details</h1>
                    </div>
                    <span className="rounded-full bg-blue-50 px-3 py-2 text-[9px] font-black text-blue-600">
                        {booking.status.replaceAll("_", " ")}
                    </span>
                </div>
                <div className="grid gap-4 lg:grid-cols-3">
                    <div className="space-y-4 lg:col-span-2">
                        <Panel title="Trip information" icon={LuRoute}>
                            <div className="grid gap-3 sm:grid-cols-2">
                                <Item
                                    label="Service"
                                    value={booking.serviceType.replaceAll("_", " ")}
                                />
                                <Item label="Assignment mode" value={booking.assignmentMode} />
                                <Item label="Pickup" value={booking.pickup.address} />
                                <Item
                                    label="Destination"
                                    value={
                                        booking.destination?.address ||
                                        booking.packageName ||
                                        "Hidden until trip starts"
                                    }
                                />
                                <Item label="Start" value={date(booking.scheduledStartAt)} />
                                <Item label="End" value={date(booking.scheduledEndAt)} />
                                <Item label="Passengers" value={booking.passengerCount} />
                                <Item
                                    label="Vehicle requested"
                                    value={booking.requestedVehicleType.replaceAll("_", " ")}
                                />
                            </div>
                        </Panel>
                        <Panel title="Driver assignment history" icon={LuCarFront}>
                            <div className="space-y-2">
                                {booking.assignments.length === 0 ? (
                                    <p className="py-6 text-center text-[9px] text-slate-400">
                                        No driver has been assigned.
                                    </p>
                                ) : (
                                    booking.assignments.map((a, i) => (
                                        <div key={i} className="rounded-xl border p-3">
                                            <b className="text-[10px]">
                                                {a.driverId?.personal?.fullName || "Driver"} ·{" "}
                                                {a.vehicleRegistrationNumber}
                                            </b>
                                            <p className="mt-1 text-[8px] text-slate-400">
                                                {a.method} · {date(a.assignedAt)}
                                                {a.reason ? ` · ${a.reason}` : ""}
                                            </p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </Panel>
                        <Panel title="Operational notes" icon={LuMessageSquare}>
                            <div className="space-y-2">
                                {booking.internalNotes?.map((n, i) => (
                                    <div key={i} className="rounded-xl bg-slate-50 p-3">
                                        <p className="text-[10px]">{n.text}</p>
                                        <small className="text-[8px] text-slate-400">
                                            {n.authorName} · {date(n.createdAt)}
                                        </small>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-3 flex gap-2">
                                <input
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    className="h-10 flex-1 rounded-xl border px-3 text-[10px]"
                                    placeholder="Add an internal note"
                                />
                                <button
                                    onClick={addNote}
                                    className="rounded-xl bg-blue-600 px-4 text-[9px] font-bold text-white"
                                >
                                    Add note
                                </button>
                            </div>
                        </Panel>
                    </div>
                    <div className="space-y-4">
                        <Panel title="Customer" icon={LuUserRound}>
                            <Item label="Name" value={booking.customer.name} />
                            <div className="mt-2">
                                <Item label="Phone" value={booking.customer.phone} />
                            </div>
                            <a
                                href={`tel:${booking.customer.phone}`}
                                className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-blue-50 p-3 text-[9px] font-bold text-blue-600"
                            >
                                <LuPhone />
                                Call customer
                            </a>
                        </Panel>
                        <Panel title="Payment" icon={LuBanknote}>
                            <div className="space-y-2">
                                <Item label="Amount" value={money(booking.totalAmount)} />
                                <Item label="Status" value={booking.paymentStatus} />
                                <Item
                                    label="Method"
                                    value={payment?.methodDisplay || booking.paymentMethod}
                                />
                                <Item
                                    label="Gateway reference"
                                    value={payment?.gatewayReference}
                                />
                            </div>
                        </Panel>
                        <Panel title="Refunds" icon={LuCalendarClock}>
                            {refunds.length === 0 ? (
                                <p className="text-[9px] text-slate-400">No refund records.</p>
                            ) : (
                                refunds.map((r) => (
                                    <div key={r._id} className="mb-2 rounded-xl bg-slate-50 p-3">
                                        <b className="text-[10px]">
                                            {money(r.eligibleAmount)} · {r.status}
                                        </b>
                                        <p className="text-[8px] text-slate-400">{r.reason}</p>
                                    </div>
                                ))
                            )}
                        </Panel>
                    </div>
                </div>
            </main>
        </AdminLayout>
    );
}

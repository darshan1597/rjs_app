import { useEffect, useState } from "react";
import {
    LuArrowLeft,
    LuBadgeCheck,
    LuBanknote,
    LuCalendarDays,
    LuCarFront,
    LuCircleCheck,
    LuClock3,
    LuFileText,
    LuEye,
    LuMail,
    LuMapPin,
    LuPhone,
    LuShieldAlert,
    LuUserRound,
} from "react-icons/lu";
import { useNavigate, useParams } from "react-router-dom";
import AdminLayout from "../components/AdminLayout.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import { get, patch } from "../services/api.js";
const money = (v) =>
    new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(v || 0)
;
const date = (v) =>
    v
        ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(
            new Date(v),
        )
        : "—"
;
const statusTone = {
    ACTIVE: "bg-emerald-50 text-emerald-700",
    PENDING: "bg-amber-50 text-amber-700",
    SUSPENDED: "bg-red-50 text-red-600",
    ONLINE: "bg-emerald-50 text-emerald-700",
    ON_TRIP: "bg-blue-50 text-blue-700",
    OFFLINE: "bg-slate-100 text-slate-500",
};
function Panel({ title, icon: Icon, children, action }) {
    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center">
                <span className="mr-2 grid h-8 w-8 place-items-center rounded-lg bg-blue-50 text-blue-600">
                    <Icon />
                </span>
                <h2 className="text-sm font-black">{title}</h2>
                {action && <div className="ml-auto">{action}</div>}
            </div>
            {children}
        </section>
    );
}
function Item({ label, value }) {
    return (
        <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-[8px] font-bold uppercase tracking-wide text-slate-400">
                {label}
            </p>
            <p className="mt-1 break-words text-[10px] font-bold text-slate-700">
                {value || "—"}
            </p>
        </div>
    );
}
function FileItem({ label, fileName, url }) {
    return (
        <div className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-200 p-3">
            <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${url ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}>
                {url ? <LuCircleCheck /> : <LuShieldAlert />}
            </span>
            <div className="min-w-0 flex-1">
                <b className="block text-[9px]">{label}</b>
                <small className="block truncate text-[8px] text-slate-400">{fileName || "Not uploaded"}</small>
            </div>
            {url && (
                <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex h-8 shrink-0 items-center gap-1 rounded-lg bg-blue-50 px-3 text-[8px] font-extrabold text-blue-600 hover:bg-blue-100"
                >
                    <LuEye /> View
                </a>
            )}
        </div>
    );
}
export default function DriverDetailsPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [driver, setDriver] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [confirm, setConfirm] = useState(false);
    const [acting, setActing] = useState(false);
    async function load() {
        setLoading(true);
        try {
            setDriver(await get(`/admin/drivers/${id}`));
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }
    useEffect(() => {
        load();
    }, [id]);
    async function changeStatus() {
        setActing(true);
        try {
            await patch(`/admin/drivers/${id}/status`, {
                status: driver.status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED",
            });
            setConfirm(false);
            await load();
        } catch (e) {
            setError(e.message);
        } finally {
            setActing(false);
        }
    }
    if (loading)
        return (
            <AdminLayout>
                <main className="p-7">
                    <div className="mx-auto h-[600px] max-w-6xl animate-pulse rounded-2xl bg-white" />
                </main>
            </AdminLayout>
        );
    if (!driver)
        return (
            <AdminLayout>
                <main className="p-7 text-sm text-red-600">
                    {error || "Driver not found"}
                </main>
            </AdminLayout>
        );
    const upcoming = driver.bookings.filter(
        (x) => !["COMPLETED", "CANCELLED", "NO_SHOW"].includes(x.status),
    );
    return (
        <AdminLayout>
            <main className="mx-auto max-w-[1250px] p-4 sm:p-6 lg:p-7">
                <div className="mb-6 flex flex-wrap items-center gap-4">
                    <button
                        onClick={() => navigate("/drivers")}
                        className="grid h-11 w-11 place-items-center rounded-xl border bg-white shadow-sm cursor-pointer"
                    >
                        <LuArrowLeft />
                    </button>
                    <div className="flex-1">
                        <p className="text-[9px] font-bold tracking-[1.5px] text-blue-600">
                            {driver.driverCode}
                        </p>
                        <h1 className="text-2xl font-black">Driver Details</h1>
                    </div>
                    <span
                        className={`rounded-full px-3 py-2 text-[9px] font-black ${statusTone[driver.operationalStatus]}`}
                    >
                        {driver.operationalStatus.replace("_", " ")}
                    </span>
                    <button
                        onClick={() => setConfirm(true)}
                        className={`h-10 rounded-xl px-4 text-[9px] font-bold cursor-pointer ${driver.status === "SUSPENDED" ? "bg-emerald-600 text-white" : "bg-red-100 text-red-600 hover:bg-red-200"}`}
                    >
                        {driver.status === "SUSPENDED"
                        ? "Reactivate driver"
                        : "Suspend driver"}
                    </button>
                </div>
                {error && (
                    <p className="mb-4 rounded-xl bg-red-50 p-3 text-[10px] font-bold text-red-600">
                        {error}
                    </p>
                )}
                <div className="grid gap-4 lg:grid-cols-3">
                    <div className="space-y-4 lg:col-span-2">
                        <Panel title="Personal information" icon={LuUserRound}>
                            <div className="flex flex-col gap-5 sm:flex-row">
                                <div className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-blue-100 to-emerald-100 text-3xl font-black text-blue-600">
                                    {driver.personal.profilePhoto ? (
                                        <img
                                            src={driver.personal.profilePhoto}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        driver.personal.fullName[0]
                                    )}
                                </div>
                                <div className="grid flex-1 gap-3 sm:grid-cols-2">
                                    <Item label="Full name" value={driver.personal.fullName} />
                                    <Item label="Phone" value={driver.personal.phone} />
                                    <Item label="Email" value={driver.personal.email} />
                                    <Item
                                        label="Date of birth"
                                        value={date(driver.personal.dateOfBirth)}
                                    />
                                    <Item label="Gender" value={driver.personal.gender} />
                                    <Item
                                        label="Emergency contact"
                                        value={driver.personal.emergencyContact}
                                    />
                                    <div className="sm:col-span-2">
                                        <Item
                                            label="Residential address"
                                            value={driver.personal.residentialAddress}
                                        />
                                    </div>
                                </div>
                            </div>
                        </Panel>
                        <Panel title="Licence and verification" icon={LuBadgeCheck}>
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                <Item label="Licence number" value={driver.licence.number} />
                                <Item
                                    label="Issuing state"
                                    value={driver.licence.issuingState}
                                />
                                <Item
                                    label="Issue date"
                                    value={date(driver.licence.issueDate)}
                                />
                                <Item
                                    label="Expiry date"
                                    value={date(driver.licence.expiryDate)}
                                />
                            </div>
                            <div className="mt-4 grid gap-2 sm:grid-cols-2">
                                {
                                    [
                                        ["Front of driving licence", driver.licence.frontFileName, driver.licence.frontUrl],
                                        ["Back of driving licence", driver.licence.backFileName, driver.licence.backUrl],
                                    ].map(([name, file, url]) => <FileItem key={name} label={name} fileName={file} url={url} />)
                                }
                            </div>
                        </Panel>
                        <Panel title="Vehicle" icon={LuCarFront}>
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                <Item
                                    label="Category"
                                    value={driver.vehicle.category.replaceAll("_", " ")}
                                />
                                <Item
                                    label="Registration number"
                                    value={driver.vehicle.registrationNumber}
                                />
                                <Item
                                    label="Manufacturer"
                                    value={driver.vehicle.manufacturer}
                                />
                                <Item label="Model" value={driver.vehicle.model} />
                                <Item label="Fuel type" value={driver.vehicle.fuelType} />
                                <Item
                                    label="Seating capacity"
                                    value={driver.vehicle.seatingCapacity}
                                />
                                <Item
                                    label="Manufacturing year"
                                    value={driver.vehicle.manufacturingYear}
                                />
                            </div>
                            <div className="mt-4 grid gap-2 sm:grid-cols-2">
                                <FileItem label="Front vehicle photo" fileName="Front photo" url={driver.vehicle.frontPhoto} />
                                <FileItem label="Rear vehicle photo" fileName="Rear photo" url={driver.vehicle.rearPhoto} />
                            </div>
                        </Panel>
                        <Panel title="Documents" icon={LuFileText}>
                            <div className="grid gap-2 sm:grid-cols-2">
                                {driver.documents.map((doc) => <FileItem key={doc.name} label={doc.name} fileName={doc.fileName} url={doc.url} />)}
                            </div>
                        </Panel>
                        <Panel title="Current and upcoming trips" icon={LuCalendarDays}>
                            <div className="space-y-2">
                                {upcoming.length === 0 ? (
                                    <p className="py-8 text-center text-[9px] text-slate-400">
                                        No active or upcoming trips.
                                    </p>
                                ) : (
                                    upcoming.map((trip) => (
                                        <div
                                            key={trip._id}
                                            className="flex flex-col gap-2 rounded-xl border p-4 sm:flex-row sm:items-center"
                                        >
                                        <div className="flex-1">
                                            <b className="text-[10px] text-blue-600">
                                                {trip.bookingNumber}
                                            </b>
                                            <p className="mt-1 text-[10px] font-bold">
                                                {trip.pickup.address} →{" "}
                                                {trip.destination?.address ||
                                                    trip.packageName ||
                                                    "Hidden until trip starts"}
                                            </p>
                                            <small className="text-[8px] text-slate-400">
                                                {date(trip.scheduledStartAt)} ·{" "}
                                                {trip.serviceType.replaceAll("_", " ")}
                                            </small>
                                        </div>
                                        <span className="rounded-full bg-blue-50 px-2 py-1 text-[8px] font-bold text-blue-600">
                                            {trip.status.replaceAll("_", " ")}
                                        </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </Panel>
                    </div>
                    <div className="space-y-4">
                        <Panel title="Account status" icon={LuShieldAlert}>
                            <div className="flex items-center justify-between">
                                <span
                                    className={`rounded-full px-3 py-2 text-[9px] font-black ${statusTone[driver.status]}`}
                                >
                                    {driver.status}
                                </span>
                                <small className="text-[8px] text-slate-400">
                                    Registered {date(driver.createdAt)}
                                </small>
                            </div>
                        </Panel>
                        <Panel title="Payout summary" icon={LuBanknote}>
                            <div className="space-y-3">
                                <Item
                                    label="Total paid"
                                    value={money(driver.earnings.totalPaid)}
                                />
                                <Item
                                    label="Pending payout"
                                    value={money(driver.earnings.pendingPayout)}
                                />
                                <Item
                                    label="Completed trips"
                                    value={driver.earnings.completedTrips}
                                />
                            </div>
                        </Panel>
                        <Panel title="Bank details" icon={LuBanknote}>
                            <div className="space-y-3">
                                <Item
                                    label="Account holder"
                                    value={driver.bank.accountHolderName}
                                />
                                <Item
                                    label="Account number"
                                    value={driver.bank.accountNumber}
                                />
                                <Item label="IFSC code" value={driver.bank.ifscCode} />
                                <Item label="UPI ID" value={driver.bank.upiId} />
                                <FileItem label="Cancelled cheque / passbook" fileName={driver.bank.proofFileName} url={driver.bank.proofUrl} />
                            </div>
                        </Panel>
                        <Panel title="Contact" icon={LuPhone}>
                            <div className="space-y-3">
                                <a
                                    href={`tel:${driver.personal.phone}`}
                                    className="flex items-center gap-2 rounded-xl bg-blue-50 p-3 text-[10px] font-bold text-blue-600"
                                >
                                    <LuPhone />
                                    Call driver
                                </a>
                                {driver.personal.email && (
                                    <a
                                        href={`mailto:${driver.personal.email}`}
                                        className="flex items-center gap-2 rounded-xl bg-slate-50 p-3 text-[10px] font-bold"
                                    >
                                        <LuMail />
                                        Email driver
                                    </a>
                                )}
                                <div className="flex items-center gap-2 p-2 text-[9px] text-slate-500">
                                    <LuMapPin />
                                    {driver.personal.residentialAddress}
                                </div>
                            </div>
                        </Panel>
                    </div>
                </div>
                <ConfirmDialog
                    open={confirm}
                    loading={acting}
                    tone={driver.status === "SUSPENDED" ? "warning" : "danger"}
                    title={
                        driver.status === "SUSPENDED"
                        ? "Reactivate driver?"
                        : "Suspend driver?"
                    }
                    description={
                        driver.status === "SUSPENDED"
                        ? `${driver.personal.fullName} will become eligible for assignments again.`
                        : `${driver.personal.fullName} will immediately become unavailable for new assignments.`
                    }
                    confirmLabel={
                        driver.status === "SUSPENDED" ? "Reactivate" : "Suspend"
                    }
                    onCancel={() => setConfirm(false)}
                    onConfirm={changeStatus}
                />
            </main>
        </AdminLayout>
    );
}

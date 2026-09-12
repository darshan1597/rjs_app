import { useEffect, useState } from "react";
import {
    LuChevronLeft,
    LuChevronRight,
    LuMessageCircle,
    LuSearch,
    LuSend,
} from "react-icons/lu";
import AdminLayout from "../components/AdminLayout.jsx";
import { get, patch } from "../services/api.js";

const tones = {
    URGENT: "bg-red-50 text-red-600",
    HIGH: "bg-orange-50 text-orange-600",
    MEDIUM: "bg-amber-50 text-amber-700",
    LOW: "bg-slate-100 text-slate-500",
    OPEN: "bg-blue-50 text-blue-600",
    IN_PROGRESS: "bg-violet-50 text-violet-600",
    WAITING_FOR_USER: "bg-amber-50 text-amber-700",
    RESOLVED: "bg-emerald-50 text-emerald-700",
    CLOSED: "bg-slate-100 text-slate-500",
};

export default function SupportTicketsPage() {
    const [items, setItems] = useState([]);
    const [selected, setSelected] = useState(null);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState(null);
    const [query, setQuery] = useState("");
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("");
    const [priority, setPriority] = useState("");
    const [reply, setReply] = useState("");
    const [error, setError] = useState("");
    useEffect(() => {
        const t = setTimeout(() => {
        setPage(1);
        setSearch(query);
        }, 350);
        return () => clearTimeout(t);
    }, [query]);
    async function load() {
        try {
            const p = new URLSearchParams({ page, limit: 20 });
            if (search) p.set("search", search);
            if (status) p.set("status", status);
            if (priority) p.set("priority", priority);
            const d = await get(`/admin/support-tickets?${p}`);
            setItems(d.items);
            setPagination(d.pagination);
            if (selected)
                setSelected(d.items.find((x) => x._id === selected._id) || selected);
        } catch (e) {
            setError(e.message);
        }
    }
    useEffect(() => {
        load();
    }, [page, search, status, priority]);
    async function update(data) {
        try {
            const value = await patch(`/admin/support-tickets/${selected._id}`, data);
            setSelected(value);
            setReply("");
            load();
        } catch (e) {
            setError(e.message);
        }
    }
    return (
        <AdminLayout>
            <main className="mx-auto max-w-[1500px] p-4 sm:p-6 lg:p-7">
                <div className="mb-6">
                    <p className="text-[10px] font-bold tracking-[1.8px] text-blue-600">
                        CUSTOMER & DRIVER CARE
                    </p>
                    <h1 className="text-3xl font-black">Support Tickets</h1>
                    <p className="mt-1 text-[11px] text-slate-500">
                        Review, reply to and resolve support requests.
                    </p>
                </div>
                <div className="grid gap-4 lg:grid-cols-[420px_1fr]">
                    <section className="overflow-hidden rounded-2xl border bg-white shadow-sm">
                        <div className="space-y-3 border-b p-4">
                            <div className="relative">
                                <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    className="h-10 w-full rounded-xl border bg-slate-50 pl-9 text-[10px]"
                                    placeholder="Search ticket, name or subject"
                                />
                            </div>
                            <div className="flex gap-2">
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                    className="h-9 flex-1 rounded-lg border text-[8px]"
                                >
                                    <option value="">All statuses</option>
                                    {[
                                        "OPEN",
                                        "IN_PROGRESS",
                                        "WAITING_FOR_USER",
                                        "RESOLVED",
                                        "CLOSED",
                                    ].map((x) => (
                                        <option key={x}>{x}</option>
                                    ))}
                                </select>
                                <select
                                    value={priority}
                                    onChange={(e) => setPriority(e.target.value)}
                                    className="h-9 flex-1 rounded-lg border text-[8px]"
                                >
                                    <option value="">All priorities</option>
                                    {["URGENT", "HIGH", "MEDIUM", "LOW"].map((x) => (
                                        <option key={x}>{x}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="max-h-[650px] overflow-y-auto">
                            {items.length === 0 ? (
                                <p className="p-12 text-center text-[9px] text-slate-400">
                                    No tickets found.
                                </p>
                            ) : (
                                items.map((t) => (
                                    <button
                                        key={t._id}
                                        onClick={() => setSelected(t)}
                                        className={`w-full border-b p-4 text-left ${selected?._id === t._id ? "bg-blue-50" : "hover:bg-slate-50"}`}
                                    >
                                        <div className="flex justify-between">
                                            <b className="text-[9px] text-blue-600">
                                                {t.ticketNumber}
                                            </b>
                                            <span
                                                className={`rounded-full px-2 py-1 text-[7px] font-bold ${tones[t.priority]}`}
                                            >
                                                {t.priority}
                                            </span>
                                        </div>
                                        <h3 className="mt-2 truncate text-[11px] font-black">
                                            {t.subject}
                                        </h3>
                                        <p className="mt-1 text-[8px] text-slate-400">
                                            {t.requesterName} · {t.requesterType}
                                        </p>
                                        <span className={`mt-2 inline-block rounded-full px-2 py-1 text-[7px] font-bold ${tones[t.status]}`}>
                                            {t.status.replaceAll("_", " ")}
                                        </span>
                                    </button>
                                ))
                            )}
                        </div>
                        {pagination?.pages > 1 && (
                            <div className="flex justify-between border-t p-3 text-[8px]">
                                <span>
                                    {pagination.page}/{pagination.pages}
                                </span>
                                <div className="flex gap-2">
                                    <button
                                        disabled={page <= 1}
                                        onClick={() => setPage(page - 1)}
                                    >
                                        <LuChevronLeft />
                                    </button>
                                    <button
                                        disabled={page >= pagination.pages}
                                        onClick={() => setPage(page + 1)}
                                    >
                                        <LuChevronRight />
                                    </button>
                                </div>
                            </div>
                        )}
                    </section>
                    <section className="min-h-[600px] rounded-2xl border bg-white p-5 shadow-sm">
                        {!selected ? (
                            <div className="grid h-full place-items-center text-center text-slate-400">
                                <div>
                                <LuMessageCircle className="mx-auto text-4xl" />
                                <p className="mt-3 text-[10px]">
                                    Select a ticket to open the conversation.
                                </p>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="flex flex-wrap items-start gap-3 border-b pb-4">
                                    <div className="flex-1">
                                        <p className="text-[9px] font-bold text-blue-600">
                                            {selected.ticketNumber}
                                        </p>
                                        <h2 className="text-xl font-black">{selected.subject}</h2>
                                        <p className="mt-1 text-[9px] text-slate-500">
                                            {selected.requesterName} ·{" "}
                                            {selected.requesterPhone || selected.requesterEmail} ·{" "}
                                            {selected.category}
                                        </p>
                                    </div>
                                    <select
                                        value={selected.priority}
                                        onChange={(e) => update({ priority: e.target.value })}
                                        className="h-9 rounded-lg border px-2 text-[8px]"
                                    >
                                        {["LOW", "MEDIUM", "HIGH", "URGENT"].map((x) => (
                                            <option key={x}>{x}</option>
                                        ))}
                                    </select>
                                    <select
                                        value={selected.status}
                                        onChange={(e) => update({ status: e.target.value })}
                                        className="h-9 rounded-lg border px-2 text-[8px]"
                                    >
                                        {[
                                            "OPEN",
                                            "IN_PROGRESS",
                                            "WAITING_FOR_USER",
                                            "RESOLVED",
                                            "CLOSED",
                                        ].map((x) => (
                                            <option key={x}>{x}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="my-5 max-h-[430px] space-y-3 overflow-y-auto">
                                    {selected.messages.map((m) => (
                                        <div
                                            key={m._id}
                                            className={`max-w-[80%] rounded-2xl p-3 ${m.senderType === "EMPLOYEE" ? "ml-auto bg-blue-600 text-white" : "bg-slate-100"}`}
                                        >
                                            <p className="text-[10px]">{m.text}</p>
                                            <small
                                                className={`mt-1 block text-[7px] ${m.senderType === "EMPLOYEE" ? "text-blue-100" : "text-slate-400"}`}
                                            >
                                                {m.senderName} ·{" "}
                                                {new Date(m.createdAt).toLocaleString("en-IN")}
                                            </small>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex gap-2 border-t pt-4">
                                    <textarea
                                        value={reply}
                                        onChange={(e) => setReply(e.target.value)}
                                        className="h-20 flex-1 rounded-xl border p-3 text-[10px]"
                                        placeholder="Write a reply..."
                                    />
                                    <button
                                        disabled={reply.trim().length < 2}
                                        onClick={() => update({ reply, status: "IN_PROGRESS" })}
                                        className="flex items-center gap-2 self-end rounded-xl bg-orange-500 px-4 py-3 text-[9px] font-bold text-white disabled:opacity-40"
                                    >
                                        <LuSend />
                                        Send
                                    </button>
                                </div>
                            </>
                        )}
                    </section>
                </div>
                {error && (
                    <p className="mt-4 rounded-xl bg-red-50 p-3 text-[10px] text-red-600">
                        {error}
                    </p>
                )}
            </main>
        </AdminLayout>
    );
}

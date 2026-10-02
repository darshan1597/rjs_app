import { useEffect, useState } from 'react';
import { LuChevronLeft, LuChevronRight, LuExternalLink, LuInbox, LuMail, LuPhone, LuSearch } from 'react-icons/lu';
import AdminLayout from '../components/AdminLayout.jsx';
import { get, patch } from '../services/api.js';

const statuses = ['NEW', 'CONTACTED', 'RESOLVED', 'CLOSED'];
const tones = {
  NEW: 'bg-blue-50 text-blue-700',
  CONTACTED: 'bg-amber-50 text-amber-700',
  RESOLVED: 'bg-emerald-50 text-emerald-700',
  CLOSED: 'bg-slate-100 text-slate-600',
};

export default function WebsiteEnquiriesPage() {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [source, setSource] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => { setPage(1); setSearch(query.trim()); }, 350);
    return () => clearTimeout(timer);
  }, [query]);

  async function load() {
    try {
      setError('');
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search);
      if (status) params.set('status', status);
      if (source) params.set('source', source);
      const data = await get(`/admin/website-enquiries?${params}`);
      setItems(data.items);
      setPagination(data.pagination);
      if (selected) {
        const refreshed = data.items.find((item) => item._id === selected._id);
        if (refreshed) select(refreshed);
      }
    } catch (loadError) {
      setError(loadError.message);
    }
  }

  useEffect(() => { load(); }, [page, search, status, source]);

  function select(item) {
    setSelected(item);
    setNotes(item.adminNotes || '');
  }

  async function update(changes) {
    if (!selected) return;
    try {
      setSaving(true);
      setError('');
      const data = await patch(`/admin/website-enquiries/${selected._id}`, changes);
      select(data.enquiry);
      setItems((current) => current.map((item) => item._id === data.enquiry._id ? data.enquiry : item));
    } catch (updateError) {
      setError(updateError.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminLayout>
      <main className="mx-auto max-w-[1500px] p-4 sm:p-6 lg:p-7">
        <div className="mb-6">
          <p className="text-[10px] font-bold tracking-[1.8px] text-blue-600">WEBSITE LEADS</p>
          <h1 className="text-3xl font-black">Website enquiries</h1>
          <p className="mt-1 text-[11px] text-slate-500">Follow up contact requests and tour-package enquiries submitted from the customer website.</p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[420px_1fr]">
          <section className="overflow-hidden rounded-2xl border bg-white shadow-sm">
            <div className="space-y-3 border-b p-4">
              <div className="relative">
                <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={query} onChange={(event) => setQuery(event.target.value)} className="h-10 w-full rounded-xl border bg-slate-50 pl-9 text-[10px]" placeholder="Search reference, customer or package" />
              </div>
              <div className="flex gap-2">
                <select value={status} onChange={(event) => { setPage(1); setStatus(event.target.value); }} className="h-9 flex-1 rounded-lg border px-2 text-[8px]">
                  <option value="">All statuses</option>
                  {statuses.map((value) => <option key={value}>{value}</option>)}
                </select>
                <select value={source} onChange={(event) => { setPage(1); setSource(event.target.value); }} className="h-9 flex-1 rounded-lg border px-2 text-[8px]">
                  <option value="">All sources</option>
                  <option value="CONTACT">Contact form</option>
                  <option value="TOUR_PACKAGE">Tour package</option>
                </select>
              </div>
            </div>

            <div className="max-h-[650px] overflow-y-auto">
              {!items.length ? <div className="grid min-h-52 place-items-center p-8 text-center text-slate-400"><div><LuInbox className="mx-auto text-3xl" /><p className="mt-2 text-[9px]">No website enquiries found.</p></div></div> : items.map((item) => (
                <button key={item._id} onClick={() => select(item)} className={`w-full border-b p-4 text-left transition ${selected?._id === item._id ? 'bg-blue-50' : 'hover:bg-slate-50'}`}>
                  <div className="flex items-center justify-between gap-2">
                    <b className="text-[9px] text-blue-600">{item.enquiryNumber}</b>
                    <span className={`rounded-full px-2 py-1 text-[7px] font-bold ${tones[item.status]}`}>{item.status}</span>
                  </div>
                  <h2 className="mt-2 truncate text-[11px] font-black">{item.customer.name}</h2>
                  <p className="mt-1 truncate text-[8px] text-slate-500">{item.packageSnapshot?.title || item.travelType}</p>
                  <p className="mt-2 text-[7px] text-slate-400">{new Date(item.createdAt).toLocaleString('en-IN')}</p>
                </button>
              ))}
            </div>

            {pagination?.pages > 1 && <div className="flex items-center justify-between border-t p-3 text-[8px]"><span>{pagination.page} / {pagination.pages}</span><div className="flex gap-3"><button disabled={page <= 1} onClick={() => setPage((value) => value - 1)}><LuChevronLeft /></button><button disabled={page >= pagination.pages} onClick={() => setPage((value) => value + 1)}><LuChevronRight /></button></div></div>}
          </section>

          <section className="min-h-[600px] rounded-2xl border bg-white p-5 shadow-sm">
            {!selected ? <div className="grid h-full min-h-[520px] place-items-center text-center text-slate-400"><div><LuInbox className="mx-auto text-4xl" /><p className="mt-3 text-[10px]">Select an enquiry to review it.</p></div></div> : <>
              <div className="flex flex-wrap items-start gap-3 border-b pb-5">
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] font-bold text-blue-600">{selected.enquiryNumber}</p>
                  <h2 className="mt-1 text-xl font-black">{selected.customer.name}</h2>
                  <p className="mt-1 text-[9px] text-slate-500">Received {new Date(selected.createdAt).toLocaleString('en-IN')}</p>
                </div>
                <select disabled={saving} value={selected.status} onChange={(event) => update({ status: event.target.value })} className="h-10 rounded-xl border px-3 text-[9px] font-bold">
                  {statuses.map((value) => <option key={value}>{value}</option>)}
                </select>
              </div>

              <div className="grid gap-4 py-5 sm:grid-cols-2">
                <a href={`tel:${selected.customer.phone}`} className="flex items-center gap-3 rounded-xl bg-slate-50 p-4 text-[10px] text-slate-700"><LuPhone className="text-blue-600" /><span><small className="block text-[7px] text-slate-400">PHONE</small><b>{selected.customer.phone}</b></span></a>
                <a href={`mailto:${selected.customer.email}`} className="flex min-w-0 items-center gap-3 rounded-xl bg-slate-50 p-4 text-[10px] text-slate-700"><LuMail className="shrink-0 text-blue-600" /><span className="min-w-0"><small className="block text-[7px] text-slate-400">EMAIL</small><b className="block truncate">{selected.customer.email}</b></span></a>
              </div>

              {selected.packageSnapshot?.title && <div className="mb-4 rounded-2xl border border-blue-100 bg-blue-50 p-4"><small className="text-[8px] font-bold text-blue-500">TOUR PACKAGE ENQUIRY</small><div className="mt-1 flex flex-wrap items-center justify-between gap-2"><div><b className="text-sm">{selected.packageSnapshot.title}</b><p className="text-[8px] text-slate-500">{selected.packageSnapshot.durationLabel} · ₹{Number(selected.packageSnapshot.price || 0).toLocaleString('en-IN')}</p></div><a href={`/tour-packages/${selected.packageId}/edit`} className="flex items-center gap-1 text-[8px] font-bold text-blue-600">View package <LuExternalLink /></a></div></div>}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border p-4"><small className="text-[8px] font-bold text-slate-400">TRAVEL TYPE</small><p className="mt-2 text-[10px] font-semibold">{selected.travelType}</p></div>
                <div className="rounded-xl border p-4 sm:col-span-2"><small className="text-[8px] font-bold text-slate-400">CUSTOMER MESSAGE</small><p className="mt-2 whitespace-pre-wrap text-[10px] leading-5 text-slate-700">{selected.message}</p></div>
              </div>

              <div className="mt-5 border-t pt-5">
                <label className="text-[9px] font-bold text-slate-600">INTERNAL FOLLOW-UP NOTES</label>
                <textarea value={notes} onChange={(event) => setNotes(event.target.value)} maxLength="3000" className="mt-2 min-h-28 w-full resize-y rounded-xl border p-3 text-[10px]" placeholder="Add call outcome, follow-up date or other notes..." />
                <div className="mt-2 flex items-center justify-between"><small className="text-[7px] text-slate-400">Visible only to employees</small><button disabled={saving || notes.trim() === (selected.adminNotes || '')} onClick={() => update({ adminNotes: notes.trim() })} className="rounded-xl bg-blue-600 px-4 py-2.5 text-[9px] font-bold text-white disabled:opacity-40">{saving ? 'Saving...' : 'Save notes'}</button></div>
              </div>
            </>}
          </section>
        </div>
        {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-[10px] text-red-600">{error}</p>}
      </main>
    </AdminLayout>
  );
}

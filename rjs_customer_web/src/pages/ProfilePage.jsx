import { useEffect, useState } from 'react';
import { ArrowRight, CheckCircle2, LoaderCircle, Mail, Phone, Save, UserRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { api, readSession } from '../lib/api.js';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { signedIn, signIn } = useAuth();
  const [profile, setProfile] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!signedIn) {
      navigate('/login', { replace: true, state: { returnTo: '/profile' } });
      return;
    }
    api('/api/v1/customer/auth/me')
      .then((data) => {
        setProfile(data.customer);
        setName(data.customer.name || '');
        setEmail(data.customer.email || '');
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [signedIn, navigate]);

  async function save(event) {
    event.preventDefault();
    setSaving(true); setError(''); setSaved(false);
    try {
      const data = await api('/api/v1/customer/auth/me', {
        method: 'PATCH',
        body: JSON.stringify({ name, email }),
      });
      setProfile(data.customer);
      const current = readSession();
      signIn({ ...current, customer: data.customer });
      setSaved(true);
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }

  return <><Navbar /><main className="min-h-[72vh] bg-[#f5f6f8] py-14"><div className="mx-auto w-[min(920px,calc(100%-32px))]"><small className="font-extrabold tracking-[1.4px] text-[#9a7010]">YOUR RJS ACCOUNT</small><h1 className="mt-2 mb-8 font-[Manrope] text-4xl font-bold text-[var(--navy)]">Profile</h1>
    {loading ? <LoaderCircle className="mx-auto mt-20 h-9 w-9 animate-spin text-[#a87808]" /> : <div className="grid grid-cols-[260px_1fr] gap-6 max-[720px]:grid-cols-1">
      <aside className="h-fit rounded-2xl bg-[linear-gradient(145deg,#071a3d,#12437c)] p-6 text-white shadow-[0_18px_45px_rgba(7,26,61,.16)]"><div className="grid h-20 w-20 place-items-center rounded-full bg-white/10 font-[Manrope] text-2xl font-extrabold text-[#f2c75b]">{profile?.name?.split(' ').map(part => part[0]).slice(0,2).join('').toUpperCase() || 'RJ'}</div><h2 className="mt-5 font-[Manrope] text-xl font-bold">{profile?.name}</h2><p className="mt-1 text-[10px] text-[#b8c5d8]">RJS customer</p><button onClick={() => navigate('/my-bookings')} className="mt-7 flex w-full items-center justify-between rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-[11px] font-bold text-white hover:bg-white/15">My bookings <ArrowRight className="w-4" /></button></aside>
      <section className="rounded-2xl border border-[#e4e8ed] bg-white p-7 shadow-[0_12px_40px_rgba(7,26,61,.06)]"><h2 className="font-[Manrope] text-xl font-bold text-[var(--navy)]">Personal information</h2><p className="mt-1 mb-6 text-[10px] leading-5 text-[#778293]">These details are shared with your RJS customer app account.</p><form onSubmit={save} className="space-y-5"><ProfileField label="FULL NAME" icon={UserRound}><input required minLength="2" maxLength="100" value={name} onChange={event => setName(event.target.value)} className="w-full border-0 bg-transparent text-xs outline-none" /></ProfileField><ProfileField label="EMAIL ADDRESS" icon={Mail}><input type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="Add your email address" className="w-full border-0 bg-transparent text-xs outline-none" /></ProfileField><ProfileField label="VERIFIED MOBILE NUMBER" icon={Phone}><input value={profile?.phone || ''} disabled className="w-full border-0 bg-transparent text-xs text-[#8a94a3] outline-none" /></ProfileField>{error && <p className="rounded-lg bg-[#fff0f0] p-3 text-[10px] text-[#b83232]">{error}</p>}{saved && <p className="flex items-center gap-2 rounded-lg bg-[#ebf8f1] p-3 text-[10px] text-[#25765a]"><CheckCircle2 className="w-4" /> Profile updated successfully.</p>}<button disabled={saving} className="flex h-12 items-center gap-2 rounded-xl border-0 bg-[var(--navy)] px-6 text-xs font-bold text-white disabled:opacity-60">{saving ? <LoaderCircle className="w-4 animate-spin" /> : <Save className="w-4" />}{saving ? 'Saving…' : 'Save changes'}</button></form></section>
    </div>}
  </div></main><Footer /></>;
}

function ProfileField({ label, icon: Icon, children }) {
  return <label className="block"><span className="mb-1.5 block text-[8px] font-extrabold tracking-[1px] text-[#657084]">{label}</span><div className="flex h-12 items-center gap-2.5 rounded-[9px] border border-[var(--line)] px-3 focus-within:border-[#b88711] focus-within:shadow-[0_0_0_3px_rgba(238,178,27,.12)]"><Icon className="w-4 shrink-0 text-[#8d96a5]" />{children}</div></label>;
}

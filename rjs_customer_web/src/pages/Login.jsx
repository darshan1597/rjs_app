import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Phone, ShieldCheck, Star, UserRound, Mail } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';

export function AuthScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useAuth();
  const [step, setStep] = useState('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [registrationToken, setRegistrationToken] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const requestedReturn = location.state?.returnTo || sessionStorage.getItem('rjs_auth_return_to') || (sessionStorage.getItem('rjs_ride_review') ? '/ride-review' : '/');
  const returnTo = requestedReturn.startsWith('/') && !requestedReturn.startsWith('//') ? requestedReturn : '/';

  useEffect(() => {
    sessionStorage.setItem('rjs_auth_return_to', returnTo);
  }, [returnTo]);

  function finishAuthentication(data) {
    signIn(data);
    sessionStorage.removeItem('rjs_auth_return_to');
    navigate(returnTo, { replace: true });
  }

  async function submit(event) {
    event.preventDefault(); setLoading(true); setError('');
    try {
      if (step === 'phone') {
        const data = await api('/api/v1/customer/auth/request-otp', { method: 'POST', body: JSON.stringify({ phone }) });
        setDevOtp(data.devOtp || ''); setStep('otp');
      } else if (step === 'otp') {
        const data = await api('/api/v1/customer/auth/verify-otp', { method: 'POST', body: JSON.stringify({ phone, otp }) });
        if (data.isNewCustomer) { setRegistrationToken(data.registrationToken); setStep('profile'); }
        else { finishAuthentication({ customer: data.customer, tokens: data.tokens }); }
      } else {
        const data = await api('/api/v1/customer/auth/complete-profile', { method: 'POST', body: JSON.stringify({ registrationToken, name, email }) });
        finishAuthentication(data);
      }
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  return <main className="grid min-h-screen grid-cols-[1.02fr_.98fr] max-[800px]:block">
    <section className="relative flex min-h-screen flex-col justify-between overflow-hidden bg-[linear-gradient(145deg,rgba(3,17,43,.97),rgba(7,31,69,.87)),url('/assets/rjs-fleet-hero.png')] bg-cover bg-center px-[8vw] pt-[38px] pb-[45px] text-white max-[800px]:hidden">
      <button className="flex items-center gap-2 self-start border-0 bg-transparent text-[11px] text-[#c8d3e4]" onClick={() => navigate('/')}><ArrowLeft className="w-4" /> Back to website</button>
      <div className="max-w-[520px]">
        <img className="mb-12 h-24 w-24 rounded-[14px] bg-white object-contain p-1" src="/assets/rjs-logo.png" alt="RJS Tours App" />
        <span className="text-[9px] font-extrabold tracking-[1.7px] text-[#f2c75b]">TRAVEL WITH CONFIDENCE</span>
        <h1 className="my-[17px] font-[Manrope] text-[clamp(43px,4.2vw,64px)] leading-[1.02] font-bold tracking-[-3px]">Every journey,<br />managed beautifully.</h1>
        <p className="max-w-[470px] text-sm leading-[1.75] text-[#b8c4d6]">Use the same secure mobile-number account on the RJS website and customer app.</p>
        <div className="mt-7 flex flex-wrap gap-5">{['Verified vehicles','Transparent pricing','24/7 assistance'].map(x => <small key={x} className="flex items-center gap-1.5 text-[10px]"><Check className="w-3.5 text-[var(--gold)]" />{x}</small>)}</div>
      </div>
      <div className="border-l-2 border-[var(--gold)] pl-4"><div className="flex text-[var(--gold)]">{[1,2,3,4,5].map(x => <Star className="w-3" fill="currentColor" key={x} />)}</div><p className="my-2 text-[11px]">One account for your app and web bookings.</p></div>
    </section>
    <section className="flex items-center justify-center p-[45px] max-[800px]:min-h-screen max-[800px]:px-[22px]">
      <div className="w-[min(430px,100%)]">
        <Link to="/" className="mb-10 hidden max-[800px]:block"><img className="h-16 w-16 object-contain" src="/assets/rjs-logo.png" alt="RJS" /></Link>
        <span className="text-[9px] font-extrabold tracking-[1.7px] text-[#a87808]">SECURE CUSTOMER ACCESS</span>
        <h2 className="my-[10px] font-[Manrope] text-[34px] font-bold tracking-[-1.5px] text-[var(--navy)]">{step === 'phone' ? 'Login or sign up.' : step === 'otp' ? 'Verify your number.' : 'Complete your profile.'}</h2>
        <p className="mb-7 text-xs leading-6 text-[#737d8c]">{step === 'phone' ? 'Enter your Indian mobile number. No password is required.' : step === 'otp' ? `Enter the 6-digit OTP sent to +91 ${phone}.` : 'Tell us your name to finish creating your RJS account.'}</p>
        <form onSubmit={submit} className="space-y-4">
          {step === 'phone' && <Field label="MOBILE NUMBER" icon={Phone}><span className="text-xs font-bold text-[#657084]">+91</span><input className="w-full border-0 text-xs outline-0" required inputMode="numeric" pattern="[0-9]{10}" maxLength="10" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g,''))} placeholder="10-digit mobile number" /></Field>}
          {step === 'otp' && <Field label="ONE-TIME PASSWORD" icon={ShieldCheck}><input className="w-full border-0 text-xs outline-0" required inputMode="numeric" pattern="[0-9]{6}" maxLength="6" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g,''))} placeholder="Enter 6-digit OTP" /></Field>}
          {step === 'profile' && <><Field label="FULL NAME" icon={UserRound}><input className="w-full border-0 text-xs outline-0" required minLength="2" value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" /></Field><Field label="EMAIL (OPTIONAL)" icon={Mail}><input className="w-full border-0 text-xs outline-0" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" /></Field></>}
          {devOtp && step === 'otp' && <p className="rounded-lg bg-[#fff6d9] p-3 text-[10px] text-[#795908]">Development OTP: <b>{devOtp}</b></p>}
          {error && <p className="rounded-lg bg-[#fff0f0] p-3 text-[10px] text-[#b83232]">{error}</p>}
          <button disabled={loading} className="flex h-[50px] w-full items-center justify-between rounded-lg border-0 bg-[var(--navy)] px-[17px] text-[11px] font-bold text-white disabled:opacity-60">{loading ? 'Please wait…' : step === 'phone' ? 'Send OTP' : step === 'otp' ? 'Verify OTP' : 'Create account'}<ArrowRight className="w-4" /></button>
          {step !== 'phone' && <button type="button" className="w-full border-0 bg-transparent py-2 text-[10px] font-bold text-[#8d6507]" onClick={() => { setStep('phone'); setOtp(''); setError(''); }}>Change mobile number</button>}
        </form>
        <p className="mt-6 text-center text-[9px] leading-5 text-[#788291]">By continuing, you agree to our <Link className="font-bold text-[#8d6507]" to="/terms">Terms</Link> and <Link className="font-bold text-[#8d6507]" to="/privacy">Privacy Policy</Link>.</p>
      </div>
    </section>
  </main>;
}

function Field({ label, icon: Icon, children }) {
  return <label className="block"><span className="mb-1.5 block text-[8px] font-extrabold tracking-[1px] text-[#657084]">{label}</span><div className="flex h-12 items-center gap-2.5 rounded-[9px] border border-[var(--line)] px-3 focus-within:border-[#b88711] focus-within:shadow-[0_0_0_3px_rgba(238,178,27,.12)]"><Icon className="w-4 text-[#8d96a5]" />{children}</div></label>;
}

export default function Login() { return <AuthScreen />; }

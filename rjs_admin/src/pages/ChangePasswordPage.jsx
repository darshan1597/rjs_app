import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout.jsx';
import { ErrorMessage, Field, cardClass, primaryButtonClass } from '../components/FormElements.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { post } from '../services/api.js';

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const { session, updateAdmin, logout } = useAuth();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const change = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));
  async function submit(event) {
    event.preventDefault();
    if (form.newPassword !== form.confirmPassword) return setError('The new passwords do not match');
    setLoading(true); setError('');
    try {
      const result = await post('/admin/auth/change-password', { currentPassword: form.currentPassword, newPassword: form.newPassword }, session.tokens.accessToken);
      updateAdmin(result.admin);
      navigate('/', { replace: true });
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  }
  return (
    <AuthLayout step={2}>
      <form className={cardClass} onSubmit={submit}>
        <span className="text-[10px] font-extrabold tracking-[2.2px] text-orange-600">
          SECURE YOUR ACCOUNT
        </span>
        <h2 className="mt-3 text-3xl font-extrabold text-slate-950">
          Change your password
        </h2>
        <p className="mb-6 mt-2 text-xs leading-6 text-slate-500">
          Replace the temporary password before accessing the dashboard.
        </p>

        <ErrorMessage error={error} />

        <Field label="Current password" type="password" value={form.currentPassword} onChange={change('currentPassword')} required />

        <Field label="New password" type="password" minLength={12} value={form.newPassword} onChange={change('newPassword')} required />

        <Field label="Confirm new password" type="password" minLength={12} value={form.confirmPassword} onChange={change('confirmPassword')} required />

        <button className={primaryButtonClass} disabled={loading}>
          {loading ? 'Changing password…' : 'Change password'}
        </button>
        
        <button type="button" onClick={logout} className="mx-auto mt-4 block bg-transparent text-[10px] font-bold text-slate-400">
          Sign out
        </button>
      </form>
    </AuthLayout>
  );
}

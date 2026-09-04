import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout.jsx";
import {
  ErrorMessage,
  Field,
  cardClass,
  primaryButtonClass,
} from "../components/FormElements.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { post } from "../services/api.js";
import { LuArrowRight, LuExternalLink, LuLockKeyhole } from "react-icons/lu";

export default function LoginPage() {
  const navigate = useNavigate();
  const { setChallenge } = useAuth();
  const [email, setEmail] = useState("darshanradha1597@gmail.com");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await post("/admin/auth/login", { email, password });
      setChallenge(result);
      navigate(result.mfaSetupRequired ? "/mfa/setup" : "/mfa/verify", {
        replace: true,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }
  return (
    <AuthLayout step={0}>
      <form className={cardClass} onSubmit={submit}>
        <div className="mb-5 grid h-11 w-11 place-items-center rounded-xl bg-orange-50 text-2xl text-orange-600">
          <LuExternalLink />
        </div>
        <span className="text-[10px] font-extrabold tracking-[2.2px] text-orange-600">
          ADMIN SIGN IN
        </span>
        <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950">
          Welcome back, Darshan
        </h2>
        <p className="mb-6 mt-2 text-xs leading-6 text-slate-500">
          Enter your Super Admin credentials to continue.
        </p>
        <ErrorMessage error={error} />
        <Field
          label="Email address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="username"
          required
        />
        <Field
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          placeholder="Enter your password"
          required
        />
        <button className={primaryButtonClass} disabled={loading}>
          {loading ? "Checking…" : "Continue securely"}{" "}
          <LuArrowRight className="text-xl" />
        </button>
        <div className="mt-5 text-center text-[9px] text-slate-400">
          <LuLockKeyhole className="inline" /> Your session expires after 12 hours
        </div>
      </form>
    </AuthLayout>
  );
}

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout.jsx";
import {
  ErrorMessage,
  Field,
  primaryButtonClass,
  wideCardClass,
} from "../components/FormElements.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { post } from "../services/api.js";
import { LuArrowRight } from "react-icons/lu";

export default function MfaSetupPage() {
  const navigate = useNavigate();
  const { challenge, setSetupResult, clearTransientAuth } = useAuth();
  const [setup, setSetup] = useState(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    post("/admin/auth/mfa/setup", { challengeToken: challenge.challengeToken })
      .then(setSetup)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [challenge.challengeToken]);
  async function verify(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await post("/admin/auth/mfa/setup/verify", {
        challengeToken: challenge.challengeToken,
        code,
      });
      setSetupResult(result);
      navigate("/mfa/recovery-codes", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }
  function restart() {
    clearTransientAuth();
    navigate("/login", { replace: true });
  }
  return (
    <AuthLayout step={1}>
      <form className={wideCardClass} onSubmit={verify}>
        <span className="text-[10px] font-extrabold tracking-[2.2px] text-orange-600">
          FIRST-TIME SECURITY SETUP
        </span>
        <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950">
          Connect your authenticator
        </h2>
        <p className="mb-5 mt-2 text-xs leading-6 text-slate-500">
          Scan using Google Authenticator, Microsoft Authenticator, Authy or
          1Password.
        </p>
        <ErrorMessage error={error} />
        {loading && !setup ? (
          <div className="p-12 text-center text-sm text-slate-500">
            Preparing secure QR code…
          </div>
        ) : (
          setup && (
            <>
              <div className="mx-auto my-4 grid h-48 w-48 place-items-center rounded-2xl border border-slate-200 bg-white">
                <img
                  className="w-44"
                  src={setup.qrCodeDataUrl}
                  alt="RJS Admin authenticator QR code"
                />
              </div>
              <details className="text-xs text-slate-600">
                <summary className="cursor-pointer font-bold">
                  Cannot scan the QR code?
                </summary>
                <div className="mt-2 flex gap-2">
                  <code className="flex-1 overflow-auto rounded-lg bg-slate-100 p-2.5 text-[9px]">
                    {setup.manualKey}
                  </code>
                  <button
                    className="rounded-lg bg-blue-50 px-3 text-[9px] font-bold text-blue-600"
                    type="button"
                    onClick={() =>
                      navigator.clipboard.writeText(setup.manualKey)
                    }
                  >
                    Copy
                  </button>
                </div>
              </details>
              <Field
                label="6-digit authenticator code"
                className="text-center text-xl font-extrabold tracking-[8px]"
                inputMode="numeric"
                maxLength="6"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="000 000"
                autoFocus
                required
              />
              <button
                className={primaryButtonClass}
                disabled={loading || code.length !== 6}
              >
                {loading ? "Verifying…" : "Verify and enable MFA"}{" "}
                <LuArrowRight className="text-xl" />
              </button>
            </>
          )
        )}
        <button
          className="mx-auto mt-4 block border-0 bg-transparent text-[10px] font-bold text-blue-600"
          type="button"
          onClick={restart}
        >
          Start sign-in again
        </button>
      </form>
    </AuthLayout>
  );
}

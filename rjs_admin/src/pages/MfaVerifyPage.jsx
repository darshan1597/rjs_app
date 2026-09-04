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
import { LuArrowRight, LuBadgeCheck } from "react-icons/lu";

export default function MfaVerifyPage() {
  const navigate = useNavigate();
  const { challenge, completeLogin, clearTransientAuth } = useAuth();
  const [value, setValue] = useState("");
  const [recovery, setRecovery] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await post("/admin/auth/mfa/verify", {
        challengeToken: challenge.challengeToken,
        ...(recovery ? { recoveryCode: value } : { code: value }),
      });
      completeLogin(result);
      navigate(result.admin.mustChangePassword ? "/change-password" : "/", { replace: true });
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
      <form className={cardClass} onSubmit={submit}>
        <div className="mb-5 grid h-11 w-11 place-items-center rounded-xl bg-blue-50 text-2xl text-blue-600">
          <LuBadgeCheck />
        </div>
        <span className="text-[10px] font-extrabold tracking-[2.2px] text-orange-600">
          TWO-STEP VERIFICATION
        </span>
        <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950">
          Confirm it’s you
        </h2>
        <p className="mb-6 mt-2 text-xs leading-6 text-slate-500">
          {recovery
            ? "Enter one of your unused recovery codes."
            : "Enter the code currently shown in your authenticator app."}
        </p>
        <ErrorMessage error={error} />
        <Field
          label={recovery ? "Recovery code" : "Authenticator code"}
          className="text-center text-xl font-extrabold tracking-[8px]"
          value={value}
          inputMode={recovery ? "text" : "numeric"}
          maxLength={recovery ? 20 : 6}
          onChange={(e) =>
            setValue(
              recovery
                ? e.target.value.toUpperCase()
                : e.target.value.replace(/\D/g, ""),
            )
          }
          placeholder={recovery ? "XXXX-XXXX-XXXX" : "000 000"}
          autoFocus
          required
        />
        <button
          className={primaryButtonClass}
          disabled={loading || value.length < 6}
        >
          {loading ? "Verifying…" : "Verify and sign in"}{" "}
          <LuArrowRight className="text-xl" />
        </button>
        <button
          className="mx-auto mt-4 block border-0 bg-transparent text-[10px] font-bold text-blue-600"
          type="button"
          onClick={() => {
            setRecovery(!recovery);
            setValue("");
            setError("");
          }}
        >
          {recovery ? "Use authenticator code" : "Use a recovery code"}
        </button>
        <button
          className="mx-auto mt-2 block border-0 bg-transparent text-[10px] font-bold text-slate-400"
          type="button"
          onClick={restart}
        >
          Back to sign in
        </button>
      </form>
    </AuthLayout>
  );
}

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout.jsx";
import {
  primaryButtonClass,
  wideCardClass,
} from "../components/FormElements.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { LuArrowRight } from "react-icons/lu";

export default function RecoveryCodesPage() {
  const navigate = useNavigate();
  const { setupResult, completeLogin } = useAuth();
  const [saved, setSaved] = useState(false);
  const text = setupResult.recoveryCodes.join("\n");
  function download() {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(
      new Blob([`RJS Admin recovery codes\n\n${text}\n`], {
        type: "text/plain",
      }),
    );
    link.download = "rjs-admin-recovery-codes.txt";
    link.click();
    URL.revokeObjectURL(link.href);
    setSaved(true);
  }
  function continueToDashboard() {
    completeLogin(setupResult);
    navigate(setupResult.admin.mustChangePassword ? "/change-password" : "/", { replace: true });
  }
  return (
    <AuthLayout step={2}>
      <section className={wideCardClass}>
        <span className="text-[10px] font-extrabold tracking-[2.2px] text-orange-600">
          SAVE THESE ONCE
        </span>
        <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950">
          Your recovery codes
        </h2>
        <p className="mb-5 mt-2 text-xs leading-6 text-slate-500">
          Each code works once if your authenticator is unavailable. They will
          not be shown again.
        </p>
        <div className="my-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {setupResult.recoveryCodes.map((code) => (
            <code
              className="rounded-lg bg-slate-100 p-2.5 text-center text-xs font-bold"
              key={code}
            >
              {code}
            </code>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            className="flex-1 rounded-lg border border-blue-600 bg-white p-3 text-xs font-bold text-blue-600 cursor-pointer hover:bg-blue-300 hover:text-black"
            onClick={() => {
              navigator.clipboard.writeText(text);
              setSaved(true);
            }}
          >
            Copy all
          </button>
          <button
            className="flex-1 rounded-lg border border-blue-600 bg-white p-3 text-xs font-bold text-blue-600 cursor-pointer hover:bg-blue-300 hover:text-black"
            onClick={download}
          >
            Download
          </button>
        </div>
        <label className="my-5 flex items-center gap-2 text-[11px] font-bold">
          <input
            className="h-4 w-4"
            type="checkbox"
            checked={saved}
            onChange={(e) => setSaved(e.target.checked)}
          />{" "}
          I saved the recovery codes securely
        </label>
        <button
          className={`${primaryButtonClass} cursor-pointer`}
          disabled={!saved}
          onClick={continueToDashboard}
        >
          Continue to dashboard <LuArrowRight className="text-xl" />
        </button>
      </section>
    </AuthLayout>
  );
}

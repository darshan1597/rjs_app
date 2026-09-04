import Brand from "./Brand.jsx";
import { LuCheck } from "react-icons/lu";

export default function AuthLayout({ step, children }) {
  const labels = ["Credentials", "Authenticator", "Secure access"];
  return (
    <main className="grid min-h-screen min-w-80 bg-slate-50 lg:grid-cols-[minmax(360px,43%)_1fr]">
      <section className="relative hidden overflow-hidden bg-[radial-gradient(circle_at_85%_23%,#2570d9_0,transparent_25%),linear-gradient(145deg,#061b43_0%,#073c8b_58%,#0d62cb_100%)] p-12 text-white lg:flex lg:flex-col">
        <div className="pointer-events-none absolute -right-56 top-[8%] h-[520px] w-[520px] rounded-full border border-white/15" />
        <div className="pointer-events-none absolute -right-72 -top-[2%] h-[700px] w-[700px] rounded-full border border-white/15" />
        <Brand light />
        <div className="relative z-10 my-auto max-w-xl">
          <span className="text-[10px] font-extrabold tracking-[2.2px]">
            OPERATIONS <span className="mx-1 inline-block h-1 w-1 rounded-full bg-current align-middle" /> BENGALURU
          </span>
          <h1 className="my-5 text-5xl font-extrabold leading-[1.05] tracking-[-2.8px] xl:text-6xl">
            Manage every journey with confidence.
          </h1>
          <p className="max-w-md text-base leading-8 text-blue-100">
            One secure workspace for drivers, trips, customers, packages and
            finance.
          </p>
        </div>
        <div className="relative z-10 flex max-w-md items-center gap-3 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-orange-500">
            <LuCheck />
          </span>
          <div>
            <strong className="block text-sm">Protected admin access</strong>
            <small className="mt-1 block text-[10px] text-blue-100">
              Password, authenticator verification and audited activity.
            </small>
          </div>
        </div>
      </section>
      <section className="flex min-h-screen flex-col justify-center bg-[radial-gradient(circle_at_80%_15%,#e9f2ff_0,transparent_28%)] px-5 py-8 sm:px-10 lg:px-[7vw]">
        <div className="mx-auto mb-8 lg:hidden">
          <Brand />
        </div>
        <div className="mx-auto mb-8 flex w-full max-w-lg items-start">
          {labels.map((label, index) => (
            <div
              className={`flex flex-1 items-center text-[9px] font-bold ${index <= step ? "text-slate-950" : "text-slate-400"}`}
              key={label}
            >
              <i
                className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 not-italic ${index <= step ? "border-orange-500 bg-orange-500 text-white" : "border-slate-200"}`}
              >
                {index < step ? <LuCheck /> : index + 1}
              </i>
              <span className="ml-2 hidden sm:block">{label}</span>
              {index < labels.length - 1 && (
                <span
                  className={`mx-2 h-0.5 flex-1 ${index < step ? "bg-orange-500" : "bg-slate-200"}`}
                />
              )}
            </div>
          ))}
        </div>
        {children}
      </section>
    </main>
  );
}

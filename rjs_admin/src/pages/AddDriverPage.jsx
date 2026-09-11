import { useEffect, useMemo, useState } from "react";
import {
  LuArrowLeft,
  LuArrowRight,
  LuBadgeCheck,
  LuBus,
  LuCarFront,
  LuCheck,
  LuFileUp,
  LuLandmark,
  LuLoaderCircle,
  LuPhoneCall,
  LuShieldCheck,
  LuUserRound,
  LuX,
} from "react-icons/lu";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../components/AdminLayout.jsx";
import { get, post, upload } from "../services/api.js";

const steps = [
  "Personal Details",
  "Driver Details",
  "Vehicle Category",
  "Vehicle Details",
  "Documents",
  "Bank Details",
  "Review & Submit",
];
const initial = {
  serviceAssignment: "",
  personal: {
    fullName: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
    email: "",
    residentialAddress: "",
    emergencyContact: "",
    profilePhoto: "",
  },
  licence: {
    number: "",
    issueDate: "",
    expiryDate: "",
    issuingState: "",
    frontFileName: "",
    backFileName: "",
    frontUrl: "",
    backUrl: "",
  },
  vehicle: {
    categoryId: "",
    variantId: "",
    registrationNumber: "",
    manufacturer: "",
    model: "",
    fuelType: "",
    color: "",
    ownershipType: "",
    seatingCapacity: "",
    manufacturingYear: "",
    frontPhoto: "",
    rearPhoto: "",
  },
  documents: {},
  bank: {
    accountHolderName: "",
    accountNumber: "",
    confirmAccountNumber: "",
    ifscCode: "",
    upiId: "",
    proofFileName: "",
    proofUrl: "",
  },
  consentAccepted: false,
};
const inputClass =
  "mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-[10px] font-normal outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-50";
function Field({ label, children, className = "" }) {
  return (
    <label
      className={`block text-[10px] font-bold text-slate-700 ${className}`}
    >
      {label}
      {children}
    </label>
  );
}
function FileField({
  label,
  value,
  onChange,
  help = "JPG, PNG or PDF · Max 5 MB",
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  async function choose(event) {
    const file = event.target.files[0];
    if (!file) return;
    setUploading(true);
    setUploadError("");
    try {
      const body = new FormData();
      body.append("file", file);
      onChange(await upload("/admin/media/driver-file", body));
    } catch (requestError) {
      setUploadError(requestError.message);
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }
  return (
    <label
      className={`flex cursor-pointer items-center gap-3 rounded-xl border border-dashed p-4 hover:border-blue-400 ${uploadError ? "border-red-300 bg-red-50" : value ? "border-emerald-300 bg-emerald-50" : "border-slate-300 bg-slate-50"}`}
    >
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-lg text-blue-600">
        <LuFileUp />
      </span>
      <span className="min-w-0 flex-1">
        <b className="block text-[10px]">{label}</b>
        <small className="block truncate text-[8px] text-slate-400">
          {uploading ? "Uploading..." : uploadError || value || help}
        </small>
      </span>
      <input
        type="file"
        accept="image/*,.pdf"
        className="hidden"
        disabled={uploading}
        onChange={choose}
      />
    </label>
  );
}

export default function AddDriverPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(initial);
  const [error, setError] = useState("");
  const [vehicleCategories, setVehicleCategories] = useState([]);
  const [vehicleVariants, setVehicleVariants] = useState([]);
  const selectedCategory = vehicleCategories.find((item) => item._id === form.vehicle.categoryId);
  const selectedVariant = vehicleVariants.find((item) => item._id === form.vehicle.variantId);
  const [validationIssues, setValidationIssues] = useState([]);
  const [saving, setSaving] = useState(false);
  const [phoneVerificationToken, setPhoneVerificationToken] = useState("");
  const [phoneVerification, setPhoneVerification] = useState({
    open: false,
    otp: "",
    loading: false,
    error: "",
    devOtp: "",
  });
  const docs = useMemo(
    () => [
      "Registration Certificate (RC)",
      "Vehicle Insurance",
      "Pollution Certificate (PUC)",
      "Vehicle Permit",
      ...(selectedCategory?.code === "BUS" ||
      selectedCategory?.code === "TEMPO_TRAVELLER"
        ? ["Fitness Certificate"]
        : []),
      "Aadhaar Card",
      "PAN Card",
    ],
    [selectedCategory?.code],
  );
  const update = (section, key, value) =>
    setForm((old) => ({
      ...old,
      [section]: { ...old[section], [key]: value },
    }));
  useEffect(() => {
    get("/admin/vehicles/categories?limit=100").then((data) => setVehicleCategories(data.items.filter((item) => item.isActive))).catch((requestError) => setError(requestError.message));
  }, []);
  useEffect(() => {
    setVehicleVariants([]);
    update("vehicle", "variantId", "");
    if (!form.vehicle.categoryId) return;
    get(`/admin/vehicles/categories/${form.vehicle.categoryId}/variants?limit=100`).then((data) => setVehicleVariants(data.items.filter((item) => item.isActive))).catch((requestError) => setError(requestError.message));
  }, [form.vehicle.categoryId]);
  const normalizedPhone = () =>
    String(form.personal.phone || "")
      .replace(/\D/g, "")
      .slice(-10);
  function updatePhone(value) {
    update("personal", "phone", value);
    setPhoneVerificationToken("");
  }
  async function requestPhoneOtp() {
    if (!/^[6-9]\d{9}$/.test(normalizedPhone())) {
      setError(
        "Enter a valid 10-digit Indian phone number before verification.",
      );
      return;
    }
    setError("");
    setPhoneVerification((old) => ({ ...old, loading: true, error: "" }));
    try {
      const result = await post(
        "/admin/drivers/phone-verification/request-otp",
        { phone: normalizedPhone() },
      );
      setPhoneVerification({
        open: true,
        otp: "",
        loading: false,
        error: "",
        devOtp: result.devOtp || "",
      });
    } catch (requestError) {
      setPhoneVerification((old) => ({ ...old, loading: false }));
      setError(requestError.message);
    }
  }
  async function verifyPhoneOtp(event) {
    event.preventDefault();
    if (!/^\d{6}$/.test(phoneVerification.otp)) {
      setPhoneVerification((old) => ({
        ...old,
        error: "Enter the complete 6-digit OTP.",
      }));
      return;
    }
    setPhoneVerification((old) => ({ ...old, loading: true, error: "" }));
    try {
      const result = await post(
        "/admin/drivers/phone-verification/verify-otp",
        { phone: normalizedPhone(), otp: phoneVerification.otp },
      );
      setPhoneVerificationToken(result.verificationToken);
      setPhoneVerification({
        open: false,
        otp: "",
        loading: false,
        error: "",
        devOtp: "",
      });
    } catch (requestError) {
      setPhoneVerification((old) => ({
        ...old,
        loading: false,
        error: requestError.message,
      }));
    }
  }
  function validateStep(currentStep, showError = true) {
    const fail = (message) => {
      if (showError) setError(message);
      return false;
    };
    const value = (input) => String(input || "").trim();
    if (currentStep === 0) {
      if (!form.personal.profilePhoto)
        return fail("Upload the driver's profile photo.");
      if (value(form.personal.fullName).length < 2)
        return fail("Enter the driver's full name.");
      if (!/^(?:\+91|91)?[6-9]\d{9}$/.test(value(form.personal.phone)))
        return fail("Enter a valid Indian driver phone number.");
      if (!phoneVerificationToken)
        return fail("Verify the driver's phone number before continuing.");
      if (!form.personal.dateOfBirth)
        return fail("Select the driver's date of birth.");
      if (!form.personal.gender) return fail("Select the driver's gender.");
      if (form.personal.email && !/^\S+@\S+\.\S+$/.test(form.personal.email))
        return fail("Enter a valid email address or leave it empty.");
      if (value(form.personal.emergencyContact).length < 10)
        return fail("Enter a valid emergency contact number.");
      if (value(form.personal.residentialAddress).length < 5)
        return fail("Enter the complete residential address.");
    }
    if (currentStep === 1) {
      if (value(form.licence.number).length < 5)
        return fail("Enter a valid driving licence number.");
      if (!form.licence.issueDate || !form.licence.expiryDate)
        return fail("Select both licence issue and expiry dates.");
      if (new Date(form.licence.expiryDate) <= new Date(form.licence.issueDate))
        return fail("Licence expiry must be after the issue date.");
      if (value(form.licence.issuingState).length < 2)
        return fail("Enter the licence issuing state.");
      if (!form.licence.frontUrl || !form.licence.backUrl)
        return fail("Upload both the front and back of the driving licence.");
    }
    if (currentStep === 2 && !form.vehicle.categoryId)
      return fail("Select a vehicle category.");
    if (currentStep === 2 && !form.vehicle.variantId)
      return fail("Select a vehicle variant.");
    if (currentStep === 2 && !form.serviceAssignment)
      return fail("Select Local, Outstation, or Flexible driving assignment.");
    if (currentStep === 3) {
      if (value(form.vehicle.registrationNumber).length < 5)
        return fail("Enter a valid vehicle registration number.");
      if (value(form.vehicle.manufacturer).length < 2)
        return fail("Enter the vehicle manufacturer.");
      if (value(form.vehicle.model).length < 2)
        return fail("Enter the vehicle model.");
      if (value(form.vehicle.fuelType).length < 2)
        return fail("Enter the vehicle fuel type.");
      if (value(form.vehicle.color).length < 2) return fail("Enter the vehicle colour.");
      if (!form.vehicle.ownershipType) return fail("Select the vehicle ownership type.");
      const seats = Number(form.vehicle.seatingCapacity);
      if (!Number.isInteger(seats) || seats < 1 || seats > 100)
        return fail("Seating capacity must be between 1 and 100.");
      const year = Number(form.vehicle.manufacturingYear);
      if (
        !Number.isInteger(year) ||
        year < 1990 ||
        year > new Date().getFullYear() + 1
      )
        return fail("Enter a valid manufacturing year.");
      if (!form.vehicle.frontPhoto || !form.vehicle.rearPhoto)
        return fail("Upload both front and rear vehicle photos.");
    }
    if (currentStep === 4) {
      const missing = docs.find((name) => !form.documents[name]?.url);
      if (missing) return fail(`Upload ${missing}.`);
    }
    if (currentStep === 5) {
      if (value(form.bank.accountHolderName).length < 2)
        return fail("Enter the bank account holder name.");
      if (value(form.bank.accountNumber).length < 6)
        return fail("Enter a valid bank account number.");
      if (form.bank.accountNumber !== form.bank.confirmAccountNumber)
        return fail("Bank account numbers do not match.");
      if (value(form.bank.ifscCode).length < 8)
        return fail("Enter a valid IFSC code.");
      if (!form.bank.proofUrl)
        return fail("Upload a cancelled cheque or passbook copy.");
    }
    return true;
  }
  function next(event) {
    event.preventDefault();
    setError("");
    setValidationIssues([]);
    if (!validateStep(step)) return;
    setStep((current) => Math.min(6, current + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  async function submit() {
    setError("");
    setValidationIssues([]);
    for (let index = 0; index <= 5; index += 1) {
      if (!validateStep(index, false)) {
        setStep(index);
        validateStep(index, true);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
    }
    if (!form.consentAccepted) {
      setError("Confirm that the original documents were verified.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        phoneVerificationToken,
        bank: { ...form.bank },
        documents: docs.map((name) => ({
          name,
          fileName: form.documents[name]?.fileName || "",
          url: form.documents[name]?.url || "",
        })),
      };
      delete payload.bank.confirmAccountNumber;
      await post("/admin/drivers", payload);
      navigate("/drivers", { replace: true });
    } catch (requestError) {
      const firstField = requestError.details?.issues?.[0]?.field || "";
      const targetStep =
        requestError.code?.startsWith("PHONE_VERIFICATION") ||
        firstField === "phoneVerificationToken"
          ? 0
          : firstField.startsWith("personal.")
            ? 0
            : firstField.startsWith("licence.")
              ? 1
              : firstField.startsWith("vehicle.category")
                ? 2
                : firstField.startsWith("vehicle.")
                  ? 3
                  : firstField.startsWith("documents")
                    ? 4
                    : firstField.startsWith("bank.")
                      ? 5
                      : 6;
      setStep(targetStep);
      setError(requestError.message);
      setValidationIssues(requestError.details?.issues || []);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSaving(false);
    }
  }
  return (
    <AdminLayout>
      <main className="mx-auto max-w-[1100px] p-4 sm:p-6 lg:p-7">
        <div className="mb-6 flex items-center gap-4">
          <button
            onClick={() => (step ? setStep(step - 1) : navigate("/drivers"))}
            className="grid h-11 w-11 place-items-center rounded-xl border border-slate-200 bg-white shadow-sm cursor-pointer"
          >
            <LuArrowLeft />
          </button>
          <div className="flex-1">
            <p className="text-[9px] font-bold tracking-[1.5px] text-blue-600">
              DRIVER MANAGEMENT
            </p>
            <h1 className="text-2xl font-black">Add Driver</h1>
            <p className="text-[10px] text-slate-500">
              Complete the registration at the RJS office.
            </p>
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-2 text-[9px] font-extrabold text-emerald-700">
            Step {step + 1} of 7
          </span>
        </div>
        <section className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex gap-2">
            {steps.map((name, index) => (
              <div key={name} className="min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => index < step && setStep(index)}
                  className={`h-2 w-full rounded-full ${index <= step ? "bg-emerald-500" : "bg-slate-200"}`}
                />
                <span
                  className={`mt-2 hidden truncate text-[8px] font-bold md:block ${index === step ? "text-emerald-700" : "text-slate-400"}`}
                >
                  {name}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-right text-[8px] text-slate-400">
            {Math.round(((step + 1) / 7) * 100)}% completed
          </p>
        </section>
        <form
          onSubmit={next}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
        >
          <div className="mb-6">
            <h2 className="text-xl font-black">{steps[step]}</h2>
            <p className="mt-1 text-[10px] text-slate-500">
              {
                [
                  "Tell us a little about the driver",
                  "Add the driving licence information",
                  "Select the vehicle they will drive",
                  "Enter complete vehicle information",
                  "Upload clear and valid documents",
                  "Choose where payouts should be received",
                  "Check every detail before creating the driver",
                ][step]
              }
            </p>
          </div>
          {step === 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <FileField
                label="Add profile photo"
                value={form.personal.profilePhoto}
                onChange={(file) =>
                  update("personal", "profilePhoto", file.url)
                }
              />
              <div />
              <Field label="Full Name">
                <input
                  required
                  value={form.personal.fullName}
                  onChange={(e) =>
                    update("personal", "fullName", e.target.value)
                  }
                  className={inputClass}
                />
              </Field>
              <Field label="Phone Number">
                <div className="relative mt-2">
                  <input
                    required
                    inputMode="numeric"
                    value={form.personal.phone}
                    onChange={(e) => updatePhone(e.target.value)}
                    className={`${inputClass} mt-0 pr-24`}
                  />
                  {phoneVerificationToken ? (
                    <span className="absolute right-3 top-1/2 mt-1 flex -translate-y-1/2 items-center gap-1 text-[9px] font-extrabold text-emerald-600">
                      <LuShieldCheck /> Verified
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={phoneVerification.loading}
                      onClick={requestPhoneOtp}
                      className="absolute right-2 top-1/2 mt-1 flex h-8 -translate-y-1/2 items-center gap-1 rounded-lg bg-blue-50 px-3 text-[9px] font-extrabold text-blue-600 hover:bg-blue-100 disabled:opacity-60 cursor-pointer"
                    >
                      {phoneVerification.loading ? 
                        (
                          <LuLoaderCircle className="animate-spin" />
                        ) : (
                          <LuPhoneCall />
                        )
                      }
                      Verify
                    </button>
                  )}
                </div>
              </Field>
              <Field label="Date of Birth">
                <input
                  required
                  type="date"
                  value={form.personal.dateOfBirth}
                  onChange={(e) =>
                    update("personal", "dateOfBirth", e.target.value)
                  }
                  className={inputClass}
                />
              </Field>
              <Field label="Gender">
                <select
                  required
                  value={form.personal.gender}
                  onChange={(e) => update("personal", "gender", e.target.value)}
                  className={inputClass}
                >
                  <option value="">Select</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </Field>
              <Field label="Email Address (Optional)">
                <input
                  type="email"
                  value={form.personal.email}
                  onChange={(e) => update("personal", "email", e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="Emergency Contact">
                <input
                  required
                  value={form.personal.emergencyContact}
                  onChange={(e) =>
                    update("personal", "emergencyContact", e.target.value)
                  }
                  className={inputClass}
                />
              </Field>
              <Field label="Residential Address" className="sm:col-span-2">
                <textarea
                  required
                  value={form.personal.residentialAddress}
                  onChange={(e) =>
                    update("personal", "residentialAddress", e.target.value)
                  }
                  className={`${inputClass} h-24 py-3`}
                />
              </Field>
            </div>
          )}
          {step === 1 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Driving Licence Number" className="sm:col-span-2">
                <input
                  required
                  value={form.licence.number}
                  onChange={(e) => update("licence", "number", e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="Issue Date">
                <input
                  required
                  type="date"
                  value={form.licence.issueDate}
                  onChange={(e) =>
                    update("licence", "issueDate", e.target.value)
                  }
                  className={inputClass}
                />
              </Field>
              <Field label="Expiry Date">
                <input
                  required
                  type="date"
                  value={form.licence.expiryDate}
                  onChange={(e) =>
                    update("licence", "expiryDate", e.target.value)
                  }
                  className={inputClass}
                />
              </Field>
              <Field label="Issuing State" className="sm:col-span-2">
                <input
                  required
                  value={form.licence.issuingState}
                  onChange={(e) =>
                    update("licence", "issuingState", e.target.value)
                  }
                  className={inputClass}
                />
              </Field>
              <FileField
                label="Front of Driving Licence"
                value={form.licence.frontFileName}
                onChange={(file) =>
                  setForm((old) => ({
                    ...old,
                    licence: {
                      ...old.licence,
                      frontFileName: file.fileName,
                      frontUrl: file.url,
                    },
                  }))
                }
              />
              <FileField
                label="Back of Driving Licence"
                value={form.licence.backFileName}
                onChange={(file) =>
                  setForm((old) => ({
                    ...old,
                    licence: {
                      ...old.licence,
                      backFileName: file.fileName,
                      backUrl: file.url,
                    },
                  }))
                }
              />
            </div>
          )}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="mb-3 text-[11px] font-black">Driving assignment</h3>
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    ["LOCAL", "Local", "Local cab rides only"],
                    ["OUTSTATION", "Outstation", "Packages and outstation trips"],
                    ["FLEXIBLE", "Flexible", "Eligible for both types"],
                  ].map(([key, label, help]) => (
                    <button type="button" key={key} onClick={() => setForm((old) => ({ ...old, serviceAssignment: key }))} className={`rounded-2xl border p-4 text-left ${form.serviceAssignment === key ? "border-blue-500 bg-blue-50" : "border-slate-200"}`}>
                      <b className="block text-[11px]">{label}</b>
                      <small className="mt-1 block text-[8px] text-slate-500">{help}</small>
                    </button>
                  ))}
                </div>
              </div>
              <div><h3 className="mb-3 text-[11px] font-black">Vehicle category</h3><div className="grid gap-4 sm:grid-cols-2">
                {vehicleCategories.map((item) => <button type="button" key={item._id} onClick={() => update("vehicle", "categoryId", item._id)} className={`flex items-center gap-4 rounded-2xl border p-5 text-left ${form.vehicle.categoryId === item._id ? "border-emerald-500 bg-emerald-50" : "border-slate-200"}`}><span className="grid h-16 w-24 place-items-center rounded-xl bg-white p-2"><img src={item.photoUrl} alt={item.name} className="h-full w-full object-contain" /></span><b className="flex-1 text-sm">{item.name}</b>{form.vehicle.categoryId === item._id && <LuCheck className="text-emerald-600" />}</button>)}
              </div></div>
              {form.vehicle.categoryId && <div><h3 className="mb-3 text-[11px] font-black">Vehicle variant</h3><div className="grid gap-4 sm:grid-cols-2">
                {vehicleVariants.map((item) => <button type="button" key={item._id} onClick={() => update("vehicle", "variantId", item._id)} className={`flex items-center gap-4 rounded-2xl border p-4 text-left ${form.vehicle.variantId === item._id ? "border-orange-500 bg-orange-50" : "border-slate-200"}`}><span className="grid h-14 w-24 place-items-center rounded-xl bg-white p-2"><img src={item.photoUrl} alt={item.name} className="h-full w-full object-contain" /></span><b className="flex-1 text-[11px]">{item.name}</b>{form.vehicle.variantId === item._id && <LuCheck className="text-orange-500" />}</button>)}
              </div>{vehicleVariants.length === 0 && <p className="rounded-xl bg-amber-50 p-4 text-[10px] text-amber-700">No active variants are available in this category.</p>}</div>}
            </div>
          )}
          {step === 3 && (
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                ["registrationNumber", "Registration Number", "text"],
                ["manufacturer", "Manufacturer", "text"],
                ["model", "Model", "text"],
                ["fuelType", "Fuel Type", "text"],
                ["color", "Colour", "text"],
                ["seatingCapacity", "Seating Capacity", "number"],
                ["manufacturingYear", "Manufacturing Year", "number"],
              ].map(([key, label, type]) => (
                <Field key={key} label={label}>
                  <input
                    required
                    type={type}
                    value={form.vehicle[key]}
                    onChange={(e) => update("vehicle", key, e.target.value)}
                    className={inputClass}
                  />
                </Field>
              ))}
              <Field label="Ownership Type">
                <select required value={form.vehicle.ownershipType} onChange={(e) => update("vehicle", "ownershipType", e.target.value)} className={inputClass}>
                  <option value="">Select ownership</option><option value="RJS_OWNED">RJS owned</option><option value="DRIVER_OWNED">Driver owned</option><option value="THIRD_PARTY">Third party</option>
                </select>
              </Field>
              <FileField
                label="Vehicle front photo"
                value={form.vehicle.frontPhoto}
                onChange={(file) => update("vehicle", "frontPhoto", file.url)}
                help="Keep number plate clearly visible"
              />
              <FileField
                label="Vehicle rear photo"
                value={form.vehicle.rearPhoto}
                onChange={(file) => update("vehicle", "rearPhoto", file.url)}
                help="Keep number plate clearly visible"
              />
            </div>
          )}
          {step === 4 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {docs.map((name) => (
                <FileField
                  key={name}
                  label={name}
                  value={form.documents[name]?.fileName}
                  onChange={(file) =>
                    setForm((old) => ({
                      ...old,
                      documents: { ...old.documents, [name]: file },
                    }))
                  }
                />
              ))}
            </div>
          )}
          {step === 5 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Account Holder Name" className="sm:col-span-2">
                <input
                  required
                  value={form.bank.accountHolderName}
                  onChange={(e) =>
                    update("bank", "accountHolderName", e.target.value)
                  }
                  className={inputClass}
                />
              </Field>
              <Field label="Bank Account Number">
                <input
                  required
                  value={form.bank.accountNumber}
                  onChange={(e) =>
                    update("bank", "accountNumber", e.target.value)
                  }
                  className={inputClass}
                />
              </Field>
              <Field label="Confirm Account Number">
                <input
                  required
                  value={form.bank.confirmAccountNumber}
                  onChange={(e) =>
                    update("bank", "confirmAccountNumber", e.target.value)
                  }
                  className={inputClass}
                />
              </Field>
              <Field label="IFSC Code">
                <input
                  required
                  value={form.bank.ifscCode}
                  onChange={(e) => update("bank", "ifscCode", e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="UPI ID (Optional)">
                <input
                  value={form.bank.upiId}
                  onChange={(e) => update("bank", "upiId", e.target.value)}
                  className={inputClass}
                />
              </Field>
              <div className="sm:col-span-2">
                <FileField
                  label="Cancelled cheque or passbook"
                  value={form.bank.proofFileName}
                  onChange={(file) =>
                    setForm((old) => ({
                      ...old,
                      bank: {
                        ...old.bank,
                        proofFileName: file.fileName,
                        proofUrl: file.url,
                      },
                    }))
                  }
                  help="Account name and number must be visible"
                />
              </div>
            </div>
          )}
          {step === 6 && (
            <div className="space-y-3">
              {[
                [
                  LuUserRound,
                  "Personal Details",
                  `${form.personal.fullName} · ${form.personal.phone}`,
                  0,
                ],
                [
                  LuBadgeCheck,
                  "Driver Details",
                  `${form.licence.number} · ${form.licence.issuingState}`,
                  1,
                ],
                [
                  LuCarFront,
                  "Vehicle",
                  `${selectedCategory?.name || "Category"} / ${selectedVariant?.name || "Variant"} · ${form.vehicle.registrationNumber}`,
                  2,
                ],
                [LuFileUp, "Documents", `${docs.length} required documents`, 4],
                [
                  LuLandmark,
                  "Bank Details",
                  `${form.bank.accountHolderName} · Account ending ${form.bank.accountNumber.slice(-4)}`,
                  5,
                ],
              ].map(([Icon, title, value, target]) => (
                <button
                  type="button"
                  onClick={() => setStep(target)}
                  key={title}
                  className="flex w-full items-center gap-4 rounded-xl border border-slate-200 p-4 text-left"
                >
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-emerald-50 text-emerald-600">
                    <Icon />
                  </span>
                  <span className="flex-1">
                    <b className="block text-[11px]">{title}</b>
                    <small className="text-[9px] text-slate-500">{value}</small>
                  </span>
                  <span className="text-[9px] font-bold text-blue-600">
                    Edit
                  </span>
                </button>
              ))}
              <label className="flex items-start gap-3 rounded-xl bg-orange-50 p-4 text-[10px] text-slate-600">
                <input
                  required
                  type="checkbox"
                  checked={form.consentAccepted}
                  onChange={(e) =>
                    setForm({ ...form, consentAccepted: e.target.checked })
                  }
                  className="mt-0.5"
                />
                I confirm that the original documents were checked at the office
                and the information entered is accurate.
              </label>
            </div>
          )}
          {error && (
            <div className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-[10px] text-red-600">
              <p className="flex items-center gap-2 font-bold">
                <LuX />
                {validationIssues.length
                  ? "Please correct the following fields:"
                  : error}
              </p>
              {validationIssues.length > 0 && (
                <ul className="mt-2 list-disc space-y-1 pl-7 font-medium">
                  {validationIssues.map((issue, index) => (
                    <li key={`${issue.field}-${index}`}>
                      <span className="font-bold">{issue.field || "Form"}</span>
                      : {issue.message}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          <div className="mt-7 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => (step ? setStep(step - 1) : navigate("/drivers"))}
              className="h-11 rounded-xl border border-slate-200 px-6 text-[10px] font-bold cursor-pointer"
            >
              {step ? "Back" : "Cancel"}
            </button>
            {step < 6 ? (
              <button className="flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-6 text-[10px] font-bold text-white cursor-pointer">
                Save & Continue
                <LuArrowRight />
              </button>
            ) : (
              <button
                type="button"
                disabled={saving || !form.consentAccepted}
                onClick={submit}
                className="flex h-11 items-center gap-2 rounded-xl bg-orange-500 px-6 text-[10px] font-bold text-white disabled:opacity-50"
              >
                <LuCheck />
                {saving ? "Creating..." : "Create Driver"}
              </button>
            )}
          </div>
        </form>
      </main>
      {phoneVerification.open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4 backdrop-blur-[2px]">
          <form
            onSubmit={verifyPhoneOtp}
            className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl"
          >
            <div className="flex items-start gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-blue-50 text-xl text-blue-600">
                <LuPhoneCall />
              </span>
              <div className="flex-1">
                <h3 className="text-base font-black text-slate-900">
                  Verify phone number
                </h3>
                <p className="mt-1 text-[10px] leading-5 text-slate-500">
                  Enter the 6-digit OTP sent to +91 {normalizedPhone()}.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setPhoneVerification((old) => ({
                    ...old,
                    open: false,
                    error: "",
                  }))
                }
                className="grid h-8 w-8 place-items-center rounded-lg bg-slate-100 text-slate-500"
              >
                <LuX />
              </button>
            </div>
            <input
              autoFocus
              inputMode="numeric"
              maxLength={6}
              value={phoneVerification.otp}
              onChange={(event) =>
                setPhoneVerification((old) => ({
                  ...old,
                  otp: event.target.value.replace(/\D/g, ""),
                  error: "",
                }))
              }
              placeholder="Enter OTP"
              className="mt-5 h-12 w-full rounded-xl border border-slate-200 px-4 text-center text-lg font-black tracking-[0.45em] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-50"
            />
            {phoneVerification.devOtp && (
              <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-[9px] font-bold text-amber-700">
                Development OTP: {phoneVerification.devOtp}
              </p>
            )}
            {phoneVerification.error && (
              <p className="mt-2 text-[9px] font-bold text-red-600">
                {phoneVerification.error}
              </p>
            )}
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                disabled={phoneVerification.loading}
                onClick={requestPhoneOtp}
                className="h-11 flex-1 rounded-xl border border-slate-200 text-[10px] font-bold text-slate-600 cursor-pointer"
              >
                Resend OTP
              </button>
              <button
                disabled={phoneVerification.loading}
                className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 text-[10px] font-bold text-white disabled:opacity-60 cursor-pointer"
              >
                {phoneVerification.loading && (
                  <LuLoaderCircle className="animate-spin" />
                )}
                Verify OTP
              </button>
            </div>
          </form>
        </div>
      )}
    </AdminLayout>
  );
}

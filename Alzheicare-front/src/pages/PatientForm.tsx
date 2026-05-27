import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo_alzheicare.png";

type DiseasePhase = "Early" | "Moderate" | "Severe";

type ConditionEntry = { name: string; diagnosedAt: string; isCustom?: boolean };

// All 20 diseases from the data model
const ALL_CONDITIONS = [
  "Alzheimer's Disease",
  "Osteoporosis",
  "Diabetes Type 1",
  "Epilepsy",
  "Diabetes Type 2",
  "Multiple Sclerosis",
  "Hypertension",
  "Lupus",
  "Asthma",
  "Crohn's Disease",
  "Chronic Kidney Disease",
  "Hypothyroidism",
  "Heart Disease",
  "Hyperthyroidism",
  "COPD",
  "Obesity",
  "Cancer",
  "Sleep Apnea",
  "Arthritis",
  "Depression",
];

const ALLERGY_OPTIONS = [
  "Penicillin",
  "Aspirin",
  "Ibuprofen",
  "Sulfa drugs",
  "Latex",
  "Pollen",
  "Peanuts",
  "Shellfish",
];

const inputStyle = {
  background: "#f8faff",
  border: "1.5px solid #e8eef8",
  boxShadow: "inset 0 2px 4px rgba(29,158,117,0.04)",
};

const inputFocus = {
  border: "1.5px solid #1d9e75",
  boxShadow:
    "inset 0 2px 4px rgba(29,158,117,0.08), 0 0 0 3px rgba(29,158,117,0.08)",
};

const inputBlur = {
  border: "1.5px solid #e8eef8",
  boxShadow: "inset 0 2px 4px rgba(29,158,117,0.04)",
};

// ── Condition Search Dropdown ─────────────────────────────────────────────────
function ConditionSearch({
  conditions,
  onAdd,
}: {
  conditions: ConditionEntry[];
  onAdd: (entry: ConditionEntry) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selectedNames = conditions.map((c) => c.name);

  const filtered = ALL_CONDITIONS.filter(
    (c) =>
      c.toLowerCase().includes(query.toLowerCase()) &&
      !selectedNames.includes(c)
  );

  const showCustomOption =
    query.trim().length > 0 &&
    !ALL_CONDITIONS.some(
      (c) => c.toLowerCase() === query.trim().toLowerCase()
    ) &&
    !selectedNames.includes(query.trim());

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const select = (name: string, isCustom = false) => {
    onAdd({ name, diagnosedAt: "", isCustom });
    setQuery("");
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <div
        className="flex items-center gap-2 w-full px-4 py-3 rounded-2xl text-sm text-gray-800 outline-none transition-all cursor-text"
        style={inputStyle}
        onClick={() => setOpen(true)}
      >
        <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
        </svg>
        <input
          type="text"
          placeholder="Search or type a condition..."
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          className="flex-1 bg-transparent outline-none text-sm text-gray-800 placeholder-gray-400"
        />
      </div>

      {/* Dropdown */}
      {open && (filtered.length > 0 || showCustomOption) && (
        <div
          className="absolute z-50 w-full mt-1.5 bg-white rounded-2xl overflow-hidden"
          style={{ boxShadow: "0 8px 30px rgba(0,0,0,0.12)", border: "1.5px solid #e8eef8" }}
        >
          <div className="max-h-48 overflow-y-auto">
            {filtered.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => select(c)}
                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-[#f0f7ff] hover:text-[#1a6fb5] transition-colors"
              >
                {c}
              </button>
            ))}
            {showCustomOption && (
              <>
                {filtered.length > 0 && <div className="border-t border-gray-100 mx-3" />}
                <button
                  type="button"
                  onClick={() => select(query.trim(), true)}
                  className="w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-2"
                  style={{ color: "#1a6fb5" }}
                >
                  <span className="font-semibold">+</span>
                  Add &quot;{query.trim()}&quot; as custom condition
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Selected Condition Tag ────────────────────────────────────────────────────
function ConditionTag({
  entry,
  onRemove,
  onDateChange,
}: {
  entry: ConditionEntry;
  onRemove: () => void;
  onDateChange: (date: string) => void;
}) {
  return (
    <div
      className="flex flex-col gap-2 px-3 py-2.5 rounded-2xl"
      style={{ background: "#f8faff", border: "1.5px solid #e8eef8" }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {entry.isCustom && (
            <span
              className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
              style={{ background: "rgba(107,114,128,0.1)", color: "#6b7280" }}
            >
              Custom
            </span>
          )}
          <span className="text-xs font-semibold text-gray-700">{entry.name}</span>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="text-gray-300 hover:text-red-400 transition-colors text-sm"
        >
          ✕
        </button>
      </div>

      {/* Diagnosed At */}
      <div className="flex items-center gap-2">
        <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 shrink-0">
          Diagnosed at
        </label>
        <input
          type="month"
          value={entry.diagnosedAt}
          onChange={(e) => onDateChange(e.target.value)}
          max={new Date().toISOString().slice(0, 7)}
          className="flex-1 px-2.5 py-1 rounded-xl text-xs text-gray-700 outline-none transition-all"
          style={inputStyle}
          onFocus={(e) => Object.assign(e.target.style, inputFocus)}
          onBlur={(e) => Object.assign(e.target.style, inputBlur)}
        />
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function PatientForm() {
  const navigate = useNavigate();

  const [dateOfBirth, setDateOfBirth] = useState("");
  const [address, setAddress] = useState("");
  const [caregiverNumber, setCaregiverNumber] = useState("");
  const [phase, setPhase] = useState<DiseasePhase>("Early");
  const [chronicConditions, setChronicConditions] = useState<ConditionEntry[]>([]);
  const [allergies, setAllergies] = useState<string[]>([]);

  const addCondition = (entry: ConditionEntry) => {
    setChronicConditions((prev) => [...prev, entry]);
  };

  const removeCondition = (name: string) => {
    setChronicConditions((prev) => prev.filter((c) => c.name !== name));
  };

  const updateDiagnosedAt = (name: string, date: string) => {
    setChronicConditions((prev) =>
      prev.map((c) => (c.name === name ? { ...c, diagnosedAt: date } : c))
    );
  };

  const toggleItem = (
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>,
    item: string
  ) => {
    setList(list.includes(item) ? list.filter((i) => i !== item) : [...list, item]);
  };

  function calculateAge(dob: string): number {
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    navigate("/caregiver/dashboard");
  };

  return (
    <div className="min-h-screen flex" style={{ background: "#f8faff" }}>
      {/* Background blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute rounded-full" style={{ width: "500px", height: "500px", top: "-150px", right: "-100px", background: "radial-gradient(circle, rgba(29,158,117,0.08) 0%, transparent 70%)" }} />
        <div className="absolute rounded-full" style={{ width: "400px", height: "400px", bottom: "0", left: "-100px", background: "radial-gradient(circle, rgba(26,111,181,0.06) 0%, transparent 70%)" }} />
      </div>

      {/* Left Panel */}
      <div
        className="hidden lg:flex lg:w-2/5 flex-col items-center justify-center px-12 relative overflow-hidden"
        style={{ background: "linear-gradient(160deg, #1d9e75 0%, #0f7a5a 60%, #085c40 100%)" }}
      >
        <div className="absolute top-[-80px] left-[-80px] w-72 h-72 rounded-full" style={{ background: "rgba(255,255,255,0.04)" }} />
        <div className="absolute bottom-[-60px] right-[-60px] w-96 h-96 rounded-full" style={{ background: "rgba(255,255,255,0.04)" }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full" style={{ background: "rgba(255,255,255,0.02)" }} />
        <div className="relative z-10 flex flex-col items-center gap-6">
          <img src={logo} alt="AlzheiCare" className="w-64" style={{ filter: "brightness(0) invert(1)" }} />
          <div className="w-16 h-px bg-white/30" />
          <p className="text-white/60 text-sm tracking-widest uppercase text-center">Patient Information</p>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div
          className="w-full max-w-lg bg-white rounded-3xl p-8"
          style={{ boxShadow: "0 25px 70px rgba(29,158,117,0.12), 0 8px 25px rgba(0,0,0,0.15)" }}
        >
          {/* Mobile logo */}
          <div className="flex justify-center mb-6 lg:hidden">
            <img src={logo} alt="AlzheiCare" className="h-7" />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-1">Patient Information</h2>
          <p className="text-sm text-gray-400 mb-6">Tell us about the patient you're caring for</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">

            {/* Date of Birth & Caregiver Phone */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Date of Birth</label>
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  max={new Date().toISOString().split("T")[0]}
                  className="w-full px-4 py-3 rounded-2xl text-sm text-gray-800 outline-none transition-all"
                  style={inputStyle}
                  onFocus={(e) => Object.assign(e.target.style, inputFocus)}
                  onBlur={(e) => Object.assign(e.target.style, inputBlur)}
                />
                {dateOfBirth && (
                  <p className="text-xs text-gray-400 pl-1">
                    Age: <span className="text-[#1d9e75] font-semibold">{calculateAge(dateOfBirth)} years old</span>
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Caregiver Phone</label>
                <input
                  type="tel"
                  placeholder="+1 555 000 0000"
                  value={caregiverNumber}
                  onChange={(e) => setCaregiverNumber(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl text-sm text-gray-800 outline-none transition-all"
                  style={inputStyle}
                  onFocus={(e) => Object.assign(e.target.style, inputFocus)}
                  onBlur={(e) => Object.assign(e.target.style, inputBlur)}
                />
              </div>
            </div>

            {/* Address */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Home Address</label>
              <input
                type="text"
                placeholder="Street, City, Country"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl text-sm text-gray-800 outline-none transition-all"
                style={inputStyle}
                onFocus={(e) => Object.assign(e.target.style, inputFocus)}
                onBlur={(e) => Object.assign(e.target.style, inputBlur)}
              />
            </div>

            {/* Disease Phase */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Alzheimer's Disease Phase</label>
              <div className="flex gap-2">
                {(["Early", "Moderate", "Severe"] as DiseasePhase[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPhase(p)}
                    className="flex-1 py-2.5 rounded-2xl text-sm font-medium transition-all"
                    style={{
                      border: phase === p ? "1.5px solid #1d9e75" : "1.5px solid #e8eef8",
                      background: phase === p ? "linear-gradient(135deg, #1d9e75, #0f7a5a)" : "#f8faff",
                      color: phase === p ? "white" : "#6b7280",
                      boxShadow: phase === p ? "0 4px 12px rgba(29,158,117,0.25)" : "none",
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Chronic Conditions */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Chronic Conditions
              </label>

              <ConditionSearch conditions={chronicConditions} onAdd={addCondition} />

              {/* Selected tags */}
              {chronicConditions.length > 0 && (
                <div className="flex flex-col gap-2 mt-1">
                  {chronicConditions.map((entry) => (
                    <ConditionTag
                      key={entry.name}
                      entry={entry}
                      onRemove={() => removeCondition(entry.name)}
                      onDateChange={(date) => updateDiagnosedAt(entry.name, date)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Allergies */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Allergies</label>
              <div className="flex flex-wrap gap-2">
                {ALLERGY_OPTIONS.map((allergy) => (
                  <button
                    key={allergy}
                    type="button"
                    onClick={() => toggleItem(allergies, setAllergies, allergy)}
                    className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                    style={{
                      border: allergies.includes(allergy) ? "1.5px solid #ef4444" : "1.5px solid #e8eef8",
                      background: allergies.includes(allergy) ? "rgba(239,68,68,0.08)" : "#f8faff",
                      color: allergies.includes(allergy) ? "#ef4444" : "#6b7280",
                      boxShadow: allergies.includes(allergy) ? "0 2px 8px rgba(239,68,68,0.12)" : "none",
                    }}
                  >
                    {allergy}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full py-3 rounded-2xl text-sm font-semibold text-white transition-all hover:scale-[1.02] mt-2"
              style={{
                background: "linear-gradient(135deg, #1d9e75 0%, #0f7a5a 100%)",
                boxShadow: "0 4px 15px rgba(29,158,117,0.35)",
              }}
            >
              Continue to Dashboard →
            </button>
          </form>

          <p className="text-xs text-gray-400 text-center mt-5">
            Note: This is a prototype. Do not use real patient data.
          </p>
        </div>
      </div>
    </div>
  );
}
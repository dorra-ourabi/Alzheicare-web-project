import { useState } from "react";
import {
  User,
  Activity,
  Pill,
  AlertCircle,
  Plus,
  X,
  Check,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
export interface PatientIdentity {
  firstName: string;
  secondName: string;
  dateOfBirth: string;
  address: string | null;
  dateOfDiagnosis?: string | null;
}

export interface ChronicDisease {
  id: number;
  diseaseName: string;
  additionalDisease?: string | null;
  diagnosedAt?: string | null;
}

export interface Medication {
  id: number;
  name: string;
  frequencyPerDay: number;
  timingNote?: string | null;
  startDate: string;
  expiryDate?: string | null;
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface PatientOverviewProps {
  onFormClick: () => void;
  patient: PatientIdentity;
  chronicDiseases: ChronicDisease[];
  medications: Medication[];
  allergies: string[];
  onAddMedication: (
    name: string,
    frequencyPerDay: number,
    startDate: string,
    timingNote?: string | null,
    expiryDate?: string | null,
  ) => Promise<void>;
  onRemoveMedication: (id: number) => Promise<void>;
  isLoading?: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatAge(dateOfBirth: string): number {
  const birth = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function formatBirthDate(dateOfBirth: string): string {
  return new Date(dateOfBirth).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatDiagnosedAt(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

function formatFreq(
  frequencyPerDay: number,
  timingNote?: string | null,
): string {
  const base = `${frequencyPerDay}x / day`;
  return timingNote ? `${base} · ${timingNote}` : base;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function PatientOverview({
  onFormClick,
  patient,
  chronicDiseases,
  medications,
  allergies,
  onAddMedication,
  onRemoveMedication,
  isLoading = false,
}: PatientOverviewProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newFreq, setNewFreq] = useState("");
  const [newTimingNote, setNewTimingNote] = useState("");
  const [newStartDate, setNewStartDate] = useState("");
  const [newExpiryDate, setNewExpiryDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setNewName("");
    setNewFreq("");
    setNewTimingNote("");
    setNewStartDate("");
    setNewExpiryDate("");
    setError(null);
    setShowAddForm(false);
  };

  const handleAddMedication = async () => {
    if (!newName.trim() || !newFreq.trim() || !newStartDate.trim()) {
      setError("Name, frequency and start date are required.");
      return;
    }
    const freq = parseInt(newFreq);
    if (isNaN(freq) || freq < 1) {
      setError("Frequency must be a valid number.");
      return;
    }

    const alreadyExists = medications.some(
      (m) => m.name.toLowerCase() === newName.trim().toLowerCase(),
    );
    if (alreadyExists) {
      setError("This medication is already in the list.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await onAddMedication(
        newName.trim(),
        freq,
        newStartDate,
        newTimingNote.trim() || null,
        newExpiryDate || null,
      );
      resetForm();
    } catch {
      setError("Failed to add medication. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveMedication = async (id: number) => {
    try {
      await onRemoveMedication(id);
    } catch {
      setError("Failed to remove medication. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <div
        className="rounded-2xl p-6 text-white mb-6 animate-pulse"
        style={{
          background: "linear-gradient(135deg, #1a6fb5 0%, #1557a0 100%)",
          minHeight: 200,
        }}
      />
    );
  }

  return (
    <div
      className="rounded-2xl p-6 text-white mb-6"
      style={{
        background: "linear-gradient(135deg, #1a6fb5 0%, #1557a0 100%)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-xl">
            <User size={20} />
          </div>
          <h2 className="font-semibold text-lg">Patient Overview</h2>
        </div>
        <div className="flex gap-2">
          <button className="bg-white/20 hover:bg-white/30 transition px-4 py-1.5 rounded-lg text-sm font-medium">
            Export Report
          </button>
          <button
            onClick={onFormClick}
            className="bg-white text-[#1a6fb5] hover:bg-blue-50 transition px-4 py-1.5 rounded-lg text-sm font-semibold"
          >
            + Form
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Identity */}
        <div className="bg-white/10 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3 text-blue-200 text-xs font-semibold uppercase tracking-wider">
            <User size={12} /> Identity
          </div>
          <p className="font-semibold text-base">
            {patient.firstName} {patient.secondName}
          </p>
          <p className="text-blue-100 text-sm mt-1">
            {formatAge(patient.dateOfBirth)} years old — Born{" "}
            {formatBirthDate(patient.dateOfBirth)}
          </p>
          {patient.address && (
            <p className="text-blue-200 text-xs mt-2">{patient.address}</p>
          )}
          {patient.dateOfDiagnosis && (
            <p className="text-blue-200 text-xs mt-1">
              Diagnosed: {formatDiagnosedAt(patient.dateOfDiagnosis)}
            </p>
          )}
        </div>

        {/* Chronic Conditions + Allergies */}
        <div className="bg-white/10 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3 text-blue-200 text-xs font-semibold uppercase tracking-wider">
            <Activity size={12} /> Chronic Conditions
          </div>

          {chronicDiseases.length === 0 ? (
            <p className="text-blue-300 text-xs italic">
              No conditions recorded
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {chronicDiseases.map((disease) => (
                <div
                  key={disease.id}
                  className="flex items-center justify-between"
                >
                  <span className="text-sm">
                    {disease.diseaseName === "Other" &&
                    disease.additionalDisease
                      ? disease.additionalDisease
                      : disease.diseaseName}
                  </span>
                  {disease.diagnosedAt && (
                    <span className="text-blue-300 text-xs">
                      {formatDiagnosedAt(disease.diagnosedAt)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="border-t border-white/15 my-3" />

          <div className="flex items-center gap-2 mb-2 text-blue-200 text-xs font-semibold uppercase tracking-wider">
            <AlertCircle size={12} /> Allergies
          </div>
          {allergies.length === 0 ? (
            <p className="text-blue-300 text-xs italic">No known allergies</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {allergies.map((allergy) => (
                <span
                  key={allergy}
                  className="flex items-center gap-1 bg-red-400/20 border border-red-300/30 text-red-100 text-xs font-medium px-2.5 py-1 rounded-full"
                >
                  ⚠ {allergy}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Key Medications */}
        <div className="bg-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-blue-200 text-xs font-semibold uppercase tracking-wider">
              <Pill size={12} /> Key Medications
            </div>
            <button
              onClick={() => {
                setShowAddForm(!showAddForm);
                setError(null);
              }}
              className="w-5 h-5 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition"
            >
              <Plus size={12} />
            </button>
          </div>

          {/* Error */}
          {error && (
            <p className="text-red-300 text-xs mb-2 bg-red-400/10 px-2 py-1 rounded-lg">
              {error}
            </p>
          )}

          {/* Add Form */}
          {showAddForm && (
            <div className="mb-3 flex flex-col gap-1.5">
              <input
                type="text"
                placeholder="Drug name (e.g. Aspirin)"
                value={newName}
                onChange={(e) => {
                  setNewName(e.target.value);
                  setError(null);
                }}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-blue-300 outline-none focus:border-white/40"
              />

              <div className="flex items-center gap-1.5 bg-white/10 border border-white/20 rounded-lg px-2.5 py-1.5">
                <input
                  type="number"
                  min="1"
                  placeholder="e.g. 2"
                  value={newFreq}
                  onChange={(e) => setNewFreq(e.target.value)}
                  className="w-full bg-transparent text-xs text-white placeholder-blue-300 outline-none"
                />
                <span className="text-blue-300 text-xs shrink-0">x / day</span>
              </div>

              <input
                type="text"
                placeholder="Timing note (e.g. after meals) — optional"
                value={newTimingNote}
                onChange={(e) => setNewTimingNote(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-blue-300 outline-none focus:border-white/40"
              />

              <div className="flex flex-col gap-0.5">
                <label className="text-blue-300 text-xs">Start date</label>
                <input
                  type="date"
                  value={newStartDate}
                  onChange={(e) => setNewStartDate(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-white/40"
                />
              </div>

              <div className="flex flex-col gap-0.5">
                <label className="text-blue-300 text-xs">
                  Expiry date — optional
                </label>
                <input
                  type="date"
                  value={newExpiryDate}
                  onChange={(e) => setNewExpiryDate(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-white/40"
                />
              </div>

              <div className="flex gap-1.5">
                <button
                  onClick={handleAddMedication}
                  disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-1 bg-white text-[#1a6fb5] rounded-lg py-1 text-xs font-semibold hover:bg-blue-50 transition disabled:opacity-50"
                >
                  <Check size={11} />
                  {submitting ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={resetForm}
                  className="flex-1 flex items-center justify-center gap-1 bg-white/10 hover:bg-white/20 rounded-lg py-1 text-xs transition"
                >
                  <X size={11} /> Cancel
                </button>
              </div>
            </div>
          )}

          {/* Medications List */}
          <div className="flex flex-col gap-2 text-sm">
            {medications.length === 0 ? (
              <p className="text-blue-300 text-xs italic">
                No medications added yet
              </p>
            ) : (
              medications.map((med) => (
                <div
                  key={med.id}
                  className="flex items-start justify-between group"
                >
                  <span className="text-sm">{med.name}</span>
                  <div className="flex items-start gap-2">
                    <div className="flex flex-col items-end">
                      <span className="text-blue-200 text-xs">
                        {formatFreq(med.frequencyPerDay, med.timingNote)}
                      </span>
                      {med.startDate && (
                        <span className="text-blue-300 text-xs">
                          {formatDate(med.startDate)}
                          {med.expiryDate &&
                            ` → ${formatDate(med.expiryDate)}`}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemoveMedication(med.id)}
                      className="opacity-0 group-hover:opacity-100 transition w-4 h-4 rounded-full bg-white/20 hover:bg-red-400 flex items-center justify-center mt-0.5"
                    >
                      <X size={9} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
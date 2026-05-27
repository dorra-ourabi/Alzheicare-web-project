import { useState } from "react";
import Sidebar from "../../components/caregiver/Sidebar";
import PatientOverview from "../../components/caregiver/PatientOverview";
import type {
  PatientIdentity,
  ChronicDisease,
  Medication,
} from "../../components/caregiver/PatientOverview";
import BehavioralChart from "../../components/caregiver/BehavioralChart";
import WeightChart from "../../components/caregiver/WeightChart";
import SleepTracker from "../../components/caregiver/SleepTracker";
import type { SleepRecord } from "../../components/caregiver/SleepTracker";
import DailyLogModal from "../../components/caregiver/DailyLogModal";
import type { DailyLogInput } from "../../components/caregiver/DailyLogModal";
import MoodTracker from "../../components/caregiver/MoodTracker";
import type { MoodEntry } from "../../components/caregiver/moodTracker.types.ts";
import { mockMoodEntries } from "/home/oumeima/alzheicare/Alzheicare-front/src/components/caregiver/moodTracker.types.ts";

// ── Types charts ──────────────────────────────────────────────────────────────

interface BehaviorEntry {
  date: string;
  aggressiveness: number;
  withdrawal: number;
  anxiety: number;
  repetitive: number;
}

interface WeightEntry {
  date: string;
  weight: number;
}

// ── Mock data statique ────────────────────────────────────────────────────────

const mockPatient: PatientIdentity = {
  firstName: "Margaret",
  secondName: "Thompson",
  dateOfBirth: "1948-04-03",
  dateOfDiagnosis: "2021-03-12",
  address: "Avenue Bourguiba 8170, Bou Salem, Tunisie",
};

const mockChronicDiseases: ChronicDisease[] = [
  { id: 1, diseaseName: "Hypertension", diagnosedAt: "2018-03-01" },
  { id: 2, diseaseName: "Diabetes_Type2", diagnosedAt: "2019-01-01" },
  {
    id: 3,
    diseaseName: "Other",
    additionalDisease: "Mild Cognitive Decline",
    diagnosedAt: "2021-03-01",
  },
];

const mockMedications: Medication[] = [
  { id: 1, name: "Metformin",  frequencyPerDay: 2, startDate: "2023-01-01", timingNote: "after meals" },
  { id: 2, name: "Lisinopril", frequencyPerDay: 1, startDate: "2022-06-15" },
  { id: 3, name: "Aspirin",    frequencyPerDay: 1, startDate: "2022-06-15", timingNote: "morning" },
];

const mockAllergies: string[] = ["Penicillin", "Ibuprofen"];

// ── Mock data charts ──────────────────────────────────────────────────────────

const mockBehaviorData: BehaviorEntry[] = [
  { date: "Apr 1",  aggressiveness: 1, withdrawal: 0, anxiety: 1, repetitive: 0 },
  { date: "Apr 2",  aggressiveness: 1, withdrawal: 1, anxiety: 1, repetitive: 1 },
  { date: "Apr 3",  aggressiveness: 0, withdrawal: 1, anxiety: 0, repetitive: 0 },
  { date: "Apr 4",  aggressiveness: 1, withdrawal: 0, anxiety: 1, repetitive: 1 },
  { date: "Apr 5",  aggressiveness: 0, withdrawal: 0, anxiety: 0, repetitive: 1 },
  { date: "Apr 6",  aggressiveness: 1, withdrawal: 1, anxiety: 1, repetitive: 0 },
  { date: "Apr 7",  aggressiveness: 0, withdrawal: 0, anxiety: 1, repetitive: 0 },
  { date: "Apr 8",  aggressiveness: 1, withdrawal: 1, anxiety: 0, repetitive: 1 },
  { date: "Apr 9",  aggressiveness: 0, withdrawal: 0, anxiety: 1, repetitive: 1 },
  { date: "Apr 10", aggressiveness: 1, withdrawal: 0, anxiety: 0, repetitive: 0 },
  { date: "Apr 11", aggressiveness: 0, withdrawal: 1, anxiety: 1, repetitive: 1 },
  { date: "Apr 12", aggressiveness: 1, withdrawal: 0, anxiety: 1, repetitive: 0 },
  { date: "Apr 13", aggressiveness: 0, withdrawal: 1, anxiety: 0, repetitive: 1 },
  { date: "Apr 14", aggressiveness: 1, withdrawal: 0, anxiety: 1, repetitive: 0 },
  { date: "Apr 15", aggressiveness: 0, withdrawal: 0, anxiety: 0, repetitive: 1 },
  { date: "Apr 16", aggressiveness: 1, withdrawal: 1, anxiety: 1, repetitive: 0 },
  { date: "Apr 17", aggressiveness: 0, withdrawal: 0, anxiety: 1, repetitive: 1 },
  { date: "Apr 18", aggressiveness: 1, withdrawal: 1, anxiety: 0, repetitive: 0 },
  { date: "Apr 19", aggressiveness: 0, withdrawal: 0, anxiety: 1, repetitive: 1 },
  { date: "Apr 20", aggressiveness: 1, withdrawal: 0, anxiety: 0, repetitive: 0 },
  { date: "Apr 21", aggressiveness: 0, withdrawal: 1, anxiety: 1, repetitive: 0 },
  { date: "Apr 22", aggressiveness: 1, withdrawal: 0, anxiety: 0, repetitive: 1 },
  { date: "Apr 23", aggressiveness: 0, withdrawal: 1, anxiety: 1, repetitive: 0 },
  { date: "Apr 24", aggressiveness: 1, withdrawal: 0, anxiety: 1, repetitive: 1 },
  { date: "Apr 25", aggressiveness: 0, withdrawal: 1, anxiety: 0, repetitive: 0 },
  { date: "Apr 26", aggressiveness: 1, withdrawal: 0, anxiety: 1, repetitive: 1 },
  { date: "Apr 27", aggressiveness: 0, withdrawal: 1, anxiety: 1, repetitive: 0 },
  { date: "Apr 28", aggressiveness: 1, withdrawal: 0, anxiety: 0, repetitive: 1 },
  { date: "Apr 29", aggressiveness: 0, withdrawal: 0, anxiety: 1, repetitive: 0 },
  { date: "Apr 30", aggressiveness: 1, withdrawal: 1, anxiety: 0, repetitive: 1 },
];

const mockWeightData: WeightEntry[] = [
  { date: "Feb 1",  weight: 72.4 },
  { date: "Feb 8",  weight: 72.1 },
  { date: "Feb 15", weight: 71.8 },
  { date: "Feb 22", weight: 71.6 },
  { date: "Mar 1",  weight: 71.3 },
  { date: "Mar 8",  weight: 71.0 },
  { date: "Mar 15", weight: 71.2 },
  { date: "Mar 22", weight: 70.8 },
  { date: "Mar 29", weight: 70.5 },
  { date: "Apr 5",  weight: 70.3 },
];

const mockSleepRecords: SleepRecord[] = [
  { id: 1,  date: "2026-04-01", hoursSlept: 5.5, quality: "Fair",      bedTime: "23:30", wakeTime: "05:00", notes: "Interrupted" },
  { id: 2,  date: "2026-04-02", hoursSlept: 7.2, quality: "Good",      bedTime: "22:45", wakeTime: "05:57" },
  { id: 3,  date: "2026-04-03", hoursSlept: 3.8, quality: "Poor",      bedTime: "01:00", wakeTime: "04:48", notes: "Nightmares" },
  { id: 4,  date: "2026-04-04", hoursSlept: 8.5, quality: "Excellent", bedTime: "22:00", wakeTime: "06:30" },
  { id: 5,  date: "2026-04-05", hoursSlept: 6.5, quality: "Good",      bedTime: "23:00", wakeTime: "05:30" },
  { id: 6,  date: "2026-04-06", hoursSlept: 4.2, quality: "Poor",      notes: "Restless" },
  { id: 7,  date: "2026-04-07", hoursSlept: 7.8, quality: "Good",      bedTime: "22:30", wakeTime: "06:18" },
  { id: 8,  date: "2026-04-08", hoursSlept: 6.1, quality: "Good",      bedTime: "23:15", wakeTime: "05:21" },
  { id: 9,  date: "2026-04-09", hoursSlept: 5.0, quality: "Fair",      bedTime: "00:00", wakeTime: "05:00" },
  { id: 10, date: "2026-04-10", hoursSlept: 8.0, quality: "Excellent", bedTime: "21:30", wakeTime: "05:30" },
  { id: 11, date: "2026-04-11", hoursSlept: 3.5, quality: "Poor",      notes: "Very agitated" },
  { id: 12, date: "2026-04-12", hoursSlept: 6.8, quality: "Good",      bedTime: "23:00", wakeTime: "05:48" },
  { id: 13, date: "2026-04-13", hoursSlept: 7.5, quality: "Good",      bedTime: "22:15", wakeTime: "05:45" },
  { id: 14, date: "2026-04-14", hoursSlept: 5.8, quality: "Fair",      bedTime: "23:45", wakeTime: "05:33" },
  { id: 15, date: "2026-04-15", hoursSlept: 9.0, quality: "Excellent", bedTime: "21:00", wakeTime: "06:00" },
];

// ── Helper ────────────────────────────────────────────────────────────────────

function toShortDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function CaregiverDashboard() {
  const [showModal, setShowModal] = useState(false);

  // ── Medications state ──
  const [medications, setMedications] = useState<Medication[]>(mockMedications);

  // ── Charts state — centralisé ici, mis à jour par DailyLogModal ──
  const [behaviorData, setBehaviorData] = useState<BehaviorEntry[]>(mockBehaviorData);
  const [weightData,   setWeightData]   = useState<WeightEntry[]>(mockWeightData);
  const [sleepRecords, setSleepRecords] = useState<SleepRecord[]>(mockSleepRecords);
  const [moodEntries,  setMoodEntries]  = useState<MoodEntry[]>(mockMoodEntries);

  // ── Medication callbacks ──
  const handleAddMedication = async (
    name: string,
    frequencyPerDay: number,
    startDate: string,
    timingNote?: string | null,
    expiryDate?: string | null,
  ) => {
    // TODO: await addMedicationMutation({ variables: { patientId, name, frequencyPerDay, startDate, timingNote, expiryDate } })
    const newMed: Medication = {
      id: Date.now(),
      name,
      frequencyPerDay,
      startDate,
      timingNote:  timingNote  ?? null,
      expiryDate:  expiryDate  ?? null,
    };
    setMedications((prev) => [...prev, newMed]);
  };

  const handleRemoveMedication = async (id: number) => {
    // TODO: await removeMedicationMutation({ variables: { id } })
    setMedications((prev) => prev.filter((m) => m.id !== id));
  };

  // ── DailyLog submit — met à jour les 4 charts ──
  const handleDailyLogSubmit = async (log: DailyLogInput) => {
    // TODO: await createDailyLogMutation({ variables: { patientId, ...log } })

    // 1. Behavioral chart
    const newBehavior: BehaviorEntry = {
      date:           toShortDate(log.date),
      aggressiveness: log.behaviors.includes("aggressiveness")  ? 1 : 0,
      withdrawal:     log.behaviors.includes("withdrawal")      ? 1 : 0,
      anxiety:        log.behaviors.includes("anxiety")         ? 1 : 0,
      repetitive:     log.behaviors.includes("repetitive_acts") ? 1 : 0,
    };
    setBehaviorData((prev) => [...prev, newBehavior]);

    // 2. Weight chart
    if (log.weightKg !== null) {
      setWeightData((prev) => [
        ...prev,
        { date: toShortDate(log.date), weight: log.weightKg! },
      ]);
    }

    // 3. Sleep tracker
    if (log.sleep !== null) {
      const newRecord: SleepRecord = {
        id:         Date.now(),
        date:       log.date,
        hoursSlept: log.sleep.hoursSlept,
        quality:    log.sleep.quality,
        bedTime:    log.sleep.bedTime    ?? undefined,
        wakeTime:   log.sleep.wakeTime   ?? undefined,
        notes:      log.sleep.sleepNotes ?? undefined,
      };
      setSleepRecords((prev) => [...prev, newRecord]);
    }

    // 4. Mood tracker
    const newMoodEntry: MoodEntry = {
      id:         Date.now(),
      date:       log.date,
      mood:       log.mood,
      notes:      log.moodNote ?? null,
      recordedAt: new Date().toISOString(),
    };
    setMoodEntries((prev) => [...prev, newMoodEntry]);
  };

  return (
    <div className="flex min-h-screen bg-[#f4f7fb]">
      <Sidebar />

      <main className="flex-1 p-6 overflow-y-auto">
        <div className="mb-4">
          <h1 className="text-xl font-bold text-gray-900">Patient Dashboard</h1>
          <p className="text-xs text-gray-400">
            Last updated:{" "}
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        <PatientOverview
          onFormClick={() => setShowModal(true)}
          patient={mockPatient}
          chronicDiseases={mockChronicDiseases}
          medications={medications}
          allergies={mockAllergies}
          onAddMedication={handleAddMedication}
          onRemoveMedication={handleRemoveMedication}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <BehavioralChart data={behaviorData} />
          <WeightChart data={weightData} />
          <MoodTracker
            entries={moodEntries}
            onSaveNote={async (entryId, note) => {
              // TODO: await updateMoodNoteMutation({ variables: { entryId, note } })
              setMoodEntries((prev) =>
                prev.map((e) => (e.id === entryId ? { ...e, notes: note } : e))
              );
            }}
          />
          <SleepTracker records={sleepRecords} />
        </div>
      </main>

      {showModal && (
        <DailyLogModal
          onClose={() => setShowModal(false)}
          onSubmit={handleDailyLogSubmit}
        />
      )}
    </div>
  );
}
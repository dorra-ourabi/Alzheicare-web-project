import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../../components/caregiver/Sidebar'
import PatientOverview from '../../components/caregiver/PatientOverview'
import type {
  PatientIdentity,
  ChronicDisease,
  Medication,
} from '../../components/caregiver/PatientOverview'
import BehavioralChart from '../../components/caregiver/BehavioralChart'
import WeightChart from '../../components/caregiver/WeightChart'
import SleepTracker from '../../components/caregiver/SleepTracker'
import type { SleepRecord } from '../../components/caregiver/SleepTracker'
import DailyLogModal from '../../components/caregiver/DailyLogModal'
import type { DailyLogInput } from '../../components/caregiver/DailyLogModal'
import MoodTracker from '../../components/caregiver/MoodTracker'
import type { MoodEntry } from '../../components/caregiver/moodTracker.types.ts'
import { mockMoodEntries } from '../../components/caregiver/moodTracker.types.ts'
import { useAuth } from '../../context/useAuth'
import { ApiError } from '../../lib/api'
import { graphqlRequest } from '../../lib/graphql'

type BehaviorEntry = {
  date: string
  aggressiveness: number
  withdrawal: number
  anxiety: number
  repetitive: number
}

type WeightEntry = {
  date: string
  weight: number
}

type PatientDashboardPayload = {
  patient: {
    firstName: string
    secondName: string
    dateOfBirth: string | null
    dateOfDiagnosis: string | null
    address: string | null
    caregiversNumbers: string | null
  }
  chronicDiseases: Array<{
    id: number
    diseaseName: string
    additionalDisease: string | null
    diagnosedAt: string | null
  }>
  medications: Array<{
    id: number
    name: string
    dosage: string | null
    startDate: string
    endDate: string | null
    notes: string | null
  }>
  allergies: string[]
  behaviorEntries: BehaviorEntry[]
  weightEntries: WeightEntry[]
  moodEntries: MoodEntry[]
  sleepRecords: SleepRecord[]
}

const emptyPatient: PatientIdentity = {
  firstName: '',
  secondName: '',
  dateOfBirth: '1970-01-01',
  dateOfDiagnosis: null,
  address: null,
}

function parseFrequency(dosage: string | null) {
  if (!dosage) return 1
  const match = dosage.match(/\d+/)
  return match ? Number(match[0]) || 1 : 1
}

function toShortDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

export default function CaregiverDashboard() {
  const navigate = useNavigate()
  const { accessToken } = useAuth()
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [patient, setPatient] = useState<PatientIdentity>(emptyPatient)
  const [chronicDiseases, setChronicDiseases] = useState<ChronicDisease[]>([])
  const [medications, setMedications] = useState<Medication[]>([])
  const [allergies, setAllergies] = useState<string[]>([])
  const [behaviorData, setBehaviorData] = useState<BehaviorEntry[]>([])
  const [weightData, setWeightData] = useState<WeightEntry[]>([])
  const [sleepRecords, setSleepRecords] = useState<SleepRecord[]>([])
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([])

  useEffect(() => {
    const stored = localStorage.getItem('accessToken')
    const token = accessToken ?? stored

    if (!token) {
      navigate('/', { replace: true })
      return
    }

    setLoading(true)
    setError('')

    graphqlRequest<{ patientDashboard: PatientDashboardPayload }>(
      `
        query PatientDashboard {
          patientDashboard {
            patient {
              firstName
              secondName
              dateOfBirth
              dateOfDiagnosis
              address
              caregiversNumbers
            }
            chronicDiseases {
              id
              diseaseName
              additionalDisease
              diagnosedAt
            }
            medications {
              id
              name
              dosage
              startDate
              endDate
              notes
            }
            allergies
            behaviorEntries {
              date
              aggressiveness
              withdrawal
              anxiety
              repetitive
            }
            weightEntries {
              date
              weight
            }
            moodEntries {
              id
              date
              mood
              notes
              recordedAt
            }
            sleepRecords {
              id
              date
              hoursSlept
              quality
              bedTime
              wakeTime
              notes
            }
          }
        }
      `,
      {},
      token,
    )
      .then((response) => {
        const payload = response.patientDashboard

        setPatient({
          firstName: payload.patient.firstName,
          secondName: payload.patient.secondName,
          dateOfBirth: payload.patient.dateOfBirth ?? '1970-01-01',
          dateOfDiagnosis: payload.patient.dateOfDiagnosis,
          address: payload.patient.address,
        })

        setChronicDiseases(
          payload.chronicDiseases.map((disease) => ({
            id: disease.id,
            diseaseName: disease.diseaseName,
            additionalDisease: disease.additionalDisease,
            diagnosedAt: disease.diagnosedAt,
          })),
        )

        setMedications(
          payload.medications.map((medication) => ({
            id: medication.id,
            name: medication.name,
            frequencyPerDay: parseFrequency(medication.dosage),
            timingNote: medication.notes,
            startDate: medication.startDate,
            expiryDate: medication.endDate,
          })),
        )

        setAllergies(payload.allergies)
        setBehaviorData(payload.behaviorEntries)
        setWeightData(payload.weightEntries)
        setSleepRecords(payload.sleepRecords)
        setMoodEntries(payload.moodEntries)
      })
      .catch((caughtError) => {
        const message =
          caughtError instanceof ApiError ? caughtError.message : 'Failed to load patient dashboard'
        setError(message)
      })
      .finally(() => setLoading(false))
  }, [accessToken, navigate])

  const handleAddMedication = async (
    name: string,
    frequencyPerDay: number,
    startDate: string,
    timingNote?: string | null,
    expiryDate?: string | null,
  ) => {
    const newMed: Medication = {
      id: Date.now(),
      name,
      frequencyPerDay,
      startDate,
      timingNote: timingNote ?? null,
      expiryDate: expiryDate ?? null,
    }
    setMedications((prev) => [...prev, newMed])
  }

  const handleRemoveMedication = async (id: number) => {
    setMedications((prev) => prev.filter((m) => m.id !== id))
  }

  const handleDailyLogSubmit = async (log: DailyLogInput) => {
    const newBehavior: BehaviorEntry = {
      date: toShortDate(log.date),
      aggressiveness: log.behaviors.includes('aggressiveness') ? 1 : 0,
      withdrawal: log.behaviors.includes('withdrawal') ? 1 : 0,
      anxiety: log.behaviors.includes('anxiety') ? 1 : 0,
      repetitive: log.behaviors.includes('repetitive_acts') ? 1 : 0,
    }
    setBehaviorData((prev) => [...prev, newBehavior])

    if (log.weightKg !== null) {
      setWeightData((prev) => [...prev, { date: toShortDate(log.date), weight: log.weightKg! }])
    }

    if (log.sleep !== null) {
      const newRecord: SleepRecord = {
        id: Date.now(),
        date: log.date,
        hoursSlept: log.sleep.hoursSlept,
        quality: log.sleep.quality,
        bedTime: log.sleep.bedTime ?? undefined,
        wakeTime: log.sleep.wakeTime ?? undefined,
        notes: log.sleep.sleepNotes ?? undefined,
      }
      setSleepRecords((prev) => [...prev, newRecord])
    }

    const newMoodEntry: MoodEntry = {
      id: Date.now(),
      date: log.date,
      mood: log.mood,
      notes: log.moodNote ?? null,
      recordedAt: new Date().toISOString(),
    }
    setMoodEntries((prev) => [...prev, newMoodEntry])
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f7fb] text-sm text-gray-500">
        Loading patient dashboard...
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f7fb] px-6">
        <div className="max-w-md rounded-3xl border border-red-200 bg-white p-6 text-center shadow-sm">
          <h1 className="text-lg font-bold text-gray-900">Patient dashboard unavailable</h1>
          <p className="mt-2 text-sm text-gray-500">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="mt-5 rounded-2xl bg-[#1a6fb5] px-4 py-2.5 text-sm font-semibold text-white"
          >
            Back to home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-[#f4f7fb]">
      <Sidebar />

      <main className="flex-1 p-6 overflow-y-auto">
        <div className="mb-4">
          <h1 className="text-xl font-bold text-gray-900">Patient Dashboard</h1>
          <p className="text-xs text-gray-400">
            Last updated:{' '}
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>

        <PatientOverview
          onFormClick={() => setShowModal(true)}
          patient={patient}
          chronicDiseases={chronicDiseases}
          medications={medications}
          allergies={allergies}
          onAddMedication={handleAddMedication}
          onRemoveMedication={handleRemoveMedication}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <BehavioralChart data={behaviorData} />
          <WeightChart data={weightData} />
          <MoodTracker
            entries={moodEntries.length > 0 ? moodEntries : mockMoodEntries}
            onSaveNote={async (entryId, note) => {
              setMoodEntries((prev) =>
                prev.map((e) => (e.id === entryId ? { ...e, notes: note } : e)),
              )
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
  )
}

import { useState } from 'react'
import { X, Moon, Clock } from 'lucide-react'

// ── Types — miroir exact du data model Prisma/GraphQL ─────────────────────────

export type MoodType = 'sad' | 'anxious' | 'neutral' | 'good' | 'great'
export type BehaviorType = 'aggressiveness' | 'withdrawal' | 'anxiety' | 'repetitive_acts'
export type SleepQuality = 'Poor' | 'Fair' | 'Good' | 'Excellent'

export interface DailyLogInput {
  // MoodEntry
  mood: MoodType
  moodNote: string | null

  // BehaviorEntry[]
  behaviors: BehaviorType[]

  // WeightRecord
  weightKg: number | null

  // SleepRecord
  sleep: {
    hoursSlept: number
    quality: SleepQuality       // computed client-side, confirmed by backend
    bedTime: string | null      // "HH:mm"
    wakeTime: string | null     // "HH:mm"
    sleepNotes: string | null
  } | null

  // shared
  date: string                  // ISO "YYYY-MM-DD" — today
}

// ── Constants ─────────────────────────────────────────────────────────────────

const MOODS: { key: MoodType; emoji: string; label: string }[] = [
  { key: 'sad',     emoji: '😢', label: 'Sad'     },
  { key: 'anxious', emoji: '😟', label: 'Anxious' },
  { key: 'neutral', emoji: '😐', label: 'Neutral' },
  { key: 'good',    emoji: '🙂', label: 'Good'    },
  { key: 'great',   emoji: '😊', label: 'Great'   },
]

const BEHAVIORS: { key: BehaviorType; label: string; color: string }[] = [
  { key: 'aggressiveness',  label: 'Aggressiveness', color: 'bg-red-500'    },
  { key: 'withdrawal',      label: 'Withdrawal',     color: 'bg-purple-500' },
  { key: 'anxiety',         label: 'Anxiety',        color: 'bg-yellow-400' },
  { key: 'repetitive_acts', label: 'Repetitive Acts',color: 'bg-blue-500'   },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function computeSleepQuality(hours: number): SleepQuality {
  if (hours < 4)  return 'Poor'
  if (hours < 6)  return 'Fair'
  if (hours < 8)  return 'Good'
  return 'Excellent'
}

const QUALITY_STYLE: Record<SleepQuality, string> = {
  Poor:      'bg-red-100 text-red-600',
  Fair:      'bg-amber-100 text-amber-600',
  Good:      'bg-blue-100 text-blue-600',
  Excellent: 'bg-emerald-100 text-emerald-600',
}

function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  onClose: () => void
  // TODO: replace with useMutation(CREATE_DAILY_LOG) when GraphQL is ready
  onSubmit?: (data: DailyLogInput) => Promise<void>
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function DailyLogModal({ onClose, onSubmit }: Props) {

  // Mood
  const [mood, setMood] = useState<MoodType | null>(null)
  const [moodNote, setMoodNote] = useState('')

  // Behaviors
  const [selectedBehaviors, setSelectedBehaviors] = useState<BehaviorType[]>([])

  // Weight
  const [weight, setWeight] = useState('')

  // Sleep
  const [hoursSlept, setHoursSlept] = useState('')
  const [bedTime, setBedTime]       = useState('')
  const [wakeTime, setWakeTime]     = useState('')
  const [sleepNotes, setSleepNotes] = useState('')

  // UI
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]           = useState<string | null>(null)

  // Computed sleep quality — shown live as user types
  const sleepHoursNum = parseFloat(hoursSlept)
  const sleepQuality: SleepQuality | null =
    !isNaN(sleepHoursNum) && sleepHoursNum > 0
      ? computeSleepQuality(sleepHoursNum)
      : null

  const toggleBehavior = (key: BehaviorType) => {
    setSelectedBehaviors((prev) =>
      prev.includes(key) ? prev.filter((b) => b !== key) : [...prev, key]
    )
  }

  const handleSubmit = async () => {
    if (!mood) {
      setError('Please select a mood before saving.')
      return
    }

    const payload: DailyLogInput = {
      mood,
      moodNote:  moodNote.trim()  || null,
      behaviors: selectedBehaviors,
      weightKg:  weight ? parseFloat(weight) : null,
      date:      todayISO(),
      sleep:
        hoursSlept
          ? {
              hoursSlept:  sleepHoursNum,
              quality:     sleepQuality!,
              bedTime:     bedTime  || null,
              wakeTime:    wakeTime || null,
              sleepNotes:  sleepNotes.trim() || null,
            }
          : null,
    }

    try {
      setSubmitting(true)
      setError(null)
      // TODO: await createDailyLogMutation({ variables: { patientId, ...payload } })
      if (onSubmit) await onSubmit(payload)
      onClose()
    } catch {
      setError('Failed to save. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">

        {/* Header */}
        <div className="flex items-center gap-3 p-6 border-b border-gray-100">
          <div>
            <h2 className="font-semibold text-gray-900 text-lg">Daily Patient Log</h2>
            <p className="text-xs text-gray-400">
              Complete this form to update the dashboard charts.
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-auto p-2 rounded-xl hover:bg-gray-100 text-gray-400"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-6">

          {/* ── Mood ── */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-3">
              How was the patient's mood today?
            </p>
            <div className="flex gap-2">
              {MOODS.map(({ key, emoji, label }) => (
                <button
                  key={key}
                  onClick={() => setMood(key)}
                  className={`flex-1 flex flex-col items-center py-3 rounded-xl border-2 transition-all ${
                    mood === key
                      ? 'border-[#1a6fb5] bg-blue-50'
                      : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <span className="text-2xl">{emoji}</span>
                  <span className="text-xs text-gray-500 mt-1">{label}</span>
                </button>
              ))}
            </div>
            <input
              type="text"
              placeholder="Mood note (optional) — e.g. calm morning, agitated after lunch"
              value={moodNote}
              onChange={(e) => setMoodNote(e.target.value)}
              className="mt-2 w-full bg-gray-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#1a6fb5]"
            />
          </div>

          {/* ── Behaviors ── */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">
              Observed Behaviors{' '}
              <span className="text-gray-400 font-normal">(select all that apply)</span>
            </p>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {BEHAVIORS.map(({ key, label, color }) => (
                <button
                  key={key}
                  onClick={() => toggleBehavior(key)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 text-sm transition-all ${
                    selectedBehaviors.includes(key)
                      ? 'border-[#1a6fb5] bg-blue-50 text-[#1a6fb5]'
                      : 'border-gray-100 text-gray-600 hover:border-gray-200'
                  }`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Weight ── */}
          <div>
            <label className="text-sm font-medium text-gray-700">
              Weight (kg)
            </label>
            <input
              type="number"
              placeholder="e.g. 72.5"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="mt-1 w-full bg-gray-100 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#1a6fb5]"
            />
          </div>

          {/* ── Sleep ── */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Moon size={15} className="text-[#1a6fb5]" />
              <p className="text-sm font-medium text-gray-700">Sleep</p>
            </div>

            {/* Hours + quality badge */}
            <div>
              <label className="text-xs text-gray-500">Hours slept</label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="number"
                  placeholder="e.g. 7.5"
                  value={hoursSlept}
                  onChange={(e) => setHoursSlept(e.target.value)}
                  className="flex-1 bg-gray-100 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#1a6fb5]"
                />
                {sleepQuality && (
                  <span className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 ${QUALITY_STYLE[sleepQuality]}`}>
                    {sleepQuality}
                  </span>
                )}
              </div>
            </div>

            {/* Bed time + Wake time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 flex items-center gap-1">
                  <Clock size={11} /> Bed time
                  <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  type="time"
                  value={bedTime}
                  onChange={(e) => setBedTime(e.target.value)}
                  className="mt-1 w-full bg-gray-100 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#1a6fb5]"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 flex items-center gap-1">
                  <Clock size={11} /> Wake time
                  <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  type="time"
                  value={wakeTime}
                  onChange={(e) => setWakeTime(e.target.value)}
                  className="mt-1 w-full bg-gray-100 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#1a6fb5]"
                />
              </div>
            </div>

            {/* Sleep notes */}
            <div>
              <label className="text-xs text-gray-500">
                Sleep notes <span className="text-gray-400">(optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. interrupted, nightmares, restless"
                value={sleepNotes}
                onChange={(e) => setSleepNotes(e.target.value)}
                className="mt-1 w-full bg-gray-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#1a6fb5]"
              />
            </div>
          </div>

          {/* ── Additional Notes ── */}
          <div>
            <label className="text-sm font-medium text-gray-700">
              Additional Notes{' '}
              <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              placeholder="Describe any notable events, reactions, or observations..."
              value={moodNote}
              onChange={(e) => setMoodNote(e.target.value)}
              rows={3}
              className="mt-1 w-full bg-gray-100 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#1a6fb5] resize-none"
            />
          </div>

          {/* ── Error ── */}
          {error && (
            <p className="text-red-500 text-xs bg-red-50 px-4 py-2 rounded-xl">
              {error}
            </p>
          )}

          {/* ── Submit ── */}
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full bg-[#1a6fb5] text-white rounded-xl py-3 text-sm font-semibold hover:bg-[#1557a0] transition-colors disabled:opacity-50"
          >
            {submitting ? 'Saving...' : 'Save Daily Update'}
          </button>

        </div>
      </div>
    </div>
  )
}
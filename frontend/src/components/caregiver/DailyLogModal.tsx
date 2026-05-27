import { useState } from 'react'
import { X } from 'lucide-react'

type Mood = 'sad' | 'anxious' | 'neutral' | 'good' | 'great'

const moods: { key: Mood; emoji: string; label: string }[] = [
  { key: 'sad', emoji: '😢', label: 'Sad' },
  { key: 'anxious', emoji: '😟', label: 'Anxious' },
  { key: 'neutral', emoji: '😐', label: 'Neutral' },
  { key: 'good', emoji: '🙂', label: 'Good' },
  { key: 'great', emoji: '😊', label: 'Great' },
]

const behaviors = ['Aggressiveness', 'Withdrawal', 'Anxiety', 'Repetitive Acts']

const behaviorColors: Record<string, string> = {
  Aggressiveness: 'bg-red-500',
  Withdrawal: 'bg-purple-500',
  Anxiety: 'bg-yellow-400',
  'Repetitive Acts': 'bg-blue-500',
}

interface Props {
  onClose: () => void
}

export default function DailyLogModal({ onClose }: Props) {
  const [mood, setMood] = useState<Mood | null>(null)
  const [selectedBehaviors, setSelectedBehaviors] = useState<string[]>([])
  const [sleep, setSleep] = useState('')
  const [weight, setWeight] = useState('')
  const [meds, setMeds] = useState(true)
  const [notes, setNotes] = useState('')

  const toggleBehavior = (b: string) => {
    setSelectedBehaviors((prev) =>
      prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b]
    )
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center gap-3 p-6 border-b border-gray-100">
          <div className="bg-[#1a6fb5] p-2 rounded-xl">
            <span className="text-white text-lg">📋</span>
          </div>
          <div>
            <h2 className="font-semibold text-gray-900 text-lg">Daily Patient Log</h2>
            <p className="text-xs text-gray-400">Complete this form to update the dashboard charts.</p>
          </div>
          <button
            onClick={onClose}
            className="ml-auto p-2 rounded-xl hover:bg-gray-100 text-gray-400"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-6">

          {/* Mood */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-3">How was the patient's mood today?</p>
            <div className="flex gap-2">
              {moods.map(({ key, emoji, label }) => (
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
          </div>

          {/* Behaviors */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">
              Observed Behaviors{' '}
              <span className="text-gray-400 font-normal">(select all that apply)</span>
            </p>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {behaviors.map((b) => (
                <button
                  key={b}
                  onClick={() => toggleBehavior(b)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 text-sm transition-all ${
                    selectedBehaviors.includes(b)
                      ? 'border-[#1a6fb5] bg-blue-50 text-[#1a6fb5]'
                      : 'border-gray-100 text-gray-600 hover:border-gray-200'
                  }`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full ${behaviorColors[b]}`} />
                  {b}
                </button>
              ))}
            </div>
          </div>

          {/* Sleep & Weight */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Sleep (hours)</label>
              <input
                type="number"
                placeholder="e.g. 7.5"
                value={sleep}
                onChange={(e) => setSleep(e.target.value)}
                className="mt-1 w-full bg-gray-100 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#1a6fb5]"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Weight (kg)</label>
              <input
                type="number"
                placeholder="e.g. 72.5"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="mt-1 w-full bg-gray-100 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#1a6fb5]"
              />
            </div>
          </div>

          {/* Medications */}
          <button
            onClick={() => setMeds(!meds)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all ${
              meds ? 'border-green-400 bg-green-50' : 'border-gray-100 bg-gray-50'
            }`}
          >
            <span className={`w-5 h-5 rounded-md flex items-center justify-center ${meds ? 'bg-green-500' : 'bg-gray-300'}`}>
              {meds && <span className="text-white text-xs">✓</span>}
            </span>
            <span className="text-sm font-medium text-gray-700">All medications were taken today</span>
          </button>

          {/* Notes */}
          <div>
            <label className="text-sm font-medium text-gray-700">
              Additional Notes{' '}
              <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              placeholder="Describe any notable events, reactions, or observations..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="mt-1 w-full bg-gray-100 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#1a6fb5] resize-none"
            />
          </div>

          {/* Submit */}
          <button
            onClick={onClose}
            className="w-full bg-[#1a6fb5] text-white rounded-xl py-3 text-sm font-semibold hover:bg-[#1557a0] transition-colors"
          >
            Save Daily Update
          </button>
        </div>
      </div>
    </div>
  )
}
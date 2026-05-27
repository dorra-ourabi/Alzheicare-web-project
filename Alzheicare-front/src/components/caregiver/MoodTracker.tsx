import { useState } from 'react'
import { ChevronLeft, ChevronRight, FileText, Pencil, Check, X } from 'lucide-react'
import type { MoodLevel, MoodEntry } from '/home/oumeima/alzheicare/Alzheicare-front/src/components/caregiver/moodTracker.types.ts'
import { moodEmojis, moodLabels } from '/home/oumeima/alzheicare/Alzheicare-front/src/components/caregiver/moodTracker.types.ts'

// ── Props ────────────────────────────────────────────────────────────────────
interface MoodTrackerProps {
  entries: MoodEntry[]
  onSaveNote: (entryId: number, note: string) => Promise<void>
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function getMoodCounts(entries: MoodEntry[]): Record<MoodLevel, number> {
  const counts: Record<MoodLevel, number> = { great: 0, good: 0, neutral: 0, anxious: 0, sad: 0 }
  entries.forEach(e => { counts[e.mood]++ })
  return counts
}

function formatRecordedAt(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit'
  })
}

// ── Component ────────────────────────────────────────────────────────────────
export default function MoodTracker({ entries, onSaveNote }: MoodTrackerProps) {
  const [currentDate, setCurrentDate]     = useState(new Date(2026, 3, 1))
  const [selectedEntry, setSelectedEntry] = useState<MoodEntry | null>(
    entries.find(e => e.date === '2026-04-15') ?? null
  )
  const [editingNote, setEditingNote]     = useState(false)
  const [noteText, setNoteText]           = useState('')
  const [savingNote, setSavingNote]       = useState(false)
  const [noteError, setNoteError]         = useState<string | null>(null)

  const days        = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const year        = currentDate.getFullYear()
  const month       = currentDate.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const startDay    = new Date(year, month, 1).getDay()
  const monthLabel  = currentDate.toLocaleString('en-US', { month: 'long', year: 'numeric' })

  const today          = new Date()
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month

  // O(1) lookup: date string → MoodEntry
  const entryByDate: Record<string, MoodEntry> = {}
  entries.forEach(e => { entryByDate[e.date] = e })

  const goToPrevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const goToNextMonth = () => setCurrentDate(new Date(year, month + 1, 1))

  const handleDayClick = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    setSelectedEntry(entryByDate[dateStr] ?? null)
    setEditingNote(false)
    setNoteError(null)
  }

  const handleEditNote = () => {
    setNoteText(selectedEntry?.notes ?? '')
    setEditingNote(true)
    setNoteError(null)
  }

  const handleSaveNote = async () => {
    if (!selectedEntry) return
    try {
      setSavingNote(true)
      setNoteError(null)
      await onSaveNote(selectedEntry.id, noteText.trim())
      setEditingNote(false)
    } catch {
      setNoteError('Failed to save note. Please try again.')
    } finally {
      setSavingNote(false)
    }
  }

  const handleCancelNote = () => {
    setEditingNote(false)
    setNoteError(null)
  }

  const moodCounts = getMoodCounts(entries)

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <h3 className="font-semibold text-gray-800 mb-1">Mood Tracker</h3>
      <p className="text-xs text-gray-400 mb-4">Daily emotional state log</p>

      {/* Month navigation */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={goToPrevMonth} className="p-1 rounded-lg hover:bg-gray-100">
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm font-medium text-gray-700">{monthLabel}</span>
        <button onClick={goToNextMonth} className="p-1 rounded-lg hover:bg-gray-100">
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {days.map((d) => (
          <div key={d} className="text-xs text-gray-400 font-medium py-1">{d}</div>
        ))}
        {Array.from({ length: startDay }).map((_, i) => <div key={`empty-${i}`} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day     = i + 1
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const entry   = entryByDate[dateStr]
          const isToday    = isCurrentMonth && today.getDate() === day
          const isSelected = selectedEntry?.date === dateStr

          return (
            <div
              key={day}
              onClick={() => handleDayClick(day)}
              className={`flex flex-col items-center justify-center rounded-xl py-1 text-xs transition-all cursor-pointer
                ${isSelected && !isToday ? 'bg-blue-50 ring-1 ring-[#1a6fb5]' : ''}
                ${isToday ? 'bg-[#1a6fb5] text-white' : 'hover:bg-gray-50'}
              `}
            >
              <span className={isToday ? 'text-white' : 'text-gray-500'}>{day}</span>
              {entry && (
                <span className="text-sm leading-none">{moodEmojis[entry.mood]}</span>
              )}
            </div>
          )
        })}
      </div>

      {/* Bottom section */}
      <div className="mt-4 pt-3 border-t border-gray-100">
        {selectedEntry ? (
          <>
            {/* Selected day header */}
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
              <span className="text-base">{moodEmojis[selectedEntry.mood]}</span>
              <span className="font-medium text-[#1a6fb5]">
                {selectedEntry.date} — {moodLabels[selectedEntry.mood]}
              </span>
              <span className="text-gray-400">
                · {formatRecordedAt(selectedEntry.recordedAt)}
              </span>
            </div>

            {/* Notes section */}
            <div className="bg-gray-50 rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <FileText size={11} /> Notes
                </div>
                {!editingNote && (
                  <button
                    onClick={handleEditNote}
                    className="flex items-center gap-1 text-xs text-[#1a6fb5] hover:text-blue-700 transition font-medium"
                  >
                    <Pencil size={11} />
                    {selectedEntry.notes ? 'Edit' : '+ Add Note'}
                  </button>
                )}
              </div>

              {editingNote ? (
                <div className="flex flex-col gap-2">
                  <textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Describe any notable events, reactions, or observations..."
                    rows={3}
                    autoFocus
                    className="w-full text-xs text-gray-700 bg-white border border-gray-200 rounded-lg px-3 py-2 outline-none resize-none focus:border-[#1a6fb5] transition"
                  />
                  {noteError && (
                    <p className="text-xs text-red-500">{noteError}</p>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveNote}
                      disabled={savingNote}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition disabled:opacity-50"
                      style={{ background: 'linear-gradient(135deg, #1a6fb5, #1254a0)' }}
                    >
                      <Check size={11} /> {savingNote ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={handleCancelNote}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 bg-white border border-gray-200 hover:bg-gray-50 transition"
                    >
                      <X size={11} /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-500 leading-relaxed">
                  {selectedEntry.notes ?? (
                    <span className="italic text-gray-400">No notes for this day.</span>
                  )}
                </p>
              )}
            </div>
          </>
        ) : (
          <p className="text-xs text-gray-400 italic">Select a day to see details.</p>
        )}

        {/* Mood summary */}
        <div className="flex flex-wrap gap-2 mt-3 text-xs text-gray-400">
          {(Object.keys(moodEmojis) as MoodLevel[]).map(mood => (
            moodCounts[mood] > 0 && (
              <span key={mood}>
                {moodEmojis[mood]} {moodLabels[mood]} ({moodCounts[mood]})
              </span>
            )
          ))}
        </div>
      </div>
    </div>
  )
}
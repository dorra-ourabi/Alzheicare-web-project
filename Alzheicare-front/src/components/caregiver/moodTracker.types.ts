// ── Types — miroir exact du data model MoodEntry ─────────────────────────────
export type MoodLevel = 'great' | 'good' | 'neutral' | 'anxious' | 'sad'

export interface MoodEntry {
  id: number
  date: string        // ISO string "2026-04-15"
  mood: MoodLevel
  notes?: string | null
  recordedAt: string  // ISO string timestamp
}

// ── Mock data — remplacé par props venant de Dashboard.tsx ───────────────────
export const mockMoodEntries: MoodEntry[] = [
  { id: 1,  date: '2026-04-01', mood: 'good',    notes: null,                                  recordedAt: '2026-04-01T09:00:00Z' },
  { id: 2,  date: '2026-04-02', mood: 'great',   notes: 'Very calm and happy all day.',        recordedAt: '2026-04-02T09:00:00Z' },
  { id: 3,  date: '2026-04-03', mood: 'neutral',  notes: null,                                 recordedAt: '2026-04-03T09:00:00Z' },
  { id: 4,  date: '2026-04-04', mood: 'good',    notes: null,                                  recordedAt: '2026-04-04T09:00:00Z' },
  { id: 5,  date: '2026-04-05', mood: 'sad',     notes: 'Refused to eat breakfast.',           recordedAt: '2026-04-05T09:00:00Z' },
  { id: 6,  date: '2026-04-06', mood: 'anxious', notes: 'Very restless in the afternoon.',     recordedAt: '2026-04-06T09:00:00Z' },
  { id: 7,  date: '2026-04-07', mood: 'good',    notes: null,                                  recordedAt: '2026-04-07T09:00:00Z' },
  { id: 8,  date: '2026-04-08', mood: 'great',   notes: 'Had a great visit with family.',      recordedAt: '2026-04-08T09:00:00Z' },
  { id: 9,  date: '2026-04-09', mood: 'neutral',  notes: null,                                 recordedAt: '2026-04-09T09:00:00Z' },
  { id: 10, date: '2026-04-10', mood: 'good',    notes: null,                                  recordedAt: '2026-04-10T09:00:00Z' },
  { id: 11, date: '2026-04-11', mood: 'anxious', notes: 'Agitated after evening meal.',        recordedAt: '2026-04-11T09:00:00Z' },
  { id: 12, date: '2026-04-12', mood: 'sad',     notes: null,                                  recordedAt: '2026-04-12T09:00:00Z' },
  { id: 13, date: '2026-04-13', mood: 'good',    notes: null,                                  recordedAt: '2026-04-13T09:00:00Z' },
  { id: 14, date: '2026-04-14', mood: 'neutral',  notes: null,                                 recordedAt: '2026-04-14T09:00:00Z' },
  { id: 15, date: '2026-04-15', mood: 'good',    notes: 'Calm morning, slightly tired later.', recordedAt: '2026-04-15T09:42:00Z' },
]

// ── Constants ─────────────────────────────────────────────────────────────────
export const moodEmojis: Record<MoodLevel, string> = {
  great: '😊', good: '🙂', neutral: '😐', anxious: '😟', sad: '😢'
}

export const moodLabels: Record<MoodLevel, string> = {
  great: 'Great', good: 'Good', neutral: 'Neutral', anxious: 'Anxious', sad: 'Sad'
}
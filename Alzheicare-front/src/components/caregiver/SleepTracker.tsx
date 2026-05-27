import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell
} from 'recharts'
import { ChevronLeft, ChevronRight, Moon, Clock, FileText } from 'lucide-react'

// ── Types — miroir exact du data model Prisma/GraphQL ─────────────────────────

export type SleepQuality = 'Poor' | 'Fair' | 'Good' | 'Excellent'

export interface SleepRecord {
  id: number
  date: string           // ISO "YYYY-MM-DD"
  hoursSlept: number
  quality: SleepQuality
  bedTime?: string | null   // "HH:mm"
  wakeTime?: string | null  // "HH:mm"
  notes?: string | null
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  // TODO: replace mock with useQuery(GET_SLEEP_RECORDS) when GraphQL is ready
  records?: SleepRecord[]
  targetHours?: number
}

// ── Constants ─────────────────────────────────────────────────────────────────

const QUALITY_COLOR: Record<SleepQuality, string> = {
  Excellent: '#22c55e',
  Good:      '#3b82f6',
  Fair:      '#f59e0b',
  Poor:      '#ef4444',
}

const QUALITY_BADGE: Record<SleepQuality, string> = {
  Excellent: 'bg-emerald-100 text-emerald-600',
  Good:      'bg-blue-100 text-blue-600',
  Fair:      'bg-amber-100 text-amber-600',
  Poor:      'bg-red-100 text-red-600',
}

const WEEK_SIZE = 7

// ── Mock data — remplacé par useQuery quand GraphQL est prêt ──────────────────

const mockRecords: SleepRecord[] = [
  { id: 1,  date: '2026-04-01', hoursSlept: 5.5, quality: 'Fair',      bedTime: '23:30', wakeTime: '05:00', notes: 'Interrupted' },
  { id: 2,  date: '2026-04-02', hoursSlept: 7.2, quality: 'Good',      bedTime: '22:45', wakeTime: '05:57' },
  { id: 3,  date: '2026-04-03', hoursSlept: 3.8, quality: 'Poor',      bedTime: '01:00', wakeTime: '04:48', notes: 'Nightmares' },
  { id: 4,  date: '2026-04-04', hoursSlept: 8.5, quality: 'Excellent', bedTime: '22:00', wakeTime: '06:30' },
  { id: 5,  date: '2026-04-05', hoursSlept: 6.5, quality: 'Good',      bedTime: '23:00', wakeTime: '05:30' },
  { id: 6,  date: '2026-04-06', hoursSlept: 4.2, quality: 'Poor',      notes: 'Restless' },
  { id: 7,  date: '2026-04-07', hoursSlept: 7.8, quality: 'Good',      bedTime: '22:30', wakeTime: '06:18' },
  { id: 8,  date: '2026-04-08', hoursSlept: 6.1, quality: 'Good',      bedTime: '23:15', wakeTime: '05:21' },
  { id: 9,  date: '2026-04-09', hoursSlept: 5.0, quality: 'Fair',      bedTime: '00:00', wakeTime: '05:00' },
  { id: 10, date: '2026-04-10', hoursSlept: 8.0, quality: 'Excellent', bedTime: '21:30', wakeTime: '05:30' },
  { id: 11, date: '2026-04-11', hoursSlept: 3.5, quality: 'Poor',      notes: 'Very agitated' },
  { id: 12, date: '2026-04-12', hoursSlept: 6.8, quality: 'Good',      bedTime: '23:00', wakeTime: '05:48' },
  { id: 13, date: '2026-04-13', hoursSlept: 7.5, quality: 'Good',      bedTime: '22:15', wakeTime: '05:45' },
  { id: 14, date: '2026-04-14', hoursSlept: 5.8, quality: 'Fair',      bedTime: '23:45', wakeTime: '05:33' },
  { id: 15, date: '2026-04-15', hoursSlept: 9.0, quality: 'Excellent', bedTime: '21:00', wakeTime: '06:00' },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatMonth(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

function computeStats(records: SleepRecord[], target: number) {
  if (records.length === 0) return null
  const hours = records.map((r) => r.hoursSlept)
  const avg = hours.reduce((a, b) => a + b, 0) / hours.length
  const longest = Math.max(...hours)
  const counts = { Excellent: 0, Good: 0, Fair: 0, Poor: 0 }
  records.forEach((r) => counts[r.quality]++)
  const belowTarget = records.filter((r) => r.hoursSlept < target).length
  return { avg, longest, counts, belowTarget }
}

// ── Custom Tooltip ────────────────────────────────────────────────────────────

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const r: SleepRecord = payload[0].payload
  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-lg p-3 text-xs min-w-[140px]">
      <p className="font-semibold text-gray-700 mb-1">{formatDate(r.date)}</p>
      <div className="flex items-center justify-between gap-3 mb-1">
        <span className="text-gray-400">Hours</span>
        <span className="font-bold text-gray-800">{r.hoursSlept}h</span>
      </div>
      {r.bedTime && r.wakeTime && (
        <div className="flex items-center justify-between gap-3 mb-1">
          <span className="text-gray-400">Time</span>
          <span className="text-gray-600">{r.bedTime} → {r.wakeTime}</span>
        </div>
      )}
      <div className="flex items-center justify-between gap-3">
        <span className="text-gray-400">Quality</span>
        <span className={`px-2 py-0.5 rounded-full font-semibold ${QUALITY_BADGE[r.quality]}`}>
          {r.quality}
        </span>
      </div>
      {r.notes && (
        <p className="mt-1.5 text-gray-400 italic border-t border-gray-100 pt-1.5">
          {r.notes}
        </p>
      )}
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function SleepTracker({
  records = mockRecords,
  targetHours = 7,
}: Props) {
  const [weekIndex, setWeekIndex] = useState(0)
  const [selected, setSelected] = useState<SleepRecord | null>(null)

  // Sort records ascending
  const sorted = [...records].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  // Paginate by week
  const totalWeeks = Math.ceil(sorted.length / WEEK_SIZE)
  const weekStart  = weekIndex * WEEK_SIZE
  const weekData   = sorted.slice(weekStart, weekStart + WEEK_SIZE)

  const stats = computeStats(sorted, targetHours)

  const weekLabel =
    weekData.length > 0
      ? `${formatDate(weekData[0].date)} — ${formatDate(weekData[weekData.length - 1].date)}`
      : ''

  const currentAvg =
    weekData.length > 0
      ? (weekData.reduce((a, r) => a + r.hoursSlept, 0) / weekData.length).toFixed(1)
      : '—'

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Moon size={16} className="text-[#1a6fb5]" />
          <h3 className="font-semibold text-gray-800">Sleep Tracker</h3>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-[#1a6fb5]">{currentAvg}h avg</p>
          <p className="text-xs text-gray-400">Target: ≥ {targetHours}h</p>
        </div>
      </div>
      <p className="text-xs text-gray-400 mb-4">
        {sorted.length > 0 ? formatMonth(sorted[0].date) : 'No records yet'}
      </p>

      {/* ── Stats Cards ── */}
      {stats && (
        <div className="grid grid-cols-5 gap-2 mb-4">
          {[
            { label: 'AVG',       value: `${stats.avg.toFixed(1)}h`, color: 'text-[#1a6fb5]' },
            { label: 'EXCELLENT', value: stats.counts.Excellent,     color: 'text-emerald-500' },
            { label: 'GOOD',      value: stats.counts.Good,          color: 'text-blue-500'    },
            { label: 'FAIR',      value: stats.counts.Fair,          color: 'text-amber-500'   },
            { label: 'POOR',      value: stats.counts.Poor,          color: 'text-red-500'     },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-gray-50 rounded-xl p-2 text-center">
              <p className="text-xs text-gray-400 leading-tight">{label}</p>
              <p className={`font-bold text-sm ${color}`}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Week Navigator ── */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => { setWeekIndex((i) => Math.max(0, i - 1)); setSelected(null) }}
          disabled={weekIndex === 0}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 disabled:opacity-30 transition"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-xs font-medium text-gray-500">{weekLabel}</span>
        <button
          onClick={() => { setWeekIndex((i) => Math.min(totalWeeks - 1, i + 1)); setSelected(null) }}
          disabled={weekIndex >= totalWeeks - 1}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 disabled:opacity-30 transition"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* ── Chart ── */}
      <ResponsiveContainer width="100%" height={130}>
        <BarChart
          data={weekData}
          onClick={(e) => {
            if (e?.activePayload?.[0]) {
              const r = e.activePayload[0].payload as SleepRecord
              setSelected((prev) => prev?.id === r.id ? null : r)
            }
          }}
        >
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            tick={{ fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[0, 10]}
            tick={{ fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={targetHours} stroke="#22c55e" strokeDasharray="4 4" />
          <Bar dataKey="hoursSlept" radius={[4, 4, 0, 0]} cursor="pointer">
            {weekData.map((entry) => (
              <Cell
                key={entry.id}
                fill={QUALITY_COLOR[entry.quality]}
                opacity={selected ? (selected.id === entry.id ? 1 : 0.4) : 1}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* ── Legend ── */}
      <div className="flex gap-3 mt-3 text-xs text-gray-400">
        {(Object.keys(QUALITY_COLOR) as SleepQuality[]).map((q) => (
          <span key={q} className="flex items-center gap-1">
            <span
              className="w-2 h-2 rounded-full inline-block"
              style={{ background: QUALITY_COLOR[q] }}
            />
            {q}
          </span>
        ))}
      </div>

      {/* ── Selected Detail Card ── */}
      {selected && (
        <div className="mt-4 p-4 rounded-2xl border border-gray-100 bg-gray-50 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-700">
              {formatDate(selected.date)}
            </p>
            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${QUALITY_BADGE[selected.quality]}`}>
              {selected.quality}
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Moon size={11} />
              {selected.hoursSlept}h slept
            </span>
            {selected.bedTime && selected.wakeTime && (
              <span className="flex items-center gap-1">
                <Clock size={11} />
                {selected.bedTime} → {selected.wakeTime}
              </span>
            )}
          </div>

          {selected.notes && (
            <div className="flex items-start gap-1.5 text-xs text-gray-400">
              <FileText size={11} className="mt-0.5 shrink-0" />
              <span className="italic">{selected.notes}</span>
            </div>
          )}
        </div>
      )}

    </div>
  )
}
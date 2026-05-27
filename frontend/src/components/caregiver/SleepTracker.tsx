import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

const data = [
  { date: 'Apr 1', hours: 5.5, quality: 'fair' },
  { date: 'Apr 4', hours: 7.2, quality: 'good' },
  { date: 'Apr 7', hours: 4.8, quality: 'poor' },
  { date: 'Apr 10', hours: 8.0, quality: 'great' },
  { date: 'Apr 13', hours: 6.5, quality: 'good' },
]

const colorMap: Record<string, string> = {
  great: '#22c55e', good: '#3b82f6', fair: '#f59e0b', poor: '#ef4444'
}

export default function SleepTracker() {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-800">Sleep Tracker</h3>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-[#1a6fb5]">6.5h avg</p>
          <p className="text-xs text-gray-400">Target: ≥ 7h</p>
        </div>
      </div>
      <p className="text-xs text-gray-400 mb-4">Hours per night — April 2026</p>

      <div className="grid grid-cols-4 gap-2 mb-4">
        {[
          { label: 'AVG SLEEP', value: '6.5h', color: 'text-[#1a6fb5]' },
          { label: 'POOR NIGHTS', value: '4', color: 'text-red-500' },
          { label: 'GOOD NIGHTS', value: '6', color: 'text-green-500' },
          { label: 'LONGEST', value: '8.0h', color: 'text-blue-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-gray-50 rounded-xl p-2 text-center">
            <p className="text-xs text-gray-400">{label}</p>
            <p className={`font-bold text-sm ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={130}>
        <BarChart data={data}>
          <XAxis dataKey="date" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', fontSize: 12 }} />
          <ReferenceLine y={7} stroke="#22c55e" strokeDasharray="4 4" />
          {data.map((entry) => (
            <Bar key={entry.date} dataKey="hours" fill={colorMap[entry.quality]} radius={[4, 4, 0, 0]} />
          ))}
          <Bar dataKey="hours" radius={[4, 4, 0, 0]} fill="#1a6fb5" />
        </BarChart>
      </ResponsiveContainer>

      <div className="flex gap-3 mt-3 text-xs text-gray-400">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> Great</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block" /> Good</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" /> Fair</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Poor</span>
      </div>
    </div>
  )
}
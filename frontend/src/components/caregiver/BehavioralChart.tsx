import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts'

const data = [
  { date: 'Apr 1', agitation: 6, wandering: 4, anxiety: 5, sleep: 3 },
  { date: 'Apr 4', agitation: 7, wandering: 5, anxiety: 6, sleep: 4 },
  { date: 'Apr 7', agitation: 5, wandering: 6, anxiety: 4, sleep: 5 },
  { date: 'Apr 10', agitation: 8, wandering: 4, anxiety: 7, sleep: 3 },
  { date: 'Apr 13', agitation: 6, wandering: 7, anxiety: 5, sleep: 6 },
]

export default function BehavioralChart() {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-semibold text-gray-800">Behavioral Turbulence</h3>
        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">Score / 10</span>
      </div>
      <p className="text-xs text-gray-400 mb-4">Daily behavioral scores — April 2026</p>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data}>
          <XAxis dataKey="date" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', fontSize: 12 }} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
          <Line type="monotone" dataKey="agitation" stroke="#ef4444" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="wandering" stroke="#f59e0b" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="anxiety" stroke="#8b5cf6" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="sleep" stroke="#3b82f6" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
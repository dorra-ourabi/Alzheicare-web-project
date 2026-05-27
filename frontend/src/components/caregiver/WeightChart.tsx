import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ReferenceLine
} from 'recharts'
import { TrendingDown } from 'lucide-react'

const data = [
  { date: 'Feb 1', weight: 72.4 },
  { date: 'Feb 22', weight: 71.8 },
  { date: 'Mar 15', weight: 71.2 },
  { date: 'Apr 5', weight: 70.3 },
]

export default function WeightChart() {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-semibold text-gray-800">Weight Evolution</h3>
        <div className="text-right">
          <p className="text-2xl font-bold text-gray-900">70.3 kg</p>
          <p className="text-xs text-green-500 flex items-center justify-end gap-1">
            <TrendingDown size={12} /> 2.1 kg
          </p>
        </div>
      </div>
      <p className="text-xs text-gray-400 mb-4">Weekly measurements — Feb–Apr 2026</p>

      <div className="flex gap-6 mb-4 text-sm">
        {[
          { label: 'START', value: '72.4 kg', color: 'text-gray-500' },
          { label: 'CURRENT', value: '70.3 kg', color: 'text-[#1a6fb5] font-bold' },
          { label: 'TARGET', value: '70 kg', color: 'text-green-500' },
          { label: 'BMI', value: '27.4', color: 'text-gray-500' },
        ].map(({ label, value, color }) => (
          <div key={label}>
            <p className="text-xs text-gray-400">{label}</p>
            <p className={`text-sm ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={130}>
        <LineChart data={data}>
          <XAxis dataKey="date" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis domain={[68, 74]} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', fontSize: 12 }} />
          <ReferenceLine y={70} stroke="#22c55e" strokeDasharray="4 4" />
          <Line type="monotone" dataKey="weight" stroke="#1a6fb5" strokeWidth={2} dot={{ r: 4, fill: '#1a6fb5' }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
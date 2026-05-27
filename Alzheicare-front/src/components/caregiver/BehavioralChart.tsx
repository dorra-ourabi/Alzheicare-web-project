import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface BehaviorEntry {
  date: string
  aggressiveness: number
  withdrawal: number
  anxiety: number
  repetitive: number
}

interface Props {
  data: BehaviorEntry[] 
}

const WINDOW = 10;

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const behaviors = payload.filter((p: any) => p.value === 1);
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg p-3 text-xs">
      <p className="font-semibold text-gray-700 mb-2">{label}</p>
      {behaviors.length === 0 ? (
        <p className="text-gray-400 italic">No behaviors observed</p>
      ) : (
        behaviors.map((b: any) => (
          <div key={b.dataKey} className="flex items-center gap-2 mb-1">
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: b.fill }}
            />
            <span className="text-gray-600 capitalize">{b.dataKey}</span>
          </div>
        ))
      )}
      <p className="text-gray-400 mt-2 pt-2 border-t border-gray-100">
        {behaviors.length} / 4 behaviors
      </p>
    </div>
  );
};

export default function BehavioralChart({ data }: Props) {
  const [startIndex, setStartIndex] = useState(
    Math.max(0, data.length - WINDOW),
  );
  const [direction, setDirection] = useState<"left" | "right">("right");

  const visibleData = data.slice(startIndex, startIndex + WINDOW);
  const canGoLeft = startIndex > 0;
  const canGoRight = startIndex + WINDOW < data.length;

  const monthLabel = new Date().toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-semibold text-gray-800">Behavioral Turbulence</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setDirection("left");
              setStartIndex((i) => Math.max(0, i - WINDOW));
            }}
            disabled={!canGoLeft}
            className="w-6 h-6 rounded-full flex items-center justify-center text-lg transition"
            style={{
              background: canGoLeft ? "#f3f4f6" : "transparent",
              color: canGoLeft ? "#374151" : "#d1d5db",
              cursor: canGoLeft ? "pointer" : "not-allowed",
            }}
          >
            ‹
          </button>
          <span className="text-xs text-gray-400 w-28 text-center">
            {visibleData[0]?.date} — {visibleData[visibleData.length - 1]?.date}
          </span>
          <button
            onClick={() => {
              setDirection("right");
              setStartIndex((i) =>
                Math.min(data.length - WINDOW, i + WINDOW),
              );
            }}
            disabled={!canGoRight}
            className="w-6 h-6 rounded-full flex items-center justify-center text-lg transition"
            style={{
              background: canGoRight ? "#f3f4f6" : "transparent",
              color: canGoRight ? "#374151" : "#d1d5db",
              cursor: canGoRight ? "pointer" : "not-allowed",
            }}
          >
            ›
          </button>
          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full ml-1">
            Daily Behaviors
          </span>
        </div>
      </div>

      <p className="text-xs text-gray-400 mb-4">
        Observed behaviors per day — {monthLabel}
      </p>

    <div key={startIndex} className={direction === 'right' ? 'slide-in-right' : 'slide-in-left'}>
      <ResponsiveContainer width="100%" height={180}>        
        <BarChart data={visibleData} barSize={20} barCategoryGap="30%">
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[0, 4]}
            ticks={[0, 1, 2, 3, 4]}
            tick={{ fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: "rgba(0,0,0,0.04)" }}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 12 }}
          />
          <Bar
            dataKey="aggressiveness"
            stackId="a"
            fill="#ef4444"
            radius={[0, 0, 0, 0]}
          />
          <Bar
            dataKey="anxiety"
            stackId="a"
            fill="#f59e0b"
            radius={[0, 0, 0, 0]}
          />
          <Bar
            dataKey="repetitive"
            stackId="a"
            fill="#3b82f6"
            radius={[0, 0, 0, 0]}
          />
          <Bar
            dataKey="withdrawal"
            stackId="a"
            fill="#8b5cf6"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>
  );
}
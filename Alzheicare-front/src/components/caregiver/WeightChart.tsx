import { useState } from "react";
import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Area,
  AreaChart,
} from "recharts";
import { TrendingDown, ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  data: { date: string; weight: number }[]
}

const WINDOW = 5;

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-3 py-2.5 text-xs">
      <p className="font-semibold text-gray-500 mb-1">{label}</p>
      <p className="text-[#1a6fb5] font-bold text-sm">{payload[0].value} kg</p>
    </div>
  );
};

export default function WeightChart({ data }: Props) {
  const [startIndex, setStartIndex] = useState(
    Math.max(0, data.length - WINDOW),
  );
  const [direction, setDirection] = useState<"left" | "right">("right");

  const visibleData = data.slice(startIndex, startIndex + WINDOW);
  const canGoLeft = startIndex > 0;
  const canGoRight = startIndex + WINDOW < data.length;

  const currentWeight = data[data.length - 1].weight;
  const startWeight = data[0].weight;
  const diff = (startWeight - currentWeight).toFixed(1);

  // dynamic Y domain with padding
  const weights = visibleData.map((d) => d.weight);
  const minWeight = Math.min(...weights);
  const maxWeight = Math.max(...weights);
  const padding = 0.5;
  const yDomain = [
    Math.floor((minWeight - padding) * 2) / 2,
    Math.ceil((maxWeight + padding) * 2) / 2,
  ];

  const slideClass = direction === "right" ? "slide-in-right" : "slide-in-left";

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-start justify-between mb-1">
        <h3 className="font-semibold text-gray-800">Weight Evolution</h3>
        <div className="text-right">
          <p className="text-2xl font-bold text-gray-900 leading-none">
            {currentWeight} kg
          </p>
          <p className="text-xs text-green-500 flex items-center justify-end gap-1 mt-1">
            <TrendingDown size={12} /> {diff} kg
          </p>
        </div>
      </div>

      {/* ── Stats row ── */}
      <div className="flex gap-6 mb-3">
        {[
          { label: "START", value: `${startWeight} kg`, cls: "text-gray-500" },
          {
            label: "CURRENT",
            value: `${currentWeight} kg`,
            cls: "text-[#1a6fb5] font-bold",
          },
          { label: "BMI", value: "27.4", cls: "text-gray-500" },
        ].map(({ label, value, cls }) => (
          <div key={label}>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              {label}
            </p>
            <p className={`text-sm mt-0.5 ${cls}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Navigation arrows */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => {
            setDirection("left");
            setStartIndex((i) => Math.max(0, i - WINDOW));
          }}
          disabled={!canGoLeft}
          className="p-1 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-xs text-black-400">
          {visibleData[0]?.date} — {visibleData[visibleData.length - 1]?.date}
        </span>
        <button
          onClick={() => {
            setDirection("right");
            setStartIndex((i) => Math.min(data.length - WINDOW, i + WINDOW));
          }}
          disabled={!canGoRight}
          className="p-1 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* ── Chart with slide ── */}
      <div key={startIndex} className={slideClass}>
        <ResponsiveContainer width="100%" height={140}>
          <AreaChart
            data={visibleData}
            margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1a6fb5" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#1a6fb5" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#f0f0f0"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={yDomain}
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v}`}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{
                stroke: "#1a6fb5",
                strokeWidth: 1,
                strokeDasharray: "4 4",
              }}
            />
            <Area
              type="monotone"
              dataKey="weight"
              stroke="#1a6fb5"
              strokeWidth={2.5}
              fill="url(#weightGradient)"
              dot={{ r: 5, fill: "#fff", stroke: "#1a6fb5", strokeWidth: 2 }}
              activeDot={{
                r: 6,
                fill: "#1a6fb5",
                stroke: "#fff",
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
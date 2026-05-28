import { useState } from "react";
import Sidebar from "../../components/caregiver/Sidebar";
import {
  MapPin,
  Navigation,
  Shield,
  AlertTriangle,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  Home,
} from "lucide-react";

type ZoneStatus = "safe" | "warning" | "danger";

interface PatientLocation {
  x: number;
  y: number;
  address: string;
  updatedAt: string;
}

const statusConfig: Record<
  ZoneStatus,
  {
    label: string;
    color: string;
    bg: string;
    border: string;
    icon: typeof Shield;
  }
> = {
  safe: {
    label: "Inside Safe Zone",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    icon: Shield,
  },
  warning: {
    label: "Near Zone Boundary",
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
    icon: AlertTriangle,
  },
  danger: {
    label: "Outside Safe Zone",
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-200",
    icon: AlertTriangle,
  },
};

export default function CaregiverLiveMap() {
  const [status, setStatus] = useState<ZoneStatus>("safe");
  const [location, setLocation] = useState<PatientLocation>({
    x: 52,
    y: 48,
    address: "Avenue Bourguiba, Bou Salem",
    updatedAt: new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  });
  const [refreshing, setRefreshing] = useState(false);

  const refresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setLocation((prev) => ({
        ...prev,
        updatedAt: new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      }));
      setRefreshing(false);
    }, 1000);
  };

  const simulate = (newStatus: ZoneStatus) => {
    setStatus(newStatus);
    const positions: Record<
      ZoneStatus,
      { x: number; y: number; address: string }
    > = {
      safe: { x: 52, y: 48, address: "Avenue Bourguiba, Bou Salem" },
      warning: { x: 68, y: 38, address: "Rue de la République, Bou Salem" },
      danger: { x: 80, y: 28, address: "Route Nationale 5, Bou Salem" },
    };
    setLocation((prev) => ({
      ...prev,
      ...positions[newStatus],
      updatedAt: new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    }));
  };

  const { label, color, bg, border, icon: StatusIcon } = statusConfig[status];

  return (
    <div className="flex min-h-screen bg-[#f4f7fb]">
      <Sidebar />

      <main className="flex-1 p-6 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Live Map</h1>
            <p className="text-xs text-gray-400">
              Real-time GPS tracking — Margaret J. Thompson
            </p>
          </div>
          <button
            onClick={refresh}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white transition ${
              refreshing ? "opacity-70" : ""
            }`}
            style={{ background: "linear-gradient(135deg, #1a6fb5, #6366f1)" }}
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Map */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Map Controls */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs text-gray-500 font-medium">
                        Live · Updated {location.updatedAt}
                    </span>
                  </div>
                <div className="flex gap-1">
                  <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition">
                    <ZoomIn size={15} />
                  </button>
                  <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition">
                    <ZoomOut size={15} />
                  </button>
                </div>
              </div>

              {/* Map Placeholder */}
              <div
                className="relative w-full overflow-hidden"
                style={{ height: "420px", background: "#e8f0f7" }}
              >
                {/* Grid lines simulating map */}
                <svg
                  className="absolute inset-0 w-full h-full opacity-20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <pattern
                      id="grid"
                      width="40"
                      height="40"
                      patternUnits="userSpaceOnUse"
                    >
                      <path
                        d="M 40 0 L 0 0 0 40"
                        fill="none"
                        stroke="#1a6fb5"
                        strokeWidth="0.5"
                      />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>

                {/* Simulated roads */}
                <svg
                  className="absolute inset-0 w-full h-full"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <line
                    x1="0"
                    y1="50%"
                    x2="100%"
                    y2="50%"
                    stroke="#cbd5e1"
                    strokeWidth="8"
                  />
                  <line
                    x1="30%"
                    y1="0"
                    x2="30%"
                    y2="100%"
                    stroke="#cbd5e1"
                    strokeWidth="5"
                  />
                  <line
                    x1="70%"
                    y1="0"
                    x2="70%"
                    y2="100%"
                    stroke="#cbd5e1"
                    strokeWidth="5"
                  />
                  <line
                    x1="0"
                    y1="25%"
                    x2="100%"
                    y2="25%"
                    stroke="#e2e8f0"
                    strokeWidth="3"
                  />
                  <line
                    x1="0"
                    y1="75%"
                    x2="100%"
                    y2="75%"
                    stroke="#e2e8f0"
                    strokeWidth="3"
                  />

                  {/* Road labels */}
                  <text
                    x="5"
                    y="48%"
                    fontSize="10"
                    fill="#94a3b8"
                    fontFamily="sans-serif"
                  >
                    Avenue Bourguiba
                  </text>
                  <text
                    x="32%"
                    y="15"
                    fontSize="10"
                    fill="#94a3b8"
                    fontFamily="sans-serif"
                  >
                    Rue Principale
                  </text>
                  <text
                    x="72%"
                    y="15"
                    fontSize="10"
                    fill="#94a3b8"
                    fontFamily="sans-serif"
                  >
                    Route Nationale
                  </text>
                </svg>

                {/* Safe Zone Circle */}
                <div
                  className="absolute rounded-full border-2 border-dashed border-[#1a6fb5]/40 bg-[#1a6fb5]/8 transition-all duration-500"
                  style={{
                    width: "200px",
                    height: "200px",
                    left: "50%",
                    top: "50%",
                    transform: "translate(-50%, -50%)",
                  }}
                />

                {/* Home marker */}
                <div
                  className="absolute flex flex-col items-center"
                  style={{
                    left: "50%",
                    top: "50%",
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  <div className="w-8 h-8 rounded-xl bg-[#1a6fb5] flex items-center justify-center shadow-lg">
                    <Home size={16} className="text-white" />
                  </div>
                  <span className="text-xs font-medium text-[#1a6fb5] mt-1 bg-white px-2 py-0.5 rounded-full shadow-sm">
                    Home
                  </span>
                </div>

                {/* Patient marker */}
                <div
                  className="absolute flex flex-col items-center transition-all duration-700"
                  style={{
                    left: `${location.x}%`,
                    top: `${location.y}%`,
                    transform: "translate(-50%, -100%)",
                  }}
                >
                  {/* Pulse ring */}
                  <div className="relative">
                    <span
                      className={`absolute inset-0 rounded-full animate-ping opacity-30 ${
                        status === "safe"
                          ? "bg-emerald-400"
                          : status === "warning"
                            ? "bg-amber-400"
                            : "bg-red-500"
                      }`}
                      style={{
                        width: "36px",
                        height: "36px",
                        top: "-4px",
                        left: "-4px",
                      }}
                    />
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center shadow-lg ${
                        status === "safe"
                          ? "bg-emerald-500"
                          : status === "warning"
                            ? "bg-amber-500"
                            : "bg-red-500"
                      }`}
                    >
                      <MapPin size={14} className="text-white" />
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-gray-700 mt-1 bg-white px-2 py-0.5 rounded-full shadow-sm whitespace-nowrap">
                    Margaret
                  </span>
                </div>

                {/* Zone radius label */}
                <div
                  className="absolute text-xs text-[#1a6fb5]/60 font-medium"
                  style={{ left: "72%", top: "30%" }}
                >
                  300m radius
                </div>
              </div>

              {/* Map Legend */}
              <div className="flex items-center gap-5 px-4 py-3 border-t border-gray-100 bg-gray-50">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <div className="w-4 h-4 rounded-xl bg-[#1a6fb5] flex items-center justify-center">
                    <Home size={9} className="text-white" />
                  </div>
                  Home Address
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  Patient (safe)
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <div className="w-10 h-0 border border-dashed border-[#1a6fb5]/40" />
                  Safe Zone (300m)
                </div>
              </div>
            </div>
          </div>

          {/* Info Panel */}
          <div className="flex flex-col gap-4">
            {/* Status Card */}
            <div className={`rounded-2xl border p-4 ${bg} ${border}`}>
              <div className="flex items-center gap-2 mb-2">
                <StatusIcon size={18} className={color} />
                <p className={`text-sm font-semibold ${color}`}>{label}</p>
              </div>
              <p className="text-xs text-gray-500">
                Last update: {location.updatedAt}
              </p>
            </div>

            {/* Location Details */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Current Location
              </p>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-[#1a6fb5]/10">
                  <MapPin size={16} className="text-[#1a6fb5]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {location.address}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Bou Salem, Tunisia
                  </p>
                </div>
              </div>
              <button
                onClick={() => window.open("https://maps.google.com", "_blank")}
                className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-white transition"
                style={{
                  background: "linear-gradient(135deg, #1a6fb5, #6366f1)",
                }}
              >
                <Navigation size={14} />
                Get Directions
              </button>
            </div>

            {/* Home Address */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Home Address
              </p>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-emerald-100">
                  <Home size={16} className="text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    Avenue Bourguiba 8170
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Bou Salem, Tunisia
                  </p>
                </div>
              </div>
            </div>

            {/* Simulate — for demo */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Simulate Position
              </p>
              <div className="flex flex-col gap-2">
                {(["safe", "warning", "danger"] as ZoneStatus[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => simulate(s)}
                    className={`py-2 rounded-xl text-xs font-medium capitalize transition border ${
                      status === s
                        ? s === "safe"
                          ? "bg-emerald-500 text-white border-emerald-500"
                          : s === "warning"
                            ? "bg-amber-500 text-white border-amber-500"
                            : "bg-red-500 text-white border-red-500"
                        : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    {s === "safe"
                      ? "✓ Inside Zone"
                      : s === "warning"
                        ? "⚠ Near Boundary"
                        : "✕ Outside Zone"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

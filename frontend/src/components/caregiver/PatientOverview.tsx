import { User, Activity, Pill, AlertCircle } from 'lucide-react'

export default function PatientOverview({ onFormClick }: { onFormClick: () => void }) {
  return (
    <div className="rounded-2xl p-6 text-white mb-6" style={{ background: 'linear-gradient(135deg, #1a6fb5 0%, #1557a0 100%)' }}>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-xl">
            <User size={20} />
          </div>
          <h2 className="font-semibold text-lg">Patient Overview</h2>
        </div>
        <div className="flex gap-2">
          <button className="bg-white/20 hover:bg-white/30 transition px-4 py-1.5 rounded-lg text-sm font-medium">
            Export Report
          </button>
          <button
            onClick={onFormClick}
            className="bg-white text-[#1a6fb5] hover:bg-blue-50 transition px-4 py-1.5 rounded-lg text-sm font-semibold"
          >
            + Form
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Identity */}
        <div className="bg-white/10 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3 text-blue-200 text-xs font-semibold uppercase tracking-wider">
            <User size={12} /> Identity
          </div>
          <p className="font-semibold text-base">Margaret J. Thompson</p>
          <p className="text-blue-100 text-sm mt-1">78 years old — Born April 3, 1948</p>
          <p className="text-blue-200 text-xs mt-2">Avenue Bourguiba 8170 BOU SALEM, TUNISIE</p>
        </div>

        {/* Chronic Conditions */}
        <div className="bg-white/10 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3 text-blue-200 text-xs font-semibold uppercase tracking-wider">
            <Activity size={12} /> Chronic Conditions
          </div>
          <div className="flex flex-col gap-2">
            {[
              { label: 'Hypertension', color: 'bg-red-400' },
              { label: 'Type 2 Diabetes', color: 'bg-yellow-400' },
              { label: 'Mild Cognitive Decline', color: 'bg-blue-300' },
            ].map(({ label, color }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-sm">{label}</span>
                <span className={`${color} text-white text-xs px-2 py-0.5 rounded-full`}>
                  {label === 'Hypertension' ? 'Stage 2' : label === 'Type 2 Diabetes' ? 'Insulin' : 'Monitored'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Key Medications */}
        <div className="bg-white/10 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3 text-blue-200 text-xs font-semibold uppercase tracking-wider">
            <Pill size={12} /> Key Medications
          </div>
          <div className="flex flex-col gap-1.5 text-sm">
            {[
              { name: 'Metformin 500mg', freq: '2x / day' },
              { name: 'Lisinopril 10mg', freq: '1x / day' },
              { name: 'Aspirin 81mg', freq: '1x / day' },
            ].map(({ name, freq }) => (
              <div key={name} className="flex justify-between">
                <span>{name}</span>
                <span className="text-blue-200 text-xs">{freq}</span>
              </div>
            ))}
            <div className="flex items-center gap-1 mt-2 text-blue-200 text-xs">
              <AlertCircle size={11} />
              Emergency: Dr. A. Moreau — +1 (555) 621-4400
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Stats */}
      <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-white/20 text-xs text-blue-100">
        <span>🩺 Last Check-up: Apr 10, 2026</span>
        <span>🩸 Blood Glucose: 148 mg/dL</span>
        <span>❤️ Blood Pressure: 138 / 85 mmHg</span>
        <span>⚖️ BMI: 27.4</span>
      </div>
    </div>
  )
}
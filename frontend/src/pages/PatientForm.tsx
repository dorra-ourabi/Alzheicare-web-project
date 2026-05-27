import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import logo from '../assets/logo_alzheicare.png'

type DiseasePhase = 'Early' | 'Moderate' | 'Severe'

const CHRONIC_OPTIONS = [
  'Hypertension', 'Type 2 Diabetes', 'Heart Disease',
  'Asthma', 'Arthritis', 'Osteoporosis', 'Depression'
]

const ALLERGY_OPTIONS = [
  'Penicillin', 'Aspirin', 'Ibuprofen', 'Sulfa drugs',
  'Latex', 'Pollen', 'Peanuts', 'Shellfish'
]

const inputStyle = {
  background: '#f8faff',
  border: '1.5px solid #e8eef8',
  boxShadow: 'inset 0 2px 4px rgba(29,158,117,0.04)',
}

const inputFocus = {
  border: '1.5px solid #1d9e75',
  boxShadow: 'inset 0 2px 4px rgba(29,158,117,0.08), 0 0 0 3px rgba(29,158,117,0.08)',
}

const inputBlur = {
  border: '1.5px solid #e8eef8',
  boxShadow: 'inset 0 2px 4px rgba(29,158,117,0.04)',
}

export default function PatientForm() {
  const navigate = useNavigate()

  const [age, setAge] = useState('')
  const [address, setAddress] = useState('')
  const [caregiverNumber, setCaregiverNumber] = useState('')
  const [phase, setPhase] = useState<DiseasePhase>('Early')
  const [chronicConditions, setChronicConditions] = useState<string[]>([])
  const [allergies, setAllergies] = useState<string[]>([])

  const toggleItem = (
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>,
    item: string
  ) => {
    setList(list.includes(item) ? list.filter((i) => i !== item) : [...list, item])
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    navigate('/caregiver/dashboard')
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#f8faff' }}>

      {/* Background blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute rounded-full" style={{ width: '500px', height: '500px', top: '-150px', right: '-100px', background: 'radial-gradient(circle, rgba(29,158,117,0.08) 0%, transparent 70%)' }} />
        <div className="absolute rounded-full" style={{ width: '400px', height: '400px', bottom: '0', left: '-100px', background: 'radial-gradient(circle, rgba(26,111,181,0.06) 0%, transparent 70%)' }} />
      </div>

      {/* Left Panel */}
      <div
        className="hidden lg:flex lg:w-2/5 flex-col items-center justify-center px-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #1d9e75 0%, #0f7a5a 60%, #085c40 100%)' }}
      >
        <div className="absolute top-[-80px] left-[-80px] w-72 h-72 rounded-full" style={{ background: 'rgba(255,255,255,0.04)' }} />
        <div className="absolute bottom-[-60px] right-[-60px] w-96 h-96 rounded-full" style={{ background: 'rgba(255,255,255,0.04)' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full" style={{ background: 'rgba(255,255,255,0.02)' }} />

        <div className="relative z-10 flex flex-col items-center gap-6">
          <img
            src={logo}
            alt="AlzheiCare"
            className="w-64"
            style={{ filter: 'brightness(0) invert(1)' }}
          />
          <div className="w-16 h-px bg-white/30" />
          <p className="text-white/60 text-sm tracking-widest uppercase text-center">
            Patient Information
          </p>
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div
          className="w-full max-w-lg bg-white rounded-3xl p-8"
          style={{
            boxShadow: '0 25px 70px rgba(29,158,117,0.12), 0 8px 25px rgba(0,0,0,0.15)',
          }}
        >
          {/* Mobile logo */}
          <div className="flex justify-center mb-6 lg:hidden">
            <img src={logo} alt="AlzheiCare" className="h-7" />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-1">Patient Information</h2>
          <p className="text-sm text-gray-400 mb-6">Tell us about the patient you're caring for</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">

            {/* Age & Phone — two columns */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Patient Age</label>
                <input
                  type="number"
                  placeholder="e.g. 78"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl text-sm text-gray-800 outline-none transition-all"
                  style={inputStyle}
                  onFocus={(e) => Object.assign(e.target.style, inputFocus)}
                  onBlur={(e) => Object.assign(e.target.style, inputBlur)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Caregiver Phone</label>
                <input
                  type="tel"
                  placeholder="+1 555 000 0000"
                  value={caregiverNumber}
                  onChange={(e) => setCaregiverNumber(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl text-sm text-gray-800 outline-none transition-all"
                  style={inputStyle}
                  onFocus={(e) => Object.assign(e.target.style, inputFocus)}
                  onBlur={(e) => Object.assign(e.target.style, inputBlur)}
                />
              </div>
            </div>

            {/* Address */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Home Address</label>
              <input
                type="text"
                placeholder="Street, City, Country"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl text-sm text-gray-800 outline-none transition-all"
                style={inputStyle}
                onFocus={(e) => Object.assign(e.target.style, inputFocus)}
                onBlur={(e) => Object.assign(e.target.style, inputBlur)}
              />
            </div>

            {/* Disease Phase */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Alzheimer's Disease Phase
              </label>
              <div className="flex gap-2">
                {(['Early', 'Moderate', 'Severe'] as DiseasePhase[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPhase(p)}
                    className="flex-1 py-2.5 rounded-2xl text-sm font-medium transition-all"
                    style={{
                      border: phase === p ? '1.5px solid #1d9e75' : '1.5px solid #e8eef8',
                      background: phase === p ? 'linear-gradient(135deg, #1d9e75, #0f7a5a)' : '#f8faff',
                      color: phase === p ? 'white' : '#6b7280',
                      boxShadow: phase === p ? '0 4px 12px rgba(29,158,117,0.25)' : 'none',
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Chronic Conditions */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Chronic Conditions
              </label>
              <div className="flex flex-wrap gap-2">
                {CHRONIC_OPTIONS.map((condition) => (
                  <button
                    key={condition}
                    type="button"
                    onClick={() => toggleItem(chronicConditions, setChronicConditions, condition)}
                    className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                    style={{
                      border: chronicConditions.includes(condition)
                        ? '1.5px solid #1a6fb5'
                        : '1.5px solid #e8eef8',
                      background: chronicConditions.includes(condition)
                        ? 'rgba(26,111,181,0.1)'
                        : '#f8faff',
                      color: chronicConditions.includes(condition) ? '#1a6fb5' : '#6b7280',
                      boxShadow: chronicConditions.includes(condition)
                        ? '0 2px 8px rgba(26,111,181,0.15)'
                        : 'none',
                    }}
                  >
                    {condition}
                  </button>
                ))}
              </div>
            </div>

            {/* Allergies */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Allergies
              </label>
              <div className="flex flex-wrap gap-2">
                {ALLERGY_OPTIONS.map((allergy) => (
                  <button
                    key={allergy}
                    type="button"
                    onClick={() => toggleItem(allergies, setAllergies, allergy)}
                    className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                    style={{
                      border: allergies.includes(allergy)
                        ? '1.5px solid #ef4444'
                        : '1.5px solid #e8eef8',
                      background: allergies.includes(allergy)
                        ? 'rgba(239,68,68,0.08)'
                        : '#f8faff',
                      color: allergies.includes(allergy) ? '#ef4444' : '#6b7280',
                      boxShadow: allergies.includes(allergy)
                        ? '0 2px 8px rgba(239,68,68,0.12)'
                        : 'none',
                    }}
                  >
                    {allergy}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full py-3 rounded-2xl text-sm font-semibold text-white transition-all hover:scale-[1.02] mt-2"
              style={{
                background: 'linear-gradient(135deg, #1d9e75 0%, #0f7a5a 100%)',
                boxShadow: '0 4px 15px rgba(29,158,117,0.35)',
              }}
            >
              Continue to Dashboard →
            </button>

          </form>

          <p className="text-xs text-gray-400 text-center mt-5">
            Note: This is a prototype. Do not use real patient data.
          </p>
        </div>
      </div>
    </div>
  )
}
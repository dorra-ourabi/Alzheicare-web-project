import { useState, useCallback } from 'react'
import { Upload, Brain, AlertTriangle } from 'lucide-react'
import { predictMri, type MriPredictionResult } from '../../api/ml-classifier'
import { useAuth } from '../../context/AuthContext'

const stageTone = {
  'No Impairment': {
    color: 'text-green-600',
    bg: 'bg-green-50 border-green-200',
    bar: 'bg-green-500',
  },
  'Very Mild Impairment': {
    color: 'text-sky-600',
    bg: 'bg-sky-50 border-sky-200',
    bar: 'bg-sky-500',
  },
  'Mild Impairment': {
    color: 'text-yellow-600',
    bg: 'bg-yellow-50 border-yellow-200',
    bar: 'bg-yellow-400',
  },
  'Moderate Impairment': {
    color: 'text-red-600',
    bg: 'bg-red-50 border-red-200',
    bar: 'bg-red-500',
  },
} as const

const defaultTone = {
  color: 'text-[#1a6fb5]',
  bg: 'bg-[#1a6fb5]/5 border-[#1a6fb5]/20',
  bar: 'bg-[#1a6fb5]',
}

const formatPercent = (value: number) => `${Math.round(value * 100)}%`

export default function MRIClassifier() {
  const { token } = useAuth()
  const [dragging, setDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<MriPredictionResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFile = (f: File) => {
    setFile(f)
    setResult(null)
    setError(null)
    const reader = new FileReader()
    reader.onload = () => setPreview(reader.result as string)
    reader.readAsDataURL(f)
  }

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }, [])

  const classify = async () => {
    if (!file) return

    setLoading(true)
    setResult(null)
    setError(null)

    try {
      const data = await predictMri(file, token)
      setResult(data)
    } catch (err) {
      console.error('Classification failed:', err)
      setError(err instanceof Error ? err.message : 'Classification failed')
    } finally {
      setLoading(false)
    }
  }

  const tone = result
    ? stageTone[result.predicted_stage as keyof typeof stageTone] ?? defaultTone
    : defaultTone

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 rounded-xl" style={{ background: 'linear-gradient(135deg, #1a6fb5, #6366f1)' }}>
          <Brain size={20} className="text-white" />
        </div>
        <div>
          <h2 className="font-semibold text-gray-800">MRI Classifier</h2>
          <p className="text-xs text-gray-400">Upload a brain scan to detect Alzheimer's stage</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Upload Zone */}
        <div>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => document.getElementById('mri-input')?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all ${
              dragging
                ? 'border-[#1a6fb5] bg-[#1a6fb5]/5'
                : 'border-gray-200 hover:border-[#1a6fb5]/50 hover:bg-gray-50'
            }`}
          >
            {preview ? (
              <img src={preview} alt="MRI preview" className="max-h-40 rounded-xl object-contain" />
            ) : (
              <>
                <div className="w-14 h-14 rounded-2xl bg-[#1a6fb5]/10 flex items-center justify-center mb-3">
                  <Upload size={24} className="text-[#1a6fb5]" />
                </div>
                <p className="text-sm font-medium text-gray-700">Drag & drop MRI scan</p>
                <p className="text-xs text-gray-400 mt-1">or click to browse</p>
                <p className="text-xs text-gray-300 mt-3">PNG, JPG, DICOM accepted</p>
              </>
            )}
            <input
              id="mri-input"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
          </div>

          {file && (
            <button
              onClick={classify}
              disabled={loading}
              className="mt-4 w-full py-3 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #1a6fb5, #6366f1)' }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Analyzing scan...
                </span>
              ) : (
                'Classify Scan'
              )}
            </button>
          )}
        </div>

        {/* Result */}
        <div className="flex flex-col justify-center">
          {result ? (
            <div className={`rounded-2xl border-2 p-5 ${tone.bg}`}>
              <div className="flex items-center justify-between gap-4 mb-4">
                <p className="text-sm font-medium text-gray-500">Detected Stage</p>
                <span className={`text-2xl font-bold text-right ${tone.color}`}>
                  {result.predicted_stage}
                </span>
              </div>

              <div className="mb-4">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Confidence</span>
                  <span className="font-semibold">{formatPercent(result.confidence)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-700 ${tone.bar}`}
                    style={{ width: formatPercent(result.confidence) }}
                  />
                </div>
              </div>

              <div className="space-y-3 mb-4">
                {Object.entries(result.probabilities).map(([label, probability]) => (
                  <div key={label}>
                    <div className="flex justify-between gap-3 text-xs text-gray-500 mb-1">
                      <span>{label}</span>
                      <span className="font-semibold">{formatPercent(probability)}</span>
                    </div>
                    <div className="w-full bg-white/70 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-[#1a6fb5] transition-all duration-700"
                        style={{ width: formatPercent(probability) }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-xs text-gray-500 leading-relaxed">{result.clinical_note}</p>

              <div className="flex items-start gap-2 mt-4 bg-white/60 rounded-xl p-3">
                <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[11px] text-gray-500">{result.disclaimer}</p>
              </div>
            </div>
          ) : error ? (
            <div className="rounded-2xl border-2 border-red-200 bg-red-50 p-5">
              <div className="flex items-start gap-2">
                <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-10">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
                <Brain size={28} className="text-gray-300" />
              </div>
              <p className="text-sm text-gray-400">Upload a scan and click Classify to see results</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

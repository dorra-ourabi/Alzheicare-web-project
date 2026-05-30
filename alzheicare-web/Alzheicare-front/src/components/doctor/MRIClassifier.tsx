import { useState, useCallback } from 'react'
import { Upload, Brain, AlertTriangle } from 'lucide-react'

type Stage = 'Early' | 'Moderate' | 'Severe' | null

const stageConfig = {
  Early: {
    color: 'text-green-600',
    bg: 'bg-green-50 border-green-200',
    bar: 'bg-green-500',
    description: 'Mild memory lapses. Patient may still live independently with some support.',
  },
  Moderate: {
    color: 'text-yellow-600',
    bg: 'bg-yellow-50 border-yellow-200',
    bar: 'bg-yellow-400',
    description: 'Increased memory loss and confusion. Daily assistance is recommended.',
  },
  Severe: {
    color: 'text-red-600',
    bg: 'bg-red-50 border-red-200',
    bar: 'bg-red-500',
    description: 'Advanced stage. Full-time care and medical supervision required.',
  },
}

export default function MRIClassifier() {
  const [dragging, setDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ stage: Stage; confidence: number } | null>(null)

  const handleFile = (f: File) => {
    setFile(f)
    setResult(null)
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

  const formData = new FormData()
  formData.append('file', file)

  try {
    const response = await fetch('http://localhost:8000/predict', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`)
    }

    const data = await response.json()

    setResult({
      stage: data.stage,           // "Early" | "Moderate" | "Severe"
      confidence: Math.round(data.confidence * 100),  // 0.91 → 91
    })

  } catch (error) {
    console.error('Classification failed:', error)
    setResult(null)
  } finally {
    setLoading(false)
  }
} //Le backend doit retourner un JSON de cette forme: json{ "stage": "Moderate", "confidence": 0.91 }

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
          {result && result.stage ? (
            <div className={`rounded-2xl border-2 p-5 ${stageConfig[result.stage].bg}`}>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-medium text-gray-500">Detected Stage</p>
                <span className={`text-2xl font-bold ${stageConfig[result.stage].color}`}>
                  {result.stage}
                </span>
              </div>

              <div className="mb-4">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Confidence</span>
                  <span className="font-semibold">{result.confidence}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-700 ${stageConfig[result.stage].bar}`}
                    style={{ width: `${result.confidence}%` }}
                  />
                </div>
              </div>

              <p className="text-xs text-gray-500 leading-relaxed">
                {stageConfig[result.stage].description}
              </p>

              <div className="flex items-start gap-2 mt-4 bg-white/60 rounded-xl p-3">
                <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-gray-500">
                  For clinical support only. Image is not saved or linked to any patient profile.
                </p>
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
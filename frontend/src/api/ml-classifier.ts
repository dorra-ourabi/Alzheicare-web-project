const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000'

export interface MriPredictionResult {
  predicted_stage: string
  confidence: number
  probabilities: Record<string, number>
  clinical_note: string
  disclaimer: string
}

export async function predictMri(file: File, token: string | null): Promise<MriPredictionResult> {
  const formData = new FormData()
  formData.append('file', file)

  const res = await fetch(`${API_BASE_URL}/ml-classifier/predict`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `MRI prediction failed with ${res.status}`)
  }

  return res.json() as Promise<MriPredictionResult>
}

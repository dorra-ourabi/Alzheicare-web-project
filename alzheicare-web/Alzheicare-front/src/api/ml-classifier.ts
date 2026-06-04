import { API_BASE_URL } from '../lib/api'

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

  const response = await fetch(`${API_BASE_URL}/ml-classifier/predict`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || `MRI prediction failed with ${response.status}`)
  }

  return response.json() as Promise<MriPredictionResult>
}

import { API_BASE_URL, ApiError } from '../lib/api'

export interface ChatResponse {
  reply: string
  used_search: boolean
}

export interface TranscribeResponse {
  text: string
  language_detected?: string | null
}

export interface DoctorPatientOption {
  patientId: number
  name: string
}

type AiRequestOptions = {
  patientId?: number
  language?: string
}

function authHeaders(token: string, extra?: HeadersInit): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    ...(extra ?? {}),
  }
}

async function parseError(response: Response) {
  const raw = await response.text()
  let payload: unknown = raw
  try {
    payload = raw ? JSON.parse(raw) : null
  } catch {
    // keep raw text
  }

  const message =
    payload &&
    typeof payload === 'object' &&
    'message' in payload &&
    typeof (payload as { message: unknown }).message === 'string'
      ? (payload as { message: string }).message
      : raw || response.statusText || 'Request failed'

  throw new ApiError(message, response.status, payload)
}

export async function fetchDoctorPatients(token: string): Promise<DoctorPatientOption[]> {
  const response = await fetch(`${API_BASE_URL}/dashboard/doctor/overview`, {
    headers: authHeaders(token),
  })

  if (!response.ok) {
    await parseError(response)
  }

  const data = (await response.json()) as {
    threads?: Array<{ patientId: number; name: string }>
  }

  const seen = new Set<number>()
  const patients: DoctorPatientOption[] = []

  for (const thread of data.threads ?? []) {
    if (!thread.patientId || seen.has(thread.patientId)) continue
    seen.add(thread.patientId)
    patients.push({ patientId: thread.patientId, name: thread.name })
  }

  return patients
}

export async function clearChatHistory(
  token: string,
  patientId?: number,
): Promise<{ message: string }> {
  const params = new URLSearchParams()
  if (patientId) params.set('patientId', String(patientId))

  const query = params.toString()
  const response = await fetch(
    `${API_BASE_URL}/ai-assistant/chat/history${query ? `?${query}` : ''}`,
    {
      method: 'DELETE',
      headers: authHeaders(token),
    },
  )

  if (!response.ok) {
    await parseError(response)
  }

  return response.json() as Promise<{ message: string }>
}

export async function sendChatMessage(
  token: string,
  message: string,
  options: AiRequestOptions = {},
): Promise<ChatResponse> {
  const response = await fetch(`${API_BASE_URL}/ai-assistant/chat`, {
    method: 'POST',
    headers: authHeaders(token, { 'Content-Type': 'application/json' }),
    body: JSON.stringify({
      message,
      language: options.language ?? null,
      ...(options.patientId ? { patientId: options.patientId } : {}),
    }),
  })

  if (!response.ok) {
    await parseError(response)
  }

  return response.json() as Promise<ChatResponse>
}

export async function streamChatMessage(
  token: string,
  message: string,
  options: AiRequestOptions & {
    onToken: (token: string) => void
    signal?: AbortSignal
  },
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/ai-assistant/chat/stream`, {
    method: 'POST',
    headers: authHeaders(token, { 'Content-Type': 'application/json' }),
    body: JSON.stringify({
      message,
      language: options.language ?? null,
      ...(options.patientId ? { patientId: options.patientId } : {}),
    }),
    signal: options.signal,
  })

  if (!response.ok || !response.body) {
    await parseError(response)
  }

  const reader = response.body!.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const chunk = line.slice(6).trim()
      if (chunk === '[DONE]') return
      if (chunk === '[ERROR]') {
        throw new ApiError('AI stream failed', 502, null)
      }
      if (chunk) options.onToken(chunk)
    }
  }
}

export async function transcribeAudio(
  token: string,
  audio: Blob,
  options: AiRequestOptions = {},
): Promise<TranscribeResponse> {
  const formData = new FormData()
  formData.append('audio', audio, 'recording.webm')
  if (options.language) formData.append('language', options.language)
  if (options.patientId) formData.append('patientId', String(options.patientId))

  const response = await fetch(`${API_BASE_URL}/ai-assistant/transcribe`, {
    method: 'POST',
    headers: authHeaders(token),
    body: formData,
  })

  if (!response.ok) {
    await parseError(response)
  }

  return response.json() as Promise<TranscribeResponse>
}

export async function speakText(
  token: string,
  text: string,
  options: AiRequestOptions = {},
): Promise<Blob> {
  const response = await fetch(`${API_BASE_URL}/ai-assistant/speak`, {
    method: 'POST',
    headers: authHeaders(token, { 'Content-Type': 'application/json' }),
    body: JSON.stringify({
      text,
      ...(options.patientId ? { patientId: options.patientId } : {}),
    }),
  })

  if (!response.ok) {
    await parseError(response)
  }

  return response.blob()
}

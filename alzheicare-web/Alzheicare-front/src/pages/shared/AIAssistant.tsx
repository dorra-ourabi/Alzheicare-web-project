import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../../components/caregiver/Sidebar'
import DoctorSidebar from '../../components/doctor/Sidebar'
import {
  Bot,
  Mic,
  MicOff,
  Send,
  Sparkles,
  RefreshCw,
  User,
  Volume2,
  Loader2,
} from 'lucide-react'
import { useAuth } from '../../context/useAuth'
import { ApiError } from '../../lib/api'
import {
  clearChatHistory,
  fetchDoctorPatients,
  speakText,
  streamChatMessage,
  transcribeAudio,
  type DoctorPatientOption,
} from '../../api/ai-assistant'
import { useVoiceRecorder } from '../../hooks/useVoiceRecorder'

interface Message {
  id: number
  role: 'user' | 'assistant'
  text: string
  time: string
}

const suggestions = {
  caregiver: [
    'What is sundowning?',
    'How to handle wandering?',
    'Tips for medication management',
    'How to communicate with an Alzheimer patient?',
    "What are the stages of Alzheimer's?",
    'How to reduce caregiver burnout?',
  ],
  doctor: [
    "Latest Alzheimer's research 2026",
    "Difference between MCI and Alzheimer's",
    'Recommended medications for early stage',
    'How to interpret MRI results?',
    'Clinical trials available in 2026',
    'Managing behavioral symptoms',
  ],
}

function formatTime() {
  return new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function welcomeMessage(role: 'caregiver' | 'doctor') {
  return role === 'caregiver'
    ? "Hello! I'm your AI assistant specialized in Alzheimer's caregiving. Ask me anything about managing symptoms, medications, or daily care tips."
    : "Hello, Doctor. I'm your AI assistant for Alzheimer's clinical support. Ask me about research, medications, diagnostic criteria, or treatment protocols."
}

function renderFormattedText(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
      )
    }
    return <span key={index}>{part}</span>
  })
}

interface Props {
  role: 'caregiver' | 'doctor'
}

export default function AIAssistant({ role }: Props) {
  const navigate = useNavigate()
  const { accessToken } = useAuth()
  const bottomRef = useRef<HTMLDivElement>(null)
  const streamAbortRef = useRef<AbortController | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const [messages, setMessages] = useState<Message[]>([
    {
      id: Date.now(),
      role: 'assistant',
      text: welcomeMessage(role),
      time: formatTime(),
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [transcribing, setTranscribing] = useState(false)
  const [speakingId, setSpeakingId] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [patients, setPatients] = useState<DoctorPatientOption[]>([])
  const [selectedPatientId, setSelectedPatientId] = useState<number | undefined>()

  const { isRecording, startRecording, stopRecording, cancelRecording } =
    useVoiceRecorder()

  const SidebarComponent = role === 'caregiver' ? Sidebar : DoctorSidebar

  useEffect(() => {
    if (!accessToken) {
      navigate('/', { replace: true })
    }
  }, [accessToken, navigate])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    if (role !== 'doctor' || !accessToken) return

    fetchDoctorPatients(accessToken)
      .then((list) => {
        setPatients(list)
        if (list.length > 0) {
          setSelectedPatientId(list[0].patientId)
        }
      })
      .catch(() => {
        setError('Unable to load your patients. Select a patient to continue.')
      })
  }, [role, accessToken])

  useEffect(() => {
    return () => {
      streamAbortRef.current?.abort()
      if (audioRef.current) {
        audioRef.current.pause()
        URL.revokeObjectURL(audioRef.current.src)
      }
    }
  }, [])

  const patientId = role === 'doctor' ? selectedPatientId : undefined

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || loading || !accessToken) return
      if (role === 'doctor' && !patientId) {
        setError('Please select a patient before chatting.')
        return
      }

      setError('')
      const userMsg: Message = {
        id: Date.now(),
        role: 'user',
        text: text.trim(),
        time: formatTime(),
      }

      const assistantId = Date.now() + 1
      setMessages((prev) => [
        ...prev,
        userMsg,
        {
          id: assistantId,
          role: 'assistant',
          text: '',
          time: formatTime(),
        },
      ])
      setInput('')
      setLoading(true)

      streamAbortRef.current?.abort()
      const controller = new AbortController()
      streamAbortRef.current = controller

      try {
        await streamChatMessage(accessToken, text.trim(), {
          patientId,
          signal: controller.signal,
          onToken: (token) => {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantId
                  ? { ...msg, text: `${msg.text}${token} ` }
                  : msg,
              ),
            )
          },
        })

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantId
              ? { ...msg, text: msg.text.trim() || 'No response received.' }
              : msg,
          ),
        )
      } catch (caught) {
        if (caught instanceof DOMException && caught.name === 'AbortError') {
          return
        }

        const message =
          caught instanceof ApiError
            ? caught.message
            : caught instanceof Error
              ? caught.message
              : 'Failed to get AI response'

        setError(message)
        setMessages((prev) => prev.filter((msg) => msg.id !== assistantId))
      } finally {
        setLoading(false)
        streamAbortRef.current = null
      }
    },
    [accessToken, loading, patientId, role],
  )

  const resetChat = async () => {
    if (!accessToken) return

    streamAbortRef.current?.abort()
    setLoading(false)
    setError('')

    try {
      if (role === 'doctor' && patientId) {
        await clearChatHistory(accessToken, patientId)
      } else if (role === 'caregiver') {
        await clearChatHistory(accessToken)
      }
    } catch (caught) {
      const message =
        caught instanceof ApiError
          ? caught.message
          : 'Failed to clear chat history'
      setError(message)
    }

    setMessages([
      {
        id: Date.now(),
        role: 'assistant',
        text: welcomeMessage(role),
        time: formatTime(),
      },
    ])
  }

  const handleMicClick = async () => {
    if (!accessToken || loading || transcribing) return

    if (role === 'doctor' && !patientId) {
      setError('Please select a patient before recording.')
      return
    }

    if (isRecording) {
      try {
        setTranscribing(true)
        setError('')
        const blob = await stopRecording()
        const result = await transcribeAudio(accessToken, blob, { patientId })
        const transcript = result.text?.trim()
        if (transcript) {
          setInput((prev) => (prev ? `${prev} ${transcript}` : transcript))
        } else {
          setError('No speech detected. Please try again.')
        }
      } catch (caught) {
        const message =
          caught instanceof ApiError
            ? caught.message
            : caught instanceof Error
              ? caught.message
              : 'Transcription failed'
        setError(message)
      } finally {
        setTranscribing(false)
      }
      return
    }

    try {
      setError('')
      await startRecording()
    } catch (caught) {
      const message =
        caught instanceof Error
          ? caught.message
          : 'Unable to access microphone'
      setError(message)
    }
  }

  const handleSpeak = async (messageId: number, text: string) => {
    if (!accessToken || !text.trim()) return
    if (role === 'doctor' && !patientId) {
      setError('Please select a patient first.')
      return
    }

    try {
      setSpeakingId(messageId)
      setError('')

      if (audioRef.current) {
        audioRef.current.pause()
        URL.revokeObjectURL(audioRef.current.src)
      }

      const blob = await speakText(accessToken, text, { patientId })
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      audioRef.current = audio
      audio.onended = () => {
        URL.revokeObjectURL(url)
        setSpeakingId(null)
      }
      await audio.play()
    } catch (caught) {
      setSpeakingId(null)
      const message =
        caught instanceof ApiError
          ? caught.message
          : caught instanceof Error
            ? caught.message
            : 'Text-to-speech failed'
      setError(message)
    }
  }

  return (
    <div className="flex min-h-screen bg-[#f4f7fb]">
      <SidebarComponent />

      <main className="flex-1 flex flex-col p-6 overflow-hidden">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div
              className="p-2.5 rounded-xl"
              style={{ background: 'linear-gradient(135deg, #1a6fb5, #6366f1)' }}
            >
              <Bot size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">AI Assistant</h1>
              <p className="text-xs text-gray-400">
                {role === 'caregiver'
                  ? "Specialized in Alzheimer's caregiving support"
                  : 'Clinical knowledge & research support'}
              </p>
            </div>
          </div>
          <button
            onClick={resetChat}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-gray-500 bg-white border border-gray-200 hover:bg-gray-50 transition disabled:opacity-50"
          >
            <RefreshCw size={13} />
            New Chat
          </button>
        </div>

        {role === 'doctor' && (
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              Patient context
            </label>
            <select
              value={selectedPatientId ?? ''}
              onChange={(e) =>
                setSelectedPatientId(
                  e.target.value ? Number(e.target.value) : undefined,
                )
              }
              className="w-full max-w-md rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-[#1a6fb5]/40"
            >
              {patients.length === 0 ? (
                <option value="">No patients available</option>
              ) : (
                patients.map((patient) => (
                  <option key={patient.patientId} value={patient.patientId}>
                    {patient.name}
                  </option>
                ))
              )}
            </select>
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
            {isRecording && (
              <button
                onClick={cancelRecording}
                className="ml-3 underline text-red-800"
              >
                Cancel recording
              </button>
            )}
          </div>
        )}

        <div className="flex flex-1 gap-5 overflow-hidden min-h-0">
          <div className="w-56 shrink-0 flex flex-col gap-3">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={14} className="text-[#1a6fb5]" />
                <p className="text-xs font-semibold text-gray-600">
                  Suggested Questions
                </p>
              </div>
              <div className="flex flex-col gap-2">
                {suggestions[role].map((s) => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s)}
                    disabled={loading || transcribing}
                    className="text-left text-xs text-gray-500 px-3 py-2.5 rounded-xl bg-gray-50 hover:bg-[#1a6fb5]/10 hover:text-[#1a6fb5] transition-all border border-transparent hover:border-[#1a6fb5]/20 disabled:opacity-50"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div
              className="rounded-2xl p-4 text-white"
              style={{ background: 'linear-gradient(135deg, #1a6fb5, #6366f1)' }}
            >
              <Bot size={20} className="mb-2 opacity-80" />
              <p className="text-xs font-semibold mb-1">AI Powered</p>
              <p className="text-xs opacity-70 leading-relaxed">
                Chat, voice input, and spoken replies are connected to the
                AlzheiCare AI backend.
              </p>
            </div>
          </div>

          <div className="flex-1 flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden min-h-0">
            <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-4 bg-[#f8fafc]">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-1"
                      style={{
                        background: 'linear-gradient(135deg, #1a6fb5, #6366f1)',
                      }}
                    >
                      <Bot size={15} className="text-white" />
                    </div>
                  )}

                  <div
                    className={`max-w-lg px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-[#1a6fb5] text-white rounded-tr-sm'
                        : 'bg-white text-gray-700 rounded-tl-sm shadow-sm border border-gray-100'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">
                      {msg.role === 'assistant'
                        ? msg.text
                          ? renderFormattedText(msg.text)
                          : null
                        : msg.text}
                    </p>
                    <div
                      className={`flex items-center gap-2 mt-1.5 ${
                        msg.role === 'user' ? 'text-blue-200' : 'text-gray-400'
                      }`}
                    >
                      <p className="text-xs">{msg.time}</p>
                      {msg.role === 'assistant' && msg.text && (
                        <button
                          onClick={() => handleSpeak(msg.id, msg.text)}
                          disabled={speakingId === msg.id}
                          className="inline-flex items-center gap-1 text-xs hover:text-[#1a6fb5] disabled:opacity-50"
                          title="Listen to response"
                        >
                          {speakingId === msg.id ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <Volume2 size={12} />
                          )}
                          Listen
                        </button>
                      )}
                    </div>
                  </div>

                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-xl bg-gray-200 flex items-center justify-center shrink-0 mt-1">
                      <User size={15} className="text-gray-500" />
                    </div>
                  )}
                </div>
              ))}

              {loading && messages[messages.length - 1]?.text === '' && (
                <div className="flex gap-3 justify-start">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      background: 'linear-gradient(135deg, #1a6fb5, #6366f1)',
                    }}
                  >
                    <Bot size={15} className="text-white" />
                  </div>
                  <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm border border-gray-100 flex items-center gap-1.5">
                    <span
                      className="w-2 h-2 rounded-full bg-[#1a6fb5] animate-bounce"
                      style={{ animationDelay: '0ms' }}
                    />
                    <span
                      className="w-2 h-2 rounded-full bg-[#1a6fb5] animate-bounce"
                      style={{ animationDelay: '150ms' }}
                    />
                    <span
                      className="w-2 h-2 rounded-full bg-[#1a6fb5] animate-bounce"
                      style={{ animationDelay: '300ms' }}
                    />
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            <div className="px-5 py-4 border-t border-gray-100 bg-white">
              {(isRecording || transcribing) && (
                <div className="mb-2 flex items-center gap-2 text-xs text-[#1a6fb5]">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#1a6fb5] opacity-60" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#1a6fb5]" />
                  </span>
                  {isRecording
                    ? 'Recording… click mic to stop and transcribe'
                    : 'Transcribing audio…'}
                </div>
              )}

              <div className="flex items-center gap-3 bg-gray-50 rounded-2xl px-4 py-2.5 border border-gray-100 focus-within:border-[#1a6fb5]/40 transition">
                <button
                  onClick={handleMicClick}
                  disabled={loading || transcribing}
                  className={`p-2 rounded-xl transition disabled:opacity-40 ${
                    isRecording
                      ? 'bg-red-500 text-white'
                      : 'bg-white text-gray-500 border border-gray-200 hover:text-[#1a6fb5]'
                  }`}
                  title={isRecording ? 'Stop recording' : 'Record voice message'}
                >
                  {isRecording ? <MicOff size={15} /> : <Mic size={15} />}
                </button>

                <input
                  type="text"
                  placeholder="Ask anything about Alzheimer's..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') sendMessage(input)
                  }}
                  disabled={loading || transcribing}
                  className="flex-1 bg-transparent text-sm outline-none text-gray-700 placeholder-gray-400 disabled:opacity-50"
                />

                <button
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || loading || transcribing}
                  className="p-2 rounded-xl text-white transition disabled:opacity-40"
                  style={{
                    background: 'linear-gradient(135deg, #1a6fb5, #6366f1)',
                  }}
                >
                  <Send size={15} />
                </button>
              </div>

              <p className="text-xs text-gray-400 text-center mt-2">
                For informational purposes only — not a substitute for medical
                advice.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

import { useState, useRef, useEffect } from 'react'
import Sidebar from '../../components/caregiver/Sidebar'
import DoctorSidebar from '../../components/doctor/Sidebar'
import { Bot, Send, User, Sparkles, RefreshCw } from 'lucide-react'

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
    'What are the stages of Alzheimer\'s?',
    'How to reduce caregiver burnout?',
  ],
  doctor: [
    'Latest Alzheimer\'s research 2026',
    'Difference between MCI and Alzheimer\'s',
    'Recommended medications for early stage',
    'How to interpret MRI results?',
    'Clinical trials available in 2026',
    'Managing behavioral symptoms',
  ],
}

const mockResponses: Record<string, string> = {
  'What is sundowning?':
    'Sundowning refers to a state of confusion that occurs in the late afternoon and evening hours in people with Alzheimer\'s. Symptoms include increased agitation, confusion, suspicion, and sometimes aggression. It is thought to be linked to disruptions in the internal body clock. Strategies include maintaining a consistent routine, increasing light exposure during the day, and reducing noise and stimulation in the evening.',
  'How to handle wandering?':
    'Wandering is common in Alzheimer\'s patients and can be dangerous. Key strategies include: installing door alarms or locks, using GPS tracking devices like a bracelet, keeping the environment safe and familiar, providing regular exercise to reduce restlessness, and ensuring the patient wears an ID bracelet at all times.',
  default:
    'Thank you for your question. Based on current Alzheimer\'s research and caregiving best practices, I can provide the following guidance. Alzheimer\'s disease requires a holistic approach combining medical treatment, cognitive stimulation, emotional support, and a safe environment. For more specific advice, please consult with the assigned medical team. Is there anything more specific you\'d like to know?',
}

interface Props {
  role: 'caregiver' | 'doctor'
}

export default function AIAssistant({ role }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: 'assistant',
      text: role === 'caregiver'
        ? 'Hello! I\'m your AI assistant specialized in Alzheimer\'s caregiving. Ask me anything about managing symptoms, medications, or daily care tips.'
        : 'Hello, Doctor. I\'m your AI assistant for Alzheimer\'s clinical support. Ask me about research, medications, diagnostic criteria, or treatment protocols.',
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = (text: string) => {
    if (!text.trim() || loading) return

    const userMsg: Message = {
      id: Date.now(),
      role: 'user',
      text,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    setTimeout(() => {
      const responseText = mockResponses[text] || mockResponses['default']
      const assistantMsg: Message = {
        id: Date.now() + 1,
        role: 'assistant',
        text: responseText,
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      }
      setMessages((prev) => [...prev, assistantMsg])
      setLoading(false)
    }, 1200)
  }

  const resetChat = () => {
    setMessages([
      {
        id: Date.now(),
        role: 'assistant',
        text: role === 'caregiver'
          ? 'Hello! I\'m your AI assistant specialized in Alzheimer\'s caregiving. Ask me anything about managing symptoms, medications, or daily care tips.'
          : 'Hello, Doctor. I\'m your AI assistant for Alzheimer\'s clinical support. Ask me about research, medications, diagnostic criteria, or treatment protocols.',
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      },
    ])
  }

  const SidebarComponent = role === 'caregiver' ? Sidebar : DoctorSidebar

  return (
    <div className="flex min-h-screen bg-[#f4f7fb]">
      <SidebarComponent />

      <main className="flex-1 flex flex-col p-6 overflow-hidden">
        {/* Header */}
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
                  ? 'Specialized in Alzheimer\'s caregiving support'
                  : 'Clinical knowledge & research support'}
              </p>
            </div>
          </div>
          <button
            onClick={resetChat}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-gray-500 bg-white border border-gray-200 hover:bg-gray-50 transition"
          >
            <RefreshCw size={13} />
            New Chat
          </button>
        </div>

        <div className="flex flex-1 gap-5 overflow-hidden">

          {/* Suggestions Sidebar */}
          <div className="w-56 shrink-0 flex flex-col gap-3">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={14} className="text-[#1a6fb5]" />
                <p className="text-xs font-semibold text-gray-600">Suggested Questions</p>
              </div>
              <div className="flex flex-col gap-2">
                {suggestions[role].map((s) => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s)}
                    className="text-left text-xs text-gray-500 px-3 py-2.5 rounded-xl bg-gray-50 hover:bg-[#1a6fb5]/10 hover:text-[#1a6fb5] transition-all border border-transparent hover:border-[#1a6fb5]/20"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Info card */}
            <div
              className="rounded-2xl p-4 text-white"
              style={{ background: 'linear-gradient(135deg, #1a6fb5, #6366f1)' }}
            >
              <Bot size={20} className="mb-2 opacity-80" />
              <p className="text-xs font-semibold mb-1">AI Powered</p>
              <p className="text-xs opacity-70 leading-relaxed">
                Responses are based on current Alzheimer's research and clinical guidelines.
              </p>
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-4 bg-[#f8fafc]">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-1"
                      style={{ background: 'linear-gradient(135deg, #1a6fb5, #6366f1)' }}
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
                    <p>{msg.text}</p>
                    <p className={`text-xs mt-1.5 ${msg.role === 'user' ? 'text-blue-200' : 'text-gray-400'}`}>
                      {msg.time}
                    </p>
                  </div>

                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-xl bg-gray-200 flex items-center justify-center shrink-0 mt-1">
                      <User size={15} className="text-gray-500" />
                    </div>
                  )}
                </div>
              ))}

              {/* Loading indicator */}
              {loading && (
                <div className="flex gap-3 justify-start">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: 'linear-gradient(135deg, #1a6fb5, #6366f1)' }}
                  >
                    <Bot size={15} className="text-white" />
                  </div>
                  <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm border border-gray-100 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#1a6fb5] animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-[#1a6fb5] animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-[#1a6fb5] animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-5 py-4 border-t border-gray-100 bg-white">
              <div className="flex items-center gap-3 bg-gray-50 rounded-2xl px-4 py-2.5 border border-gray-100 focus-within:border-[#1a6fb5]/40 transition">
                <input
                  type="text"
                  placeholder="Ask anything about Alzheimer's..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
                  className="flex-1 bg-transparent text-sm outline-none text-gray-700 placeholder-gray-400"
                />
                <button
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || loading}
                  className="p-2 rounded-xl text-white transition disabled:opacity-40"
                  style={{ background: 'linear-gradient(135deg, #1a6fb5, #6366f1)' }}
                >
                  <Send size={15} />
                </button>
              </div>
              <p className="text-xs text-gray-400 text-center mt-2">
                For informational purposes only — not a substitute for medical advice.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
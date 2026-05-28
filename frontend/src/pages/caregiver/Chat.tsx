import { useState, useRef, useEffect } from 'react'
import Sidebar from '../../components/caregiver/Sidebar'
import { Send, Phone, Video, Search } from 'lucide-react'

interface Doctor {
  id: number
  name: string
  specialty: string
  avatar: string
  online: boolean
  lastSeen: string
}

interface Message {
  id: number
  sender: 'caregiver' | 'doctor'
  text: string
  time: string
}

const doctors: Doctor[] = [
  {
    id: 1,
    name: 'Dr. A. Moreau',
    specialty: 'Neurologist',
    avatar: 'AM',
    online: true,
    lastSeen: 'Online',
  },
  {
    id: 2,
    name: 'Dr. S. Benali',
    specialty: 'Geriatrician',
    avatar: 'SB',
    online: false,
    lastSeen: 'Last seen 2h ago',
  },
]

const mockMessages: Record<number, Message[]> = {
  1: [
    { id: 1, sender: 'doctor', text: 'Good morning! How is Margaret doing today?', time: '08:00' },
    { id: 2, sender: 'caregiver', text: 'She had a rough night, was wandering around at 3am.', time: '08:15' },
    { id: 3, sender: 'doctor', text: 'I see. Has she taken her Lisinopril this morning?', time: '08:20' },
    { id: 4, sender: 'caregiver', text: 'Yes, all medications were taken at 7:30am.', time: '08:45' },
    { id: 5, sender: 'doctor', text: 'Good. Keep monitoring her and let me know if anything changes.', time: '09:00' },
  ],
  2: [
    { id: 1, sender: 'doctor', text: 'Hello, please send me the latest behavioral report when you can.', time: 'Yesterday' },
    { id: 2, sender: 'caregiver', text: 'Of course, I will send it today.', time: 'Yesterday' },
  ],
}

export default function CaregiverChat() {
  const [selected, setSelected] = useState<Doctor>(doctors[0])
  const [messages, setMessages] = useState(mockMessages)
  const [input, setInput] = useState('')
  const [search, setSearch] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, selected])

  const sendMessage = () => {
    if (!input.trim()) return
    const newMsg: Message = {
      id: Date.now(),
      sender: 'caregiver',
      text: input,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    }
    setMessages((prev) => ({
      ...prev,
      [selected.id]: [...(prev[selected.id] || []), newMsg],
    }))
    setInput('')
  }

  const filtered = doctors.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex min-h-screen bg-[#f4f7fb]">
      <Sidebar />

      <main className="flex-1 p-6 overflow-hidden">
        <div className="mb-5">
          <h1 className="text-xl font-bold text-gray-900">Chat</h1>
          <p className="text-xs text-gray-400">Messages with your connected doctors</p>
        </div>

        <div className="flex h-[calc(100vh-140px)] bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

          {/* Doctor List */}
          <div className="w-64 border-r border-gray-100 flex flex-col">
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
                <Search size={14} className="text-gray-400" />
                <input
                  type="text"
                  placeholder="Search doctor..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-transparent text-sm outline-none flex-1 text-gray-700 placeholder-gray-400"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {filtered.map((doctor) => (
                <button
                  key={doctor.id}
                  onClick={() => setSelected(doctor)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 border-b border-gray-50 transition-all text-left ${
                    selected.id === doctor.id ? 'bg-[#1a6fb5]/8' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="relative">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold"
                      style={{ background: 'linear-gradient(135deg, #1a6fb5, #6366f1)' }}
                    >
                      {doctor.avatar}
                    </div>
                    <span
                      className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${
                        doctor.online ? 'bg-emerald-400' : 'bg-gray-300'
                      }`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{doctor.name}</p>
                    <p className="text-xs text-gray-400 truncate">{doctor.specialty}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Chat Window */}
          <div className="flex-1 flex flex-col">

            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-4 border-b border-gray-100"
              style={{ background: 'linear-gradient(90deg, #f0f6ff 0%, #ffffff 100%)' }}
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ background: 'linear-gradient(135deg, #1a6fb5, #6366f1)' }}
                  >
                    {selected.avatar}
                  </div>
                  <span
                    className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${
                      selected.online ? 'bg-emerald-400' : 'bg-gray-300'
                    }`}
                  />
                </div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{selected.name}</p>
                  <p className="text-xs text-gray-400">{selected.lastSeen}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="p-2 rounded-xl bg-[#1a6fb5]/10 text-[#1a6fb5] hover:bg-[#1a6fb5]/20 transition">
                  <Phone size={16} />
                </button>
                <button className="p-2 rounded-xl bg-[#1a6fb5]/10 text-[#1a6fb5] hover:bg-[#1a6fb5]/20 transition">
                  <Video size={16} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3 bg-[#f8fafc]">
              {(messages[selected.id] || []).map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === 'caregiver' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs px-4 py-2.5 rounded-2xl text-sm ${
                      msg.sender === 'caregiver'
                        ? 'bg-[#1a6fb5] text-white rounded-tr-sm'
                        : 'bg-white text-gray-700 rounded-tl-sm shadow-sm border border-gray-100'
                    }`}
                  >
                    <p>{msg.text}</p>
                    <p className={`text-xs mt-1 ${msg.sender === 'caregiver' ? 'text-blue-200' : 'text-gray-400'}`}>
                      {msg.time}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-5 py-4 border-t border-gray-100 bg-white">
              <div className="flex items-center gap-3 bg-gray-50 rounded-2xl px-4 py-2.5 border border-gray-100 focus-within:border-[#1a6fb5]/40 transition">
                <input
                  type="text"
                  placeholder="Write a message..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  className="flex-1 bg-transparent text-sm outline-none text-gray-700 placeholder-gray-400"
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim()}
                  className="p-2 rounded-xl text-white transition disabled:opacity-40"
                  style={{ background: 'linear-gradient(135deg, #1a6fb5, #6366f1)' }}
                >
                  <Send size={15} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
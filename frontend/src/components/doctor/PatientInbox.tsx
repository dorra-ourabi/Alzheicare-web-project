import { useState } from 'react'
import { Search, Send, Phone, Video } from 'lucide-react'

interface Patient {
  id: number
  name: string
  caregiver: string
  avatar: string
  lastMessage: string
  time: string
  unread: number
  phase: 'Early' | 'Moderate' | 'Severe'
}

const patients: Patient[] = [
  {
    id: 1,
    name: 'Margaret J. Thompson',
    caregiver: 'Sophie Thompson',
    avatar: 'MT',
    lastMessage: 'She had a rough night, wandering around...',
    time: '09:41',
    unread: 2,
    phase: 'Moderate',
  },
  {
    id: 2,
    name: 'Robert H. Chen',
    caregiver: 'David Chen',
    avatar: 'RC',
    lastMessage: 'Medications were taken this morning.',
    time: 'Yesterday',
    unread: 0,
    phase: 'Early',
  },
  {
    id: 3,
    name: 'Elaine M. Dupont',
    caregiver: 'Marie Dupont',
    avatar: 'ED',
    lastMessage: 'Can we schedule a call this week?',
    time: 'Mon',
    unread: 1,
    phase: 'Severe',
  },
]

const phaseColors: Record<string, string> = {
  Early: 'bg-green-100 text-green-600',
  Moderate: 'bg-yellow-100 text-yellow-600',
  Severe: 'bg-red-100 text-red-600',
}

interface Message {
  id: number
  sender: 'doctor' | 'caregiver'
  text: string
  time: string
}

const mockMessages: Record<number, Message[]> = {
  1: [
    { id: 1, sender: 'caregiver', text: 'Good morning Doctor, Margaret had a rough night.', time: '08:12' },
    { id: 2, sender: 'caregiver', text: 'She was wandering around at 3am and seemed confused.', time: '08:13' },
    { id: 3, sender: 'doctor', text: 'Thank you Sophie. Has she taken her Lisinopril this morning?', time: '09:01' },
    { id: 4, sender: 'caregiver', text: 'Yes, all medications were taken at 7:30am.', time: '09:20' },
    { id: 5, sender: 'caregiver', text: 'She had a rough night, wandering around...', time: '09:41' },
  ],
  2: [
    { id: 1, sender: 'caregiver', text: 'Hello Doctor, Robert is doing well today.', time: 'Yesterday' },
    { id: 2, sender: 'caregiver', text: 'Medications were taken this morning.', time: 'Yesterday' },
  ],
  3: [
    { id: 1, sender: 'caregiver', text: 'Can we schedule a call this week?', time: 'Mon' },
  ],
}

export default function PatientInbox() {
  const [selected, setSelected] = useState<Patient>(patients[0])
  const [search, setSearch] = useState('')
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState(mockMessages)

  const filtered = patients.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  const sendMessage = () => {
    if (!message.trim()) return
    const newMsg: Message = {
      id: Date.now(),
      sender: 'doctor',
      text: message,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    }
    setMessages((prev) => ({
      ...prev,
      [selected.id]: [...(prev[selected.id] || []), newMsg],
    }))
    setMessage('')
  }

  return (
    <div className="flex h-[calc(100vh-120px)] bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

      {/* Patient List */}
      <div className="w-72 border-r border-gray-100 flex flex-col">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800 mb-3">Patient Messages</h2>
          <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
            <Search size={14} className="text-gray-400" />
            <input
              type="text"
              placeholder="Search patient..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-sm outline-none flex-1 text-gray-700 placeholder-gray-400"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filtered.map((patient) => (
            <button
              key={patient.id}
              onClick={() => setSelected(patient)}
              className={`w-full flex items-start gap-3 px-4 py-3.5 border-b border-gray-50 transition-all text-left ${
                selected.id === patient.id ? 'bg-[#1a6fb5]/8' : 'hover:bg-gray-50'
              }`}
            >
              {/* Avatar */}
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                style={{ background: 'linear-gradient(135deg, #1a6fb5, #6366f1)' }}
              >
                {patient.avatar}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-800 truncate">{patient.name}</p>
                  <span className="text-xs text-gray-400 shrink-0 ml-1">{patient.time}</span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${phaseColors[patient.phase]}`}>
                  {patient.phase}
                </span>
                <p className="text-xs text-gray-400 truncate mt-1">{patient.lastMessage}</p>
              </div>

              {patient.unread > 0 && (
                <span className="w-5 h-5 rounded-full bg-[#1a6fb5] text-white text-xs flex items-center justify-center shrink-0 mt-1">
                  {patient.unread}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Window */}
      <div className="flex-1 flex flex-col">

        {/* Chat Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100"
          style={{ background: 'linear-gradient(90deg, #f0f6ff 0%, #ffffff 100%)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold"
              style={{ background: 'linear-gradient(135deg, #1a6fb5, #6366f1)' }}
            >
              {selected.avatar}
            </div>
            <div>
              <p className="font-semibold text-gray-800 text-sm">{selected.name}</p>
              <p className="text-xs text-gray-400">Caregiver: {selected.caregiver}</p>
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
              className={`flex ${msg.sender === 'doctor' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs px-4 py-2.5 rounded-2xl text-sm ${
                  msg.sender === 'doctor'
                    ? 'bg-[#1a6fb5] text-white rounded-tr-sm'
                    : 'bg-white text-gray-700 rounded-tl-sm shadow-sm border border-gray-100'
                }`}
              >
                <p>{msg.text}</p>
                <p className={`text-xs mt-1 ${msg.sender === 'doctor' ? 'text-blue-200' : 'text-gray-400'}`}>
                  {msg.time}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="px-5 py-4 border-t border-gray-100 bg-white">
          <div className="flex items-center gap-3 bg-gray-50 rounded-2xl px-4 py-2">
            <input
              type="text"
              placeholder="Write a message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              className="flex-1 bg-transparent text-sm outline-none text-gray-700 placeholder-gray-400"
            />
            <button
              onClick={sendMessage}
              className="p-2 rounded-xl bg-[#1a6fb5] text-white hover:bg-[#1557a0] transition"
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
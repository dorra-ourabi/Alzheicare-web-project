import { useEffect, useRef, useState } from 'react'
import { Search, Send, Phone, Video } from 'lucide-react'
import { useAuth } from '../../context/useAuth'
import { createChatSocket, type ChatSocketMessage } from '../../lib/chat-socket'

export interface DoctorThreadMessage {
  id: number
  sender: 'doctor' | 'patient'
  text: string
  time: string
}

export interface DoctorThread {
  id: number
  conversationId: number
  name: string
  caregiver: string
  avatar: string
  lastMessage: string
  time: string
  unread: number
  phase: 'Early' | 'Moderate' | 'Severe'
  messages: DoctorThreadMessage[]
}

const fallbackThreads: DoctorThread[] = [
  {
    id: 1,
    conversationId: 1,
    name: 'Margaret J. Thompson',
    caregiver: 'Sophie Thompson',
    avatar: 'MT',
    lastMessage: 'She had a rough night, wandering around...',
    time: '09:41',
    unread: 2,
    phase: 'Moderate',
    messages: [
      { id: 1, sender: 'patient', text: 'She had a rough night, wandering around...', time: '09:41' },
    ],
  },
  {
    id: 2,
    conversationId: 2,
    name: 'Robert H. Chen',
    caregiver: 'David Chen',
    avatar: 'RC',
    lastMessage: 'Medications were taken this morning.',
    time: 'Yesterday',
    unread: 0,
    phase: 'Early',
    messages: [
      { id: 1, sender: 'patient', text: 'Medications were taken this morning.', time: 'Yesterday' },
    ],
  },
  {
    id: 3,
    conversationId: 3,
    name: 'Elaine M. Dupont',
    caregiver: 'Marie Dupont',
    avatar: 'ED',
    lastMessage: 'Can we schedule a call this week?',
    time: 'Mon',
    unread: 1,
    phase: 'Severe',
    messages: [
      { id: 1, sender: 'patient', text: 'Can we schedule a call this week?', time: 'Mon' },
    ],
  },
]

const phaseColors: Record<string, string> = {
  Early: 'bg-green-100 text-green-600',
  Moderate: 'bg-yellow-100 text-yellow-600',
  Severe: 'bg-red-100 text-red-600',
}

const formatTime = (value: string) =>
  new Date(value).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

export default function PatientInbox({ threads }: { threads?: DoctorThread[] }) {
  const { accessToken: token } = useAuth()
  const initialThreads = threads && threads.length > 0 ? threads : fallbackThreads
  const [liveThreads, setLiveThreads] = useState<DoctorThread[]>(initialThreads)
  const [selectedId, setSelectedId] = useState<number>(initialThreads[0]?.id ?? 0)
  const [search, setSearch] = useState('')
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<Record<number, DoctorThreadMessage[]>>(
    Object.fromEntries(initialThreads.map((thread) => [thread.id, thread.messages]))
  )
  const socketRef = useRef<ReturnType<typeof createChatSocket> | null>(null)

  useEffect(() => {
    const nextThreads = threads && threads.length > 0 ? threads : fallbackThreads
    setLiveThreads(nextThreads)
    setSelectedId((current) =>
      nextThreads.some((thread) => thread.id === current) ? current : nextThreads[0]?.id ?? 0,
    )
    setMessages(Object.fromEntries(nextThreads.map((thread) => [thread.id, thread.messages])))
  }, [threads])

  const selectedThread = liveThreads.find((thread) => thread.id === selectedId) ?? liveThreads[0]

  useEffect(() => {
    if (!token || !selectedThread) return

    const socket = createChatSocket(token)
    socketRef.current = socket

    const joinRoom = () => {
      socket.emit('join', { conversationId: selectedThread.conversationId })
      socket.emit('markRead', { conversationId: selectedThread.conversationId })
    }

    socket.on('connect', joinRoom)

    const handleMessage = (incoming: ChatSocketMessage) => {
      const incomingTime = formatTime(incoming.at)
      const sender = incoming.fromRole.toLowerCase() === 'doctor' ? 'doctor' : 'patient'

      setMessages((prev) => ({
        ...prev,
        [incoming.conversationId]: [
          ...(prev[incoming.conversationId] || []),
          {
            id: incoming.id,
            sender,
            text: incoming.content,
            time: incomingTime,
          },
        ],
      }))

      setLiveThreads((prev) =>
        prev.map((thread) =>
          thread.conversationId === incoming.conversationId
            ? {
                ...thread,
                lastMessage: incoming.content,
                time: incomingTime,
                unread:
                    incoming.conversationId === selectedThread.conversationId && sender === 'patient'
                    ? 0
                    : thread.unread + (sender === 'patient' && thread.conversationId !== selectedThread.conversationId ? 1 : 0),
              }
            : thread,
        ),
      )
    }

    const handleMessagesRead = () => {
      setLiveThreads((prev) =>
        prev.map((thread) =>
          thread.conversationId === selectedThread.conversationId ? { ...thread, unread: 0 } : thread,
        ),
      )
    }

    socket.on('message', handleMessage)
    socket.on('messagesRead', handleMessagesRead)

    joinRoom()

    return () => {
      socket.off('connect', joinRoom)
      socket.off('message', handleMessage)
      socket.off('messagesRead', handleMessagesRead)
      socket.disconnect()
      socketRef.current = null
    }
  }, [selectedThread?.conversationId, token])

  const filtered = liveThreads.filter((patient) =>
    patient.name.toLowerCase().includes(search.toLowerCase()),
  )

  const sendMessage = () => {
    if (!message.trim() || !selectedThread) return

    const content = message.trim()
    const socket = socketRef.current

    if (socket?.connected) {
      socket.emit('message', {
        conversationId: selectedThread.conversationId,
        content,
      })
      socket.emit('markRead', { conversationId: selectedThread.conversationId })
    } else {
      const newMsg: DoctorThreadMessage = {
        id: Date.now(),
        sender: 'doctor',
        text: content,
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      }
      setMessages((prev) => ({
        ...prev,
        [selectedThread.id]: [...(prev[selectedThread.id] || []), newMsg],
      }))
      setLiveThreads((prev) =>
        prev.map((thread) =>
          thread.id === selectedThread.id
            ? { ...thread, lastMessage: content, time: newMsg.time }
            : thread,
        ),
      )
    }

    setMessage('')
  }

  return (
    <div className="flex h-[calc(100vh-120px)] bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
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
              onClick={() => setSelectedId(patient.id)}
              className={`w-full flex items-start gap-3 px-4 py-3.5 border-b border-gray-50 transition-all text-left ${
                selectedThread?.id === patient.id ? 'bg-[#1a6fb5]/8' : 'hover:bg-gray-50'
              }`}
            >
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

      <div className="flex-1 flex flex-col">
        <div
          className="flex items-center justify-between px-5 py-4 border-b border-gray-100"
          style={{ background: 'linear-gradient(90deg, #f0f6ff 0%, #ffffff 100%)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold"
              style={{ background: 'linear-gradient(135deg, #1a6fb5, #6366f1)' }}
            >
              {selectedThread?.avatar}
            </div>
            <div>
              <p className="font-semibold text-gray-800 text-sm">{selectedThread?.name}</p>
              <p className="text-xs text-gray-400">Caregiver: {selectedThread?.caregiver}</p>
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

        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3 bg-[#f8fafc]">
          {(messages[selectedThread?.id ?? 0] || []).map((msg) => (
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
              disabled={!message.trim() || !selectedThread}
              className="p-2 rounded-xl bg-[#1a6fb5] text-white hover:bg-[#1557a0] transition disabled:opacity-40"
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

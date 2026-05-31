import { useEffect, useRef, useState } from 'react'
import Sidebar from '../../components/caregiver/Sidebar'
import { Send, Phone, Video, Search } from 'lucide-react'
import { useAuth } from '../../context/useAuth'
import { apiRequest } from '../../lib/api'
import { createChatSocket, type ChatSocketMessage } from '../../lib/chat-socket'

interface Doctor {
  id: number
  conversationId: number
  name: string
  specialty: string
  avatar: string
  online: boolean
  lastSeen: string
}

interface Message {
  id: number
  sender: 'patient' | 'doctor'
  text: string
  time: string
}

type MeResponse = {
  id: number
  patient?: {
    conversations?: Array<{
      id: number
      doctor: {
        user: {
          firstName: string
          secondName: string
          specialization?: string | null
          licenceNumber?: string | null
        }
      }
      messages: Array<{
        id: number
        senderId: number
        content: string
        sentAt: string
      }>
    }>
  }
}

const formatTime = (value: string) =>
  new Date(value).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

export default function CaregiverChat() {
  const { accessToken: token } = useAuth()
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [messages, setMessages] = useState<Record<number, Message[]>>({})
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null)
  const [input, setInput] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const socketRef = useRef<ReturnType<typeof createChatSocket> | null>(null)
  const userIdRef = useRef<number | null>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, selectedConversationId])

  useEffect(() => {
    if (!token) return

    let isMounted = true
    setLoading(true)
    setError('')

    apiRequest<MeResponse>('/users/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((response) => {
        if (!isMounted) return
        userIdRef.current = response.id

        const conversations = response.patient?.conversations ?? []
        const nextDoctors: Doctor[] = conversations.map((conversation) => {
          const doctorUser = conversation.doctor.user
          const lastMessage = conversation.messages.at(-1)
          return {
            id: conversation.id,
            conversationId: conversation.id,
            name: `${doctorUser.firstName} ${doctorUser.secondName}`,
            specialty: doctorUser.specialization ?? 'Doctor',
            avatar: `${doctorUser.firstName?.[0] ?? 'D'}${doctorUser.secondName?.[0] ?? 'D'}`,
            online: false,
            lastSeen: lastMessage ? `Updated ${formatTime(lastMessage.sentAt)}` : 'No messages yet',
          }
        })

        const nextMessages = Object.fromEntries(
          conversations.map((conversation) => [
            conversation.id,
            conversation.messages.map((message) => ({
              id: message.id,
              sender: message.senderId === response.id ? 'patient' : 'doctor',
              text: message.content,
              time: formatTime(message.sentAt),
            })),
          ]),
        ) as Record<number, Message[]>

        setDoctors(nextDoctors)
        setMessages(nextMessages)
        setSelectedConversationId((current) => current ?? nextDoctors[0]?.conversationId ?? null)
      })
      .catch((caughtError) => {
        if (!isMounted) return
        setError(caughtError instanceof Error ? caughtError.message : 'Could not load conversations.')
      })
      .finally(() => {
        if (!isMounted) return
        setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [token])

  const selectedDoctor =
    doctors.find((doctor) => doctor.conversationId === selectedConversationId) ?? doctors[0] ?? null

  useEffect(() => {
    if (!token || !selectedDoctor) return

    const socket = createChatSocket(token)
    socketRef.current = socket

    const joinRoom = () => {
      socket.emit('join', { conversationId: selectedDoctor.conversationId })
      socket.emit('markRead', { conversationId: selectedDoctor.conversationId })
    }

    socket.on('connect', joinRoom)

    const handleMessage = (incoming: ChatSocketMessage) => {
      const time = formatTime(incoming.at)
      const sender: Message['sender'] = incoming.fromRole.toLowerCase() === 'patient' ? 'patient' : 'doctor'

      setMessages((prev) => ({
        ...prev,
        [incoming.conversationId]: [
          ...(prev[incoming.conversationId] || []),
          {
            id: incoming.id,
            sender,
            text: incoming.content,
            time,
          },
        ],
      }))

      setDoctors((prev) =>
        prev.map((doctor) =>
          doctor.conversationId === incoming.conversationId
            ? {
                ...doctor,
                lastSeen: `Updated ${time}`,
              }
            : doctor,
        ),
      )
    }

    socket.on('message', handleMessage)
    joinRoom()

    return () => {
      socket.off('connect', joinRoom)
      socket.off('message', handleMessage)
      socket.disconnect()
      socketRef.current = null
    }
  }, [selectedDoctor?.conversationId, token])

  const filtered = doctors.filter((doctor) =>
    doctor.name.toLowerCase().includes(search.toLowerCase()) ||
    doctor.specialty.toLowerCase().includes(search.toLowerCase()),
  )

  const sendMessage = () => {
    if (!input.trim() || !selectedDoctor) return

    const content = input.trim()
    const socket = socketRef.current
    const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

    if (socket?.connected) {
      socket.emit('message', {
        conversationId: selectedDoctor.conversationId,
        content,
      })
      socket.emit('markRead', { conversationId: selectedDoctor.conversationId })
    } else {
      const newMsg: Message = {
        id: Date.now(),
        sender: 'patient',
        text: content,
        time,
      }
      setMessages((prev) => ({
        ...prev,
        [selectedDoctor.conversationId]: [...(prev[selectedDoctor.conversationId] || []), newMsg],
      }))
    }

    setDoctors((prev) =>
      prev.map((doctor) =>
        doctor.conversationId === selectedDoctor.conversationId
          ? { ...doctor, lastSeen: `Updated ${time}` }
          : doctor,
      ),
    )

    setInput('')
  }

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f7fb] p-6">
        <div className="max-w-md w-full bg-white rounded-3xl border border-gray-100 shadow-sm p-8 text-center">
          <h1 className="text-lg font-semibold text-gray-900">Sign in to chat</h1>
          <p className="text-sm text-gray-500 mt-3">You need an authenticated caregiver session.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f7fb] text-sm text-gray-500">
        Loading conversations...
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f7fb] px-6">
        <div className="max-w-md rounded-3xl border border-red-200 bg-white p-6 text-center shadow-sm">
          <h1 className="text-lg font-bold text-gray-900">Chat unavailable</h1>
          <p className="mt-2 text-sm text-gray-500">{error}</p>
        </div>
      </div>
    )
  }

  if (!selectedDoctor) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f7fb] px-6">
        <div className="max-w-md rounded-3xl border border-gray-100 bg-white p-6 text-center shadow-sm">
          <h1 className="text-lg font-bold text-gray-900">No connected doctor yet</h1>
          <p className="mt-2 text-sm text-gray-500">Accept an invitation first, then your conversation room will appear here.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-[#f4f7fb]">
      <Sidebar />

      <main className="flex-1 p-6 overflow-hidden">
        <div className="mb-5">
          <h1 className="text-xl font-bold text-gray-900">Chat</h1>
          <p className="text-xs text-gray-400">Messages with your connected doctor</p>
        </div>

        <div className="flex h-[calc(100vh-140px)] bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
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
                  key={doctor.conversationId}
                  onClick={() => setSelectedConversationId(doctor.conversationId)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 border-b border-gray-50 transition-all text-left ${
                    selectedDoctor.conversationId === doctor.conversationId ? 'bg-[#1a6fb5]/8' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="relative">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold"
                      style={{ background: 'linear-gradient(135deg, #1a6fb5, #6366f1)' }}
                    >
                      {doctor.avatar}
                    </div>
                    <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${doctor.online ? 'bg-emerald-400' : 'bg-gray-300'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{doctor.name}</p>
                    <p className="text-xs text-gray-400 truncate">{doctor.specialty}</p>
                    <p className="text-xs text-gray-300 truncate mt-0.5">{doctor.lastSeen}</p>
                  </div>
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
                <div className="relative">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ background: 'linear-gradient(135deg, #1a6fb5, #6366f1)' }}
                  >
                    {selectedDoctor.avatar}
                  </div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white bg-emerald-400" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{selectedDoctor.name}</p>
                  <p className="text-xs text-gray-400">{selectedDoctor.specialty}</p>
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
              {(messages[selectedDoctor.conversationId] || []).map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === 'patient' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs px-4 py-2.5 rounded-2xl text-sm ${
                      msg.sender === 'patient'
                        ? 'bg-[#1a6fb5] text-white rounded-tr-sm'
                        : 'bg-white text-gray-700 rounded-tl-sm shadow-sm border border-gray-100'
                    }`}
                  >
                    <p>{msg.text}</p>
                    <p className={`text-xs mt-1 ${msg.sender === 'patient' ? 'text-blue-200' : 'text-gray-400'}`}>
                      {msg.time}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

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

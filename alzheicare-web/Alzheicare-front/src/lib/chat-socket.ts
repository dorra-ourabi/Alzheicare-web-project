import { io, type Socket } from 'socket.io-client'
import { API_BASE_URL } from './api'

export type ChatSocketMessage = {
  id: number
  conversationId: number
  fromRole: string
  content: string
  at: string
}

export type ChatSocketTyping = {
  username: string
  isTyping: boolean
}

export type ChatSocketMessagesRead = {
  byUser: string
  byRole: string
  at: string
}

export type ChatSocketReaction = {
  messageId: number
  emoji: string
  fromUser: string
}

export function createChatSocket(token: string): Socket {
  return io(API_BASE_URL, {
    auth: { token },
    transports: ['websocket'],
  })
}

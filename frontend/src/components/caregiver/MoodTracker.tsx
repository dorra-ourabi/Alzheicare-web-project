import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const moodEmojis: Record<string, string> = {
  great: '😊', good: '🙂', neutral: '😐', anxious: '😟', sad: '😢'
}

const mockMoods: Record<number, string> = {
  1: 'good', 2: 'great', 3: 'neutral', 4: 'good',
  5: 'sad', 6: 'anxious', 7: 'good', 8: 'great',
  9: 'neutral', 10: 'good', 11: 'anxious', 12: 'sad',
  13: 'good', 14: 'neutral', 15: 'good',
}

export default function MoodTracker() {
  const [currentMonth] = useState('April 2026')
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const startDay = 2 // April 2026 starts on Wednesday

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-center gap-2 mb-1">
        <h3 className="font-semibold text-gray-800">Mood Tracker</h3>
      </div>
      <p className="text-xs text-gray-400 mb-4">Daily emotional state log</p>

      <div className="flex items-center justify-between mb-3">
        <button className="p-1 rounded-lg hover:bg-gray-100"><ChevronLeft size={16} /></button>
        <span className="text-sm font-medium text-gray-700">{currentMonth}</span>
        <button className="p-1 rounded-lg hover:bg-gray-100"><ChevronRight size={16} /></button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {days.map((d) => (
          <div key={d} className="text-xs text-gray-400 font-medium py-1">{d}</div>
        ))}
        {Array.from({ length: startDay }).map((_, i) => <div key={`empty-${i}`} />)}
        {Array.from({ length: 30 }).map((_, i) => {
          const day = i + 1
          const mood = mockMoods[day]
          const isToday = day === 15
          return (
            <div
              key={day}
              className={`flex flex-col items-center justify-center rounded-xl py-1 text-xs transition-all ${
                isToday ? 'bg-[#1a6fb5] text-white' : 'hover:bg-gray-50'
              }`}
            >
              <span className={isToday ? 'text-white' : 'text-gray-500'}>{day}</span>
              {mood && <span className="text-sm leading-none">{moodEmojis[mood]}</span>}
            </div>
          )
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="text-base">😊</span>
          <span className="font-medium text-[#1a6fb5]">2026-04-15 — Good</span>
          <span className="text-gray-400">· Recorded by care staff</span>
        </div>
        <div className="flex flex-wrap gap-2 mt-2 text-xs text-gray-400">
          <span>😊 Great (2)</span>
          <span>🙂 Good (5)</span>
          <span>😐 Neutral (3)</span>
          <span>😟 Anxious (3)</span>
          <span>😢 Sad (2)</span>
        </div>
      </div>
    </div>
  )
}
import { useState } from 'react'
import Sidebar from '../../components/caregiver/Sidebar'
import {
  Brain, Grid3x3, Type, Shapes, Clock,
  Star, Trophy, Play, RotateCcw, Check, X
} from 'lucide-react'

type GameId = 'memory' | 'word' | 'attention' | 'shape'
type GameState = 'idle' | 'playing' | 'finished'

interface Game {
  id: GameId
  title: string
  description: string
  icon: typeof Brain
  color: string
  bg: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  duration: string
}

const games: Game[] = [
  {
    id: 'memory',
    title: 'Memory Match',
    description: 'Flip cards and find matching pairs to stimulate short-term memory.',
    icon: Grid3x3,
    color: 'text-[#1a6fb5]',
    bg: 'bg-[#1a6fb5]/10',
    difficulty: 'Easy',
    duration: '5 min',
  },
  {
    id: 'word',
    title: 'Word Recall',
    description: 'Remember and recall a list of words to exercise verbal memory.',
    icon: Type,
    color: 'text-violet-500',
    bg: 'bg-violet-100',
    difficulty: 'Medium',
    duration: '3 min',
  },
  {
    id: 'attention',
    title: 'Attention Game',
    description: 'Spot the target among distractors to train focus and concentration.',
    icon: Brain,
    color: 'text-emerald-500',
    bg: 'bg-emerald-100',
    difficulty: 'Easy',
    duration: '4 min',
  },
  {
    id: 'shape',
    title: 'Shape Sorting',
    description: 'Match shapes to their correct slots to stimulate spatial reasoning.',
    icon: Shapes,
    color: 'text-amber-500',
    bg: 'bg-amber-100',
    difficulty: 'Easy',
    duration: '5 min',
  },
]

const difficultyColor: Record<string, string> = {
  Easy: 'bg-emerald-100 text-emerald-600',
  Medium: 'bg-amber-100 text-amber-600',
  Hard: 'bg-red-100 text-red-600',
}

// ── MEMORY MATCH GAME ──────────────────────────────────────────
const EMOJIS = ['🍎', '🐶', '🌸', '⭐', '🎈', '🦋', '🍓', '🌙']

function MemoryMatch({ onFinish }: { onFinish: (score: number) => void }) {
  const cards = [...EMOJIS, ...EMOJIS]
    .sort(() => Math.random() - 0.5)
    .map((emoji, i) => ({ id: i, emoji, flipped: false, matched: false }))

  const [deck, setDeck] = useState(cards)
  const [selected, setSelected] = useState<number[]>([])
  const [moves, setMoves] = useState(0)
  const [matches, setMatches] = useState(0)

  const flip = (id: number) => {
    if (selected.length === 2) return
    if (deck[id].flipped || deck[id].matched) return

    const newDeck = deck.map((c) => c.id === id ? { ...c, flipped: true } : c)
    const newSelected = [...selected, id]
    setDeck(newDeck)
    setSelected(newSelected)

    if (newSelected.length === 2) {
      setMoves((m) => m + 1)
      const [a, b] = newSelected
      if (newDeck[a].emoji === newDeck[b].emoji) {
        const matched = newDeck.map((c) =>
          c.id === a || c.id === b ? { ...c, matched: true } : c
        )
        setDeck(matched)
        setSelected([])
        const newMatches = matches + 1
        setMatches(newMatches)
        if (newMatches === EMOJIS.length) {
          setTimeout(() => onFinish(Math.max(100 - moves * 5, 50)), 500)
        }
      } else {
        setTimeout(() => {
          setDeck((d) =>
            d.map((c) => c.id === a || c.id === b ? { ...c, flipped: false } : c)
          )
          setSelected([])
        }, 900)
      }
    }
  }

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="flex items-center gap-6 text-sm text-gray-500">
        <span>Moves: <strong className="text-gray-800">{moves}</strong></span>
        <span>Matches: <strong className="text-[#1a6fb5]">{matches}/{EMOJIS.length}</strong></span>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {deck.map((card) => (
          <button
            key={card.id}
            onClick={() => flip(card.id)}
            className={`w-16 h-16 rounded-2xl text-2xl flex items-center justify-center transition-all duration-300 border-2 ${
              card.matched
                ? 'bg-[#1a6fb5]/10 border-[#1a6fb5]/30'
                : card.flipped
                ? 'bg-white border-[#1a6fb5] shadow-md'
                : 'bg-gray-100 border-gray-200 hover:border-[#1a6fb5]/40'
            }`}
          >
            {card.flipped || card.matched ? card.emoji : '?'}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── WORD RECALL GAME ───────────────────────────────────────────
const WORD_LIST = ['Apple', 'River', 'Chair', 'Sunset', 'Garden', 'Music']

type WordPhase = 'memorize' | 'recall'

function WordRecall({ onFinish }: { onFinish: (score: number) => void }) {
  const [phase, setPhase] = useState<WordPhase>('memorize')
  const [input, setInput] = useState('')
  const [recalled, setRecalled] = useState<string[]>([])
  const [submitted, setSubmitted] = useState(false)

  const addWord = () => {
    const word = input.trim()
    if (!word || recalled.includes(word)) return
    setRecalled((prev) => [...prev, word])
    setInput('')
  }

  const submit = () => {
    setSubmitted(true)
    const correct = recalled.filter((w) =>
      WORD_LIST.map((x) => x.toLowerCase()).includes(w.toLowerCase())
    ).length
    setTimeout(() => onFinish(Math.round((correct / WORD_LIST.length) * 100)), 1500)
  }

  if (phase === 'memorize') {
    return (
      <div className="flex flex-col items-center gap-6">
        <p className="text-sm text-gray-500 text-center">
          Memorize these words. You will be asked to recall them.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          {WORD_LIST.map((word) => (
            <span
              key={word}
              className="px-5 py-2.5 rounded-2xl bg-[#1a6fb5]/10 text-[#1a6fb5] font-semibold text-lg"
            >
              {word}
            </span>
          ))}
        </div>
        <button
          onClick={() => setPhase('recall')}
          className="px-8 py-3 rounded-2xl text-white font-medium text-sm"
          style={{ background: 'linear-gradient(135deg, #1a6fb5, #6366f1)' }}
        >
          I'm Ready — Start Recall
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-5">
      <p className="text-sm text-gray-500">Type the words you remember and press Enter</p>
      <div className="flex gap-2 w-full max-w-sm">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addWord()}
          placeholder="Type a word..."
          disabled={submitted}
          className="flex-1 bg-gray-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#1a6fb5]"
        />
        <button
          onClick={addWord}
          disabled={submitted}
          className="px-4 py-2.5 rounded-xl text-white text-sm font-medium bg-[#1a6fb5] disabled:opacity-40"
        >
          Add
        </button>
      </div>

      <div className="flex flex-wrap gap-2 justify-center min-h-8">
        {recalled.map((word) => {
          const correct = WORD_LIST.map((x) => x.toLowerCase()).includes(word.toLowerCase())
          return (
            <span
              key={word}
              className={`px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1 ${
                submitted
                  ? correct
                    ? 'bg-emerald-100 text-emerald-600'
                    : 'bg-red-100 text-red-500'
                  : 'bg-[#1a6fb5]/10 text-[#1a6fb5]'
              }`}
            >
              {submitted && (correct ? <Check size={12} /> : <X size={12} />)}
              {word}
            </span>
          )
        })}
      </div>

      {!submitted && recalled.length > 0 && (
        <button
          onClick={submit}
          className="px-8 py-3 rounded-2xl text-white font-medium text-sm"
          style={{ background: 'linear-gradient(135deg, #1a6fb5, #6366f1)' }}
        >
          Submit Answers
        </button>
      )}
    </div>
  )
}

// ── ATTENTION GAME ─────────────────────────────────────────────
const TARGETS = ['🌟', '🎯', '🔴']
const DISTRACTORS = ['🔵', '🟢', '🟡', '⬛', '🔶', '🔷', '🟣', '⬜']

function AttentionGame({ onFinish }: { onFinish: (score: number) => void }) {
  const target = TARGETS[Math.floor(Math.random() * TARGETS.length)]
  const gridSize = 16
  const targetIndex = Math.floor(Math.random() * gridSize)
  const grid = Array.from({ length: gridSize }, (_, i) =>
    i === targetIndex
      ? target
      : DISTRACTORS[Math.floor(Math.random() * DISTRACTORS.length)]
  )

  const [found, setFound] = useState(false)
  const [wrong, setWrong] = useState(false)
  const [attempts, setAttempts] = useState(0)

  const click = (emoji: string, idx: number) => {
    if (found) return
    setAttempts((a) => a + 1)
    if (emoji === target && idx === targetIndex) {
      setFound(true)
      setTimeout(() => onFinish(Math.max(100 - attempts * 15, 40)), 800)
    } else {
      setWrong(true)
      setTimeout(() => setWrong(false), 500)
    }
  }

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="flex items-center gap-3 bg-[#1a6fb5]/10 px-5 py-2.5 rounded-2xl">
        <span className="text-sm text-gray-600">Find:</span>
        <span className="text-3xl">{target}</span>
      </div>
      <div className={`grid grid-cols-4 gap-2 transition-all ${wrong ? 'opacity-50' : ''}`}>
        {grid.map((emoji, i) => (
          <button
            key={i}
            onClick={() => click(emoji, i)}
            className={`w-14 h-14 rounded-2xl text-2xl flex items-center justify-center transition-all border-2 ${
              found && i === targetIndex
                ? 'bg-emerald-100 border-emerald-400 scale-110'
                : 'bg-gray-50 border-gray-200 hover:border-[#1a6fb5]/40 hover:bg-[#1a6fb5]/5'
            }`}
          >
            {emoji}
          </button>
        ))}
      </div>
      <p className="text-xs text-gray-400">Attempts: {attempts}</p>
    </div>
  )
}

// ── SHAPE SORTING GAME ─────────────────────────────────────────
const SHAPES = [
  { id: 'circle', label: '⬤', name: 'Circle' },
  { id: 'square', label: '■', name: 'Square' },
  { id: 'triangle', label: '▲', name: 'Triangle' },
  { id: 'star', label: '★', name: 'Star' },
]

function ShapeSorting({ onFinish }: { onFinish: (score: number) => void }) {
  const shuffled = [...SHAPES].sort(() => Math.random() - 0.5)
  const [items, setItems] = useState(shuffled)
  const [slots, setSlots] = useState<Record<string, string | null>>({
    circle: null, square: null, triangle: null, star: null
  })
  const [dragging, setDragging] = useState<string | null>(null)

  const drop = (slotId: string) => {
    if (!dragging) return
    const alreadyPlaced = Object.values(slots).includes(dragging)
    if (alreadyPlaced) return
    setSlots((prev) => ({ ...prev, [slotId]: dragging }))
    setItems((prev) => prev.filter((s) => s.id !== dragging))
    setDragging(null)

    const newSlots = { ...slots, [slotId]: dragging }
    const allFilled = SHAPES.every((s) => newSlots[s.id] !== null)
    if (allFilled) {
      const correct = SHAPES.filter((s) => newSlots[s.id] === s.id).length
      setTimeout(() => onFinish(Math.round((correct / SHAPES.length) * 100)), 500)
    }
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <p className="text-sm text-gray-500">Drag each shape to its matching slot</p>

      {/* Draggable shapes */}
      <div className="flex gap-4">
        {items.map((shape) => (
          <div
            key={shape.id}
            draggable
            onDragStart={() => setDragging(shape.id)}
            className="w-16 h-16 rounded-2xl bg-[#1a6fb5]/10 border-2 border-[#1a6fb5]/30 flex items-center justify-center text-3xl cursor-grab active:cursor-grabbing hover:scale-105 transition-all"
          >
            {shape.label}
          </div>
        ))}
      </div>

      {/* Slots */}
      <div className="grid grid-cols-4 gap-3">
        {SHAPES.map((shape) => (
          <div
            key={shape.id}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => drop(shape.id)}
            className={`w-16 h-16 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-all ${
              slots[shape.id]
                ? slots[shape.id] === shape.id
                  ? 'border-emerald-400 bg-emerald-50'
                  : 'border-red-400 bg-red-50'
                : 'border-gray-300 hover:border-[#1a6fb5]/40'
            }`}
          >
            {slots[shape.id] ? (
              <span className="text-2xl">
                {SHAPES.find((s) => s.id === slots[shape.id])?.label}
              </span>
            ) : (
              <span className="text-xs text-gray-400">{shape.name}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── MAIN PAGE ──────────────────────────────────────────────────
export default function CognitiveGames() {
  const [activeGame, setActiveGame] = useState<GameId | null>(null)
  const [gameState, setGameState] = useState<GameState>('idle')
  const [score, setScore] = useState<number | null>(null)

  const startGame = (id: GameId) => {
    setActiveGame(id)
    setGameState('playing')
    setScore(null)
  }

  const finishGame = (s: number) => {
    setScore(s)
    setGameState('finished')
  }

  const reset = () => {
    setActiveGame(null)
    setGameState('idle')
    setScore(null)
  }

  const game = games.find((g) => g.id === activeGame)

  return (
    <div className="flex min-h-screen bg-[#f4f7fb]">
      <Sidebar />

      <main className="flex-1 p-6 overflow-y-auto">
        <div className="mb-5">
          <h1 className="text-xl font-bold text-gray-900">Cognitive Games</h1>
          <p className="text-xs text-gray-400">
            Memory stimulation activities for you and your patient
          </p>
        </div>

        {/* Game Grid */}
        {gameState === 'idle' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {games.map((g) => {
              const Icon = g.icon
              return (
                <div
                  key={g.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4 hover:shadow-md transition-all"
                >
                  <div className={`w-12 h-12 rounded-2xl ${g.bg} flex items-center justify-center`}>
                    <Icon size={22} className={g.color} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-1">{g.title}</h3>
                    <p className="text-xs text-gray-400 leading-relaxed">{g.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${difficultyColor[g.difficulty]}`}>
                      {g.difficulty}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <Clock size={11} /> {g.duration}
                    </span>
                  </div>
                  <button
                    onClick={() => startGame(g.id)}
                    className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-white transition mt-auto"
                    style={{ background: 'linear-gradient(135deg, #1a6fb5, #6366f1)' }}
                  >
                    <Play size={14} />
                    Play
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {/* Active Game */}
        {gameState === 'playing' && game && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${game.bg} flex items-center justify-center`}>
                  <game.icon size={20} className={game.color} />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-800">{game.title}</h2>
                  <p className="text-xs text-gray-400">{game.description}</p>
                </div>
              </div>
              <button
                onClick={reset}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-gray-500 bg-gray-100 hover:bg-gray-200 transition"
              >
                <RotateCcw size={13} />
                Exit
              </button>
            </div>

            <div className="flex justify-center py-4">
              {activeGame === 'memory' && <MemoryMatch onFinish={finishGame} />}
              {activeGame === 'word' && <WordRecall onFinish={finishGame} />}
              {activeGame === 'attention' && <AttentionGame onFinish={finishGame} />}
              {activeGame === 'shape' && <ShapeSorting onFinish={finishGame} />}
            </div>
          </div>
        )}

        {/* Finished */}
        {gameState === 'finished' && game && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 flex flex-col items-center gap-5">
            <div
              className="w-20 h-20 rounded-3xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #1a6fb5, #6366f1)' }}
            >
              <Trophy size={36} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Game Complete!</h2>
            <div className="flex items-center gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={24}
                  className={i < Math.round((score || 0) / 20) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}
                />
              ))}
            </div>
            <div
              className="text-5xl font-black"
              style={{ background: 'linear-gradient(135deg, #1a6fb5, #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
            >
              {score}%
            </div>
            <p className="text-sm text-gray-400">
              {(score || 0) >= 80
                ? 'Excellent performance! Keep it up.'
                : (score || 0) >= 60
                ? 'Good job! Practice makes perfect.'
                : 'Keep practicing — every session helps!'}
            </p>
            <div className="flex gap-3 mt-2">
              <button
                onClick={() => { setGameState('playing'); setScore(null) }}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-medium text-white"
                style={{ background: 'linear-gradient(135deg, #1a6fb5, #6366f1)' }}
              >
                <RotateCcw size={14} />
                Play Again
              </button>
              <button
                onClick={reset}
                className="px-6 py-3 rounded-2xl text-sm font-medium text-gray-500 bg-gray-100 hover:bg-gray-200 transition"
              >
                Back to Games
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
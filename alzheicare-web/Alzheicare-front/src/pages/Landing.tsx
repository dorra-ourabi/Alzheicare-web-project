import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import logo from '../assets/logo_alzheicare.png'
import {
  Stethoscope, Heart, MapPin, Bot,
  Users, Brain, ChevronDown, Mail, Shield
} from 'lucide-react'

// ── ANIMATED COUNTER ─────────────────────────────────────────
function Counter({ target, suffix }: { target: number; suffix: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const started = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true
          let start = 0
          const duration = 1500
          const step = Math.ceil(target / (duration / 16))

          const timer = setInterval(() => {
            start += step
            if (start >= target) {
              setCount(target)
              clearInterval(timer)
              observer.unobserve(el)
            } else {
              setCount(start)
            }
          }, 16)
        }
      },
      { threshold: 0.5 }
    )
    observer.observe(el)

  return () => observer.unobserve(el)
  }, [target])

  return <div ref={ref}>{count.toLocaleString()}{suffix}</div>
}

// ── ANIMATED BRAIN SVG ───────────────────────────────────────
function BrainIllustration() {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Outer pulse rings */}
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="absolute rounded-full border border-[#1a6fb5]/15"
          style={{
            width: `${180 + i * 80}px`,
            height: `${180 + i * 80}px`,
            animation: `ping ${1.5 + i * 0.5}s cubic-bezier(0, 0, 0.2, 1) infinite`,
            animationDelay: `${i * 0.3}s`,
          }}
        />
      ))}

      {/* Center circle */}
      <div
        className="relative w-44 h-44 rounded-full flex items-center justify-center"
        style={{
          background: 'linear-gradient(135deg, rgba(26,111,181,0.12) 0%, rgba(99,102,241,0.10) 100%)',
          border: '1.5px solid rgba(26,111,181,0.2)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <Brain size={72} className="text-[#1a6fb5] opacity-80" strokeWidth={1.2} />
      </div>

      {/* Floating badges */}
      {[
        { icon: Heart, label: 'Care', color: '#1d9e75', top: '10%', left: '5%' },
        { icon: Shield, label: 'Safe', color: '#1a6fb5', top: '10%', right: '5%' },
        { icon: Bot, label: 'AI', color: '#6366f1', bottom: '15%', left: '5%' },
        { icon: MapPin, label: 'GPS', color: '#0ea5e9', bottom: '15%', right: '5%' },
      ].map(({ icon: Icon, label, color, ...pos }, i) => (
        <div
          key={label}
          className="absolute flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white shadow-lg border border-gray-100"
          style={{
            ...pos,
            animation: `float ${2.5 + i * 0.4}s ease-in-out infinite alternate`,
          }}
        >
          <Icon size={13} style={{ color }} />
          <span className="text-xs font-semibold text-gray-600">{label}</span>
        </div>
      ))}
    </div>
  )
}

// ── MAIN ─────────────────────────────────────────────────────
export default function Landing() {
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const features = [
    {
      icon: MapPin,
      title: 'GPS Geofencing',
      description: 'Real-time location tracking with instant alerts when the patient leaves the safe zone.',
      color: 'text-[#1a6fb5]',
      bg: 'bg-[#1a6fb5]/10',
    },
    {
      icon: Bot,
      title: 'AI Assistant',
      description: '24/7 intelligent support for caregivers and doctors with the latest Alzheimer\'s research.',
      color: 'text-violet-500',
      bg: 'bg-violet-100',
    },
    {
      icon: Users,
      title: 'Doctor Network',
      description: 'Connect with specialized doctors, share updates, and communicate in real time.',
      color: 'text-emerald-500',
      bg: 'bg-emerald-100',
    },
    {
      icon: Brain,
      title: 'Cognitive Games',
      description: 'Stimulate memory and cognition with activities designed for Alzheimer\'s patients.',
      color: 'text-amber-500',
      bg: 'bg-amber-100',
    },
  ]

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: '#f8faff' }}>

      {/* Background blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute rounded-full"
          style={{
            width: '600px', height: '600px',
            top: '-200px', right: '-150px',
            background: 'radial-gradient(circle, rgba(26,111,181,0.07) 0%, transparent 70%)',
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: '500px', height: '500px',
            bottom: '10%', left: '-150px',
            background: 'radial-gradient(circle, rgba(29,158,117,0.06) 0%, transparent 70%)',
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: '400px', height: '400px',
            top: '40%', left: '40%',
            background: 'radial-gradient(circle, rgba(99,102,241,0.05) 0%, transparent 70%)',
          }}
        />
      </div>

      {/* Navbar */}
      <nav
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          scrolled
            ? 'bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100'
            : 'bg-white/80'
        }`}
      >
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <img src={logo} alt="AlzheiCare" className="h-6" />
          <div className="flex items-center gap-6">
            <a href="#features" className="text-sm text-gray-500 hover:text-[#1a6fb5] transition">
              Features
            </a>
            <a href="#contact" className="text-sm text-gray-500 hover:text-[#1a6fb5] transition">
              Contact
            </a>
            <button
                onClick={() => {
                    document.getElementById('portals')?.scrollIntoView({ behavior: 'smooth' })
                }}
                className="px-4 py-2 rounded-xl text-sm font-medium text-white transition"
                style={{ background: 'linear-gradient(135deg, #1a6fb5, #6366f1)' }}
                >
                Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="min-h-screen flex items-center pt-20">
        <div className="max-w-6xl mx-auto px-6 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

            {/* Left */}
            <div
              className="flex flex-col gap-6"
              style={{ animation: 'slideUp 0.8s ease forwards', opacity: 0 }}
            >
              

              <h1 className="text-5xl font-black text-gray-900 leading-tight tracking-tight">
                Caring for your{' '}
                <span
                  style={{
                    background: 'linear-gradient(135deg, #1a6fb5, #6366f1)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  loved ones
                </span>
                ,{' '}together.
              </h1>

              <p className="text-lg text-gray-500 leading-relaxed max-w-md">
                AlzheiCare connects caregivers and doctors to provide the best possible support for Alzheimer's patients — with real-time monitoring, AI assistance, and seamless communication.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mt-2">
                <button
                  onClick={() => navigate('/doctor/auth')}
                  className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-semibold text-white transition hover:scale-105 hover:shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #1a6fb5, #1557a0)' }}
                >
                  <Stethoscope size={17} />
                  Doctor Portal
                </button>
                <button
                  onClick={() => navigate('/caregiver/auth')}
                  className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-semibold text-white transition hover:scale-105 hover:shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #1d9e75, #0f6e56)' }}
                >
                  <Heart size={17} />
                  Caregiver Portal
                </button>
              </div>

              
            </div>

            {/* Right — Brain Illustration */}
            <div
              className="hidden lg:flex items-center justify-center h-96"
              style={{ animation: 'fadeIn 1.2s ease forwards', opacity: 0 }}
            >
              <BrainIllustration />
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="flex justify-center mt-16">
            <a
              href="#stats"
              className="flex flex-col items-center gap-1 text-gray-400 hover:text-[#1a6fb5] transition"
            >
              <span className="text-xs">Scroll to explore</span>
              <ChevronDown size={18} className="animate-bounce" />
            </a>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section id="stats" className="py-48">
        <div className="w-full px-8 lg:px-16">  
          <div
            className="grid grid-cols-2 md:grid-cols-4 gap-8 rounded-3xl px-10 py-24"
            style={{
              background: 'linear-gradient(135deg, #1a6fb5 0%, #6366f1 100%)',
            }}
          >
            {[
              { target: 10000, suffix: '+', label: 'Caregivers Supported' },
              { target: 500, suffix: '+', label: 'Doctors Connected' },
              { target: 24, suffix: '/7', label: 'AI Assistance' },
              { target: 98, suffix: '%', label: 'Satisfaction Rate' },
            ].map(({ target, suffix, label }) => (
              <div key={label} className="flex flex-col items-center text-center gap-1">
                <div className="text-4xl md:text-5xl font-black text-white">
                  <Counter target={target} suffix={suffix} />
                </div>
                <p className="text-sm text-blue-200">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24">
        <div className="w-full lg:px-24">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-3">
              Why AlzheiCare?
            </h2>
            <p className="text-gray-500 max-w-md mx-auto text-sm leading-relaxed">
              Everything you need to monitor, support, and communicate — all in one place.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map(({ icon: Icon, title, description, color, bg }, i) => (
              <div
                key={title}
                className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col gap-4 hover:shadow-md hover:-translate-y-1 transition-all duration-300"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center`}>
                  <Icon size={23} className={color} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-1">{title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Portal Cards */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Choose your portal</h2>
            <p className="text-gray-500 text-sm">Specialized access for every role in the care journey.</p>
          </div>

          <div id="portals" className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Doctor */}
            <div
              className="rounded-3xl p-7 flex flex-col gap-5 border border-[#1a6fb5]/15 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
              style={{ background: 'linear-gradient(135deg, #f0f6ff 0%, #e8f0fb 100%)' }}
              onClick={() => navigate('/doctor/auth')}
            >
              <div className="w-14 h-14 rounded-2xl bg-[#1a6fb5] flex items-center justify-center shadow-lg shadow-[#1a6fb5]/30 group-hover:scale-110 transition-transform">
                <Stethoscope size={26} className="text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Medical Doctor Portal</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Access MRI classification, patient messaging, medical calendar and clinical AI support.
                </p>
              </div>
              <button
                className="w-full py-3 rounded-2xl text-sm font-semibold text-white transition"
                style={{ background: 'linear-gradient(135deg, #1a6fb5, #1557a0)' }}
              >
                Enter Doctor Portal →
              </button>
            </div>

            {/* Caregiver */}
            <div
              className="rounded-3xl p-7 flex flex-col gap-5 border border-emerald-200/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
              style={{ background: 'linear-gradient(135deg, #f0fdf8 0%, #e6f9f3 100%)' }}
              onClick={() => navigate('/caregiver/auth')}
            >
              <div className="w-14 h-14 rounded-2xl bg-[#1d9e75] flex items-center justify-center shadow-lg shadow-emerald-400/30 group-hover:scale-110 transition-transform">
                <Heart size={26} className="text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Family Caregiver Portal</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Monitor your patient in real time, manage medications, play cognitive games and chat with doctors.
                </p>
              </div>
              <button
                className="w-full py-3 rounded-2xl text-sm font-semibold text-white transition"
                style={{ background: 'linear-gradient(135deg, #1d9e75, #0f6e56)' }}
              >
                Enter Caregiver Portal →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="py-8 border-t border-gray-100 mt-8 bg-white/80 backdrop-blur-md shadow-sm">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-col items-center md:items-start gap-1">
              <img src={logo} alt="AlzheiCare" className="h-5" />
              <p className="text-xs text-gray-400">
                © 2026 AlzheiCare. All rights reserved.
              </p>
            </div>

            <div className="flex items-center gap-6">
              <a href="#" className="text-xs text-gray-400 hover:text-[#1a6fb5] transition">
                Privacy Policy
              </a>
              <a href="#" className="text-xs text-gray-400 hover:text-[#1a6fb5] transition">
                Terms of Use
              </a>
              <a
                href="mailto:contact@alzheicare.com"
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-[#1a6fb5] transition"
              >
                <Mail size={12} />
                contact@alzheicare.com
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Global animations */}
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes float {
          from { transform: translateY(0px); }
          to { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  )
}
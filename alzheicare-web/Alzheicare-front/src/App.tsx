import { useState, useEffect, useRef } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AlertTriangle, Map } from 'lucide-react'
import Landing from './pages/Landing'
import Home from './pages/Home'
import DoctorAuth from './pages/DoctorAuth'
import CaregiverAuth from './pages/CaregiverAuth'
import PatientForm from './pages/PatientForm'
import CaregiverDashboard from './pages/caregiver/Dashboard'
import DoctorDashboard from './pages/doctor/Dashboard'
import CaregiverCalendar from './pages/caregiver/Calendar'
import DoctorCalendar from './pages/doctor/Calendar'
import CaregiverNotifications from './pages/caregiver/Notifications'
import DoctorNotifications from './pages/doctor/Notifications'
import VerifyEmail from './pages/VerifyEmail'
import AIAssistant from './pages/shared/AIAssistant'
import CaregiverChat from './pages/caregiver/Chat'
import CaregiverLiveMap from './pages/caregiver/LiveMap'
import CaregiverGames from './pages/caregiver/CognitiveGames'
import DoctorNetwork from './pages/caregiver/DoctorNetwork'
import DoctorMRI from './pages/doctor/MRI'
import { openNotificationsStream, acknowledgeGeofenceAlert } from './api/notifications'

interface GeofenceNotification {
  mapsLink?: string
  message?: string
}

export default function App() {
  const [geofenceActive, setGeofenceActive] = useState(false)
  const [geofenceDismissed, setGeofenceDismissed] = useState(false)
  const [geofenceData, setGeofenceData] = useState<GeofenceNotification>({})
  const [isAcknowledging, setIsAcknowledging] = useState(false)
  const eventSourceRef = useRef<EventSource | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return

    // Open SSE stream for notifications
    const eventSource = openNotificationsStream(token)
    eventSourceRef.current = eventSource

    eventSource.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.notification?.referenceType === 'geofence') {
          setGeofenceDismissed(false)
          setGeofenceData({
            message: data.notification.body,
            mapsLink: data.notification.body?.includes('Carte:')
              ? data.notification.body
                  .split('Carte: ')[1]
                  ?.split('\n')[0]
                  ?.trim()
              : undefined,
          })
          setGeofenceActive(true)
        }
      } catch (err) {
        console.error('Failed to parse notification:', err)
      }
    })

    eventSource.addEventListener('error', () => {
      eventSource.close()
      eventSourceRef.current = null
    })

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
    }
  }, [])

  const handleAcknowledgeGeofence = async () => {
    setIsAcknowledging(true)
    try {
      const token = localStorage.getItem('token')
      await acknowledgeGeofenceAlert(token)
      setGeofenceActive(false)
      setGeofenceDismissed(true)
    } catch (error) {
      console.error('Failed to acknowledge geofence alert:', error)
    } finally {
      setIsAcknowledging(false)
    }
  }

  return (
    <BrowserRouter>

      {/* Geofence Alert — global, au dessus de tout */}
      {geofenceActive && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center"
          style={{ background: '#cc0000' }}
        >
          {/* Icon */}
          <div className="relative flex items-center justify-center mb-10">
            <span
              className="absolute w-52 h-52 rounded-full bg-white/10 animate-ping"
              style={{ animationDuration: '1.5s' }}
            />
            <span className="absolute w-36 h-36 rounded-full bg-white/15" />
            <div className="relative w-24 h-24 rounded-3xl bg-white/20 flex items-center justify-center border border-white/30">
              <AlertTriangle size={48} className="text-white" strokeWidth={2} />
            </div>
          </div>

          {/* Text */}
          <p className="text-white/70 text-sm font-semibold tracking-[0.2em] uppercase mb-3">
            Geofence Alert
          </p>
          <h1 className="text-4xl font-black text-white mb-3 tracking-tight">
            Patient left the safe zone
          </h1>
          <p className="text-white/60 text-sm mb-16">
            {geofenceData.message || 'Last known location: Rue de la République · ' + new Date().toLocaleTimeString()}
          </p>

          {/* Buttons */}
          <div className="flex gap-5">
            <button
              onClick={handleAcknowledgeGeofence}
              disabled={isAcknowledging}
              className="px-10 py-4 rounded-2xl font-semibold text-base text-red-600 bg-white hover:bg-green-100 transition shadow-2xl disabled:opacity-50"
            >
              {isAcknowledging ? 'Confirming...' : "I'm with him"}
            </button>
            <button
              onClick={() => {
                setGeofenceActive(false)
                setGeofenceDismissed(true)
              }}
              className="px-10 py-4 rounded-2xl font-semibold text-base text-white transition"
              style={{ background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.3)' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.25)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
            >
              Ignore
            </button>
            <button
              onClick={() => {
                if (geofenceData.mapsLink) {
                  window.open(geofenceData.mapsLink, '_blank')
                } else {
                  window.open('https://maps.google.com', '_blank')
                }
              }}
              className="flex items-center gap-3 px-10 py-4 rounded-2xl font-semibold text-base text-red-600 bg-white hover:bg-red-50 transition shadow-2xl"
            >
              <Map size={20} />
              See on Map
            </button>
          </div>
        </div>
      )}

      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/home" element={<Home />} />
        <Route path="/doctor/auth" element={<DoctorAuth />} />
        <Route path="/caregiver/auth" element={<CaregiverAuth />} />
        <Route path="/caregiver/patient-form" element={<PatientForm />} />
        <Route path="/caregiver/dashboard" element={<CaregiverDashboard />} />
        <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
        <Route path="/caregiver/calendar" element={<CaregiverCalendar />} />
        <Route path="/doctor/calendar" element={<DoctorCalendar />} />
        <Route path="/doctor/notifications" element={<DoctorNotifications />} />
        <Route
          path="/caregiver/notifications"
          element={<CaregiverNotifications onSimulate={() => setGeofenceActive(true)} />}
        />
        <Route path="/auth/verify-email" element={<VerifyEmail />} />
        <Route path="/caregiver/ai" element={<AIAssistant role="caregiver" />} />
        <Route path="/doctor/ai" element={<AIAssistant role="doctor" />} />
        <Route path="/caregiver/chat" element={<CaregiverChat />} />
        <Route
          path="/caregiver/map"
          element={
            <CaregiverLiveMap
              onDanger={() => {
                if (!geofenceDismissed) setGeofenceActive(true)
              }}
              onSafe={() => setGeofenceDismissed(false)}
            />
          }
        />
        <Route path="/caregiver/network" element={<DoctorNetwork />} />
        <Route path="/caregiver/games" element={<CaregiverGames/>} />
        <Route path="/doctor/mri" element={<DoctorMRI />} />
       </Routes>

    </BrowserRouter>
  )
}
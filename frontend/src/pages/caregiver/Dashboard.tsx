import { useState } from 'react'
import Sidebar from '../../components/caregiver/Sidebar'
import PatientOverview from '../../components/caregiver/PatientOverview'
import BehavioralChart from '../../components/caregiver/BehavioralChart'
import WeightChart from '../../components/caregiver/WeightChart'
import MoodTracker from '../../components/caregiver/MoodTracker'
import SleepTracker from '../../components/caregiver/SleepTracker'
import DailyLogModal from '../../components/caregiver/DailyLogModal'

export default function CaregiverDashboard() {
  const [showModal, setShowModal] = useState(false)

  return (
    <div className="flex min-h-screen bg-[#f4f7fb]">
      <Sidebar />

      <main className="flex-1 p-6 overflow-y-auto">
        <div className="mb-4">
          <h1 className="text-xl font-bold text-gray-900">Patient Dashboard</h1>
          <p className="text-xs text-gray-400">Last updated: Wednesday, April 15, 2026 at 09:42 AM</p>
        </div>

        <PatientOverview onFormClick={() => setShowModal(true)} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <BehavioralChart />
          <WeightChart />
          <MoodTracker />
          <SleepTracker />
        </div>
      </main>

      {showModal && <DailyLogModal onClose={() => setShowModal(false)} />}
    </div>
  )
}
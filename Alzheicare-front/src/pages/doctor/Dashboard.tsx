import DoctorSidebar from '../../components/doctor/Sidebar'
import StatsBar from '../../components/doctor/StatsBar'
import PatientInbox from '../../components/doctor/PatientInbox'
import MRIClassifier from '../../components/doctor/MRIClassifier'

export default function DoctorDashboard() {
  return (
    <div className="flex min-h-screen bg-[#f4f7fb]">
      <DoctorSidebar />

      <main className="flex-1 p-6 overflow-y-auto">
        <div className="mb-5">
          <h1 className="text-xl font-bold text-gray-900">Doctor Dashboard</h1>
          <p className="text-xs text-gray-400">Welcome back, Dr. A. Moreau — Sunday, April 26, 2026</p>
        </div>

        <StatsBar />
        <PatientInbox />

        <div className="mt-6">
          <MRIClassifier />
        </div>
      </main>
    </div>
  )
}
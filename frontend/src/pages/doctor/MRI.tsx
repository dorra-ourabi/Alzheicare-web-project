import DoctorSidebar from '../../components/doctor/Sidebar'
import MRIClassifier from '../../components/doctor/MRIClassifier'

export default function DoctorMRI() {
  return (
    <div className="flex min-h-screen bg-[#f4f7fb]">
      <DoctorSidebar />

      <main className="flex-1 p-6 overflow-y-auto">
        <div className="mb-5">
          <h1 className="text-xl font-bold text-gray-900">MRI Classifier</h1>
          <p className="text-xs text-gray-400">
            Upload a brain scan to detect Alzheimer's stage using AI
          </p>
        </div>

        <MRIClassifier />
      </main>
    </div>
  )
}
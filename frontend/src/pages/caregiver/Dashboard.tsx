import { useState } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import Sidebar from "../../components/caregiver/Sidebar";
import PatientOverview from "../../components/caregiver/PatientOverview";
import BehavioralChart from "../../components/caregiver/BehavioralChart";
import WeightChart from "../../components/caregiver/WeightChart";
import MoodTracker from "../../components/caregiver/MoodTracker";
import SleepTracker from "../../components/caregiver/SleepTracker";
import DailyLogModal from "../../components/caregiver/DailyLogModal";

export default function CaregiverDashboard() {
  const [showModal, setShowModal] = useState(false);
  const { token } = useAuth();

  const handleSubscribe = async () => {
    try {
      if (!token) {
        window.alert("Please sign in to continue.");
        return;
      }

      const res = await axios.post(
        "http://localhost:3000/webhooks/stripe/create-checkout-session",
        {
          userId: 1,
          email: "test@example.com",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const url = res.data?.url;
      if (!url) {
        throw new Error("Checkout URL missing from response");
      }

      window.location.href = url;
    } catch (err) {
      console.error(err);
      window.alert("Unable to start checkout. Please try again.");
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f4f7fb]">
      <Sidebar />

      <main className="flex-1 p-6 overflow-y-auto">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Patient Dashboard
            </h1>
            <p className="text-xs text-gray-400">
              Last updated: Wednesday, April 15, 2026 at 09:42 AM
            </p>
          </div>
          <button
            onClick={handleSubscribe}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-[#1a6fb5] hover:bg-[#155d95] transition"
          >
            Subscribe to Premium
          </button>
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
  );
}

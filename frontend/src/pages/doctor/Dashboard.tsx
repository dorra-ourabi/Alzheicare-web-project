import axios from "axios";
import DoctorSidebar from "../../components/doctor/Sidebar";
import StatsBar from "../../components/doctor/StatsBar";
import PatientInbox from "../../components/doctor/PatientInbox";
import MRIClassifier from "../../components/doctor/MRIClassifier";
import { useAuth } from "../../context/AuthContext";

export default function DoctorDashboard() {
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
      <DoctorSidebar />

      <main className="flex-1 p-6 overflow-y-auto">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Doctor Dashboard
            </h1>
            <p className="text-xs text-gray-400">
              Welcome back, Dr. A. Moreau — Sunday, April 26, 2026
            </p>
          </div>
          <button
            onClick={handleSubscribe}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-[#1a6fb5] hover:bg-[#155d95] transition"
          >
            Subscribe to Premium
          </button>
        </div>

        <StatsBar />
        <PatientInbox />

        <div className="mt-6">
          <MRIClassifier />
        </div>
      </main>
    </div>
  );
}

import { useNavigate } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleGoToDashboard = () => {
    const target =
      user?.role === "doctor" ? "/doctor/dashboard" : "/caregiver/dashboard";
    navigate(target);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f4f7fb] px-6">
      <div className="w-full max-w-lg rounded-3xl bg-white border border-gray-100 p-8 text-center shadow-xl">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 border border-emerald-100">
          <CheckCircle2 size={30} className="text-emerald-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Paiement valide
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          Merci, votre abonnement Premium est actif.
        </p>
        <button
          onClick={handleGoToDashboard}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#1a6fb5] hover:bg-[#155d95] transition"
        >
          Aller au Dashboard
        </button>
      </div>
    </div>
  );
}

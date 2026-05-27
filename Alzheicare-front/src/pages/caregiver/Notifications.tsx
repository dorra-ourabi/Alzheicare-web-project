import { useState } from "react";
import Sidebar from "../../components/caregiver/Sidebar";
import NotificationItem from "../../components/shared/NotificationItem";
import {
  Pill,
  Calendar,
  UserCheck,
  MapPin,
  Bell,
} from "lucide-react";

interface Notification {
  id: number;
  type: "medication" | "appointment" | "doctor";
  title: string;
  description: string;
  time: string;
  read: boolean;
}

interface Props {
  onSimulate: () => void;
}

const initialNotifications: Notification[] = [
  {
    id: 1,
    type: "medication",
    title: "Medication Reminder",
    description: "Time to administer Lisinopril 10mg to Margaret.",
    time: "08:00",
    read: false,
  },
  {
    id: 2,
    type: "appointment",
    title: "Appointment Tomorrow",
    description: "Dr. Moreau — Check-up scheduled for April 16 at 10:30 AM.",
    time: "Yesterday",
    read: false,
  },
  {
    id: 3,
    type: "doctor",
    title: "Connection Request Accepted",
    description:
      "Dr. A. Moreau accepted your follow request. You can now chat.",
    time: "Apr 14",
    read: true,
  },
  {
    id: 4,
    type: "medication",
    title: "Medication Reminder",
    description: "Time to administer Metformin 500mg to Margaret.",
    time: "Apr 14",
    read: true,
  },
  {
    id: 5,
    type: "appointment",
    title: "Appointment Completed",
    description: "Neurologist visit on April 10 has been marked as completed.",
    time: "Apr 10",
    read: true,
  },
];

const typeConfig = {
  medication: { icon: Pill, iconBg: "bg-blue-100", iconColor: "text-blue-500" },
  appointment: {
    icon: Calendar,
    iconBg: "bg-violet-100",
    iconColor: "text-violet-500",
  },
  doctor: {
    icon: UserCheck,
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-500",
  },
};

type Filter = "all" | "unread" | Notification["type"];

export default function CaregiverNotifications({ onSimulate }: Props) {
  const [notifications, setNotifications] =
    useState<Notification[]>(initialNotifications);
  const [filter, setFilter] = useState<Filter>("all");

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markRead = (id: number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  };

  const deleteNotif = (id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const filtered = notifications.filter((n) => {
    if (filter === "all") return true;
    if (filter === "unread") return !n.read;
    return n.type === filter;
  });

  const filters: { key: Filter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "unread", label: `Unread (${unreadCount})` },
    { key: "medication", label: "Medications" },
    { key: "appointment", label: "Appointments" },
    { key: "doctor", label: "Doctors" },
  ];

  return (
    <div className="flex min-h-screen bg-[#f4f7fb]">
      <Sidebar />

      <main className="flex-1 p-6 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Notifications</h1>
            <p className="text-xs text-gray-400">
              {unreadCount > 0
                ? `${unreadCount} unread notifications`
                : "All caught up!"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Simulate geofence alert button for demo */}
            <button
              onClick={onSimulate}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium text-red-500 bg-red-50 border border-red-100 hover:bg-red-100 transition"
            >
              <MapPin size={13} />
              Simulate Alert
            </button>

            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-sm text-[#1a6fb5] font-medium hover:underline"
              >
                Mark all as read
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-5">
          {filters.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                filter === key
                  ? "bg-[#1a6fb5] text-white shadow-md shadow-[#1a6fb5]/20"
                  : "bg-white text-gray-500 border border-gray-200 hover:border-[#1a6fb5]/40"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Notifications List */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
              <Bell size={28} className="text-gray-300" />
            </div>
            <p className="text-sm text-gray-400">No notifications here</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((notif) => {
              const { icon, iconBg, iconColor } = typeConfig[notif.type];
              return (
                <NotificationItem
                  key={notif.id}
                  icon={icon}
                  iconBg={iconBg}
                  iconColor={iconColor}
                  title={notif.title}
                  description={notif.description}
                  time={notif.time}
                  read={notif.read}
                  onRead={() => markRead(notif.id)}
                  onDelete={() => deleteNotif(notif.id)}
                />
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

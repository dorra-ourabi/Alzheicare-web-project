import { useEffect, useMemo, useState } from "react";
import Sidebar from "../../components/caregiver/Sidebar";
import NotificationItem from "../../components/shared/NotificationItem";
import {
  Pill,
  Calendar,
  UserCheck,
  MapPin,
  Bell,
  MessageSquare,
  UserPlus,
  UserX,
  Info,
} from "lucide-react";
import { useAuth } from "../../context/useAuth";
import { apiRequestWithAuth } from "../../lib/api";
import {
  deleteNotification,
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  openNotificationsStream,
  type NotificationDto,
  type NotificationStreamMessage,
  type NotificationType,
} from "../../api/notifications";

interface Props {
  onSimulate: () => void;
}

type Filter = "all" | "unread" | NotificationType;

const typeConfig: Record<
  NotificationType,
  { icon: any; iconBg: string; iconColor: string; label: string }
> = {
  NEW_MESSAGE: {
    icon: MessageSquare,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-500",
    label: "Messages",
  },
  INVITATION_RECEIVED: {
    icon: UserPlus,
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-500",
    label: "Invites",
  },
  INVITATION_ACCEPTED: {
    icon: UserCheck,
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-500",
    label: "Invites",
  },
  INVITATION_REJECTED: {
    icon: UserX,
    iconBg: "bg-rose-100",
    iconColor: "text-rose-500",
    label: "Invites",
  },
  CALENDAR_REMINDER: {
    icon: Calendar,
    iconBg: "bg-violet-100",
    iconColor: "text-violet-500",
    label: "Calendar",
  },
  MEDICATION_DUE: {
    icon: Pill,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-500",
    label: "Medication",
  },
  SYSTEM: {
    icon: Info,
    iconBg: "bg-slate-100",
    iconColor: "text-slate-500",
    label: "System",
  },
};

const formatTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString();
};

export default function CaregiverNotifications({ onSimulate }: Props) {
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const { accessToken: token } = useAuth();

  const handleConnectTelegram = async () => {
    try {
      if (!token) {
        window.alert("Please sign in to continue.");
        return;
      }

      const data = await apiRequestWithAuth<{ url: string }>(
        "/telegram/link",
        { method: "GET" },
        token,
      );
      const url = data?.url;
      if (!url) {
        throw new Error("Telegram URL missing from response");
      }

      window.open(url, "_blank");
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!token) return;
    fetchNotifications(token)
      .then((items) => setNotifications(items))
      .catch(() => {});
  }, [token]);

  useEffect(() => {
    if (!token) return;
    let isActive = true;
    let source: EventSource | null = null;
    let retryTimeout: number | undefined;

    const connect = () => {
      if (!isActive) return;
      source = openNotificationsStream(token);

      source.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data) as
            | NotificationStreamMessage
            | NotificationDto;
          const notif =
            (payload as NotificationStreamMessage).type === "notification:new"
              ? (payload as NotificationStreamMessage).notification
              : (payload as NotificationDto);
          if (notif && typeof notif.id === "number") {
            setNotifications((prev) => {
              if (prev.some((item) => item.id === notif.id)) {
                return prev;
              }
              return [notif, ...prev];
            });
          }
        } catch {
          // Ignore malformed SSE payloads.
        }
      };

      source.onerror = () => {
        source?.close();
        source = null;
        if (isActive) {
          retryTimeout = window.setTimeout(connect, 3000);
        }
      };
    };

    connect();

    return () => {
      isActive = false;
      if (retryTimeout) window.clearTimeout(retryTimeout);
      source?.close();
    };
  }, [token]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications],
  );

  const markRead = async (id: number) => {
    if (!token) return;
    try {
      await markNotificationRead(id, token);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
      window.dispatchEvent(new Event("notifications:refresh"));
    } catch {
      // Ignore errors for now.
    }
  };

  const deleteNotif = async (id: number) => {
    if (!token) return;
    try {
      await deleteNotification(id, token);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      window.dispatchEvent(new Event("notifications:refresh"));
    } catch {
      // Ignore errors for now.
    }
  };

  const markAllRead = async () => {
    if (!token) return;
    try {
      await markAllNotificationsRead(token);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      window.dispatchEvent(new Event("notifications:refresh"));
    } catch {
      // Ignore errors for now.
    }
  };

  const filtered = notifications.filter((n) => {
    if (filter === "all") return true;
    if (filter === "unread") return !n.isRead;
    return n.type === filter;
  });

  const filters: { key: Filter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "unread", label: `Unread (${unreadCount})` },
    { key: "NEW_MESSAGE", label: "Messages" },
    { key: "INVITATION_RECEIVED", label: "Invites" },
    { key: "CALENDAR_REMINDER", label: "Calendar" },
    { key: "MEDICATION_DUE", label: "Medication" },
    { key: "SYSTEM", label: "System" },
  ];

  return (
    <div className="flex min-h-screen bg-[#f4f7fb]">
      <Sidebar />

      <main className="flex-1 p-6 overflow-y-auto">
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
            <button
              onClick={onSimulate}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium text-red-500 bg-red-50 border border-red-100 hover:bg-red-100 transition"
            >
              <MapPin size={13} />
              Simulate Alert
            </button>

            <button
              onClick={handleConnectTelegram}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium text-[#1a6fb5] bg-white border border-gray-200 hover:border-[#1a6fb5]/40 hover:text-[#1a6fb5] transition"
            >
              Connect Telegram
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
              const config = typeConfig[notif.type];
              return (
                <NotificationItem
                  key={notif.id}
                  icon={config.icon}
                  iconBg={config.iconBg}
                  iconColor={config.iconColor}
                  title={notif.title}
                  description={notif.body ?? ""}
                  time={formatTime(notif.createdAt)}
                  read={notif.isRead}
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

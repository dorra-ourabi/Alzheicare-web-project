import { useState, useEffect, useRef } from "react";
import Sidebar from "../../components/caregiver/Sidebar";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  MapPin,
  Navigation,
  Shield,
  AlertTriangle,
  RefreshCw,
  Home,
  Search,
} from "lucide-react";
import { useAuth } from "../../context/useAuth";
import { fetchMe, updateMyLocation } from "../../api/users";
import { sendGeofenceAlert } from "../../api/notifications";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

type ZoneStatus = "safe" | "danger";

interface PatientLocation {
  lat: number;
  lng: number;
  address: string;
  updatedAt: string;
}

const statusConfig: Record<
  ZoneStatus,
  {
    label: string;
    color: string;
    bg: string;
    border: string;
    icon: typeof Shield;
  }
> = {
  safe: {
    label: "Inside Safe Zone",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    icon: Shield,
  },
  danger: {
    label: "Outside Safe Zone",
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-200",
    icon: AlertTriangle,
  },
};

const SAFE_RADIUS_METERS = 300;

interface Props {
  onDanger: () => void;
  onSafe: () => void;
}

export default function CaregiverLiveMap({ onDanger, onSafe }: Props) {
  const { accessToken: token } = useAuth();
  const [status, setStatus] = useState<ZoneStatus>("safe");
  const [homePosition, setHomePosition] = useState<{ lat: number; lng: number } | null>(null);
  const [homeAddress, setHomeAddress] = useState("");
  const [homeAddressInput, setHomeAddressInput] = useState("");
  const [addressError, setAddressError] = useState<string | null>(null);
  const [addressLoading, setAddressLoading] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  const [location, setLocation] = useState<PatientLocation>({
    lat: 0,
    lng: 0,
    address: "Detecting location...",
    updatedAt: new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  });
  const [refreshing, setRefreshing] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const mapRef = useRef<L.Map | null>(null);
  const patientMarkerRef = useRef<L.Marker | null>(null);
  const homeMarkerRef = useRef<L.Marker | null>(null);
  const circleRef = useRef<L.Circle | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const alertSentRef = useRef(false);

  const makePatientIcon = (safe: boolean) =>
    L.divIcon({
      html: `<div style="background:${safe ? "#10b981" : "#ef4444"};width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.3);">
               <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="white" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg>
             </div>`,
      className: "",
      iconAnchor: [14, 28],
    });

  const makeHomeIcon = () =>
    L.divIcon({
      html: `<div style="background:#1a6fb5;width:32px;height:32px;border-radius:10px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.3);">
               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="white" viewBox="0 0 24 24"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/></svg>
             </div>`,
      className: "",
      iconAnchor: [16, 16],
    });

  const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number } | null> => {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`,
      { headers: { "Accept-Language": "en" } }
    );
    const data = await res.json();
    if (!data || data.length === 0) return null;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  };

  const persistHomeAddress = async (address: string) => {
    await updateMyLocation({ address }, token);
  };

  const persistCurrentPosition = async (latitude: number, longitude: number, address: string) => {
    const updatedAt = new Date().toISOString();

    setLocation({
      lat: latitude,
      lng: longitude,
      address,
      updatedAt: new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    });
    setLocationError(null);

    await updateMyLocation(
      {
        currentPosition: {
          lat: latitude,
          lng: longitude,
          address,
          updatedAt,
        },
      },
      token,
    );
  };

  const handleAddressSubmit = async () => {
    if (!homeAddressInput.trim()) return;
    setAddressLoading(true);
    setAddressError(null);

    try {
      const coords = await geocodeAddress(homeAddressInput);
      if (!coords) {
        setAddressError("Address not found. Please try a more specific address.");
        return;
      }

      const normalizedAddress = homeAddressInput.trim();
      setHomePosition(coords);
      setHomeAddress(normalizedAddress);
      setHomeAddressInput(normalizedAddress);
      await persistHomeAddress(normalizedAddress);
    } catch {
      setAddressError("Could not save the home address. Please try again.");
    } finally {
      setAddressLoading(false);
    }
  };

  const detectBrowserLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        void persistCurrentPosition(latitude, longitude, "Current Location").catch(() => {
          setLocationError("Could not save the current position.");
        });
      },
      () => setLocationError("Could not detect location. Please allow location access."),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    const loadSavedHomeAddress = async () => {
      try {
        const me = await fetchMe(token);
        const savedAddress = me.patient?.address;
        if (!savedAddress || cancelled) {
          return;
        }

        setHomeAddress(savedAddress);
        setHomeAddressInput(savedAddress);

        const coords = await geocodeAddress(savedAddress);
        if (coords && !cancelled) {
          setHomePosition(coords);
        }
      } catch {
        return;
      }
    };

    void loadSavedHomeAddress();

    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    detectBrowserLocation();
  }, []);

  // Check safe zone
  useEffect(() => {
    if (!homePosition || location.lat === 0) return;

    const toRad = (val: number) => (val * Math.PI) / 180;
    const R = 6371000;
    const dLat = toRad(location.lat - homePosition.lat);
    const dLng = toRad(location.lng - homePosition.lng);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(homePosition.lat)) *
        Math.cos(toRad(location.lat)) *
        Math.sin(dLng / 2) ** 2;
    const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const newStatus: ZoneStatus = distance <= SAFE_RADIUS_METERS ? "safe" : "danger";
    setStatus(newStatus);
    if (newStatus === "danger") {
      onDanger();
      if (!alertSentRef.current && token) {
        alertSentRef.current = true;
        void sendGeofenceAlert(
          {
            lat: location.lat,
            lng: location.lng,
            address: location.address,
            homeAddress,
            updatedAt: new Date().toISOString(),
          },
          token,
        ).catch(() => {});
      }
    } else {
      alertSentRef.current = false;
      onSafe();
    }
  }, [location, homePosition, homeAddress, token, onDanger, onSafe]);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current || !homePosition) return;

    const center: [number, number] =
      location.lat !== 0
        ? [location.lat, location.lng]
        : [homePosition.lat, homePosition.lng];

    const map = L.map(mapContainerRef.current).setView(center, 15);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© <a href="https://www.openstreetmap.org/">OpenStreetMap</a>',
    }).addTo(map);

    homeMarkerRef.current = L.marker(
      [homePosition.lat, homePosition.lng],
      { icon: makeHomeIcon() }
    )
      .addTo(map)
      .bindPopup(`🏠 ${homeAddress}`);

    circleRef.current = L.circle([homePosition.lat, homePosition.lng], {
      radius: SAFE_RADIUS_METERS,
      color: "#1a6fb5",
      fillColor: "#1a6fb5",
      fillOpacity: 0.08,
      dashArray: "6 6",
      weight: 2,
    }).addTo(map);

    patientMarkerRef.current = L.marker(
      location.lat !== 0
        ? [location.lat, location.lng]
        : [homePosition.lat, homePosition.lng],
      { icon: makePatientIcon(status === "safe") }
    )
      .addTo(map)
      .bindPopup("👤 Patient");

    mapRef.current = map;
    setMapReady(true);

    return () => {
      map.remove();
      mapRef.current = null;
      setMapReady(false);
    };
  }, [homePosition]);

  // Update home marker
  useEffect(() => {
    if (!mapRef.current || !homePosition || !mapReady) return;
    homeMarkerRef.current?.setLatLng([homePosition.lat, homePosition.lng]);
    circleRef.current?.setLatLng([homePosition.lat, homePosition.lng]);
  }, [homePosition, mapReady]);

  // Update patient marker and follow
  useEffect(() => {
    if (!patientMarkerRef.current || !mapRef.current || location.lat === 0) return;
    patientMarkerRef.current.setLatLng([location.lat, location.lng]);
    patientMarkerRef.current.setIcon(makePatientIcon(status === "safe"));
    mapRef.current.panTo([location.lat, location.lng]);
  }, [location, status]);

  const refresh = () => {
    setRefreshing(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        void persistCurrentPosition(latitude, longitude, "Current Location")
          .catch(() => {
            setLocationError("Could not save the current position.");
          })
          .finally(() => {
            setRefreshing(false);
          });
      },
      () => {
        setRefreshing(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const openInGoogleMaps = (lat: number, lng: number) => {
    window.open(
      `https://www.google.com/maps?q=${lat},${lng}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const { label, color, bg, border, icon: StatusIcon } = statusConfig[status];

  return (
    <div className="flex min-h-screen bg-[#f4f7fb]">
      <Sidebar />
      <main className="flex-1 p-6 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Live Map</h1>
            <p className="text-xs text-gray-400">Real-time GPS tracking</p>
          </div>
          <button
            onClick={refresh}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white transition ${
              refreshing ? "opacity-70" : ""
            }`}
            style={{ background: "linear-gradient(135deg, #1a6fb5, #6366f1)" }}
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {/* Home Address Input */}
        {!homePosition && (
          <div className="mb-5 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Home size={16} className="text-[#1a6fb5]" />
              Enter the patient's home address
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={homeAddressInput}
                onChange={(e) => setHomeAddressInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddressSubmit()}
                placeholder="e.g. Avenue Bourguiba, Tunis, Tunisia"
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 outline-none focus:border-[#1a6fb5] transition"
              />
              <button
                onClick={handleAddressSubmit}
                disabled={addressLoading}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white transition disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, #1a6fb5, #6366f1)" }}
              >
                <Search size={14} />
                {addressLoading ? "Searching..." : "Set Home"}
              </button>
            </div>
            {addressError && (
              <p className="text-xs text-red-500 mt-2">{addressError}</p>
            )}
          </div>
        )}

        {/* Change address */}
        {homePosition && (
          <div className="mb-4 flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-gray-500 bg-white px-3 py-2 rounded-xl border border-gray-100 shadow-sm">
              <Home size={13} className="text-[#1a6fb5]" />
              <span className="font-medium text-gray-700">{homeAddress}</span>
            </div>
            <button
              onClick={() => {
                setHomePosition(null);
                setHomeAddressInput("");
                mapRef.current?.remove();
                mapRef.current = null;
              }}
              className="text-xs text-[#1a6fb5] underline"
            >
              Change
            </button>
          </div>
        )}

        {locationError && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
            {locationError}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Map */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs text-gray-500 font-medium">
                    Live · Updated {location.updatedAt}
                  </span>
                </div>
              </div>

              {!homePosition ? (
                <div
                  className="flex items-center justify-center bg-gray-50"
                  style={{ height: "420px" }}
                >
                  <div className="text-center">
                    <MapPin size={32} className="text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">
                      Enter the home address above to load the map
                    </p>
                  </div>
                </div>
              ) : (
                <div
                  ref={mapContainerRef}
                  style={{ height: "420px", width: "100%", zIndex: 0 }}
                />
              )}

              <div className="flex items-center gap-5 px-4 py-3 border-t border-gray-100 bg-gray-50">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <div className="w-4 h-4 rounded-xl bg-[#1a6fb5] flex items-center justify-center">
                    <Home size={9} className="text-white" />
                  </div>
                  Home Address
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  Patient
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <div className="w-10 h-0 border border-dashed border-[#1a6fb5]/40" />
                  Safe Zone ({SAFE_RADIUS_METERS}m)
                </div>
              </div>
            </div>
          </div>

          {/* Info Panel */}
          <div className="flex flex-col gap-4">
            {/* Status Card */}
            <div className={`rounded-2xl border p-4 ${bg} ${border}`}>
              <div className="flex items-center gap-2 mb-2">
                <StatusIcon size={18} className={color} />
                <p className={`text-sm font-semibold ${color}`}>{label}</p>
              </div>
              <p className="text-xs text-gray-500">Last update: {location.updatedAt}</p>
            </div>

            {/* Current Location */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Current Location
              </p>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-[#1a6fb5]/10">
                  <MapPin size={16} className="text-[#1a6fb5]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">{location.address}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {location.lat !== 0
                      ? `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`
                      : "—"}
                  </p>
                </div>
              </div>
              {/* Open the current position in Google Maps */}
              <button
                onClick={() => {
                  if (location.lat === 0) return;
                  openInGoogleMaps(location.lat, location.lng);
                }}
                className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-white transition"
                style={{ background: "linear-gradient(135deg, #1a6fb5, #6366f1)" }}
              >
                <Navigation size={14} />
                See location
              </button>
            </div>

            {/* Home Address */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Home Address
              </p>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-emerald-100">
                  <Home size={16} className="text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {homeAddress || "Not set yet"}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {homePosition
                      ? `${homePosition.lat.toFixed(5)}, ${homePosition.lng.toFixed(5)}`
                      : "—"}
                  </p>
                </div>
              </div>
            </div>

            {/* Danger Alert */}
            {status === "danger" && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle size={16} className="text-red-500" />
                  <p className="text-sm font-semibold text-red-600">Alert Triggered</p>
                </div>
                <p className="text-xs text-red-400">
                  The patient has left the safe zone. Their current location is more than{" "}
                  {SAFE_RADIUS_METERS}m from home.
                </p>
                <button
                  onClick={() => {
                    if (location.lat === 0) return;
                    openInGoogleMaps(location.lat, location.lng);
                  }}
                  className="mt-3 inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-white"
                  style={{ background: "linear-gradient(135deg, #ef4444, #f97316)" }}
                >
                  <Navigation size={12} />
                  Open in Google Maps
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
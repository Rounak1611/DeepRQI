import { useEffect, useState, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { getRoads, getDashboardStats } from "../api/client";
import { bandForScore } from "../utils/rqiBands";
import StatsCards from "../components/StatsCards";

// Leaflet's default marker image paths break under most bundlers (Vite
// included) because it expects them relative to the CSS file, not the JS
// module graph. A colored divIcon sidesteps that entirely -- no broken
// image requests, and it doubles as the RQI-band color coding for free.
function bandIcon(color) {
  return L.divIcon({
    className: "",
    html: `<div style="
      width: 16px; height: 16px; border-radius: 50%;
      background: ${color}; border: 2px solid #17191c;
      box-shadow: 0 0 0 1px rgba(255,255,255,0.4);
    "></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

const DEFAULT_CENTER = [20.5937, 78.9629]; // India centroid, fallback only
const DEFAULT_ZOOM = 5;

export default function DashboardPage() {
  const [roads, setRoads] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [roadsData, statsData] = await Promise.all([getRoads(), getDashboardStats()]);
        if (!cancelled) {
          setRoads(roadsData);
          setStats(statsData);
        }
      } catch (err) {
        if (!cancelled) setError("Could not load dashboard data. Is the backend running?");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const mappedRoads = roads.filter((r) => r.lat != null && r.lng != null);

  const center = useMemo(() => {
    if (mappedRoads.length === 0) return DEFAULT_CENTER;
    const avgLat = mappedRoads.reduce((s, r) => s + r.lat, 0) / mappedRoads.length;
    const avgLng = mappedRoads.reduce((s, r) => s + r.lng, 0) / mappedRoads.length;
    return [avgLat, avgLng];
  }, [mappedRoads]);

  return (
    <div className="main">
      <h2 style={{ fontSize: "22px", marginBottom: "20px" }}>Dashboard</h2>

      {error && <div className="error-banner">{error}</div>}
      {loading && <p style={{ color: "var(--text-muted)" }}>Loading…</p>}

      {!loading && !error && (
        <>
          <StatsCards stats={stats} />

          <div className="panel" style={{ padding: 0, overflow: "hidden" }}>
            <MapContainer
              center={center}
              zoom={mappedRoads.length ? 12 : DEFAULT_ZOOM}
              style={{ height: "480px", width: "100%" }}
            >
              {/* OpenStreetMap tiles -- free, no API key, no billing setup. */}
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              {mappedRoads.map((road) => {
                const band = road.latestScore ? bandForScore(road.latestScore.score) : null;
                const color = band ? band.color : "#8b9096"; // grey = no score yet
                return (
                  <Marker key={road.id} position={[road.lat, road.lng]} icon={bandIcon(color)}>
                    <Popup>
                      <strong>{road.roadName}</strong>
                      <br />
                      {[road.city, road.district, road.state].filter(Boolean).join(", ") || "—"}
                      <br />
                      {road.latestScore ? (
                        <>
                          RQI: <strong>{Math.round(road.latestScore.score)}</strong> ({road.latestScore.category})
                        </>
                      ) : (
                        "No inspections yet"
                      )}
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>

          {roads.length > mappedRoads.length && (
            <p style={{ color: "var(--text-muted)", fontSize: "12px", marginTop: "10px" }}>
              {roads.length - mappedRoads.length} road(s) not shown — no GPS coordinates recorded yet.
            </p>
          )}
        </>
      )}
    </div>
  );
}

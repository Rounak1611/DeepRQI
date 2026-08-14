import { useLocation, useNavigate, Link } from "react-router-dom";
import RqiGauge from "../components/RqiGauge";
import BoundingBoxOverlay from "../components/BoundingBoxOverlay";
import DetectionList from "../components/DetectionList";

export default function ResultsPage() {
  const { state } = useLocation();
  const navigate = useNavigate();

  if (!state?.result) {
    return (
      <div className="main">
        <div className="panel" style={{ textAlign: "center" }}>
          <p style={{ color: "var(--text-muted)" }}>No inspection result to show.</p>
          <Link to="/upload" className="btn-primary" style={{ display: "inline-block", marginTop: "16px" }}>
            Start an inspection
          </Link>
        </div>
      </div>
    );
  }

  const { result, previewUrl } = state;
  const { road, image, rqi, heatmap_base64, image_width, image_height } = result;

  return (
    <div className="main">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "24px" }}>
        <div>
          <h2 style={{ fontSize: "22px" }}>{road.roadName}</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "13px", marginTop: "4px" }}>
            {[road.city, road.district, road.state].filter(Boolean).join(", ") || "No location details"}
            {image.lat && image.lng && (
              <span className="mono"> · {image.lat.toFixed(4)}, {image.lng.toFixed(4)}</span>
            )}
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          {/* This is the only route to the road's history/report from the
              upload flow -- without it there was no way to reach the
              "Download report" button on RoadDetailPage right after an
              inspection (Dashboard is ADMIN-only as of Milestone 10). */}
          <Link
            to={`/roads/${road.id}`}
            className="btn-primary"
            style={{ padding: "8px 16px", borderRadius: "3px", fontSize: "13px", textDecoration: "none" }}
          >
            View history & report
          </Link>
          <button
            onClick={() => navigate("/upload")}
            style={{
              background: "none",
              border: "1px solid var(--line)",
              color: "var(--text-muted)",
              padding: "8px 16px",
              borderRadius: "3px",
              fontSize: "13px",
            }}
          >
            New inspection
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "20px" }}>
        {/* Left: annotated photo */}
        <div className="panel">
          <h3 style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "14px" }}>
            Detected damage
          </h3>
          <BoundingBoxOverlay
            imageUrl={previewUrl}
            detections={image.detections}
            naturalWidth={image_width}
            naturalHeight={image_height}
          />
        </div>

        {/* Right: RQI gauge + breakdown */}
        <div className="panel" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <h3 style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "6px", alignSelf: "flex-start" }}>
            Road Quality Index
          </h3>
          <RqiGauge score={rqi.score} category={rqi.category} />
          <div style={{ width: "100%", marginTop: "18px", borderTop: "1px solid var(--line)", paddingTop: "16px" }}>
            <DetectionList breakdown={rqi.breakdown} />
          </div>
        </div>
      </div>

      {/* Explainability heatmap, full width below */}
      <div className="panel" style={{ marginTop: "20px" }}>
        <h3 style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "14px" }}>
          Model attention (EigenCAM)
        </h3>
        <p style={{ color: "var(--text-muted)", fontSize: "12px", marginBottom: "14px" }}>
          Highlights which regions of the image most influenced the model's predictions —
          an approximation of the model's reasoning, not proof the highlighted damage is correct.
        </p>
        <img
          src={`data:image/png;base64,${heatmap_base64}`}
          alt="EigenCAM heatmap"
          style={{ width: "100%", maxWidth: "600px", borderRadius: "3px", display: "block" }}
        />
      </div>
    </div>
  );
}

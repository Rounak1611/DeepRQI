import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams, Link } from "react-router-dom";
import { getImage } from "../api/client";
import RqiGauge from "../components/RqiGauge";
import BoundingBoxOverlay from "../components/BoundingBoxOverlay";
import DetectionList from "../components/DetectionList";
import OcclusionExplainer from "../components/OcclusionExplainer";

export default function ResultsPage() {
  const { imageId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();

  // Fast path: we just uploaded and router state still has the full
  // result -- use it directly, no network round-trip. On a refresh or a
  // direct/shared link that state is gone (Milestone 11 fix), so we fall
  // back to fetching by ID, which now works because images/heatmaps are
  // persisted to Supabase Storage instead of only existing transiently
  // in the upload response.
  const stateResult = state?.result?.image?.id === imageId ? state.result : null;
  const [result, setResult] = useState(stateResult);
  const [loading, setLoading] = useState(!stateResult);
  const [error, setError] = useState("");

  useEffect(() => {
    if (stateResult) return;
    let cancelled = false;
    (async () => {
      try {
        const image = await getImage(imageId);
        if (cancelled) return;
        setResult({ road: image.road, image, rqi: image.scores[0] });
      } catch (err) {
        if (!cancelled) setError("Couldn't load this inspection.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [imageId, stateResult]);

  if (loading) {
    return (
      <div className="main">
        <p style={{ color: "var(--text-muted)" }}>Loading…</p>
      </div>
    );
  }

  if (error || !result || !result.rqi) {
    return (
      <div className="main">
        <div className="panel" style={{ textAlign: "center" }}>
          <p style={{ color: "var(--text-muted)" }}>{error || "No inspection result to show."}</p>
          <Link to="/upload" className="btn-primary" style={{ display: "inline-block", marginTop: "16px" }}>
            Start an inspection
          </Link>
        </div>
      </div>
    );
  }

  const { road, image, rqi } = result;
  // previewUrl only exists right after an upload (a local blob URL --
  // instant, no fetch). On refresh/direct link there's no local file, so
  // fall back to the persisted Supabase URL, which by then always exists.
  const photoUrl = state?.previewUrl || image.imagePath;

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
          <Link
            to={`/compare/${image.id}`}
            style={{
              background: "none",
              border: "1px solid var(--line)",
              color: "var(--text-muted)",
              padding: "8px 16px",
              borderRadius: "3px",
              fontSize: "13px",
              textDecoration: "none",
            }}
          >
            Compare models
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
          <BoundingBoxOverlay imageUrl={photoUrl} detections={image.detections} />
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
          {rqi.explanation && (
            <div style={{ width: "100%", marginTop: "16px", borderTop: "1px solid var(--line)", paddingTop: "16px" }}>
              <h4 style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "6px" }}>Why this score</h4>
              <p style={{ fontSize: "13px", lineHeight: "1.5" }}>{rqi.explanation}</p>
            </div>
          )}
        </div>
      </div>

      {/* Explainability heatmap, full width below. Milestone 11: this is
          now always a persisted Supabase URL rather than a one-shot base64
          string, so it survives refresh/refetch the same as the photo. */}
      {image.heatmapPath && (
        <div className="panel" style={{ marginTop: "20px" }}>
          <h3 style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "14px" }}>
            Model attention (EigenCAM)
          </h3>
          <p style={{ color: "var(--text-muted)", fontSize: "12px", marginBottom: "14px" }}>
            Highlights which regions of the image most influenced the model's predictions —
            an approximation of the model's reasoning, not proof the highlighted damage is correct.
          </p>
          <img
            src={image.heatmapPath}
            alt="EigenCAM heatmap"
            style={{ width: "100%", maxWidth: "600px", borderRadius: "3px", display: "block" }}
          />
        </div>
      )}

      <OcclusionExplainer imageId={image.id} detections={image.detections} />
    </div>
  );
}

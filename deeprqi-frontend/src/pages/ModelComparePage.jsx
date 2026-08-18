import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getImage, getAvailableModels, compareModels } from "../api/client";
import RqiGauge from "../components/RqiGauge";
import DetectionList from "../components/DetectionList";

export default function ModelComparePage() {
  const { imageId } = useParams();
  const [image, setImage] = useState(null);
  const [availableModels, setAvailableModels] = useState([]);
  const [selected, setSelected] = useState([]);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comparing, setComparing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [imgData, modelData] = await Promise.all([getImage(imageId), getAvailableModels()]);
        if (cancelled) return;
        setImage(imgData);
        setAvailableModels(modelData.models || []);
        setSelected((modelData.models || []).map((m) => m.name));
      } catch (err) {
        if (!cancelled) setError("Could not load this image or the model list.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [imageId]);

  function toggleModel(name) {
    setSelected((prev) => (prev.includes(name) ? prev.filter((m) => m !== name) : [...prev, name]));
  }

  async function handleCompare() {
    if (selected.length < 2) {
      setError("Select at least two models to compare.");
      return;
    }
    setError("");
    setComparing(true);
    setResults(null);
    try {
      const data = await compareModels(imageId, selected);
      setResults(data.results);
    } catch (err) {
      setError(err.response?.data?.error || "Comparison failed.");
    } finally {
      setComparing(false);
    }
  }

  if (loading) {
    return (
      <div className="main">
        <p style={{ color: "var(--text-muted)" }}>Loading…</p>
      </div>
    );
  }

  return (
    <div className="main">
      <h2 style={{ fontSize: "22px", marginBottom: "6px" }}>Compare models</h2>
      <p style={{ color: "var(--text-muted)", marginBottom: "20px", fontSize: "14px" }}>
        Runs this same photo through multiple AI-service models and shows each one's RQI and detections
        side by side. This doesn't change the image's saved result.
      </p>

      {image && (
        <div className="panel" style={{ marginBottom: "20px" }}>
          <img
            src={image.imagePath}
            alt=""
            style={{ width: "100%", maxWidth: "400px", borderRadius: "3px", display: "block" }}
          />
          <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "10px" }}>
            {image.road?.roadName}
          </p>
        </div>
      )}

      {error && <div className="error-banner">{error}</div>}

      {availableModels.length < 2 ? (
        <div className="panel">
          <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
            Only one model is currently registered with the AI service, so there's nothing to compare yet.
            Once a second trained model is added to <span className="mono">MODEL_REGISTRY_JSON</span>, it'll
            show up here automatically.
          </p>
        </div>
      ) : (
        <div className="panel" style={{ marginBottom: "20px" }}>
          <h3 style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "10px" }}>Models to compare</h3>
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "16px" }}>
            {availableModels.map((m) => (
              <label key={m.name} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px" }}>
                <input type="checkbox" checked={selected.includes(m.name)} onChange={() => toggleModel(m.name)} />
                {m.name}
                {m.is_placeholder_model ? " (untrained)" : ""}
              </label>
            ))}
          </div>
          <button onClick={handleCompare} disabled={comparing} className="btn-primary" style={{ padding: "8px 16px", borderRadius: "3px", fontSize: "13px" }}>
            {comparing ? "Comparing…" : "Run comparison"}
          </button>
        </div>
      )}

      {results && (
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${results.length}, 1fr)`, gap: "16px" }}>
          {results.map((r) => (
            <div className="panel" key={r.model}>
              <h3 style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "10px" }}>{r.model}</h3>
              {r.error ? (
                <p style={{ color: "var(--critical, #c0392b)", fontSize: "13px" }}>{r.error}</p>
              ) : (
                <>
                  <div style={{ display: "flex", justifyContent: "center" }}>
                    <RqiGauge score={r.rqi.score} category={r.rqi.category} />
                  </div>
                  {r.heatmap_base64 && (
                    <img
                      src={`data:image/png;base64,${r.heatmap_base64}`}
                      alt={`${r.model} heatmap`}
                      style={{ width: "100%", borderRadius: "3px", marginTop: "10px", marginBottom: "10px" }}
                    />
                  )}
                  <DetectionList breakdown={r.rqi.breakdown} />
                  {r.rqi.explanation && (
                    <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "10px", lineHeight: "1.5" }}>
                      {r.rqi.explanation}
                    </p>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}

      <Link to={`/results/${imageId}`} style={{ display: "inline-block", marginTop: "20px", fontSize: "13px" }}>
        Back to result
      </Link>
    </div>
  );
}

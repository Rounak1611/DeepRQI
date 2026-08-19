import { useState } from "react";
import { getOcclusionMap } from "../api/client";

// Second, independent XAI method -- see ai-service/app/occlusion.py for the
// black-box occlusion-sensitivity algorithm. Deliberately on-demand rather
// than shown automatically: it costs several model forward passes per
// detection, unlike the EigenCAM heatmap that's already computed for free
// at upload time.
export default function OcclusionExplainer({ imageId, detections }) {
  const [openIndex, setOpenIndex] = useState(null);
  const [results, setResults] = useState({}); // index -> { overlay_base64, detection_found } | { error }
  const [loadingIndex, setLoadingIndex] = useState(null);

  if (!detections || detections.length === 0) return null;

  async function handleExplain(i, bbox) {
    setOpenIndex(i);
    if (results[i]) return; // already fetched, just re-show it
    setLoadingIndex(i);
    try {
      const data = await getOcclusionMap(imageId, bbox, 6);
      setResults((prev) => ({ ...prev, [i]: data }));
    } catch (err) {
      setResults((prev) => ({
        ...prev,
        [i]: { error: err.response?.data?.error || "Occlusion analysis failed." },
      }));
    } finally {
      setLoadingIndex(null);
    }
  }

  return (
    <div className="panel" style={{ marginTop: "20px" }}>
      <h3 style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "8px" }}>
        Independent check: occlusion sensitivity
      </h3>
      <p style={{ color: "var(--text-muted)", fontSize: "12px", marginBottom: "14px" }}>
        A second, unrelated method for explaining a single detection -- instead of reading the model's
        internal activations (like the heatmap above), this blanks out regions of the photo one at a time
        and measures how much each one matters to that specific detection. Agreement between the two is
        stronger evidence than either alone.
      </p>

      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "14px" }}>
        {detections.map((d, i) => (
          <button
            key={i}
            onClick={() => handleExplain(i, d.bbox)}
            disabled={loadingIndex === i}
            style={{
              background: openIndex === i ? "var(--accent-dim)" : "none",
              border: "1px solid var(--line)",
              color: openIndex === i ? "var(--bg-road)" : "var(--text-muted)",
              padding: "6px 12px",
              borderRadius: "3px",
              fontSize: "12px",
            }}
          >
            {loadingIndex === i ? "Computing…" : `Explain #${i + 1}: ${d.damageType?.replace(/_/g, " ")}`}
          </button>
        ))}
      </div>

      {openIndex !== null && results[openIndex] && (
        <div>
          {results[openIndex].error ? (
            <p style={{ color: "var(--critical, #c0392b)", fontSize: "13px" }}>{results[openIndex].error}</p>
          ) : !results[openIndex].detection_found ? (
            <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>
              This model no longer detects this box (may have changed since the original inspection) --
              nothing to explain.
            </p>
          ) : (
            <img
              src={`data:image/png;base64,${results[openIndex].overlay_base64}`}
              alt={`Occlusion sensitivity for detection ${openIndex + 1}`}
              style={{ width: "100%", maxWidth: "600px", borderRadius: "3px", display: "block" }}
            />
          )}
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getPendingImages, retryImage } from "../api/client";

export default function PendingPage() {
  const [pending, setPending] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [retryingId, setRetryingId] = useState(null);
  const [retryErrors, setRetryErrors] = useState({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getPendingImages();
        if (!cancelled) {
          setPending(data.pending);
          setNextCursor(data.nextCursor);
        }
      } catch (err) {
        if (!cancelled) setError("Could not load pending images.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleLoadMore() {
    setLoadingMore(true);
    try {
      const data = await getPendingImages(nextCursor);
      setPending((prev) => [...prev, ...data.pending]);
      setNextCursor(data.nextCursor);
    } catch (err) {
      setError("Could not load more pending images.");
    } finally {
      setLoadingMore(false);
    }
  }

  async function handleRetry(id) {
    setRetryingId(id);
    setRetryErrors((prev) => ({ ...prev, [id]: "" }));
    try {
      await retryImage(id);
      // Success means this image now has a score -- it's no longer pending.
      setPending((prev) => prev.filter((img) => img.id !== id));
    } catch (err) {
      const message = err.response?.data?.error || "Retry failed. Try again later.";
      setRetryErrors((prev) => ({ ...prev, [id]: message }));
    } finally {
      setRetryingId(null);
    }
  }

  return (
    <div className="main">
      <h2 style={{ fontSize: "22px", marginBottom: "8px" }}>Pending analysis</h2>
      <p style={{ color: "var(--text-muted)", fontSize: "13px", marginBottom: "20px" }}>
        Photos uploaded while the AI service was unreachable. The original photo is
        already saved -- retry once the AI service is back up to get an RQI score.
      </p>

      {error && <div className="error-banner">{error}</div>}
      {loading && <p style={{ color: "var(--text-muted)" }}>Loading…</p>}

      {!loading && !error && (
        pending.length === 0 ? (
          <div className="panel" style={{ textAlign: "center" }}>
            <p style={{ color: "var(--text-muted)" }}>Nothing pending — every upload has a result.</p>
          </div>
        ) : (
          <div className="panel">
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--line)", textAlign: "left" }}>
                  <th style={{ padding: "8px 6px", color: "var(--text-muted)", fontWeight: 500 }}>Photo</th>
                  <th style={{ padding: "8px 6px", color: "var(--text-muted)", fontWeight: 500 }}>Road</th>
                  <th style={{ padding: "8px 6px", color: "var(--text-muted)", fontWeight: 500 }}>Uploaded</th>
                  <th style={{ padding: "8px 6px", color: "var(--text-muted)", fontWeight: 500, textAlign: "right" }}>
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {pending.map((img) => (
                  <tr key={img.id} style={{ borderBottom: "1px solid var(--line)" }}>
                    <td style={{ padding: "8px 6px" }}>
                      <img
                        src={img.imagePath}
                        alt=""
                        style={{ width: "56px", height: "40px", objectFit: "cover", borderRadius: "3px", display: "block" }}
                      />
                    </td>
                    <td style={{ padding: "8px 6px" }}>
                      <Link to={`/roads/${img.road.id}`}>{img.road.roadName}</Link>
                    </td>
                    <td className="mono" style={{ padding: "8px 6px" }}>
                      {new Date(img.uploadedAt).toLocaleString()}
                    </td>
                    <td style={{ padding: "8px 6px", textAlign: "right" }}>
                      {retryErrors[img.id] && (
                        <div style={{ color: "var(--critical, #c0392b)", fontSize: "12px", marginBottom: "4px" }}>
                          {retryErrors[img.id]}
                        </div>
                      )}
                      <button
                        onClick={() => handleRetry(img.id)}
                        disabled={retryingId === img.id}
                        className="btn-primary"
                        style={{ padding: "6px 14px", borderRadius: "3px", fontSize: "13px" }}
                      >
                        {retryingId === img.id ? "Retrying…" : "Retry"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {nextCursor && (
              <div style={{ textAlign: "center", marginTop: "14px" }}>
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="btn-primary"
                  style={{ padding: "6px 14px", borderRadius: "3px", fontSize: "13px" }}
                >
                  {loadingMore ? "Loading…" : "Load more"}
                </button>
              </div>
            )}
          </div>
        )
      )}
    </div>
  );
}

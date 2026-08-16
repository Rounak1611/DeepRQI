import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { uploadImage } from "../api/client";

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [roadName, setRoadName] = useState("");
  const [city, setCity] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const handleFile = (f) => {
    if (!f || !f.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    setError("");
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      setLat(pos.coords.latitude.toFixed(6));
      setLng(pos.coords.longitude.toFixed(6));
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("Choose a road photo first.");
      return;
    }
    if (!roadName.trim()) {
      setError("Road name is required.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const result = await uploadImage(file, { roadName, city, lat, lng });
      navigate(`/results/${result.image.id}`, { state: { result, previewUrl } });
    } catch (err) {
      setError(err.response?.data?.error || "Upload failed. Check the AI service is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="main">
      <h2 style={{ fontSize: "22px", marginBottom: "6px" }}>New Inspection</h2>
      <p style={{ color: "var(--text-muted)", marginBottom: "28px", fontSize: "14px" }}>
        Upload a road photo to detect damage and generate a Road Quality Index.
      </p>

      <div className="panel">
        {error && <div className="error-banner">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${dragActive ? "var(--accent)" : "var(--line)"}`,
              borderRadius: "3px",
              padding: previewUrl ? "0" : "48px 20px",
              textAlign: "center",
              cursor: "pointer",
              marginBottom: "20px",
              background: dragActive ? "rgba(242, 193, 78, 0.05)" : "transparent",
              overflow: "hidden",
              transition: "border-color 0.15s ease",
            }}
          >
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Preview"
                style={{ width: "100%", maxHeight: "360px", objectFit: "cover", display: "block" }}
              />
            ) : (
              <>
                <div style={{ fontSize: "14px", color: "var(--text-muted)" }}>
                  Drop a road photo here, or click to browse
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "6px" }}>
                  JPG or PNG
                </div>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleFile(e.target.files[0])}
              style={{ display: "none" }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
            <div className="field">
              <label htmlFor="roadName">Road name</label>
              <input
                id="roadName"
                value={roadName}
                onChange={(e) => setRoadName(e.target.value)}
                placeholder="e.g. MG Road"
                required
              />
            </div>
            <div className="field">
              <label htmlFor="city">City / area</label>
              <input
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Vellore"
              />
            </div>
            <div className="field">
              <label htmlFor="lat">Latitude</label>
              <input id="lat" value={lat} onChange={(e) => setLat(e.target.value)} placeholder="12.9165" />
            </div>
            <div className="field">
              <label htmlFor="lng">Longitude</label>
              <input id="lng" value={lng} onChange={(e) => setLng(e.target.value)} placeholder="79.1325" />
            </div>
          </div>

          <button
            type="button"
            onClick={useMyLocation}
            style={{
              background: "none",
              border: "none",
              color: "var(--accent)",
              fontSize: "13px",
              padding: 0,
              marginBottom: "20px",
              cursor: "pointer",
            }}
          >
            Use my current location
          </button>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Analyzing…" : "Run inspection"}
          </button>
        </form>
      </div>
    </div>
  );
}

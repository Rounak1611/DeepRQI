import { useRef, useState, useEffect } from "react";

const SEVERITY_COLOR = {
  low: "var(--fair)",
  medium: "var(--poor)",
  high: "var(--very-poor)",
  critical: "var(--critical)",
};

export default function BoundingBoxOverlay({ imageUrl, detections, naturalWidth, naturalHeight }) {
  const imgRef = useRef(null);
  const [displaySize, setDisplaySize] = useState({ width: 0, height: 0 });

  const measure = () => {
    if (imgRef.current) {
      setDisplaySize({
        width: imgRef.current.clientWidth,
        height: imgRef.current.clientHeight,
      });
    }
  };

  useEffect(() => {
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const scaleX = naturalWidth ? displaySize.width / naturalWidth : 1;
  const scaleY = naturalHeight ? displaySize.height / naturalHeight : 1;

  return (
    <div style={{ position: "relative", display: "inline-block", width: "100%" }}>
      <img
        ref={imgRef}
        src={imageUrl}
        alt="Uploaded road"
        onLoad={measure}
        style={{ width: "100%", display: "block", borderRadius: "3px" }}
      />
      {detections.map((d, i) => {
        const [xmin, ymin, xmax, ymax] = d.bbox;
        const color = SEVERITY_COLOR[d.severity] || "var(--accent)";
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: xmin * scaleX,
              top: ymin * scaleY,
              width: (xmax - xmin) * scaleX,
              height: (ymax - ymin) * scaleY,
              border: `2px solid ${color}`,
              boxShadow: `0 0 0 1px rgba(0,0,0,0.4)`,
            }}
          >
            <span
              className="mono"
              style={{
                position: "absolute",
                top: "-20px",
                left: "-2px",
                background: color,
                color: "#1a1a1a",
                fontSize: "11px",
                padding: "1px 5px",
                borderRadius: "2px",
                whiteSpace: "nowrap",
              }}
            >
              {d.damage_type.replace(/_/g, " ")} · {(d.confidence * 100).toFixed(0)}%
            </span>
          </div>
        );
      })}
    </div>
  );
}

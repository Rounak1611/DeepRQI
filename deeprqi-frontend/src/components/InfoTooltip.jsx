import { useState } from "react";

// Small hover/focus-triggered info tooltip. Keyboard-accessible (the icon
// is a real focusable button, shown on focus as well as hover) and never
// "sticks open" over content -- it closes on mouseleave/blur rather than
// needing a second click to dismiss.
export default function InfoTooltip({ text, placement = "top" }) {
  const [visible, setVisible] = useState(false);

  const positionStyle =
    placement === "bottom"
      ? { top: "calc(100% + 6px)" }
      : { bottom: "calc(100% + 6px)" };

  return (
    <span
      style={{ position: "relative", display: "inline-flex", verticalAlign: "middle" }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      <button
        type="button"
        aria-label="More information"
        onFocus={() => setVisible(true)}
        onBlur={() => setVisible(false)}
        style={{
          background: "none",
          border: "1px solid var(--line)",
          color: "var(--text-muted)",
          borderRadius: "50%",
          width: "15px",
          height: "15px",
          fontSize: "10px",
          lineHeight: "1",
          cursor: "help",
          padding: 0,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          marginLeft: "5px",
        }}
      >
        i
      </button>
      {visible && (
        <span
          role="tooltip"
          style={{
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
            ...positionStyle,
            background: "var(--bg-panel-raised)",
            color: "var(--text-primary)",
            border: "1px solid var(--line)",
            borderRadius: "4px",
            padding: "8px 10px",
            fontSize: "12px",
            lineHeight: "1.45",
            width: "230px",
            zIndex: 50,
            boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
            textTransform: "none",
            letterSpacing: "normal",
            fontWeight: 400,
            pointerEvents: "none",
          }}
        >
          {text}
        </span>
      )}
    </span>
  );
}

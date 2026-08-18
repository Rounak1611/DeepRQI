import { useState, useRef, useEffect } from "react";
import { sendChatMessage } from "../api/client";

const GREETING = {
  role: "bot",
  text: "Hi! Ask me how to use DeepRQI, about a specific road, or dashboard stats.",
};

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([GREETING]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, open]);

  async function handleSend(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    setMessages((prev) => [...prev, { role: "user", text }]);
    setInput("");
    setSending(true);
    try {
      const { reply } = await sendChatMessage(text);
      setMessages((prev) => [...prev, { role: "bot", text: reply }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: "bot", text: "Sorry, I couldn't process that. Try again." }]);
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      {open && (
        <div
          className="panel"
          style={{
            position: "fixed",
            bottom: "76px",
            right: "20px",
            width: "320px",
            maxWidth: "calc(100vw - 40px)",
            height: "420px",
            display: "flex",
            flexDirection: "column",
            padding: 0,
            zIndex: 1000,
            boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
          }}
        >
          <div
            style={{
              padding: "12px 14px",
              borderBottom: "1px solid var(--line)",
              fontSize: "13px",
              fontWeight: 600,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            DeepRQI Assistant
          </div>

          <div ref={listRef} style={{ flex: 1, overflowY: "auto", padding: "12px 14px", display: "flex", flexDirection: "column", gap: "10px" }}>
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                  maxWidth: "85%",
                  background: m.role === "user" ? "var(--accent-dim)" : "var(--bg-panel-raised)",
                  color: m.role === "user" ? "var(--bg-road)" : "var(--text-primary)",
                  padding: "8px 10px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  lineHeight: "1.4",
                }}
              >
                {m.text}
              </div>
            ))}
            {sending && (
              <div style={{ alignSelf: "flex-start", color: "var(--text-muted)", fontSize: "12px" }}>Thinking…</div>
            )}
          </div>

          <form onSubmit={handleSend} style={{ display: "flex", borderTop: "1px solid var(--line)", padding: "8px" }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question…"
              style={{
                flex: 1,
                background: "var(--bg-panel-raised)",
                border: "1px solid var(--line)",
                borderRadius: "4px",
                color: "var(--text-primary)",
                padding: "8px 10px",
                fontSize: "13px",
                marginRight: "6px",
              }}
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="btn-primary"
              style={{ padding: "8px 14px", borderRadius: "4px", fontSize: "13px" }}
            >
              Send
            </button>
          </form>
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close assistant" : "Open assistant"}
        className="btn-primary"
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          width: "48px",
          height: "48px",
          borderRadius: "50%",
          fontSize: "20px",
          zIndex: 1000,
          boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
        }}
      >
        {open ? "×" : "?"}
      </button>
    </>
  );
}

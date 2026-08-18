const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { handleMessage } = require("../lib/chatbot");

const router = express.Router();

// POST /api/chat -- rule-based assistant (see lib/chatbot.js). No external
// API calls, so this has zero per-message cost.
router.post("/", requireAuth, async (req, res) => {
  const { message } = req.body;
  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "message is required." });
  }
  try {
    const reply = await handleMessage(message, req.user);
    res.json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not process that message." });
  }
});

module.exports = router;

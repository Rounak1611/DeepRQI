require("dotenv").config();
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const imageRoutes = require("./routes/images");
const roadRoutes = require("./routes/roads");
const dashboardRoutes = require("./routes/dashboard");
const chatRoutes = require("./routes/chat");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/images", imageRoutes);
app.use("/api/roads", roadRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/chat", chatRoutes);

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`DeepRQI backend listening on http://localhost:${port}`);
});

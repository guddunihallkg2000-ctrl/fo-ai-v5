const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/status", (req, res) => {
  res.json({
    connected: false,
    source: "Live market data adapter not connected",
    mode: "SIGNAL ONLY"
  });
});

app.post("/api/analyze", (req, res) => {
  const d = req.body || {};

  res.json({
    success: true,
    signal: "WAIT",
    symbol: d.symbol || "NIFTY",
    message: "AI analysis engine is ready. Live market data connection is required for real signals.",
    entry: null,
    stopLoss: null,
    target: null
  });
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`F&O AI server running on port ${PORT}`);
});

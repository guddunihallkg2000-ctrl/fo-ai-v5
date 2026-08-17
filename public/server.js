const express = require("express");
const path = require("path");

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/status", (req, res) => {
  res.json({
    connected: false,
    source: "Live data adapter not connected",
    mode: "SIGNAL ONLY"
  });
});

app.post("/api/analyze", (req, res) => {
  const d = req.body || {};

  const required = [
    "spot",
    "vwap",
    "ema20",
    "ema50",
    "rsi",
    "adx",
    "pcr",
    "callOiChange",
    "putOiChange",
    "vix",
    "iv"
  ];

  const missing = required.filter(
    key => !Number.isFinite(Number(d[key]))
  );

  if (missing.length) {
    return res.status(400).json({
      error: "Missing market data",
      missing
    });
  }

  const n = key => Number(d[key]);

  let score = 0;

  // Trend
  score += n("spot") > n("vwap") ? 15 : -15;
  score += n("ema20") > n("ema50") ? 10 : -10;
  score += n("adx") >= 25 ? 10 : 0;

  // Momentum
  score += n("rsi") > 55 ? 10 : n("rsi") < 45 ? -10 : 0;

  // Option positioning
  score += n("putOiChange") > n("callOiChange") ? 15 : -15;
  score += n("pcr") > 1.05 ? 10 : n("pcr") < 0.90 ? -10 : 0;

  // Volatility
  score += n("vix") < 18 ? 5 : -5;
  score += n("iv") < 22 ? 5 : -5;

  score = Math.max(-100, Math.min(100, score));

  let action = "WAIT";

  if (score >= 65) {
    action = "BUY CE";
  } else if (score <= -65) {
    action = "BUY PE";
  }

  const confidence = Math.min(
    95,
    Math.max(50, 50 + Math.abs(score) * 0.45)
  );

  res.json({
    instrument: d.instrument || "NIFTY",
    action,
    score,
    confidence: Number(confidence.toFixed(1)),
    generatedAt: new Date().toISOString(),
    note:
      action === "WAIT"
        ? "No high-conviction setup. Stay out."
        : "Confirm live option premium, spread and liquidity before manually entering."
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`F&O AI running on port ${PORT}`);
});

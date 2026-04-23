require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const cron    = require('node-cron');

const rfqRoutes = require('./routes/rfq');
const { closeExpiredAuctions, activateStartedAuctions } = require('./services/auctionEngine');

const app  = express();
const PORT = process.env.PORT || 4000;

// ── Middleware ────────────────────────────────────────────────
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json());

// ── Request logger ────────────────────────────────────────────
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ── Routes ────────────────────────────────────────────────────
app.use('/api/rfqs', rfqRoutes);

app.get('/api/health', (_req, res) =>
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
);

// ── 404 catch ─────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

// ── Error handler ─────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('[Unhandled Error]', err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// ── Cron Jobs ─────────────────────────────────────────────────
// Run every 30 seconds: activate drafts that have started
cron.schedule('*/30 * * * * *', async () => {
  try {
    await activateStartedAuctions();
  } catch (err) {
    console.error('[Cron] activateStartedAuctions error:', err.message);
  }
});

// Run every 30 seconds: close auctions past bid_close_time
cron.schedule('*/30 * * * * *', async () => {
  try {
    await closeExpiredAuctions();
  } catch (err) {
    console.error('[Cron] closeExpiredAuctions error:', err.message);
  }
});

// ── Start ─────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`RFQ British Auction API running on :${PORT}`);
});
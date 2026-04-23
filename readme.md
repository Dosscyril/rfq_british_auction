#  British Auction — RFQ System

A full-stack RFQ (Request for Quotation) system with British Auction-style bidding. Supports automatic time extensions, forced close rules, and configurable auction behavior.

---

##  Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React, React Router, date-fns |
| Backend | Node.js, Express |
| Database | PostgreSQL |
| Scheduler | node-cron |

---

##  Features

- Create RFQs with British Auction configuration
- Suppliers submit bids openly and compete on price
- Automatic auction time extension when bidding activity happens near close time
- Forced close time — auction never extends beyond this hard deadline
- 3 configurable extension triggers:
  - Bid received in last X minutes
  - Any supplier rank change in last X minutes
  - Lowest bidder (L1) rank change in last X minutes
- Live countdown timer on active auctions
- Supplier ranking (L1, L2, L3 ...) updated on every bid
- Full activity log — bid submissions, extensions, reasons, time changes
- Auto-refresh every 15–30 seconds on listing and detail pages

---

##  Project Structure

```
rfq-system/
├── rfq-backend/
│   ├── schema.sql                    # PostgreSQL DDL
│   ├── .env.example
│   └── src/
│       ├── index.js                  # Express app + cron jobs
│       ├── models/db.js              # PostgreSQL connection pool
│       ├── routes/rfq.js             # All API routes + validation
│       └── services/
│           ├── auctionEngine.js      # Extension logic + close jobs
│           ├── bidService.js         # Bid submission + ranking
│           └── rfqService.js         # RFQ CRUD queries
│
└── rfq-frontend/
    └── src/
        ├── App.js                    # Router
        ├── services/api.js           # API fetch wrappers
        ├── hooks/useCountdown.js     # Live countdown timer
        ├── components/UI.jsx         # Shared UI components
        └── pages/
            ├── AuctionListPage.jsx   # All auctions + filters
            ├── CreateRFQPage.jsx     # RFQ creation form
            └── AuctionDetailPage.jsx # Bids, rankings, log, submit
```

---

##  Setup & Run

### Prerequisites
- Node.js 18+
- PostgreSQL 14+

### Backend

```bash
cd rfq-backend
npm install
cp .env.example .env        # fill in your DB credentials
psql -U postgres -c "CREATE DATABASE rfq_auction"
psql -U postgres -d rfq_auction -f schema.sql
npm run dev                 # runs on :4000
```

### Frontend

```bash
cd rfq-frontend
npm install
npm start                   # runs on :3000
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | /api/health | Health check |
| POST | /api/rfqs | Create RFQ with auction config |
| GET | /api/rfqs | List all RFQs (filter by ?status=) |
| GET | /api/rfqs/:id | Get RFQ detail with bids + activity log |
| POST | /api/rfqs/:id/bids | Submit a bid |

### Create RFQ — Request Body
```json
{
  "name": "Ocean Freight Q1 2026",
  "bidStartTime": "2026-04-22T10:00:00Z",
  "bidCloseTime": "2026-04-22T18:00:00Z",
  "forcedCloseTime": "2026-04-22T19:00:00Z",
  "pickupDate": "2026-05-01",
  "auctionConfig": {
    "triggerWindowMins": 10,
    "extensionDurationMins": 5,
    "extensionTrigger": "BID_RECEIVED"
  }
}
```

### Submit Bid — Request Body
```json
{
  "supplierName": "Maersk Line",
  "freightCharges": 1200.00,
  "originCharges": 150.00,
  "destinationCharges": 200.00,
  "transitTimeDays": 18,
  "quoteValidity": "2026-05-15"
}
```

---

##  Auction Extension Logic

```
After every bid submission:

1. Fetch RFQ + auction config
2. Compute window_start = bid_close_time - trigger_window_mins
3. Is bid submitted within [window_start → bid_close_time]?
   → No  : skip, no extension
   → Yes : check extension_trigger
            BID_RECEIVED      → always extend
            ANY_RANK_CHANGE   → always extend
            L1_RANK_CHANGE    → extend only if new L1 ≠ previous L1
4. new_close = MIN(bid_close_time + extension_duration_mins, forced_close_time)
5. Update bid_close_time + log the extension with reason
```

---

##  Database Schema

| Table | Purpose |
|---|---|
| rfqs | RFQ details, status, bid/forced close times |
| auction_configs | X, Y values and trigger type per RFQ |
| bids | All supplier bids with computed total + rank |
| activity_logs | Bid events, extensions, close events with reasons |

**Key constraint:** `forced_close_time > bid_close_time` enforced at both DB and API level.

---

##  Pages

- **Auction Listing** — all RFQs with live countdown, lowest bid, status filter
- **Create RFQ** — form with auction config and plain-English summary
- **Auction Detail** — ranked bid table, activity log, bid submission form with live total preview
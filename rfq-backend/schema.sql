
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- RFQs
CREATE TABLE rfqs (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reference_id     VARCHAR(50) UNIQUE NOT NULL,
  name             VARCHAR(255) NOT NULL,
  created_by       VARCHAR(100) NOT NULL DEFAULT 'admin',
  bid_start_time   TIMESTAMPTZ NOT NULL,
  bid_close_time   TIMESTAMPTZ NOT NULL,
  forced_close_time TIMESTAMPTZ NOT NULL,
  pickup_date      DATE NOT NULL,
  -- status: 'DRAFT' | 'ACTIVE' | 'CLOSED' | 'FORCE_CLOSED'
  status           VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_forced_after_close
    CHECK (forced_close_time > bid_close_time),
  CONSTRAINT chk_start_before_close
    CHECK (bid_start_time < bid_close_time),
  CONSTRAINT chk_status
    CHECK (status IN ('DRAFT','ACTIVE','CLOSED','FORCE_CLOSED'))
);
-- Auction configuration (1:1 with RFQ)
CREATE TABLE auction_configs (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rfq_id                  UUID NOT NULL REFERENCES rfqs(id) ON DELETE CASCADE,
  trigger_window_mins     INT NOT NULL DEFAULT 10,          -- X minutes
  extension_duration_mins INT NOT NULL DEFAULT 5,           -- Y minutes
  -- extension_trigger: 'BID_RECEIVED' | 'ANY_RANK_CHANGE' | 'L1_RANK_CHANGE'
  extension_trigger       VARCHAR(30) NOT NULL DEFAULT 'BID_RECEIVED',
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_trigger_window    CHECK (trigger_window_mins > 0),
  CONSTRAINT chk_extension_dur     CHECK (extension_duration_mins > 0),
  CONSTRAINT chk_extension_trigger CHECK (extension_trigger IN (
    'BID_RECEIVED','ANY_RANK_CHANGE','L1_RANK_CHANGE'
  ))
);

-- Bids
CREATE TABLE bids (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rfq_id              UUID NOT NULL REFERENCES rfqs(id) ON DELETE CASCADE,
  supplier_name       VARCHAR(255) NOT NULL,
  freight_charges     DECIMAL(12,2) NOT NULL DEFAULT 0,
  origin_charges      DECIMAL(12,2) NOT NULL DEFAULT 0,
  destination_charges DECIMAL(12,2) NOT NULL DEFAULT 0,
  transit_time_days   INT NOT NULL,
  quote_validity      DATE NOT NULL,
  total_amount        DECIMAL(12,2) GENERATED ALWAYS AS
                        (freight_charges + origin_charges + destination_charges) STORED,
  rank                INT,            -- L1, L2, L3 ... updated after each submission
  submitted_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_freight     CHECK (freight_charges >= 0),
  CONSTRAINT chk_origin      CHECK (origin_charges >= 0),
  CONSTRAINT chk_destination CHECK (destination_charges >= 0),
  CONSTRAINT chk_transit     CHECK (transit_time_days > 0)
);
-- Activity log (bid events + time extensions)
CREATE TABLE activity_logs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rfq_id          UUID NOT NULL REFERENCES rfqs(id) ON DELETE CASCADE,
  bid_id          UUID REFERENCES bids(id) ON DELETE SET NULL,
  -- event_type: 'BID_SUBMITTED' | 'TIME_EXTENDED' | 'AUCTION_CLOSED' | 'AUCTION_FORCE_CLOSED'
  event_type      VARCHAR(30) NOT NULL,
  description     TEXT,
  old_close_time  TIMESTAMPTZ,      -- populated on TIME_EXTENDED events
  new_close_time  TIMESTAMPTZ,      -- populated on TIME_EXTENDED events
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_event_type CHECK (event_type IN (
    'BID_SUBMITTED','TIME_EXTENDED','AUCTION_CLOSED','AUCTION_FORCE_CLOSED'
  ))
);
-- Indexes
CREATE INDEX idx_bids_rfq_id         ON bids(rfq_id);
CREATE INDEX idx_bids_rfq_total      ON bids(rfq_id, total_amount ASC);
CREATE INDEX idx_bids_submitted_at   ON bids(rfq_id, submitted_at DESC);
CREATE INDEX idx_activity_rfq        ON activity_logs(rfq_id, created_at DESC);
CREATE INDEX idx_rfqs_status         ON rfqs(status);
CREATE INDEX idx_rfqs_close_time     ON rfqs(bid_close_time) WHERE status = 'ACTIVE';
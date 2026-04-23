const pool = require('../models/db');
const { v4: uuidv4 } = require('uuid');

/**
 * Generate a human-readable reference ID.
 */
function generateRefId() {
  const now = new Date();
  const y   = now.getFullYear();
  const m   = String(now.getMonth() + 1).padStart(2, '0');
  const d   = String(now.getDate()).padStart(2, '0');
  const rnd = Math.floor(1000 + Math.random() * 9000);
  return `RFQ-${y}${m}${d}-${rnd}`;
}

async function createRFQ(data) {
  const {
    name,
    createdBy = 'admin',
    bidStartTime,
    bidCloseTime,
    forcedCloseTime,
    pickupDate,
    auctionConfig,
  } = data;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const rfqId = uuidv4();
    const refId = generateRefId();

    await client.query(
      `INSERT INTO rfqs
         (id, reference_id, name, created_by, bid_start_time, bid_close_time,
          forced_close_time, pickup_date, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'DRAFT')`,
      [rfqId, refId, name, createdBy, bidStartTime, bidCloseTime, forcedCloseTime, pickupDate]
    );

    await client.query(
      `INSERT INTO auction_configs
         (rfq_id, trigger_window_mins, extension_duration_mins, extension_trigger)
       VALUES ($1,$2,$3,$4)`,
      [
        rfqId,
        auctionConfig.triggerWindowMins  || 10,
        auctionConfig.extensionDurationMins || 5,
        auctionConfig.extensionTrigger   || 'BID_RECEIVED',
      ]
    );

    await client.query('COMMIT');

    return getRFQById(rfqId);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function listRFQs({ status, page = 1, limit = 20 } = {}) {
  const offset = (page - 1) * limit;
  const params = [];
  let whereClause = '';

  if (status) {
    params.push(status);
    whereClause = `WHERE r.status = $${params.length}`;
  }

  params.push(limit, offset);

  const { rows } = await pool.query(
    `SELECT
       r.id, r.reference_id, r.name, r.status,
       r.bid_close_time, r.forced_close_time,
       COALESCE(MIN(b.total_amount), NULL) AS lowest_bid,
       COUNT(b.id)::int AS bid_count
     FROM rfqs r
     LEFT JOIN bids b ON b.rfq_id = r.id
     ${whereClause}
     GROUP BY r.id
     ORDER BY r.created_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  return rows;
}

async function getRFQById(rfqId) {
  const { rows: rfqRows } = await pool.query(
    `SELECT r.*, ac.trigger_window_mins, ac.extension_duration_mins, ac.extension_trigger
     FROM rfqs r
     LEFT JOIN auction_configs ac ON ac.rfq_id = r.id
     WHERE r.id = $1`,
    [rfqId]
  );

  if (!rfqRows.length) return null;

  const rfq = rfqRows[0];

  // Bids sorted by total_amount ASC (ranking)
  const { rows: bids } = await pool.query(
    `SELECT *, ROW_NUMBER() OVER (ORDER BY total_amount ASC) AS rank
     FROM bids WHERE rfq_id = $1
     ORDER BY total_amount ASC, submitted_at ASC`,
    [rfqId]
  );

  // Activity log
  const { rows: logs } = await pool.query(
    `SELECT * FROM activity_logs WHERE rfq_id = $1 ORDER BY created_at DESC`,
    [rfqId]
  );

  return { ...rfq, bids, activityLog: logs };
}

module.exports = { createRFQ, listRFQs, getRFQById };
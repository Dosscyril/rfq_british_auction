const express  = require('express');
const { body, query, param, validationResult } = require('express-validator');
const rfqService = require('../services/rfqService');
const bidService = require('../services/bidService');

const router = express.Router();

// ── Validation middleware ─────────────────────────────────────
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

// ── POST /api/rfqs ────────────────────────────────────────────
router.post(
  '/',
  [
    body('name').notEmpty().withMessage('RFQ name is required'),
    body('bidStartTime').isISO8601().withMessage('Valid bidStartTime required'),
    body('bidCloseTime').isISO8601().withMessage('Valid bidCloseTime required'),
    body('forcedCloseTime').isISO8601().withMessage('Valid forcedCloseTime required'),
    body('pickupDate').isISO8601().withMessage('Valid pickupDate required'),
    body('auctionConfig').isObject().withMessage('auctionConfig object required'),
    body('auctionConfig.triggerWindowMins').isInt({ min: 1 }),
    body('auctionConfig.extensionDurationMins').isInt({ min: 1 }),
    body('auctionConfig.extensionTrigger').isIn(['BID_RECEIVED','ANY_RANK_CHANGE','L1_RANK_CHANGE']),
  ],
  handleValidation,
  async (req, res) => {
    try {
      // Business validation: forcedCloseTime > bidCloseTime
      const bidClose    = new Date(req.body.bidCloseTime);
      const forcedClose = new Date(req.body.forcedCloseTime);
      if (forcedClose <= bidClose) {
        return res.status(400).json({
          success: false,
          message: 'forcedCloseTime must be later than bidCloseTime',
        });
      }

      const rfq = await rfqService.createRFQ(req.body);
      res.status(201).json({ success: true, data: rfq });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

// ── GET /api/rfqs ─────────────────────────────────────────────
router.get(
  '/',
  [
    query('status').optional().isIn(['DRAFT','ACTIVE','CLOSED','FORCE_CLOSED']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  handleValidation,
  async (req, res) => {
    try {
      const rfqs = await rfqService.listRFQs({
        status: req.query.status,
        page:   parseInt(req.query.page  || '1'),
        limit:  parseInt(req.query.limit || '20'),
      });
      res.json({ success: true, data: rfqs });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

// ── GET /api/rfqs/:id ─────────────────────────────────────────
router.get(
  '/:id',
  [param('id').isUUID()],
  handleValidation,
  async (req, res) => {
    try {
      const rfq = await rfqService.getRFQById(req.params.id);
      if (!rfq) return res.status(404).json({ success: false, message: 'RFQ not found' });
      res.json({ success: true, data: rfq });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

// ── POST /api/rfqs/:id/bids ───────────────────────────────────
router.post(
  '/:id/bids',
  [
    param('id').isUUID(),
    body('supplierName').notEmpty().withMessage('Supplier name required'),
    body('freightCharges').isFloat({ min: 0 }),
    body('originCharges').isFloat({ min: 0 }),
    body('destinationCharges').isFloat({ min: 0 }),
    body('transitTimeDays').isInt({ min: 1 }),
    body('quoteValidity').isISO8601(),
  ],
  handleValidation,
  async (req, res) => {
    try {
      const result = await bidService.submitBid(req.params.id, req.body);
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      console.error(err);
      const status = err.statusCode || 500;
      res.status(status).json({ success: false, message: err.message });
    }
  }
);

module.exports = router;
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  estimateDelivery, createDelivery, getDeliveryStatus,
  trackDelivery, cancelDelivery, getDeliveryHistory
} = require('../controllers/deliveryController');

router.post('/estimate', protect, estimateDelivery);
router.post('/create', protect, createDelivery);
router.get('/history', protect, getDeliveryHistory);
router.get('/track/:id', trackDelivery); // public tracking
router.get('/:id', protect, getDeliveryStatus);
router.put('/:id/cancel', protect, cancelDelivery);

module.exports = router;

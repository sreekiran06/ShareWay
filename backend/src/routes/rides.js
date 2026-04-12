const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  estimateFare, bookRide, getRideStatus,
  cancelRide, rateRide, getRideHistory, getNearbyDrivers
} = require('../controllers/rideController');

router.post('/estimate', protect, estimateFare);
router.post('/book', protect, bookRide);
router.get('/history', protect, getRideHistory);
router.get('/nearby-drivers', protect, getNearbyDrivers);
router.get('/:id', protect, getRideStatus);
router.put('/:id/cancel', protect, cancelRide);
router.post('/:id/rate', protect, rateRide);

module.exports = router;

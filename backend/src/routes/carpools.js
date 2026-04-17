const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  postRide,
  searchRides,
  getDriverRides,
  requestRide,
  respondToRequest,
  cancelRide
} = require('../controllers/carpoolController');

// Passenger routes
router.get('/search', protect, searchRides);
router.post('/:id/request', protect, requestRide);

// Driver routes
router.post('/', protect, postRide);
router.get('/driver', protect, getDriverRides);
router.put('/:id/request/:requestId', protect, respondToRequest);
router.put('/:id/cancel', protect, cancelRide);

module.exports = router;

const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  registerDriver, getDriverProfile, updateDriverStatus,
  updateLocation, acceptRide, updateRideStatus,
  getDriverEarnings, getDriverRides
} = require('../controllers/driverController');

router.post('/register', protect, registerDriver);
router.get('/profile', protect, authorize('driver', 'admin'), getDriverProfile);
router.put('/status', protect, authorize('driver'), updateDriverStatus);
router.put('/location', protect, authorize('driver'), updateLocation);
router.post('/rides/:rideId/accept', protect, authorize('driver'), acceptRide);
router.put('/rides/:rideId/status', protect, authorize('driver'), updateRideStatus);
router.get('/earnings', protect, authorize('driver'), getDriverEarnings);
router.get('/rides', protect, authorize('driver'), getDriverRides);

module.exports = router;

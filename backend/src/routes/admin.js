const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getDashboardStats, getAllUsers, getAllDrivers,
  approveDriver, getAllRides, toggleUserStatus
} = require('../controllers/adminController');
const Delivery = require('../models/Delivery');

router.use(protect, authorize('admin'));

router.get('/dashboard', getDashboardStats);
router.get('/users', getAllUsers);
router.put('/users/:userId/toggle-status', toggleUserStatus);
router.get('/drivers', getAllDrivers);
router.put('/drivers/:driverId/status', approveDriver);
router.get('/rides', getAllRides);
router.get('/deliveries', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const deliveries = await Delivery.find()
      .populate('sender', 'name phone')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    const total = await Delivery.countDocuments();
    res.status(200).json({ success: true, deliveries, pagination: { page, limit, total } });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;

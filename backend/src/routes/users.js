const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');

router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.status(200).json({ success: true, user });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.put('/saved-addresses', protect, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.user._id, { savedAddresses: req.body.addresses }, { new: true });
    res.status(200).json({ success: true, user });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.get('/notifications', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('notifications');
    res.status(200).json({ success: true, notifications: user.notifications.reverse() });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.put('/notifications/read', protect, async (req, res) => {
  try {
    await User.updateOne({ _id: req.user._id }, { $set: { 'notifications.$[].read': true } });
    res.status(200).json({ success: true, message: 'All notifications marked as read' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;

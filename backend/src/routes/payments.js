const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');
const Payment = require('../models/Payment');

// Create Razorpay order
router.post('/razorpay/order', protect, async (req, res) => {
  try {
    const { amount, currency = 'INR', referenceType, referenceId } = req.body;
    // In production, integrate with actual Razorpay SDK
    const order = {
      id: 'order_' + uuidv4().replace(/-/g, '').substr(0, 20),
      amount: amount * 100,
      currency,
      status: 'created'
    };
    res.status(200).json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Verify Razorpay payment
router.post('/razorpay/verify', protect, async (req, res) => {
  try {
    const { orderId, paymentId, signature, referenceType, referenceId, amount } = req.body;
    // In production, verify signature with Razorpay
    const payment = await Payment.create({
      paymentId: 'PAY-' + uuidv4().substr(0, 8).toUpperCase(),
      user: req.user._id,
      reference: { type: referenceType, id: referenceId },
      amount,
      method: 'upi',
      gateway: 'razorpay',
      gatewayTransactionId: paymentId,
      gatewayOrderId: orderId,
      status: 'completed'
    });
    res.status(200).json({ success: true, payment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get payment history
router.get('/history', protect, async (req, res) => {
  try {
    const payments = await Payment.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(20);
    res.status(200).json({ success: true, payments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Wallet top-up
router.post('/wallet/topup', protect, async (req, res) => {
  try {
    const { amount } = req.body;
    const User = require('../models/User');
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $inc: { walletBalance: amount } },
      { new: true }
    );
    await Payment.create({
      paymentId: 'PAY-' + uuidv4().substr(0, 8).toUpperCase(),
      user: req.user._id,
      reference: { type: 'wallet_topup' },
      amount,
      method: 'card',
      gateway: 'stripe',
      status: 'completed'
    });
    res.status(200).json({ success: true, walletBalance: user.walletBalance });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

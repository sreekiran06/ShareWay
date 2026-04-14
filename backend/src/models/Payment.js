const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  paymentId: { type: String, unique: true, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reference: {
    type: { type: String, enum: ['ride', 'delivery', 'wallet_topup'] },
    id: mongoose.Schema.Types.ObjectId
  },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  method: { type: String, enum: ['cash', 'card', 'wallet', 'upi', 'netbanking'] },
  gateway: { type: String, enum: ['stripe', 'razorpay', 'cash'] },
  gatewayTransactionId: String,
  gatewayOrderId: String,
  status: {
    type: String,
    enum: ['initiated', 'processing', 'completed', 'failed', 'refunded'],
    default: 'initiated'
  },
  refund: {
    amount: Number,
    reason: String,
    gatewayRefundId: String,
    processedAt: Date
  },
  metadata: mongoose.Schema.Types.Mixed
}, { timestamps: true });

paymentSchema.index({ user: 1, status: 1 });


module.exports = mongoose.model('Payment', paymentSchema);

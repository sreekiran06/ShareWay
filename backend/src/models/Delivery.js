const mongoose = require('mongoose');

const deliverySchema = new mongoose.Schema({
  deliveryId: { type: String, unique: true, required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  driver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
  pickup: {
    address: { type: String, required: true },
    coordinates: { lat: Number, lng: Number },
    contactName: String,
    contactPhone: String,
    instructions: String
  },
  destination: {
    address: { type: String, required: true },
    coordinates: { lat: Number, lng: Number },
    contactName: { type: String, required: true },
    contactPhone: { type: String, required: true },
    instructions: String
  },
  package: {
    description: { type: String, required: true },
    weight: Number, // kg
    dimensions: { length: Number, width: Number, height: Number },
    category: {
      type: String,
      enum: ['documents', 'electronics', 'clothing', 'food', 'medicine', 'fragile', 'other'],
      default: 'other'
    },
    value: Number, // declared value for insurance
    isFragile: { type: Boolean, default: false },
    requiresSignature: { type: Boolean, default: false }
  },
  status: {
    type: String,
    enum: ['requested', 'searching', 'accepted', 'picked_up', 'in_transit', 'delivered', 'failed', 'cancelled'],
    default: 'requested'
  },
  fare: {
    baseFare: { type: Number, default: 0 },
    distanceFare: { type: Number, default: 0 },
    weightFare: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    currency: { type: String, default: 'INR' }
  },
  distance: { value: Number, text: String },
  duration: { value: Number, text: String },
  payment: {
    method: { type: String, enum: ['cash', 'card', 'wallet', 'upi'], default: 'cash' },
    status: { type: String, enum: ['pending', 'completed', 'failed', 'refunded'], default: 'pending' },
    paidBy: { type: String, enum: ['sender', 'receiver'], default: 'sender' },
    transactionId: String
  },
  rating: {
    bySender: { score: Number, comment: String },
    byDriver: { score: Number, comment: String }
  },
  otp: { value: String, verified: { type: Boolean, default: false } },
  timeline: {
    requestedAt: { type: Date, default: Date.now },
    acceptedAt: Date,
    pickedUpAt: Date,
    deliveredAt: Date,
    cancelledAt: Date
  },
  proofOfDelivery: {
    image: String,
    signature: String,
    receivedBy: String
  },
  trackingUpdates: [{
    status: String,
    location: { address: String, coordinates: { lat: Number, lng: Number } },
    message: String,
    timestamp: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

deliverySchema.index({ sender: 1, status: 1 });
deliverySchema.index({ driver: 1, status: 1 });


module.exports = mongoose.model('Delivery', deliverySchema);

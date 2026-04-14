const mongoose = require('mongoose');

const rideSchema = new mongoose.Schema({
  rideId: {
    type: String,
    unique: true,
    required: true
  },
  rider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver'
  },
  pickup: {
    address: { type: String, required: true },
    coordinates: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true }
    }
  },
  destination: {
    address: { type: String, required: true },
    coordinates: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true }
    }
  },
  waypoints: [{
    address: String,
    coordinates: { lat: Number, lng: Number }
  }],
  rideType: {
    type: String,
    enum: ['economy', 'standard', 'premium', 'bike', 'auto', 'xl'],
    default: 'standard'
  },
  status: {
    type: String,
    enum: ['requested', 'searching', 'accepted', 'driver_arriving', 'started', 'completed', 'cancelled'],
    default: 'requested'
  },
  fare: {
    baseFare: { type: Number, default: 0 },
    distanceFare: { type: Number, default: 0 },
    timeFare: { type: Number, default: 0 },
    surgeFare: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    currency: { type: String, default: 'INR' }
  },
  distance: {
    value: Number, // meters
    text: String  // human readable
  },
  duration: {
    value: Number, // seconds
    text: String
  },
  polyline: String,
  payment: {
    method: { type: String, enum: ['cash', 'card', 'wallet', 'upi'], default: 'cash' },
    status: { type: String, enum: ['pending', 'completed', 'failed', 'refunded'], default: 'pending' },
    transactionId: String,
    paidAt: Date
  },
  rating: {
    byRider: { score: Number, comment: String, createdAt: Date },
    byDriver: { score: Number, comment: String, createdAt: Date }
  },
  otp: {
    value: String,
    verified: { type: Boolean, default: false }
  },
  timeline: {
    requestedAt: { type: Date, default: Date.now },
    acceptedAt: Date,
    driverArrivedAt: Date,
    startedAt: Date,
    completedAt: Date,
    cancelledAt: Date
  },
  cancellation: {
    cancelledBy: { type: String, enum: ['rider', 'driver', 'system'] },
    reason: String,
    refundAmount: Number
  },
  isSharedRide: { type: Boolean, default: false },
  sharedWith: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  promoCode: String,
  notes: String
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

rideSchema.index({ rider: 1, status: 1 });
rideSchema.index({ driver: 1, status: 1 });
rideSchema.index({ status: 1, createdAt: -1 });


module.exports = mongoose.model('Ride', rideSchema);

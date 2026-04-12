const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  licenseNumber: {
    type: String,
    required: [true, 'License number is required'],
    unique: true,
    uppercase: true,
    trim: true
  },
  vehicleDetails: {
    make: { type: String, required: true, trim: true },
    model: { type: String, required: true, trim: true },
    year: { type: Number, required: true },
    color: { type: String, required: true },
    licensePlate: { type: String, required: true, uppercase: true, trim: true },
    type: {
      type: String,
      enum: ['bike', 'auto', 'car', 'suv', 'van'],
      required: true
    },
    capacity: { type: Number, default: 4 },
    insuranceExpiry: Date
  },
  documents: {
    license: { url: String, verified: { type: Boolean, default: false } },
    insurance: { url: String, verified: { type: Boolean, default: false } },
    registration: { url: String, verified: { type: Boolean, default: false } },
    aadhaar: { url: String, verified: { type: Boolean, default: false } }
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'suspended', 'rejected'],
    default: 'pending'
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  isAvailable: {
    type: Boolean,
    default: false
  },
  currentLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: [0, 0]
    },
    address: String,
    updatedAt: { type: Date, default: Date.now }
  },
  rating: {
    average: { type: Number, default: 0, min: 0, max: 5 },
    count: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
  },
  totalRides: { type: Number, default: 0 },
  totalDeliveries: { type: Number, default: 0 },
  totalEarnings: { type: Number, default: 0 },
  currentRide: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ride',
    default: null
  },
  currentDelivery: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Delivery',
    default: null
  },
  bankDetails: {
    accountHolder: String,
    accountNumber: String,
    ifscCode: String,
    bankName: String,
    upiId: String
  },
  serviceTypes: [{
    type: String,
    enum: ['ride', 'delivery', 'both']
  }],
  workingHours: {
    start: { type: String, default: '06:00' },
    end: { type: String, default: '22:00' }
  },
  socketId: String
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Geo index for location queries
driverSchema.index({ currentLocation: '2dsphere' });
driverSchema.index({ status: 1, isOnline: 1, isAvailable: 1 });

module.exports = mongoose.model('Driver', driverSchema);

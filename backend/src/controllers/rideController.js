const { v4: uuidv4 } = require('uuid');
const Ride = require('../models/Ride');
const Driver = require('../models/Driver');
const User = require('../models/User');
const logger = require('../utils/logger');

// Fare calculation config
const FARE_CONFIG = {
  economy: { base: 30, perKm: 8, perMin: 1.5, surge: 1.0 },
  standard: { base: 50, perKm: 12, perMin: 2, surge: 1.0 },
  premium: { base: 80, perKm: 20, perMin: 3, surge: 1.0 },
  bike: { base: 20, perKm: 5, perMin: 0.5, surge: 1.0 },
  auto: { base: 25, perKm: 7, perMin: 1, surge: 1.0 },
  xl: { base: 70, perKm: 15, perMin: 2.5, surge: 1.0 }
};

const calculateFare = (rideType, distanceKm, durationMin) => {
  const config = FARE_CONFIG[rideType] || FARE_CONFIG.standard;
  const baseFare = config.base;
  const distanceFare = distanceKm * config.perKm;
  const timeFare = durationMin * config.perMin;
  const subtotal = (baseFare + distanceFare + timeFare) * config.surge;
  const tax = subtotal * 0.05;
  const total = Math.round(subtotal + tax);
  return { baseFare, distanceFare, timeFare, surgeFare: 0, discount: 0, tax: Math.round(tax), total };
};

const generateOTP = () => Math.floor(1000 + Math.random() * 9000).toString();

exports.estimateFare = async (req, res) => {
  try {
    const { distance, duration } = req.body;
    // distance in meters, duration in seconds
    const distanceKm = (distance || 5000) / 1000;
    const durationMin = (duration || 600) / 60;

    const estimates = Object.keys(FARE_CONFIG).map(type => ({
      type,
      fare: calculateFare(type, distanceKm, durationMin),
      eta: Math.round(5 + Math.random() * 10) + ' mins',
      available: true
    }));

    res.status(200).json({ success: true, estimates, distanceKm: distanceKm.toFixed(2), durationMin: Math.round(durationMin) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.bookRide = async (req, res) => {
  try {
    const { pickup, destination, rideType, paymentMethod, distance, duration, polyline, waypoints } = req.body;

    const distanceKm = (distance || 5000) / 1000;
    const durationMin = (duration || 600) / 60;
    const fare = calculateFare(rideType || 'standard', distanceKm, durationMin);

    const ride = await Ride.create({
      rideId: 'SW-' + uuidv4().substr(0, 8).toUpperCase(),
      rider: req.user._id,
      pickup,
      destination,
      rideType: rideType || 'standard',
      fare,
      distance: { value: distance || 5000, text: `${distanceKm.toFixed(1)} km` },
      duration: { value: duration || 600, text: `${Math.round(durationMin)} mins` },
      polyline,
      waypoints: waypoints || [],
      payment: { method: paymentMethod || 'cash' },
      otp: { value: generateOTP() },
      'timeline.requestedAt': new Date()
    });

    // Notify nearby drivers via socket
    const io = req.app.get('io');
    if (io) {
      // Find nearby available drivers
      const nearbyDrivers = await Driver.find({
        status: 'approved',
        isOnline: true,
        isAvailable: true,
        currentRide: null
      }).populate('user', 'name phone avatar');

      nearbyDrivers.forEach(driver => {
        if (driver.socketId) {
          io.to(driver.socketId).emit('new_ride_request', {
            rideId: ride.rideId,
            ride: {
              _id: ride._id,
              rideId: ride.rideId,
              pickup: ride.pickup,
              destination: ride.destination,
              rideType: ride.rideType,
              fare: ride.fare,
              distance: ride.distance,
              duration: ride.duration
            }
          });
        }
      });
    }

    await ride.populate('rider', 'name phone avatar');

    res.status(201).json({ success: true, message: 'Ride booked, searching for drivers...', ride });
  } catch (error) {
    logger.error(`Book ride error: ${error.message}`);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getRideStatus = async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id)
      .populate('rider', 'name phone avatar')
      .populate({ path: 'driver', populate: { path: 'user', select: 'name phone avatar' } });

    if (!ride) return res.status(404).json({ success: false, message: 'Ride not found' });

    if (ride.rider._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    res.status(200).json({ success: true, ride });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.cancelRide = async (req, res) => {
  try {
    const { reason } = req.body;
    const ride = await Ride.findById(req.params.id);

    if (!ride) return res.status(404).json({ success: false, message: 'Ride not found' });
    if (!['requested', 'searching', 'accepted', 'driver_arriving'].includes(ride.status)) {
      return res.status(400).json({ success: false, message: 'Ride cannot be cancelled at this stage' });
    }

    ride.status = 'cancelled';
    ride.cancellation = { cancelledBy: 'rider', reason: reason || 'No reason provided' };
    ride.timeline.cancelledAt = new Date();
    await ride.save();

    // Notify driver
    if (ride.driver) {
      const driver = await Driver.findById(ride.driver);
      if (driver) {
        driver.currentRide = null;
        driver.isAvailable = true;
        await driver.save();

        const io = req.app.get('io');
        if (io && driver.socketId) {
          io.to(driver.socketId).emit('ride_cancelled', { rideId: ride.rideId, reason });
        }
      }
    }

    res.status(200).json({ success: true, message: 'Ride cancelled', ride });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.rateRide = async (req, res) => {
  try {
    const { score, comment } = req.body;
    const ride = await Ride.findById(req.params.id);

    if (!ride) return res.status(404).json({ success: false, message: 'Ride not found' });
    if (ride.status !== 'completed') return res.status(400).json({ success: false, message: 'Ride not completed' });

    ride.rating.byRider = { score, comment, createdAt: new Date() };
    await ride.save();

    // Update driver rating
    if (ride.driver) {
      const driver = await Driver.findById(ride.driver);
      if (driver) {
        driver.rating.total += score;
        driver.rating.count += 1;
        driver.rating.average = (driver.rating.total / driver.rating.count).toFixed(1);
        await driver.save();
      }
    }

    res.status(200).json({ success: true, message: 'Rating submitted', ride });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getRideHistory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = { rider: req.user._id };
    if (req.query.status) query.status = req.query.status;

    const [rides, total] = await Promise.all([
      Ride.find(query)
        .populate({ path: 'driver', populate: { path: 'user', select: 'name phone avatar' } })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Ride.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      rides,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getNearbyDrivers = async (req, res) => {
  try {
    const { lat, lng, radius = 5000 } = req.query;

    const drivers = await Driver.find({
      status: 'approved',
      isOnline: true,
      isAvailable: true,
      currentLocation: {
        $near: {
          $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: parseInt(radius)
        }
      }
    })
    .populate('user', 'name avatar')
    .select('currentLocation vehicleDetails rating')
    .limit(20);

    res.status(200).json({ success: true, drivers });
  } catch (error) {
    // Fallback without geo query if index not ready
    const drivers = await Driver.find({ status: 'approved', isOnline: true, isAvailable: true })
      .populate('user', 'name avatar')
      .select('currentLocation vehicleDetails rating')
      .limit(10);
    res.status(200).json({ success: true, drivers });
  }
};

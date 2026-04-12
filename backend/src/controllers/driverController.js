const Driver = require('../models/Driver');
const Ride = require('../models/Ride');
const User = require('../models/User');
const logger = require('../utils/logger');

exports.registerDriver = async (req, res) => {
  try {
    const existing = await Driver.findOne({ user: req.user._id });
    if (existing) return res.status(400).json({ success: false, message: 'Driver profile already exists' });

    const { licenseNumber, vehicleDetails, bankDetails, serviceTypes } = req.body;

    const driver = await Driver.create({
      user: req.user._id,
      licenseNumber,
      vehicleDetails,
      bankDetails,
      serviceTypes: serviceTypes || ['ride'],
      status: 'pending'
    });

    await User.findByIdAndUpdate(req.user._id, { role: 'driver' });

    res.status(201).json({ success: true, message: 'Driver registration submitted for review', driver });
  } catch (error) {
    logger.error(`Driver register error: ${error.message}`);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getDriverProfile = async (req, res) => {
  try {
    const driver = await Driver.findOne({ user: req.user._id }).populate('user', 'name email phone avatar');
    if (!driver) return res.status(404).json({ success: false, message: 'Driver profile not found' });
    res.status(200).json({ success: true, driver });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateDriverStatus = async (req, res) => {
  try {
    const { isOnline, isAvailable } = req.body;
    const driver = await Driver.findOne({ user: req.user._id });

    if (!driver) return res.status(404).json({ success: false, message: 'Driver profile not found' });
    if (driver.status !== 'approved') return res.status(403).json({ success: false, message: 'Driver not approved yet' });

    if (typeof isOnline === 'boolean') driver.isOnline = isOnline;
    if (typeof isAvailable === 'boolean') driver.isAvailable = isAvailable;
    await driver.save();

    res.status(200).json({ success: true, message: 'Status updated', driver });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateLocation = async (req, res) => {
  try {
    const { lat, lng, address } = req.body;
    const driver = await Driver.findOneAndUpdate(
      { user: req.user._id },
      {
        currentLocation: {
          type: 'Point',
          coordinates: [parseFloat(lng), parseFloat(lat)],
          address,
          updatedAt: new Date()
        }
      },
      { new: true }
    );

    if (!driver) return res.status(404).json({ success: false, message: 'Driver not found' });

    // Broadcast location to rider if in active ride
    if (driver.currentRide) {
      const io = req.app.get('io');
      if (io) {
        const ride = await Ride.findById(driver.currentRide);
        if (ride && ride.rider) {
          io.to(`user_${ride.rider}`).emit('driver_location_update', {
            rideId: ride.rideId,
            location: { lat, lng }
          });
        }
      }
    }

    res.status(200).json({ success: true, message: 'Location updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.acceptRide = async (req, res) => {
  try {
    const { rideId } = req.params;
    const driver = await Driver.findOne({ user: req.user._id });

    if (!driver || driver.status !== 'approved') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    if (driver.currentRide) {
      return res.status(400).json({ success: false, message: 'Already on a ride' });
    }

    const ride = await Ride.findOne({ _id: rideId, status: { $in: ['requested', 'searching'] } });
    if (!ride) return res.status(404).json({ success: false, message: 'Ride not available' });

    ride.driver = driver._id;
    ride.status = 'accepted';
    ride.timeline.acceptedAt = new Date();
    await ride.save();

    driver.currentRide = ride._id;
    driver.isAvailable = false;
    await driver.save();

    // Notify rider
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${ride.rider}`).emit('ride_accepted', {
        rideId: ride.rideId,
        driver: { ...driver.toObject(), user: req.user }
      });
    }

    await ride.populate([
      { path: 'rider', select: 'name phone avatar' },
      { path: 'driver', populate: { path: 'user', select: 'name phone avatar' } }
    ]);

    res.status(200).json({ success: true, message: 'Ride accepted', ride });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateRideStatus = async (req, res) => {
  try {
    const { rideId } = req.params;
    const { status, otp } = req.body;
    const driver = await Driver.findOne({ user: req.user._id });
    const ride = await Ride.findOne({ _id: rideId, driver: driver._id });

    if (!ride) return res.status(404).json({ success: false, message: 'Ride not found' });

    const validTransitions = {
      accepted: ['driver_arriving'],
      driver_arriving: ['started'],
      started: ['completed']
    };

    if (!validTransitions[ride.status]?.includes(status)) {
      return res.status(400).json({ success: false, message: `Cannot transition from ${ride.status} to ${status}` });
    }

    // Verify OTP when starting ride
    if (status === 'started') {
      if (!otp || ride.otp.value !== otp) {
        return res.status(400).json({ success: false, message: 'Invalid OTP' });
      }
      ride.otp.verified = true;
      ride.timeline.startedAt = new Date();
    }

    if (status === 'driver_arriving') ride.timeline.driverArrivedAt = new Date();

    if (status === 'completed') {
      ride.timeline.completedAt = new Date();
      driver.currentRide = null;
      driver.isAvailable = true;
      driver.totalRides += 1;
      driver.totalEarnings += ride.fare.total * 0.8; // 80% to driver
      await driver.save();

      // Update rider stats
      await User.findByIdAndUpdate(ride.rider, {
        $inc: { rideCount: 1, totalSpent: ride.fare.total }
      });
    }

    ride.status = status;
    await ride.save();

    const io = req.app.get('io');
    if (io) {
      io.to(`user_${ride.rider}`).emit('ride_status_update', { rideId: ride.rideId, status });
    }

    res.status(200).json({ success: true, message: `Ride status updated to ${status}`, ride });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getDriverEarnings = async (req, res) => {
  try {
    const driver = await Driver.findOne({ user: req.user._id });
    if (!driver) return res.status(404).json({ success: false, message: 'Driver not found' });

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(today); weekAgo.setDate(weekAgo.getDate() - 7);

    const [todayRides, weekRides] = await Promise.all([
      Ride.find({ driver: driver._id, status: 'completed', 'timeline.completedAt': { $gte: today } }),
      Ride.find({ driver: driver._id, status: 'completed', 'timeline.completedAt': { $gte: weekAgo } })
    ]);

    const todayEarnings = todayRides.reduce((sum, r) => sum + r.fare.total * 0.8, 0);
    const weekEarnings = weekRides.reduce((sum, r) => sum + r.fare.total * 0.8, 0);

    res.status(200).json({
      success: true,
      earnings: {
        today: { amount: Math.round(todayEarnings), rides: todayRides.length },
        week: { amount: Math.round(weekEarnings), rides: weekRides.length },
        total: { amount: Math.round(driver.totalEarnings), rides: driver.totalRides }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getDriverRides = async (req, res) => {
  try {
    const driver = await Driver.findOne({ user: req.user._id });
    if (!driver) return res.status(404).json({ success: false, message: 'Driver not found' });

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const rides = await Ride.find({ driver: driver._id })
      .populate('rider', 'name phone avatar')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({ success: true, rides });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

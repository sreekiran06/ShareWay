const { v4: uuidv4 } = require('uuid');
const Delivery = require('../models/Delivery');
const Driver = require('../models/Driver');
const logger = require('../utils/logger');

const calculateDeliveryFare = (distanceKm, weight = 1, category = 'other') => {
  const baseFare = 40;
  const distanceFare = distanceKm * 10;
  const weightFare = weight > 5 ? (weight - 5) * 15 : 0;
  const categoryMultiplier = category === 'fragile' ? 1.3 : category === 'electronics' ? 1.2 : 1.0;
  const subtotal = (baseFare + distanceFare + weightFare) * categoryMultiplier;
  const tax = subtotal * 0.05;
  return {
    baseFare,
    distanceFare: Math.round(distanceFare),
    weightFare: Math.round(weightFare),
    discount: 0,
    tax: Math.round(tax),
    total: Math.round(subtotal + tax)
  };
};

exports.estimateDelivery = async (req, res) => {
  try {
    const { distance, weight, category } = req.body;
    const distanceKm = (distance || 5000) / 1000;
    const fare = calculateDeliveryFare(distanceKm, weight, category);
    const eta = Math.round(30 + distanceKm * 3) + ' mins';
    res.status(200).json({ success: true, fare, eta, distanceKm: distanceKm.toFixed(2) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createDelivery = async (req, res) => {
  try {
    const { pickup, destination, package: pkg, paymentMethod, distance, duration } = req.body;

    const distanceKm = (distance || 5000) / 1000;
    const fare = calculateDeliveryFare(distanceKm, pkg?.weight, pkg?.category);

    const delivery = await Delivery.create({
      deliveryId: 'SWD-' + uuidv4().substr(0, 8).toUpperCase(),
      sender: req.user._id,
      pickup,
      destination,
      package: pkg,
      fare,
      distance: { value: distance || 5000, text: `${distanceKm.toFixed(1)} km` },
      duration: { value: duration || 1800, text: `${Math.round((duration || 1800) / 60)} mins` },
      payment: { method: paymentMethod || 'cash' },
      otp: { value: Math.floor(1000 + Math.random() * 9000).toString() }
    });

    // Notify available drivers
    const io = req.app.get('io');
    if (io) {
      const drivers = await Driver.find({ status: 'approved', isOnline: true, isAvailable: true, currentDelivery: null });
      drivers.forEach(d => {
        if (d.socketId) {
          io.to(d.socketId).emit('new_delivery_request', {
            deliveryId: delivery.deliveryId,
            delivery: { _id: delivery._id, deliveryId: delivery.deliveryId, pickup: delivery.pickup, destination: delivery.destination, fare: delivery.fare, package: delivery.package }
          });
        }
      });
    }

    res.status(201).json({ success: true, message: 'Delivery request created', delivery });
  } catch (error) {
    logger.error(`Create delivery error: ${error.message}`);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getDeliveryStatus = async (req, res) => {
  try {
    const delivery = await Delivery.findById(req.params.id)
      .populate('sender', 'name phone')
      .populate({ path: 'driver', populate: { path: 'user', select: 'name phone avatar' } });

    if (!delivery) return res.status(404).json({ success: false, message: 'Delivery not found' });
    res.status(200).json({ success: true, delivery });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.trackDelivery = async (req, res) => {
  try {
    const delivery = await Delivery.findOne({
      $or: [{ _id: req.params.id }, { deliveryId: req.params.id }]
    }).populate({ path: 'driver', populate: { path: 'user', select: 'name phone avatar' } });

    if (!delivery) return res.status(404).json({ success: false, message: 'Delivery not found' });

    res.status(200).json({
      success: true,
      delivery: {
        deliveryId: delivery.deliveryId,
        status: delivery.status,
        pickup: delivery.pickup,
        destination: delivery.destination,
        package: { description: delivery.package.description, category: delivery.package.category },
        driver: delivery.driver,
        timeline: delivery.timeline,
        trackingUpdates: delivery.trackingUpdates
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.cancelDelivery = async (req, res) => {
  try {
    const delivery = await Delivery.findOne({ _id: req.params.id, sender: req.user._id });
    if (!delivery) return res.status(404).json({ success: false, message: 'Delivery not found' });

    if (!['requested', 'searching', 'accepted'].includes(delivery.status)) {
      return res.status(400).json({ success: false, message: 'Cannot cancel at this stage' });
    }

    delivery.status = 'cancelled';
    delivery.timeline.cancelledAt = new Date();
    await delivery.save();

    if (delivery.driver) {
      await Driver.findByIdAndUpdate(delivery.driver, { currentDelivery: null, isAvailable: true });
    }

    res.status(200).json({ success: true, message: 'Delivery cancelled', delivery });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getDeliveryHistory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const [deliveries, total] = await Promise.all([
      Delivery.find({ sender: req.user._id })
        .populate({ path: 'driver', populate: { path: 'user', select: 'name phone avatar' } })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Delivery.countDocuments({ sender: req.user._id })
    ]);

    res.status(200).json({ success: true, deliveries, pagination: { page, limit, total } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

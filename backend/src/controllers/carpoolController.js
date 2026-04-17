const Carpool = require('../models/Carpool');
const logger = require('../utils/logger');

// POST /api/carpools
exports.postRide = async (req, res) => {
  try {
    const { startingLocation, destination, departureDate, departureTime, totalSeats, costPerSeat } = req.body;

    const carpool = await Carpool.create({
      driver: req.user._id,
      startingLocation,
      destination,
      departureDate,
      departureTime,
      totalSeats,
      availableSeats: totalSeats,
      costPerSeat
    });

    res.status(201).json({ success: true, carpool });
  } catch (error) {
    logger.error(`Post ride error: ${error.message}`);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/carpools/search
exports.searchRides = async (req, res) => {
  try {
    const { startingLocation, destination, departureDate } = req.query;
    let query = {
      status: 'active',
      availableSeats: { $gt: 0 }
    };

    if (startingLocation) query.startingLocation = new RegExp(startingLocation, 'i');
    if (destination) query.destination = new RegExp(destination, 'i');
    if (departureDate) {
      const startOfDay = new Date(departureDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(departureDate);
      endOfDay.setHours(23, 59, 59, 999);
      query.departureDate = { $gte: startOfDay, $lte: endOfDay };
    }

    const carpools = await Carpool.find(query)
      .populate('driver', 'name phone avatar')
      .sort({ departureDate: 1, departureTime: 1 });

    res.status(200).json({ success: true, carpools });
  } catch (error) {
    logger.error(`Search rides error: ${error.message}`);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/carpools/driver
exports.getDriverRides = async (req, res) => {
  try {
    const carpools = await Carpool.find({ driver: req.user._id })
      .populate('requests.passenger', 'name phone avatar')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, carpools });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/carpools/:id/request
exports.requestRide = async (req, res) => {
  try {
    const { seatsRequested } = req.body;
    const requestedSeats = seatsRequested || 1;
    
    const carpool = await Carpool.findById(req.params.id);

    if (!carpool) return res.status(404).json({ success: false, message: 'Ride not found' });
    if (carpool.status !== 'active') return res.status(400).json({ success: false, message: 'Ride is no longer active' });
    if (carpool.availableSeats < requestedSeats) return res.status(400).json({ success: false, message: 'Not enough seats available' });

    // Check if duplicate request
    const existingReq = carpool.requests.find(r => r.passenger.toString() === req.user._id.toString() && r.status !== 'cancelled' && r.status !== 'rejected');
    if (existingReq) {
      return res.status(400).json({ success: false, message: 'You have already requested this ride' });
    }

    carpool.requests.push({
      passenger: req.user._id,
      seatsRequested: requestedSeats,
      status: 'pending'
    });

    await carpool.save();

    res.status(200).json({ success: true, message: 'Request sent to driver successfully', carpool });
  } catch (error) {
    logger.error(`Request ride error: ${error.message}`);
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/carpools/:id/request/:requestId
exports.respondToRequest = async (req, res) => {
  try {
    const { status } = req.body; // 'accepted' or 'rejected'
    
    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const carpool = await Carpool.findOne({ _id: req.params.id, driver: req.user._id });

    if (!carpool) return res.status(404).json({ success: false, message: 'Ride not found or unauthorized' });

    const request = carpool.requests.id(req.params.requestId);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

    if (request.status !== 'pending') return res.status(400).json({ success: false, message: `Request is already ${request.status}` });

    if (status === 'accepted') {
      if (carpool.availableSeats < request.seatsRequested) {
        return res.status(400).json({ success: false, message: 'Not enough seats available to accept this request' });
      }
      carpool.availableSeats -= request.seatsRequested;
    }

    request.status = status;
    await carpool.save();

    res.status(200).json({ success: true, message: `Request ${status} successfully`, carpool });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/carpools/:id/cancel
exports.cancelRide = async (req, res) => {
  try {
    const carpool = await Carpool.findOne({ _id: req.params.id, driver: req.user._id });

    if (!carpool) return res.status(404).json({ success: false, message: 'Ride not found or unauthorized' });
    if (carpool.status !== 'active') return res.status(400).json({ success: false, message: 'Cannot cancel an inactive ride' });

    carpool.status = 'cancelled';
    await carpool.save();

    res.status(200).json({ success: true, message: 'Ride cancelled successfully', carpool });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

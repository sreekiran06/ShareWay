const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const Driver = require('../models/Driver');
const Ride = require('../models/Ride');
const logger = require('../utils/logger');

const connectedUsers = new Map();   // userId -> socketId
const connectedDrivers = new Map(); // driverId -> socketId

const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // Auth middleware for socket
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
      if (!token) return next(new Error('Authentication error: No token'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.userId;
    logger.info(`Socket connected: ${socket.id} (user: ${userId})`);

    // Join personal room
    socket.join(`user_${userId}`);
    connectedUsers.set(userId, socket.id);

    // Handle driver connection
    socket.on('driver_connect', async () => {
      try {
        const driver = await Driver.findOne({ user: userId });
        if (driver) {
          driver.socketId = socket.id;
          await driver.save();
          connectedDrivers.set(driver._id.toString(), socket.id);
          socket.join(`driver_${driver._id}`);
          logger.info(`Driver ${driver._id} connected via socket`);
        }
      } catch (err) {
        logger.error(`Driver connect error: ${err.message}`);
      }
    });

    // Real-time driver location update
    socket.on('update_location', async ({ lat, lng, address }) => {
      try {
        const driver = await Driver.findOneAndUpdate(
          { user: userId },
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

        if (driver?.currentRide) {
          const ride = await Ride.findById(driver.currentRide);
          if (ride) {
            io.to(`user_${ride.rider}`).emit('driver_location_update', {
              rideId: ride.rideId,
              location: { lat: parseFloat(lat), lng: parseFloat(lng) }
            });
          }
        }
      } catch (err) {
        logger.error(`Location update error: ${err.message}`);
      }
    });

    // Driver accepts a ride
    socket.on('accept_ride', async ({ rideId }) => {
      try {
        const driver = await Driver.findOne({ user: userId });
        const ride = await Ride.findOne({ _id: rideId, status: { $in: ['requested', 'searching'] } });

        if (!driver || !ride) return;

        ride.driver = driver._id;
        ride.status = 'accepted';
        ride.timeline.acceptedAt = new Date();
        await ride.save();

        driver.currentRide = ride._id;
        driver.isAvailable = false;
        await driver.save();

        // Notify rider
        io.to(`user_${ride.rider}`).emit('ride_accepted', {
          rideId: ride.rideId,
          driver: {
            id: driver._id,
            name: driver.user,
            vehicleDetails: driver.vehicleDetails,
            rating: driver.rating,
            currentLocation: driver.currentLocation
          }
        });

        socket.emit('ride_accept_confirmed', { rideId: ride.rideId });
      } catch (err) {
        logger.error(`Accept ride socket error: ${err.message}`);
        socket.emit('error', { message: err.message });
      }
    });

    // Driver rejects ride
    socket.on('reject_ride', async ({ rideId }) => {
      socket.emit('ride_reject_confirmed', { rideId });
    });

    // Ride status updates
    socket.on('ride_status_update', async ({ rideId, status, otp }) => {
      try {
        const driver = await Driver.findOne({ user: userId });
        const ride = await Ride.findOne({ _id: rideId, driver: driver._id });

        if (!ride || !driver) return;

        if (status === 'started' && ride.otp.value !== otp) {
          socket.emit('otp_invalid', { message: 'Invalid OTP' });
          return;
        }

        if (status === 'started') {
          ride.otp.verified = true;
          ride.timeline.startedAt = new Date();
        }
        if (status === 'driver_arriving') ride.timeline.driverArrivedAt = new Date();
        if (status === 'completed') {
          ride.timeline.completedAt = new Date();
          driver.currentRide = null;
          driver.isAvailable = true;
          driver.totalRides += 1;
          driver.totalEarnings += ride.fare.total * 0.8;
          await driver.save();
        }

        ride.status = status;
        await ride.save();

        io.to(`user_${ride.rider}`).emit('ride_status_update', {
          rideId: ride.rideId,
          status,
          message: getStatusMessage(status)
        });
      } catch (err) {
        logger.error(`Ride status update socket error: ${err.message}`);
      }
    });

    // Rider tracks ride
    socket.on('track_ride', async ({ rideId }) => {
      socket.join(`ride_${rideId}`);
    });

    // Chat messages during ride
    socket.on('send_message', async ({ rideId, message, recipientId }) => {
      io.to(`user_${recipientId}`).emit('new_message', {
        rideId,
        message,
        senderId: userId,
        timestamp: new Date().toISOString()
      });
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
      logger.info(`Socket disconnected: ${socket.id} (user: ${userId})`);
      connectedUsers.delete(userId);

      try {
        const driver = await Driver.findOne({ user: userId, socketId: socket.id });
        if (driver) {
          driver.socketId = null;
          driver.isOnline = false;
          driver.isAvailable = false;
          await driver.save();
          connectedDrivers.delete(driver._id.toString());
        }
      } catch (err) {
        logger.error(`Disconnect cleanup error: ${err.message}`);
      }
    });

    socket.on('error', (err) => {
      logger.error(`Socket error for ${socket.id}: ${err.message}`);
    });
  });

  return io;
};

const getStatusMessage = (status) => {
  const messages = {
    accepted: 'Driver has accepted your ride',
    driver_arriving: 'Driver is on the way to your location',
    started: 'Your ride has started',
    completed: 'You have arrived at your destination',
    cancelled: 'Ride has been cancelled'
  };
  return messages[status] || status;
};

module.exports = { initializeSocket, connectedUsers, connectedDrivers };

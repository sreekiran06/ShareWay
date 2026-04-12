const User = require('../models/User');
const Driver = require('../models/Driver');
const Ride = require('../models/Ride');
const Delivery = require('../models/Delivery');

exports.getDashboardStats = async (req, res) => {
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(today); weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today); monthAgo.setMonth(monthAgo.getMonth() - 1);

    const [
      totalUsers, totalDrivers, activeDrivers,
      totalRides, todayRides, weekRides,
      totalDeliveries, pendingDrivers,
      completedRides, completedDeliveries
    ] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      Driver.countDocuments(),
      Driver.countDocuments({ isOnline: true }),
      Ride.countDocuments(),
      Ride.countDocuments({ createdAt: { $gte: today } }),
      Ride.countDocuments({ createdAt: { $gte: weekAgo } }),
      Delivery.countDocuments(),
      Driver.countDocuments({ status: 'pending' }),
      Ride.countDocuments({ status: 'completed' }),
      Delivery.countDocuments({ status: 'delivered' })
    ]);

    // Revenue calculation
    const revenueData = await Ride.aggregate([
      { $match: { status: 'completed', createdAt: { $gte: monthAgo } } },
      { $group: { _id: null, total: { $sum: '$fare.total' } } }
    ]);
    const monthlyRevenue = revenueData[0]?.total || 0;

    // Weekly ride trend
    const rideTrend = await Ride.aggregate([
      { $match: { createdAt: { $gte: weekAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
          revenue: { $sum: '$fare.total' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Top drivers
    const topDrivers = await Driver.find({ status: 'approved' })
      .populate('user', 'name phone avatar')
      .sort({ totalRides: -1 })
      .limit(5)
      .select('user totalRides totalEarnings rating vehicleDetails');

    res.status(200).json({
      success: true,
      stats: {
        users: { total: totalUsers, new: await User.countDocuments({ createdAt: { $gte: weekAgo } }) },
        drivers: { total: totalDrivers, active: activeDrivers, pending: pendingDrivers },
        rides: { total: totalRides, today: todayRides, week: weekRides, completed: completedRides },
        deliveries: { total: totalDeliveries, completed: completedDeliveries },
        revenue: { monthly: Math.round(monthlyRevenue) }
      },
      rideTrend,
      topDrivers
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const { search, role, status } = req.query;

    const query = {};
    if (search) query.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];
    if (role) query.role = role;
    if (status === 'active') query.isActive = true;
    if (status === 'inactive') query.isActive = false;

    const [users, total] = await Promise.all([
      User.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      User.countDocuments(query)
    ]);

    res.status(200).json({ success: true, users, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllDrivers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const { status, search } = req.query;

    const query = {};
    if (status) query.status = status;

    const [drivers, total] = await Promise.all([
      Driver.find(query)
        .populate('user', 'name email phone avatar createdAt')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Driver.countDocuments(query)
    ]);

    res.status(200).json({ success: true, drivers, pagination: { page, limit, total } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.approveDriver = async (req, res) => {
  try {
    const { driverId } = req.params;
    const { status, reason } = req.body;

    if (!['approved', 'rejected', 'suspended'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const driver = await Driver.findByIdAndUpdate(driverId, { status }, { new: true }).populate('user');
    if (!driver) return res.status(404).json({ success: false, message: 'Driver not found' });

    res.status(200).json({ success: true, message: `Driver ${status}`, driver });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllRides = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const { status, dateFrom, dateTo } = req.query;

    const query = {};
    if (status) query.status = status;
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    const [rides, total] = await Promise.all([
      Ride.find(query)
        .populate('rider', 'name phone')
        .populate({ path: 'driver', populate: { path: 'user', select: 'name phone' } })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Ride.countDocuments(query)
    ]);

    res.status(200).json({ success: true, rides, pagination: { page, limit, total } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.isActive = !user.isActive;
    await user.save();
    res.status(200).json({ success: true, message: `User ${user.isActive ? 'activated' : 'deactivated'}`, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

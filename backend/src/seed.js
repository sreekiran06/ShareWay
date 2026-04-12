/**
 * ShareWay Database Seed Script
 * Run: node src/seed.js
 * Creates demo users, drivers, and sample data
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const connectDB = async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shareway');
  console.log('✅ Connected to MongoDB');
};

const seed = async () => {
  await connectDB();

  const User = require('./models/User');
  const Driver = require('./models/Driver');
  const Ride = require('./models/Ride');

  // Clear existing data
  await Promise.all([
    User.deleteMany({}),
    Driver.deleteMany({}),
    Ride.deleteMany({})
  ]);
  console.log('🗑️  Cleared existing data');

  // Create demo users
  const hashedPass = await bcrypt.hash('demo1234', 12);

  const admin = await User.create({
    name: 'Admin User',
    email: 'admin@demo.com',
    phone: '+919876543200',
    password: 'demo1234',
    role: 'admin',
    isVerified: true,
    isActive: true,
    walletBalance: 5000
  });

  const rider = await User.create({
    name: 'Rahul Sharma',
    email: 'user@demo.com',
    phone: '+919876543210',
    password: 'demo1234',
    role: 'user',
    isVerified: true,
    isActive: true,
    walletBalance: 250,
    rideCount: 12,
    totalSpent: 3480
  });

  const driverUser = await User.create({
    name: 'Suresh Kumar',
    email: 'driver@demo.com',
    phone: '+919876543220',
    password: 'demo1234',
    role: 'driver',
    isVerified: true,
    isActive: true
  });

  // More demo riders
  const riders = await User.insertMany([
    { name: 'Priya Patel', email: 'priya@demo.com', phone: '+919876543211', password: 'demo1234', role: 'user', isVerified: true, isActive: true, walletBalance: 500 },
    { name: 'Amit Singh', email: 'amit@demo.com', phone: '+919876543212', password: 'demo1234', role: 'user', isVerified: true, isActive: true, walletBalance: 150 },
    { name: 'Deepa Reddy', email: 'deepa@demo.com', phone: '+919876543213', password: 'demo1234', role: 'user', isVerified: true, isActive: true, walletBalance: 800 },
  ]);

  console.log('👤 Created demo users');

  // Create driver profile
  const driver = await Driver.create({
    user: driverUser._id,
    licenseNumber: 'TG0520190012345',
    vehicleDetails: {
      make: 'Maruti',
      model: 'Swift Dzire',
      year: 2021,
      color: 'White',
      licensePlate: 'TS09AB1234',
      type: 'car',
      capacity: 4
    },
    status: 'approved',
    isOnline: true,
    isAvailable: true,
    currentLocation: {
      type: 'Point',
      coordinates: [78.4867, 17.385], // Hyderabad
      address: 'Hitech City, Hyderabad'
    },
    rating: { average: 4.8, count: 47, total: 225.6 },
    totalRides: 47,
    totalEarnings: 18500,
    serviceTypes: ['ride', 'delivery'],
    bankDetails: {
      accountHolder: 'Suresh Kumar',
      bankName: 'State Bank of India',
      accountNumber: '31234567890',
      ifscCode: 'SBIN0001234'
    }
  });

  // Create more drivers
  const extraDriverUsers = await User.insertMany([
    { name: 'Venkat Rao', email: 'venkat@demo.com', phone: '+919876543230', password: 'demo1234', role: 'driver', isVerified: true, isActive: true },
    { name: 'Ramesh Babu', email: 'ramesh@demo.com', phone: '+919876543231', password: 'demo1234', role: 'driver', isVerified: true, isActive: true },
  ]);

  await Driver.insertMany([
    {
      user: extraDriverUsers[0]._id,
      licenseNumber: 'TG0520190054321',
      vehicleDetails: { make: 'Honda', model: 'Activa', year: 2022, color: 'Black', licensePlate: 'TS10XY5678', type: 'bike', capacity: 1 },
      status: 'approved', isOnline: false, isAvailable: false,
      currentLocation: { type: 'Point', coordinates: [78.4967, 17.395], address: 'Banjara Hills, Hyderabad' },
      rating: { average: 4.6, count: 89, total: 409.4 },
      totalRides: 89, totalEarnings: 24000,
      serviceTypes: ['ride', 'delivery']
    },
    {
      user: extraDriverUsers[1]._id,
      licenseNumber: 'TG0520190067890',
      vehicleDetails: { make: 'Toyota', model: 'Innova', year: 2020, color: 'Silver', licensePlate: 'TS07MN9012', type: 'suv', capacity: 7 },
      status: 'pending', isOnline: false, isAvailable: false,
      currentLocation: { type: 'Point', coordinates: [78.4767, 17.375], address: 'Gachibowli, Hyderabad' },
      rating: { average: 0, count: 0, total: 0 },
      totalRides: 0, totalEarnings: 0,
      serviceTypes: ['ride']
    }
  ]);

  console.log('🚗 Created demo drivers');

  // Create sample completed rides
  const sampleRides = [
    {
      rideId: 'SW-DEMO0001',
      rider: rider._id,
      driver: driver._id,
      pickup: { address: 'Hitech City Metro, Hyderabad', coordinates: { lat: 17.445, lng: 78.374 } },
      destination: { address: 'Banjara Hills, Hyderabad', coordinates: { lat: 17.4154, lng: 78.4477 } },
      rideType: 'standard',
      status: 'completed',
      fare: { baseFare: 50, distanceFare: 84, timeFare: 24, surgeFare: 0, discount: 0, tax: 8, total: 166 },
      distance: { value: 7000, text: '7.0 km' },
      duration: { value: 1200, text: '20 mins' },
      payment: { method: 'cash', status: 'completed' },
      rating: { byRider: { score: 5, comment: 'Excellent driver, very punctual!' } },
      otp: { value: '4521', verified: true },
      timeline: {
        requestedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        acceptedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 120000),
        startedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 720000),
        completedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 1920000)
      }
    },
    {
      rideId: 'SW-DEMO0002',
      rider: rider._id,
      driver: driver._id,
      pickup: { address: 'Jubilee Hills, Hyderabad', coordinates: { lat: 17.4324, lng: 78.4073 } },
      destination: { address: 'Secunderabad Railway Station', coordinates: { lat: 17.4343, lng: 78.5013 } },
      rideType: 'economy',
      status: 'completed',
      fare: { baseFare: 30, distanceFare: 72, timeFare: 18, surgeFare: 0, discount: 0, tax: 6, total: 126 },
      distance: { value: 9000, text: '9.0 km' },
      duration: { value: 1500, text: '25 mins' },
      payment: { method: 'wallet', status: 'completed' },
      rating: { byRider: { score: 4, comment: 'Good ride, comfortable car.' } },
      otp: { value: '7832', verified: true },
      timeline: {
        requestedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        acceptedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 90000),
        startedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 600000),
        completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 2100000)
      }
    }
  ];

  await Ride.insertMany(sampleRides);
  console.log('🛣️  Created sample rides');

  console.log('\n✅ Seed completed successfully!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 DEMO LOGIN CREDENTIALS:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🧑 User:   user@demo.com   / demo1234');
  console.log('🚗 Driver: driver@demo.com / demo1234');
  console.log('🛡️  Admin:  admin@demo.com  / demo1234');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch(err => {
  console.error('❌ Seed error:', err);
  process.exit(1);
});

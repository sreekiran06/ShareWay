require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Carpool = require('./src/models/Carpool');

async function seedData() {
  try {
    // Check if MONGODB_URI is provided
    if (!process.env.MONGODB_URI) {
      console.log('No MONGODB_URI found, using default localhost');
      process.env.MONGODB_URI = 'mongodb://localhost:27017/shareway';
    }
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to Database for seeding...');

    // 1. Create a demo driver (forcing reset if exists)
    let driver = await User.findOne({ email: 'driver@demo.com' });
    if (!driver) {
      driver = new User({
        name: 'Demo Driver (Arjun)',
        email: 'driver@demo.com',
        role: 'both',
        isVerified: true
      });
    }
    driver.password = 'password123';
    await driver.save();
    console.log('Driver user created/updated: driver@demo.com / password123');

    // 2. Create a demo rider
    let rider = await User.findOne({ email: 'rider@demo.com' });
    if (!rider) {
      rider = new User({
        name: 'Demo Rider (Neha)',
        email: 'rider@demo.com',
        role: 'user',
        isVerified: true
      });
    }
    rider.password = 'password123';
    await rider.save();
    console.log('Rider user created/updated: rider@demo.com / password123');

    // 3. Create demo carpools
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 2);

    const carpool1 = new Carpool({
      driver: driver._id,
      startingLocation: 'KPHB Colony, Hyderabad, Telangana',
      destination: 'DLF Cyber City, Gachibowli, Hyderabad',
      departureDate: tomorrow,
      departureTime: '09:00',
      totalSeats: 3,
      availableSeats: 3,
      costPerSeat: 60,
      status: 'active'
    });

    const carpool2 = new Carpool({
      driver: driver._id,
      startingLocation: 'Secunderabad Railway Station',
      destination: 'Mindspace IT Park, Madhapur',
      departureDate: dayAfter,
      departureTime: '10:30',
      totalSeats: 4,
      availableSeats: 2, // 2 seats booked
      costPerSeat: 100,
      status: 'active',
      requests: [
        {
          passenger: rider._id,
          status: 'accepted',
          seatsRequested: 2,
          requestedAt: new Date()
        }
      ]
    });

    await carpool1.save();
    console.log(`Carpool 1 saved: ${carpool1.startingLocation} -> ${carpool1.destination}`);
    
    await carpool2.save();
    console.log(`Carpool 2 saved: ${carpool2.startingLocation} -> ${carpool2.destination}`);

    console.log('\n--- SUCCESS: Demo data has been seeded! ---');
    console.log('You can now log in with:');
    console.log('Email: driver@demo.com  | Password: password123');
    console.log('Email: rider@demo.com   | Password: password123\n');
    process.exit(0);

  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  }
}

seedData();

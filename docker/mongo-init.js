// MongoDB initialization script
// Creates the shareway database with initial indexes and seed data

db = db.getSiblingDB('shareway');

// Create indexes
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ phone: 1 }, { unique: true });
db.users.createIndex({ role: 1 });
db.drivers.createIndex({ user: 1 }, { unique: true });
db.drivers.createIndex({ "currentLocation": "2dsphere" });
db.drivers.createIndex({ status: 1, isOnline: 1, isAvailable: 1 });
db.rides.createIndex({ rider: 1, status: 1 });
db.rides.createIndex({ driver: 1, status: 1 });
db.rides.createIndex({ rideId: 1 }, { unique: true });
db.deliveries.createIndex({ sender: 1, status: 1 });
db.deliveries.createIndex({ deliveryId: 1 }, { unique: true });
db.payments.createIndex({ paymentId: 1 }, { unique: true });
db.payments.createIndex({ user: 1, status: 1 });

print('✅ ShareWay database initialized with indexes');

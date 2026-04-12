# 🚀 ShareWay — Ride-Sharing & Delivery Platform

A production-ready, full-stack ride-sharing and package delivery platform built with the MERN stack. Similar to Uber/Rapido with real-time tracking, driver management, admin analytics, and payment integration.

---

## 📸 Features

| Feature | Description |
|---|---|
| 🔐 **Auth** | JWT + Refresh Tokens, Email/Phone login, Role-based access |
| 🚗 **Ride Booking** | Multi-step booking, fare estimation, OTP verification |
| 📦 **Deliveries** | Package dispatch, real-time tracking, proof of delivery |
| 🗺️ **Maps** | OpenStreetMap (free, no API key needed) with Leaflet.js |
| ⚡ **Real-time** | Socket.io for live driver location, ride requests, status |
| 🛡️ **Admin Panel** | Analytics dashboard, user/driver management, ride history |
| 🚘 **Driver Portal** | Online/offline toggle, ride acceptance, earnings tracker |
| 💳 **Payments** | Razorpay + Stripe integration, wallet system |
| ⭐ **Ratings** | Post-ride driver rating system |
| 🐳 **Docker** | Full Docker Compose setup, production-ready |

---

## 🗂️ Project Structure

```
shareway/
├── backend/                    # Node.js + Express API
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js     # MongoDB connection
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── rideController.js
│   │   │   ├── driverController.js
│   │   │   ├── deliveryController.js
│   │   │   └── adminController.js
│   │   ├── middleware/
│   │   │   └── auth.js         # JWT protect + authorize
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Driver.js
│   │   │   ├── Ride.js
│   │   │   ├── Delivery.js
│   │   │   └── Payment.js
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── users.js
│   │   │   ├── drivers.js
│   │   │   ├── rides.js
│   │   │   ├── deliveries.js
│   │   │   ├── payments.js
│   │   │   ├── admin.js
│   │   │   └── notifications.js
│   │   ├── socket/
│   │   │   └── socketHandler.js  # Socket.io real-time logic
│   │   ├── utils/
│   │   │   └── logger.js
│   │   ├── seed.js             # Database seeder
│   │   └── server.js           # Entry point
│   ├── .env.example
│   ├── Dockerfile
│   └── package.json
│
├── frontend/                   # React + Vite + Tailwind
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   │   ├── PublicLayout.jsx
│   │   │   │   ├── DashboardLayout.jsx
│   │   │   │   ├── DriverLayout.jsx
│   │   │   │   └── AdminLayout.jsx
│   │   │   └── map/
│   │   │       └── MapView.jsx  # Leaflet OpenStreetMap
│   │   ├── pages/
│   │   │   ├── auth/           # Login + Register
│   │   │   ├── user/           # Home, BookRide, Tracking, History, Profile
│   │   │   ├── driver/         # Dashboard, Rides, Earnings, Register
│   │   │   └── admin/          # Dashboard, Users, Drivers, Rides
│   │   ├── services/
│   │   │   ├── api.js          # Axios + service helpers
│   │   │   └── socket.js       # Socket.io client
│   │   ├── store/
│   │   │   └── authStore.js    # Zustand global state
│   │   ├── App.jsx             # Router + protected routes
│   │   └── index.css           # Tailwind + custom styles
│   ├── .env.example
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
│
├── docker/
│   └── mongo-init.js           # DB init + indexes
├── docker-compose.yml
└── package.json                # Root convenience scripts
```

---

## ⚡ Quick Start (Local Development)

### Prerequisites
- Node.js 18+
- MongoDB 6+ (local or Atlas)
- npm / yarn

### 1. Clone & Install

```bash
git clone https://github.com/yourname/shareway.git
cd shareway

# Install all dependencies (backend + frontend)
npm run install:all
```

### 2. Configure Environment

```bash
# Backend
cp backend/.env.example backend/.env

# Frontend
cp frontend/.env.example frontend/.env
```

Edit `backend/.env`:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/shareway
JWT_SECRET=your_super_secret_jwt_key_here_min_32_chars
JWT_REFRESH_SECRET=your_refresh_secret_here
FRONTEND_URL=http://localhost:5173
```

Edit `frontend/.env`:
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

### 3. Seed the Database

```bash
npm run seed
# or
cd backend && npm run seed
```

This creates demo accounts:
| Role | Email | Password |
|------|-------|----------|
| 🧑 User | user@demo.com | demo1234 |
| 🚗 Driver | driver@demo.com | demo1234 |
| 🛡️ Admin | admin@demo.com | demo1234 |

### 4. Start Development Servers

```bash
# Start both backend + frontend concurrently
npm run dev

# Or separately:
npm run dev:backend   # http://localhost:5000
npm run dev:frontend  # http://localhost:5173
```

---

## 🐳 Docker Deployment

```bash
# Build and start all services
docker-compose up --build

# Or run in background
docker-compose up -d --build
```

Access:
- **Frontend**: http://localhost
- **Backend API**: http://localhost:5000
- **API Health**: http://localhost:5000/health

Stop:
```bash
docker-compose down          # Stop containers
docker-compose down -v       # Stop + delete volumes
```

---

## 🔌 REST API Reference

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login with email/phone |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/profile` | Update profile |
| PUT | `/api/auth/change-password` | Change password |
| POST | `/api/auth/refresh-token` | Refresh JWT |
| POST | `/api/auth/logout` | Logout |

### Rides
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/rides/estimate` | Get fare estimates |
| POST | `/api/rides/book` | Book a ride |
| GET | `/api/rides/history` | Ride history |
| GET | `/api/rides/nearby-drivers` | Nearby available drivers |
| GET | `/api/rides/:id` | Ride status |
| PUT | `/api/rides/:id/cancel` | Cancel ride |
| POST | `/api/rides/:id/rate` | Rate driver |

### Deliveries
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/deliveries/estimate` | Estimate delivery cost |
| POST | `/api/deliveries/create` | Create delivery |
| GET | `/api/deliveries/history` | Delivery history |
| GET | `/api/deliveries/track/:id` | Public tracking |
| PUT | `/api/deliveries/:id/cancel` | Cancel delivery |

### Drivers
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/drivers/register` | Register as driver |
| GET | `/api/drivers/profile` | Driver profile |
| PUT | `/api/drivers/status` | Toggle online/offline |
| PUT | `/api/drivers/location` | Update GPS location |
| POST | `/api/drivers/rides/:id/accept` | Accept ride |
| PUT | `/api/drivers/rides/:id/status` | Update ride status |
| GET | `/api/drivers/earnings` | Earnings summary |

### Admin (requires admin role)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/dashboard` | Stats + analytics |
| GET | `/api/admin/users` | All users |
| PUT | `/api/admin/users/:id/toggle-status` | Ban/unban user |
| GET | `/api/admin/drivers` | All drivers |
| PUT | `/api/admin/drivers/:id/status` | Approve/reject driver |
| GET | `/api/admin/rides` | All rides |
| GET | `/api/admin/deliveries` | All deliveries |

---

## ⚡ Socket.io Events

### Client → Server
| Event | Payload | Description |
|-------|---------|-------------|
| `driver_connect` | — | Register as driver |
| `update_location` | `{ lat, lng, address }` | Update driver GPS |
| `accept_ride` | `{ rideId }` | Driver accepts ride |
| `reject_ride` | `{ rideId }` | Driver rejects ride |
| `ride_status_update` | `{ rideId, status, otp? }` | Update ride stage |
| `send_message` | `{ rideId, message, recipientId }` | In-ride chat |

### Server → Client
| Event | Payload | Description |
|-------|---------|-------------|
| `new_ride_request` | `{ rideId, ride }` | New request for drivers |
| `ride_accepted` | `{ rideId, driver }` | Notify rider |
| `ride_status_update` | `{ rideId, status, message }` | Live status |
| `driver_location_update` | `{ rideId, location }` | Live GPS to rider |
| `ride_cancelled` | `{ rideId, reason }` | Cancellation |
| `new_message` | `{ rideId, message, senderId }` | Chat message |

---

## 💳 Payment Integration

### Razorpay (India)
```javascript
// Frontend: Load Razorpay script and open checkout
const order = await paymentService.createRazorpayOrder({ amount: 150, currency: 'INR' });
const rzp = new window.Razorpay({
  key: import.meta.env.VITE_RAZORPAY_KEY_ID,
  order_id: order.id,
  amount: order.amount,
  currency: order.currency,
  handler: async (response) => {
    await paymentService.verifyRazorpay({ ...response, referenceType: 'ride', referenceId: ride._id });
  }
});
rzp.open();
```

### Stripe (International)
Set `STRIPE_SECRET_KEY` in backend `.env` and use the `/api/payments` endpoints.

---

## 🗺️ Maps Configuration

The app uses **OpenStreetMap + Leaflet.js** by default — completely **free, no API key required**.

To use Google Maps instead, install `@react-google-maps/api` and replace `MapView.jsx`:

```bash
cd frontend && npm install @react-google-maps/api
```

Then set `VITE_GOOGLE_MAPS_KEY` in `frontend/.env`.

---

## 📊 MongoDB Data Models

### User
- `name`, `email`, `phone`, `password` (bcrypt)
- `role`: user | driver | admin
- `walletBalance`, `rideCount`, `totalSpent`
- `savedAddresses`, `paymentMethods`
- `referralCode`, `notifications[]`

### Driver
- `user` (ref), `licenseNumber`
- `vehicleDetails`: make, model, year, color, licensePlate, type
- `status`: pending | approved | suspended | rejected
- `currentLocation` (GeoJSON Point, 2dsphere indexed)
- `rating`: average, count, total
- `totalRides`, `totalEarnings`

### Ride
- `rideId` (unique), `rider`, `driver`
- `pickup`, `destination` (address + coordinates)
- `rideType`: economy | standard | premium | bike | auto | xl
- `status`: requested → searching → accepted → driver_arriving → started → completed
- `fare`: baseFare, distanceFare, timeFare, tax, total
- `otp`, `timeline`, `rating`, `payment`

### Delivery
- `deliveryId`, `sender`, `driver`
- `pickup`, `destination` (with contact info)
- `package`: description, weight, category, isFragile
- `status`: requested → accepted → picked_up → in_transit → delivered
- `trackingUpdates[]`, `proofOfDelivery`

---

## 🔒 Security Features

- **Helmet.js** — HTTP security headers
- **bcryptjs** — Password hashing (12 rounds)
- **JWT + Refresh Tokens** — Stateless auth
- **Rate Limiting** — 100 req/15 min per IP
- **CORS** — Whitelisted frontend origin only
- **Input Validation** — express-validator
- **Role-based Authorization** — user | driver | admin
- **Non-root Docker user** — Principle of least privilege

---

## 🚀 Production Deployment

1. Set strong secrets in environment variables
2. Use MongoDB Atlas for production database
3. Set `NODE_ENV=production`
4. Configure HTTPS/SSL at reverse proxy (Nginx/Caddy)
5. Set `FRONTEND_URL` to your actual domain

```bash
# Build production Docker images
docker-compose -f docker-compose.yml up --build -d
```

---

## 📄 License

MIT License — Free to use, modify, and deploy.

Built with ❤️ using React, Node.js, MongoDB, Socket.io & OpenStreetMap
#   S h a r e W a y  
 
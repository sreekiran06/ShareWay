import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
});

// Request interceptor — attach token
api.interceptors.request.use(
  (config) => {
    const stored = localStorage.getItem('shareway-auth');
    if (stored) {
      const { state } = JSON.parse(stored);
      if (state?.token) {
        config.headers.Authorization = `Bearer ${state.token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const stored = localStorage.getItem('shareway-auth');
        if (stored) {
          const { state } = JSON.parse(stored);
          if (state?.refreshToken) {
            const { data } = await axios.post('/api/auth/refresh-token', {
              refreshToken: state.refreshToken
            });
            const newToken = data.token;
            // Update stored token
            const updated = JSON.parse(localStorage.getItem('shareway-auth'));
            updated.state.token = newToken;
            localStorage.setItem('shareway-auth', JSON.stringify(updated));
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return api(originalRequest);
          }
        }
      } catch (_) {
        localStorage.removeItem('shareway-auth');
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// Typed service helpers
export const authService = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
  logout: () => api.post('/auth/logout')
};

export const rideService = {
  estimate: (data) => api.post('/rides/estimate', data),
  book: (data) => api.post('/rides/book', data),
  getStatus: (id) => api.get(`/rides/${id}`),
  cancel: (id, data) => api.put(`/rides/${id}/cancel`, data),
  rate: (id, data) => api.post(`/rides/${id}/rate`, data),
  getHistory: (params) => api.get('/rides/history', { params }),
  getNearbyDrivers: (params) => api.get('/rides/nearby-drivers', { params })
};

export const deliveryService = {
  estimate: (data) => api.post('/deliveries/estimate', data),
  create: (data) => api.post('/deliveries/create', data),
  getStatus: (id) => api.get(`/deliveries/${id}`),
  track: (id) => api.get(`/deliveries/track/${id}`),
  cancel: (id) => api.put(`/deliveries/${id}/cancel`),
  getHistory: (params) => api.get('/deliveries/history', { params })
};

export const driverService = {
  register: (data) => api.post('/drivers/register', data),
  getProfile: () => api.get('/drivers/profile'),
  updateStatus: (data) => api.put('/drivers/status', data),
  updateLocation: (data) => api.put('/drivers/location', data),
  acceptRide: (rideId) => api.post(`/drivers/rides/${rideId}/accept`),
  updateRideStatus: (rideId, data) => api.put(`/drivers/rides/${rideId}/status`, data),
  getEarnings: () => api.get('/drivers/earnings'),
  getRides: (params) => api.get('/drivers/rides', { params })
};

export const adminService = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: (params) => api.get('/admin/users', { params }),
  toggleUserStatus: (userId) => api.put(`/admin/users/${userId}/toggle-status`),
  getDrivers: (params) => api.get('/admin/drivers', { params }),
  approveDriver: (driverId, data) => api.put(`/admin/drivers/${driverId}/status`, data),
  getRides: (params) => api.get('/admin/rides', { params }),
  getDeliveries: (params) => api.get('/admin/deliveries', { params })
};

export const paymentService = {
  createRazorpayOrder: (data) => api.post('/payments/razorpay/order', data),
  verifyRazorpay: (data) => api.post('/payments/razorpay/verify', data),
  getHistory: () => api.get('/payments/history'),
  topUpWallet: (data) => api.post('/payments/wallet/topup', data)
};

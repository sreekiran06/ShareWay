import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import useAuthStore from './store/authStore';
import { connectSocket, disconnectSocket } from './services/socket';
import { GoogleOAuthProvider } from '@react-oauth/google';

// Layouts
import PublicLayout from './components/common/PublicLayout';
import DashboardLayout from './components/common/DashboardLayout';
import DriverLayout from './components/common/DriverLayout';
import AdminLayout from './components/common/AdminLayout';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// User Pages
import HomePage from './pages/user/HomePage';
import BookRidePage from './pages/user/BookRidePage';
import RideTrackingPage from './pages/user/RideTrackingPage';
import SendPackagePage from './pages/user/SendPackagePage';
import DeliveryTrackingPage from './pages/user/DeliveryTrackingPage';
import RideHistoryPage from './pages/user/RideHistoryPage';
import ProfilePage from './pages/user/ProfilePage';

// Driver Pages
import DriverDashboardPage from './pages/driver/DriverDashboardPage';
import DriverRegisterPage from './pages/driver/DriverRegisterPage';
import DriverRidesPage from './pages/driver/DriverRidesPage';
import DriverEarningsPage from './pages/driver/DriverEarningsPage';

// Admin Pages
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminDriversPage from './pages/admin/AdminDriversPage';
import AdminRidesPage from './pages/admin/AdminRidesPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30000, refetchOnWindowFocus: false }
  }
});

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/auth/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user?.role)) return <Navigate to="/" replace />;
  return children;
};

const GuestRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  if (isAuthenticated) return <Navigate to="/" replace />;
  return children;
};

export default function App() {
  const { token, isAuthenticated, refreshMe } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated && token) {
      refreshMe();
      const s = connectSocket(token);
      return () => disconnectSocket();
    }
  }, [isAuthenticated, token]);

  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            {/* Auth Routes */}
            <Route path="/auth" element={<PublicLayout />}>
              <Route path="login" element={<GuestRoute><LoginPage /></GuestRoute>} />
              <Route path="register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
            </Route>

            {/* User/Rider Routes */}
            <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
              <Route index element={<HomePage />} />
              <Route path="book-ride" element={<BookRidePage />} />
              <Route path="ride/:id" element={<RideTrackingPage />} />
              <Route path="send-package" element={<SendPackagePage />} />
              <Route path="delivery/:id" element={<DeliveryTrackingPage />} />
              <Route path="history" element={<RideHistoryPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="driver/register" element={<DriverRegisterPage />} />
            </Route>

            {/* Driver Routes */}
            <Route path="/driver" element={<ProtectedRoute allowedRoles={['driver']}><DriverLayout /></ProtectedRoute>}>
              <Route index element={<DriverDashboardPage />} />
              <Route path="rides" element={<DriverRidesPage />} />
              <Route path="earnings" element={<DriverEarningsPage />} />
            </Route>

            {/* Admin Routes */}
            <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminLayout /></ProtectedRoute>}>
              <Route index element={<AdminDashboardPage />} />
              <Route path="users" element={<AdminUsersPage />} />
              <Route path="drivers" element={<AdminDriversPage />} />
              <Route path="rides" element={<AdminRidesPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>

        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              fontFamily: '"DM Sans", sans-serif',
              borderRadius: '16px',
              padding: '14px 18px',
              fontSize: '14px',
              fontWeight: 500,
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
            },
            success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } }
          }}
        />
      </QueryClientProvider>
    </GoogleOAuthProvider>
  );
}

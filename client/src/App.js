import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/authContext';
import ProtectedRoute from './routes/ProtectedRoute';
import RoleRedirect from './routes/RoleRedirect';

// Layouts
import AppShell from './components/layout/AppShell';
import ProviderShell from './components/layout/ProviderShell';

// Auth Pages
import SignIn from './pages/auth/SignInPage';
import SignUp from './pages/auth/SignUpPage';
import ProviderOnboardingPage from './pages/ProviderOnboardingPage';

// Client Pages
import AppDashboard from './pages/AppDashboard';
import BookingsPage from './pages/BookingsPage';
import MessagesPage from './pages/MessagesPage';
import AccountPage from './pages/AccountPage';
import ProviderPublicProfile from './pages/ProviderPublicProfile';

// Provider Pages
import ProviderDashboard from './pages/provider/ProviderDashboard';
import ProviderSchedule from './pages/provider/ProviderSchedule';
import ProviderEarnings from './pages/provider/ProviderEarnings';
import ProviderMessages from './pages/provider/ProviderMessages';
import ProviderServices from './pages/provider/ProviderServices';
import ProviderProfile from './pages/provider/ProviderProfile';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/auth/sign-in" element={<SignIn />} />
          <Route path="/auth/sign-up" element={<SignUp />} />

          {/* Root Redirect */}
          <Route path="/" element={<RoleRedirect />} />

          {/* Client Routes */}
          <Route
            path="/app"
            element={
              <ProtectedRoute allowedRoles={['client']}>
                <AppShell />
              </ProtectedRoute>
            }
          >
            <Route index element={<AppDashboard />} />
            <Route path="bookings" element={<BookingsPage />} />
            <Route path="messages" element={<MessagesPage />} />
            <Route path="account" element={<AccountPage />} />
            <Route path="provider/:providerId" element={<ProviderPublicProfile />} />
          </Route>

          {/* Provider Routes */}
          <Route
            path="/provider/onboarding"
            element={
              <ProtectedRoute allowedRoles={['provider']} requireProfile={false}>
                <ProviderOnboardingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/provider"
            element={
              <ProtectedRoute allowedRoles={['provider']}>
                <ProviderShell />
              </ProtectedRoute>
            }
          >
            <Route index element={<ProviderDashboard />} />
            <Route path="schedule" element={<ProviderSchedule />} />
            <Route path="earnings" element={<ProviderEarnings />} />
            <Route path="messages" element={<ProviderMessages />} />
            <Route path="services" element={<ProviderServices />} />
            <Route path="profile" element={<ProviderProfile />} />
          </Route>

          {/* Catch all - Redirect to root which handles role redirection */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;

// React import not needed with modern JSX transform
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/authContext';
import { ToastProvider } from './components/ui/ToastProvider';
import { NotificationProvider } from './contexts/NotificationContext';
import { BookingProvider } from './contexts/BookingContext';
import { MessageProvider } from './contexts/MessageContext';
import ProtectedRoute from './routes/ProtectedRoute';
import RoleRedirect from './routes/RoleRedirect';

// Layouts
import AppShell from './components/layout/AppShell';
import ProviderShell from './components/layout/ProviderShell';
import AdminShell from './components/layout/AdminShell';

// Auth Pages
import SignIn from './pages/auth/SignInPage';
import SignUp from './pages/auth/SignUpPage';
import AuthCallback from './pages/AuthCallback';
import ProviderOnboardingPage from './pages/ProviderOnboardingPage';

// Client Pages
import AppDashboard from './pages/AppDashboard';
import BrowsePage from './pages/BrowsePage';
import BookingsPage from './pages/BookingsPage';
import BookingFlowPage from './pages/BookingFlowPage';
import MessagesPage from './pages/MessagesPage';
import NotificationsPage from './pages/NotificationsPage';
import AccountPage from './pages/AccountPage';
import ProviderPublicProfile from './pages/ProviderPublicProfile';
import OnboardingPage from './pages/OnboardingPage';
import ClientInvoices from './pages/ClientInvoices';

// Provider Pages
import ProviderDashboard from './pages/provider/ProviderDashboard';
import ProviderSchedule from './pages/provider/ProviderSchedule';
import ProviderAppointments from './pages/provider/ProviderAppointments';
import ProviderEarnings from './pages/provider/ProviderEarnings';
import ProviderInvoices from './pages/provider/ProviderInvoices';
import ProviderMessages from './pages/provider/ProviderMessages';
import ProviderServices from './pages/provider/ProviderServices';
import ProviderProfile from './pages/provider/ProviderProfile';
import ProviderPromotions from './pages/provider/ProviderPromotions';
import AppointmentRequestAcceptance from './pages/provider/AppointmentRequestAcceptance';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminBookings from './pages/admin/AdminBookings';
import AdminServices from './pages/admin/AdminServices';
import AdminReviews from './pages/admin/AdminReviews';
import AdminRevenue from './pages/admin/AdminRevenue';
import AdminPromotions from './pages/admin/AdminPromotions';

import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <ToastProvider>
            <NotificationProvider>
              <BookingProvider>
                <MessageProvider>
                  <Routes>
                    {/* Public Routes */}
                    <Route path="/auth/sign-in" element={<SignIn />} />
                    <Route path="/auth/sign-up" element={<SignUp />} />
                    <Route path="/auth/callback" element={<AuthCallback />} />

                    {/* Root Redirect */}
                    <Route path="/" element={<RoleRedirect />} />

                    {/* Client Onboarding */}
                    <Route
                      path="/onboarding"
                      element={
                        <ProtectedRoute allowedRoles={['client']} requireProfile={false}>
                          <OnboardingPage />
                        </ProtectedRoute>
                      }
                    />

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
                      <Route path="browse" element={<BrowsePage />} />
                      <Route path="bookings" element={<BookingsPage />} />
                      <Route path="booking-flow" element={<BookingFlowPage />} />
                      <Route path="messages" element={<MessagesPage />} />
                      <Route path="notifications" element={<NotificationsPage />} />
                      <Route path="account" element={<AccountPage />} />
                      <Route path="invoices" element={<ClientInvoices />} />
                      <Route path="provider/:providerId" element={<ProviderPublicProfile />} />
                    </Route>

                    {/* Provider Onboarding */}
                    <Route
                      path="/provider/onboarding"
                      element={
                        <ProtectedRoute allowedRoles={['provider']} requireProfile={false}>
                          <ProviderOnboardingPage />
                        </ProtectedRoute>
                      }
                    />

                    {/* Provider Routes */}
                    <Route
                      path="/provider"
                      element={
                        <ProtectedRoute allowedRoles={['provider']}>
                          <ProviderShell />
                        </ProtectedRoute>
                      }
                    >
                      <Route index element={<ProviderDashboard />} />
                      <Route path="notifications" element={<NotificationsPage />} />
                      <Route path="requests/:requestId" element={<AppointmentRequestAcceptance />} />
                      <Route path="schedule" element={<ProviderSchedule />} />
                      <Route path="appointments" element={<ProviderAppointments />} />
                      <Route path="promotions" element={<ProviderPromotions />} />
                      <Route path="earnings" element={<ProviderEarnings />} />
                      <Route path="invoices" element={<ProviderInvoices />} />
                      <Route path="messages" element={<ProviderMessages />} />
                      <Route path="services" element={<ProviderServices />} />
                      <Route path="profile" element={<ProviderProfile />} />
                    </Route>

                    {/* Admin Routes */}
                    <Route
                      path="/admin"
                      element={
                        <ProtectedRoute allowedRoles={['admin']} requireProfile={false}>
                          <AdminShell />
                        </ProtectedRoute>
                      }
                    >
                      <Route index element={<AdminDashboard />} />
                      <Route path="users" element={<AdminUsers />} />
                      <Route path="bookings" element={<AdminBookings />} />
                      <Route path="services" element={<AdminServices />} />
                      <Route path="reviews" element={<AdminReviews />} />
                      <Route path="revenue" element={<AdminRevenue />} />
                      <Route path="promotions" element={<AdminPromotions />} />
                    </Route>

                    {/* Shared/Preview Routes - Standalone without AppShell */}
                    <Route
                      path="/preview/provider/:providerId"
                      element={
                        <ProtectedRoute allowedRoles={['client', 'provider']}>
                          <ProviderPublicProfile />
                        </ProtectedRoute>
                      }
                    />

                    {/* Catch all - Redirect to root which handles role redirection */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </MessageProvider>
              </BookingProvider>
            </NotificationProvider>
          </ToastProvider>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;

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

// React import not needed with modern JSX transform
import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { API_BASE } from './data/apiClient';
import { AuthProvider } from './auth/authContext';
import { ToastProvider } from './components/ui/ToastProvider';
import { NotificationProvider } from './contexts/NotificationContext';
import { BookingProvider } from './contexts/BookingContext';
import { MessageProvider } from './contexts/MessageContext';
import ProtectedRoute from './routes/ProtectedRoute';
import RoleRedirect from './routes/RoleRedirect';

// Layouts
import AppLayout from './components/layout/AppLayout';
import ProviderLayout from './components/layout/ProviderLayout';
import AdminShell from './components/layout/AdminShell';

// Auth Pages
import SignIn from './pages/auth/SignInPage';
import SignUp from './pages/auth/SignUpPage';
import AuthCallback from './pages/AuthCallback';
import ProviderOnboardingPage from './pages/ProviderOnboardingPage';
import InviteFlow from './pages/InviteFlow';
import PublicBookingFlow from './pages/PublicBookingFlow';

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
import RelationshipPage from './pages/RelationshipPage';
import BookingConfirmPage from './pages/BookingConfirmPage';
import ReviewPage from './pages/ReviewPage';

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
import ProviderClients from './pages/provider/ProviderClients';
import ProviderClientTimeline from './pages/provider/ProviderClientTimeline';
import ProviderServiceEditor from './pages/provider/ProviderServiceEditor';
import AppointmentRequestAcceptance from './pages/provider/AppointmentRequestAcceptance';
import ProviderNotifications from './pages/provider/ProviderNotifications';
import ProviderAppointmentDetail from './pages/provider/ProviderAppointmentDetail';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import AdminUsers from './pages/admin/AdminUsers';
import AdminBookings from './pages/admin/AdminBookings';
import AdminDisputes from './pages/admin/AdminDisputes';
import AdminServices from './pages/admin/AdminServices';
import AdminReviews from './pages/admin/AdminReviews';
import AdminRevenue from './pages/admin/AdminRevenue';
import AdminPromotions from './pages/admin/AdminPromotions';

// Provider Analytics
import ProviderAnalytics from './pages/provider/ProviderAnalytics';

import ErrorBoundary from './components/ErrorBoundary';

function App() {
  // Warm up the Render server on app load so it's ready when the user needs it
  useEffect(() => {
    fetch(`${API_BASE}/health`, { method: 'GET' }).catch(() => {});
  }, []);

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
                    <Route path="/join/:code" element={<InviteFlow />} />
                    <Route path="/book/:handle" element={<PublicBookingFlow />} />

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
                          <AppLayout />
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
                      <Route path="relationship/:providerId" element={<RelationshipPage />} />
                      <Route path="book/confirm" element={<BookingConfirmPage />} />
                      <Route path="review" element={<ReviewPage />} />
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
                          <ProviderLayout />
                        </ProtectedRoute>
                      }
                    >
                      <Route index element={<ProviderDashboard />} />
                      <Route path="notifications" element={<ProviderNotifications />} />
                      <Route path="requests/:requestId" element={<AppointmentRequestAcceptance />} />
                      <Route path="schedule" element={<ProviderSchedule />} />
                      <Route path="appointments" element={<ProviderAppointments />} />
                      <Route path="appointments/:id" element={<ProviderAppointmentDetail />} />
                      <Route path="clients" element={<ProviderClients />} />
                      <Route path="client/:clientId" element={<ProviderClientTimeline />} />
                      <Route path="promotions" element={<ProviderPromotions />} />
                      <Route path="earnings" element={<ProviderEarnings />} />
                      <Route path="analytics" element={<ProviderAnalytics />} />
                      <Route path="invoices" element={<ProviderInvoices />} />
                      <Route path="messages" element={<ProviderMessages />} />
                      <Route path="services" element={<ProviderServices />} />
                      <Route path="services/new" element={<ProviderServiceEditor />} />
                      <Route path="services/:id" element={<ProviderServiceEditor />} />
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
                      <Route path="analytics" element={<AdminAnalytics />} />
                      <Route path="users" element={<AdminUsers />} />
                      <Route path="bookings" element={<AdminBookings />} />
                      <Route path="disputes" element={<AdminDisputes />} />
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

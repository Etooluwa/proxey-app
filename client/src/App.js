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
import ErrorBoundary from './components/ErrorBoundary';

// Layouts
import AppLayout from './components/layout/AppLayout';
import ProviderLayout from './components/layout/ProviderLayout';
import AdminShell from './components/layout/AdminShell';

// ── Auth / onboarding ────────────────────────────────────────────────────────
import LoginPage from './pages/auth/LoginPage';
import SignIn from './pages/auth/SignInPage';
import SignUp from './pages/auth/SignUpPage';
import AuthCallback from './pages/AuthCallback';
import ClientOnboarding from './pages/ClientOnboarding';
import ProviderOnboarding from './pages/ProviderOnboarding';

// ── Public (no auth) ─────────────────────────────────────────────────────────
import ProviderPublicProfile from './pages/ProviderPublicProfile';
import InviteFlow from './pages/InviteFlow';

// ── Client pages ─────────────────────────────────────────────────────────────
import AppDashboard from './pages/AppDashboard';
import RelationshipPage from './pages/RelationshipPage';
import BookingFlowPage from './pages/BookingFlowPage';
import ReviewPage from './pages/ReviewPage';
import MessagesPage from './pages/MessagesPage';
import ChatPage from './pages/ChatPage';
import NotificationsPage from './pages/NotificationsPage';
import AllNotificationsPage from './pages/AllNotificationsPage';
import AccountPage from './pages/AccountPage';
import ClientBookings from './pages/ClientBookings';

// ── Provider pages ───────────────────────────────────────────────────────────
import ProviderDashboard from './pages/provider/ProviderDashboard';
import ProviderAppointments from './pages/provider/ProviderAppointments';
import ProviderAppointmentDetail from './pages/provider/ProviderAppointmentDetail';
import ProviderClients from './pages/provider/ProviderClients';
import ProviderClientTimeline from './pages/provider/ProviderClientTimeline';
import ProviderServices from './pages/provider/ProviderServices';
import ProviderServiceEditor from './pages/provider/ProviderServiceEditor';
import ProviderSchedule from './pages/provider/ProviderSchedule';
import AvailabilityPage from './pages/provider/AvailabilityPage';
import BlockTimePage from './pages/provider/BlockTimePage';
import ProviderMessages from './pages/provider/ProviderMessages';
import ProviderEarnings from './pages/provider/ProviderEarnings';
import ProviderNotifications from './pages/provider/ProviderNotifications';
import ProviderAllNotifications from './pages/provider/ProviderAllNotifications';
import ProviderProfile from './pages/provider/ProviderProfile';
import ProviderPersonalDetails from './pages/provider/ProviderPersonalDetails';
import ProviderBusinessDetails from './pages/provider/ProviderBusinessDetails';
import ProviderPhotosPortfolio from './pages/provider/ProviderPhotosPortfolio';
import ProviderPayoutsBilling from './pages/provider/ProviderPayoutsBilling';
import ProviderWorkingHours from './pages/provider/ProviderWorkingHours';
import ProviderNotifSettings from './pages/provider/ProviderNotifSettings';
import ProviderBookingSettings from './pages/provider/ProviderBookingSettings';
import HelpSupport from './pages/provider/HelpSupport';
import ProviderNewServiceGroup from './pages/provider/ProviderNewServiceGroup';
import ProviderGroupEditor from './pages/provider/ProviderGroupEditor';
import ClientPersonalDetails from './pages/ClientPersonalDetails';
import ClientPaymentMethods from './pages/ClientPaymentMethods';
import ClientNotifSettings from './pages/ClientNotifSettings';
import ClientPrivacySecurity from './pages/ClientPrivacySecurity';
import DeleteAccountPage from './pages/DeleteAccountPage';

// ── Admin pages ──────────────────────────────────────────────────────────────
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import AdminUsers from './pages/admin/AdminUsers';
import AdminBookings from './pages/admin/AdminBookings';
import AdminDisputes from './pages/admin/AdminDisputes';
import AdminServices from './pages/admin/AdminServices';
import AdminReviews from './pages/admin/AdminReviews';
import AdminRevenue from './pages/admin/AdminRevenue';
import AdminPromotions from './pages/admin/AdminPromotions';

function App() {
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

                    {/* ── Public routes (no auth) ──────────────────────────── */}
                    <Route path="/book/:handle" element={<ProviderPublicProfile />} />
                    <Route path="/join/:code" element={<InviteFlow />} />

                    {/* ── Auth routes ──────────────────────────────────────── */}
                    <Route path="/login" element={<LoginPage />} />
                    {/* Legacy auth paths kept for email-link compatibility */}
                    <Route path="/auth/login" element={<LoginPage />} />
                    <Route path="/auth/sign-in" element={<SignIn />} />
                    <Route path="/auth/sign-up" element={<SignUp />} />
                    <Route path="/auth/callback" element={<AuthCallback />} />

                    {/* ── Onboarding ───────────────────────────────────────── */}
                    <Route
                      path="/onboarding/client"
                      element={
                        <ProtectedRoute allowedRoles={['client']} requireProfile={false}>
                          <ClientOnboarding />
                        </ProtectedRoute>
                      }
                    />
                    {/* Legacy path kept for existing magic-link redirects */}
                    <Route
                      path="/onboarding"
                      element={
                        <ProtectedRoute allowedRoles={['client']} requireProfile={false}>
                          <ClientOnboarding />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/onboarding/provider"
                      element={
                        <ProtectedRoute allowedRoles={['provider']} requireProfile={false}>
                          <ProviderOnboarding />
                        </ProtectedRoute>
                      }
                    />
                    {/* Legacy provider onboarding path */}
                    <Route
                      path="/provider/onboarding"
                      element={
                        <ProtectedRoute allowedRoles={['provider']} requireProfile={false}>
                          <ProviderOnboarding />
                        </ProtectedRoute>
                      }
                    />

                    {/* ── Root redirect (role-based) ───────────────────────── */}
                    <Route path="/" element={<RoleRedirect />} />

                    {/* ── Client routes ───────────────────────────────────── */}
                    <Route
                      path="/app"
                      element={
                        <ProtectedRoute allowedRoles={['client']}>
                          <AppLayout />
                        </ProtectedRoute>
                      }
                    >
                      {/* /app → My Kliques */}
                      <Route index element={<AppDashboard />} />
                      {/* Relationship timeline with a specific provider */}
                      <Route path="relationship/:providerId" element={<RelationshipPage />} />
                      {/* Booking flow (multi-step) */}
                      <Route path="book/:providerId" element={<BookingFlowPage />} />
                      {/* Leave a review */}
                      <Route path="review/:bookingId" element={<ReviewPage />} />
                      {/* Messaging */}
                      <Route path="messages" element={<MessagesPage />} />
                      <Route path="messages/:conversationId" element={<ChatPage />} />
                      {/* Bookings */}
                      <Route path="bookings" element={<ClientBookings />} />
                      {/* Notifications */}
                      <Route path="notifications" element={<NotificationsPage />} />
                      <Route path="notifications/all" element={<AllNotificationsPage />} />
                      {/* Profile / account */}
                      <Route path="profile" element={<AccountPage />} />
                      <Route path="profile/personal" element={<ClientPersonalDetails />} />
                      <Route path="profile/payment-methods" element={<ClientPaymentMethods />} />
                      <Route path="profile/notifications" element={<ClientNotifSettings />} />
                      <Route path="profile/privacy" element={<ClientPrivacySecurity />} />
                      <Route path="profile/privacy/delete" element={<DeleteAccountPage />} />
                      <Route path="profile/help" element={<HelpSupport />} />
                      {/* Legacy paths — redirect to canonical routes */}
                      <Route path="account" element={<Navigate to="/app/profile" replace />} />
                      <Route path="browse" element={<Navigate to="/app" replace />} />
                    </Route>

                    {/* ── Provider routes ─────────────────────────────────── */}
                    <Route
                      path="/provider"
                      element={
                        <ProtectedRoute allowedRoles={['provider']}>
                          <ProviderLayout />
                        </ProtectedRoute>
                      }
                    >
                      {/* /provider → Dashboard */}
                      <Route index element={<ProviderDashboard />} />
                      {/* Bookings — 3-tab view (Pending / Upcoming / Past) */}
                      <Route path="bookings" element={<ProviderAppointments />} />
                      <Route path="bookings/all" element={<ProviderAppointments />} />
                      <Route path="appointments/:id" element={<ProviderAppointmentDetail />} />
                      {/* My kliques (client list) */}
                      <Route path="clients" element={<ProviderClients />} />
                      <Route path="clients/:clientId" element={<ProviderClientTimeline />} />
                      {/* Services */}
                      <Route path="services" element={<ProviderServices />} />
                      <Route path="services/groups/new" element={<ProviderNewServiceGroup />} />
                      <Route path="services/groups/:groupId" element={<ProviderGroupEditor />} />
                      <Route path="services/new" element={<ProviderServiceEditor />} />
                      <Route path="services/:id" element={<ProviderServiceEditor />} />
                      {/* Calendar */}
                      <Route path="calendar" element={<ProviderSchedule />} />
                      <Route path="calendar/availability" element={<AvailabilityPage />} />
                      <Route path="calendar/block" element={<BlockTimePage />} />
                      {/* Messages */}
                      <Route path="messages" element={<ProviderMessages />} />
                      <Route path="messages/:conversationId" element={<ChatPage />} />
                      {/* Earnings */}
                      <Route path="earnings" element={<ProviderEarnings />} />
                      {/* Notifications */}
                      <Route path="notifications" element={<ProviderNotifications />} />
                      <Route path="notifications/all" element={<ProviderAllNotifications />} />
                      {/* Profile */}
                      <Route path="profile" element={<ProviderProfile />} />
                      <Route path="profile/personal" element={<ProviderPersonalDetails />} />
                      <Route path="profile/business" element={<ProviderBusinessDetails />} />
                      <Route path="profile/photos" element={<ProviderPhotosPortfolio />} />
                      <Route path="profile/payouts" element={<ProviderPayoutsBilling />} />
                      <Route path="profile/hours" element={<ProviderWorkingHours />} />
                      <Route path="profile/notifications" element={<ProviderNotifSettings />} />
                      <Route path="profile/booking-settings" element={<ProviderBookingSettings />} />
                      <Route path="profile/help" element={<HelpSupport />} />
                      <Route path="profile/delete" element={<DeleteAccountPage />} />
                      {/* Legacy paths — redirect to canonical routes */}
                      <Route path="appointments" element={<Navigate to="/provider/bookings" replace />} />
                      <Route path="schedule" element={<Navigate to="/provider/calendar" replace />} />
                      <Route path="availability" element={<Navigate to="/provider/calendar/availability" replace />} />
                      <Route path="block-time" element={<Navigate to="/provider/calendar/block" replace />} />
                      {/* Legacy /provider/client/:id path handled by clients/:clientId above */}
                      <Route path="client/:clientId" element={<ProviderClientTimeline />} />
                    </Route>

                    {/* ── Admin routes ─────────────────────────────────────── */}
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

                    {/* ── Catch-all ────────────────────────────────────────── */}
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

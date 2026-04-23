import { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { API_BASE } from './data/apiClient';
import { AuthProvider } from './auth/authContext';
import { ToastProvider } from './components/ui/ToastProvider';
import { NotificationProvider } from './contexts/NotificationContext';
import { BookingProvider } from './contexts/BookingContext';
import { MessageProvider } from './contexts/MessageContext';
import ProtectedRoute from './routes/ProtectedRoute';
import RoleRedirect from './routes/RoleRedirect';
import ErrorBoundary from './components/ErrorBoundary';

const AppLayout = lazy(() => import('./components/layout/AppLayout'));
const ProviderLayout = lazy(() => import('./components/layout/ProviderLayout'));
const AdminShell = lazy(() => import('./components/layout/AdminShell'));

const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const AuthCallback = lazy(() => import('./pages/AuthCallback'));
const ClientOnboarding = lazy(() => import('./pages/ClientOnboarding'));
const ProviderOnboarding = lazy(() => import('./pages/ProviderOnboardingPage'));

const PublicBookingPage = lazy(() => import('./pages/PublicBookingPage'));
const InviteAcceptPage = lazy(() => import('./pages/InviteAcceptPage'));

const AppDashboard = lazy(() => import('./pages/AppDashboard'));
const RelationshipPage = lazy(() => import('./pages/RelationshipPage'));
const BookingFlowPage = lazy(() => import('./pages/BookingFlowPage'));
const ReviewPage = lazy(() => import('./pages/ReviewPage'));
const MessagesPage = lazy(() => import('./pages/MessagesPage'));
const ChatPage = lazy(() => import('./pages/ChatPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const AllNotificationsPage = lazy(() => import('./pages/AllNotificationsPage'));
const AccountPage = lazy(() => import('./pages/AccountPage'));
const ClientBookings = lazy(() => import('./pages/ClientBookings'));
const ClientBookingDetail = lazy(() => import('./pages/ClientBookingDetail'));
const ClientInvoices = lazy(() => import('./pages/ClientInvoices'));
const ClientPersonalDetails = lazy(() => import('./pages/ClientPersonalDetails'));
const ClientPaymentMethods = lazy(() => import('./pages/ClientPaymentMethods'));
const ClientNotifSettings = lazy(() => import('./pages/ClientNotifSettings'));
const ClientPrivacySecurity = lazy(() => import('./pages/ClientPrivacySecurity'));
const DeleteAccountPage = lazy(() => import('./pages/DeleteAccountPage'));
const FAQPage = lazy(() => import('./pages/FAQPage'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const LandingPage = lazy(() => import('./pages/LandingPage'));

const ProviderDashboard = lazy(() => import('./pages/provider/ProviderDashboard'));
const ProviderAppointments = lazy(() => import('./pages/provider/ProviderAppointments'));
const ProviderAppointmentDetail = lazy(() => import('./pages/provider/ProviderAppointmentDetail'));
const ProviderClients = lazy(() => import('./pages/provider/ProviderClients'));
const ProviderClientTimeline = lazy(() => import('./pages/provider/ProviderClientTimeline'));
const ProviderServices = lazy(() => import('./pages/provider/ProviderServices'));
const ProviderServiceEditor = lazy(() => import('./pages/provider/ProviderServiceEditor'));
const ProviderSchedule = lazy(() => import('./pages/provider/ProviderSchedule'));
const AvailabilityPage = lazy(() => import('./pages/provider/AvailabilityPage'));
const BlockTimePage = lazy(() => import('./pages/provider/BlockTimePage'));
const ProviderMessages = lazy(() => import('./pages/provider/ProviderMessages'));
const ProviderEarnings = lazy(() => import('./pages/provider/ProviderEarnings'));
const ProviderNotifications = lazy(() => import('./pages/provider/ProviderNotifications'));
const ProviderAllNotifications = lazy(() => import('./pages/provider/ProviderAllNotifications'));
const ProviderProfile = lazy(() => import('./pages/provider/ProviderProfile'));
const ProviderPersonalDetails = lazy(() => import('./pages/provider/ProviderPersonalDetails'));
const ProviderBusinessDetails = lazy(() => import('./pages/provider/ProviderBusinessDetails'));
const ProviderPhotosPortfolio = lazy(() => import('./pages/provider/ProviderPhotosPortfolio'));
const ProviderPayoutsBilling = lazy(() => import('./pages/provider/ProviderPayoutsBilling'));
const ProviderWorkingHours = lazy(() => import('./pages/provider/ProviderWorkingHours'));
const ProviderNotifSettings = lazy(() => import('./pages/provider/ProviderNotifSettings'));
const ProviderBookingSettings = lazy(() => import('./pages/provider/ProviderBookingSettings'));
const HelpSupport = lazy(() => import('./pages/provider/HelpSupport'));
const ProviderNewServiceGroup = lazy(() => import('./pages/provider/ProviderNewServiceGroup'));
const ProviderGroupEditor = lazy(() => import('./pages/provider/ProviderGroupEditor'));
const ProviderInsights = lazy(() => import('./pages/provider/ProviderInsights'));

const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminAnalytics = lazy(() => import('./pages/admin/AdminAnalytics'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminBookings = lazy(() => import('./pages/admin/AdminBookings'));
const AdminDisputes = lazy(() => import('./pages/admin/AdminDisputes'));
const AdminServices = lazy(() => import('./pages/admin/AdminServices'));
const AdminReviews = lazy(() => import('./pages/admin/AdminReviews'));
const AdminRevenue = lazy(() => import('./pages/admin/AdminRevenue'));
const AdminPromotions = lazy(() => import('./pages/admin/AdminPromotions'));

function ScrollToTopOnRouteChange() {
  const location = useLocation();

  useEffect(() => {
    if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    const resetScroll = () => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;

      document.querySelectorAll('main').forEach((node) => {
        if (node instanceof HTMLElement) node.scrollTop = 0;
      });

      document.querySelectorAll('.overflow-y-auto').forEach((node) => {
        if (node instanceof HTMLElement) node.scrollTop = 0;
      });
    };

    resetScroll();

    const raf = window.requestAnimationFrame(resetScroll);
    return () => window.cancelAnimationFrame(raf);
  }, [location.pathname, location.search]);

  return null;
}

function AuthRedirectShim() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const hash = window.location.hash || '';
    if (!hash || location.pathname !== '/') return;

    const rawHash = hash.startsWith('#') ? hash.slice(1) : hash;
    const hashParams = new URLSearchParams(rawHash);
    const looksLikeAuthPayload =
      hashParams.has('access_token') ||
      hashParams.has('refresh_token') ||
      hashParams.has('error') ||
      hashParams.has('error_code') ||
      hashParams.has('type');

    if (!looksLikeAuthPayload) return;

    navigate(`/auth/callback#${rawHash}`, { replace: true });
  }, [location.pathname, navigate]);

  return null;
}

function RouteFallback() {
  return (
    <div
      aria-hidden="true"
      style={{
        minHeight: '100vh',
        background: '#FBF7F2',
      }}
    >
      <span
        aria-live="polite"
        style={{
          position: 'absolute',
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          border: 0,
        }}
      >
        Loading…
      </span>
    </div>
  );
}

function App() {
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      fetch(`${API_BASE}/health`, { method: 'GET' }).catch(() => {});
    }, 1500);

    return () => window.clearTimeout(timeoutId);
  }, []);

  return (
    <ErrorBoundary>
      <Router>
        <ScrollToTopOnRouteChange />
        <AuthRedirectShim />
        <AuthProvider>
          <ToastProvider>
            <NotificationProvider>
              <BookingProvider>
                <MessageProvider>
                  <Suspense fallback={<RouteFallback />}>
                    <Routes>

                    {/* ── Public routes (no auth) ──────────────────────────── */}
                    <Route path="/welcome" element={<LandingPage />} />
                    <Route path="/book/:handle" element={<PublicBookingPage />} />
                    <Route path="/join/:code" element={<InviteAcceptPage />} />
                    <Route path="/terms" element={<TermsOfService publicView />} />
                    <Route path="/policy" element={<PrivacyPolicy publicView />} />

                    {/* ── Auth routes ──────────────────────────────────────── */}
                    <Route path="/login" element={<LoginPage />} />
                    {/* Legacy auth paths — redirect to /login */}
                    <Route path="/auth/login" element={<Navigate to="/login" replace />} />
                    <Route path="/auth/sign-in" element={<Navigate to="/login" replace />} />
                    <Route path="/auth/sign-up" element={<Navigate to="/login" replace />} />
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
                      <Route path="book" element={<BookingFlowPage />} />
                      <Route path="book/:providerId" element={<BookingFlowPage />} />
                      <Route path="booking-flow" element={<BookingFlowPage />} />
                      <Route path="booking-flow/:providerId" element={<BookingFlowPage />} />
                      {/* Leave a review */}
                      <Route path="review/:bookingId" element={<ReviewPage />} />
                      {/* Messaging */}
                      <Route path="messages" element={<MessagesPage />} />
                      <Route path="messages/:conversationId" element={<ChatPage />} />
                      {/* Bookings */}
                      <Route path="bookings" element={<ClientBookings />} />
                      <Route path="bookings/:id" element={<ClientBookingDetail />} />
                      {/* Invoices */}
                      <Route path="invoices" element={<ClientInvoices />} />
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
                      <Route path="profile/help/faq" element={<FAQPage />} />
                      <Route path="profile/help/terms" element={<TermsOfService />} />
                      <Route path="profile/help/privacy-policy" element={<PrivacyPolicy />} />
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
                      {/* Client Insights */}
                      <Route path="insights" element={<ProviderInsights />} />
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
                      <Route path="profile/help/faq" element={<FAQPage />} />
                      <Route path="profile/help/terms" element={<TermsOfService />} />
                      <Route path="profile/help/privacy-policy" element={<PrivacyPolicy />} />
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
                  </Suspense>
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

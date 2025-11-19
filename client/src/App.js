import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AppShell from "./components/layout/AppShell";
import ProtectedRoute from "./routes/ProtectedRoute";
import RoleRedirect from "./routes/RoleRedirect";
import AppDashboard from "./pages/AppDashboard";
import BrowsePage from "./pages/BrowsePage";
import BookingFlowPage from "./pages/BookingFlowPage";
import BookingConfirmPage from "./pages/BookingConfirmPage";
import BookingsPage from "./pages/BookingsPage";
import MessagesPage from "./pages/MessagesPage";
import AccountPage from "./pages/AccountPage";
import OnboardingPage from "./pages/OnboardingPage";
import ProviderOnboardingPage from "./pages/ProviderOnboardingPage";
import ProviderProfilePage from "./pages/ProviderProfilePage";
import SignInPage from "./pages/auth/SignInPage";
import SignUpPage from "./pages/auth/SignUpPage";
import BookingCheckoutPage from "./pages/BookingCheckoutPage";
import SuccessPage from "./pages/SuccessPage";
import CancelPage from "./pages/CancelPage";
import ProviderRoute from "./routes/ProviderRoute";
import ProviderShell from "./components/layout/ProviderShell";
import ProviderDashboard from "./pages/provider/ProviderDashboard";
import ProviderJobs from "./pages/provider/ProviderJobs";
import ProviderEarnings from "./pages/provider/ProviderEarnings";
import ProviderSchedule from "./pages/provider/ProviderSchedule";
import ProviderProfile from "./pages/provider/ProviderProfile";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RoleRedirect />} />

        <Route path="/auth/sign-in" element={<SignInPage />} />
        <Route path="/auth/sign-up" element={<SignUpPage />} />

        <Route element={<ProtectedRoute requireProfile={false} />}>
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/provider/onboarding" element={<ProviderOnboardingPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route path="/app" element={<AppDashboard />} />
            <Route path="/app/browse" element={<BrowsePage />} />
            <Route path="/app/provider/:providerId" element={<ProviderProfilePage />} />
            <Route path="/app/book" element={<BookingFlowPage />} />
            <Route path="/app/book/confirm" element={<BookingConfirmPage />} />
            <Route path="/app/bookings" element={<BookingsPage />} />
            <Route path="/app/messages" element={<MessagesPage />} />
            <Route path="/app/account" element={<AccountPage />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute requireProfile={false} />}>
          <Route element={<ProviderRoute />}>
            <Route element={<ProviderShell />}>
              <Route path="/provider" element={<ProviderDashboard />} />
              <Route path="/provider/jobs" element={<ProviderJobs />} />
              <Route path="/provider/earnings" element={<ProviderEarnings />} />
              <Route path="/provider/schedule" element={<ProviderSchedule />} />
              <Route path="/provider/profile" element={<ProviderProfile />} />
            </Route>
          </Route>
        </Route>

        <Route path="/checkout" element={<BookingCheckoutPage />} />
        <Route path="/success" element={<SuccessPage />} />
        <Route path="/cancel" element={<CancelPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

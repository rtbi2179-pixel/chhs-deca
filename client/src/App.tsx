import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AdminModeProvider } from "./contexts/AdminModeContext";
import { SchoolCodeProvider } from "./contexts/SchoolCodeContext";
import Navigation from "./components/Navigation";
import Home from "./pages/Home";
import Events from "./pages/Events";
import Practice from "./pages/Practice";
import CalendarPage from "./pages/CalendarPage";
import MembersPage from "./pages/MembersPage";
import PortfolioPage from "./pages/PortfolioPage";
import Volunteer from "./pages/Volunteer";
import Discussions from "./pages/Discussions";
import SpeechAI from "./pages/SpeechAI";
import Leaderboard from "./pages/Leaderboard";
import LoginSignup from "./pages/LoginSignup";
import { VerifyEmail } from "./pages/VerifyEmail";
import { ResetPassword } from "./pages/ResetPassword";
import { ForgotPassword } from "./pages/ForgotPassword";
import { TwoFactorAuth } from "./pages/TwoFactorAuth";
import { SchoolCodeEntry } from "./pages/SchoolCodeEntry";
import { AdminPanel } from "./pages/AdminPanel";
import { Announcements } from "./pages/Announcements";
import Profile from "./pages/Profile";
import Footer from "./components/Footer";
import { useAuth } from "@/_core/hooks/useAuth";
import { useState, useEffect } from "react";
import { Toast, useToast } from "./components/Toast";
import { useLocation } from "wouter";
import { DirectMessagesPanel } from "./components/DirectMessagesPanel";

function ProtectedRoute({ component: Component, requiresSchoolCode = true, ...rest }: any) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Home />;
  }

  // Check if school code is required and user doesn't have one
  if (requiresSchoolCode && !user.schoolCode) {
    return <Home />;
  }

  return <Component {...rest} />;
}

function Router({ isAuthenticated, showLoginRequired }: { isAuthenticated: boolean; showLoginRequired: () => void }) {
  const [location] = useLocation();

  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={LoginSignup} />
      <Route path="/events" component={(props) => <ProtectedRoute component={Events} {...props} />} />
      <Route path="/practice" component={(props) => <ProtectedRoute component={Practice} {...props} />} />
      <Route path="/leaderboard" component={(props) => <ProtectedRoute component={Leaderboard} {...props} />} />
      <Route path="/calendar" component={(props) => <ProtectedRoute component={CalendarPage} {...props} />} />
      <Route path="/chapter/members" component={(props) => <ProtectedRoute component={MembersPage} {...props} />} />
      <Route path="/portfolio" component={(props) => <ProtectedRoute component={PortfolioPage} {...props} />} />
      <Route path="/volunteer" component={(props) => <ProtectedRoute component={Volunteer} {...props} />} />
      <Route path="/discussions" component={(props) => <ProtectedRoute component={Discussions} {...props} />} />
      <Route path="/announcements" component={(props) => <ProtectedRoute component={Announcements} {...props} />} />
      <Route path="/speech-ai" component={(props) => <ProtectedRoute component={SpeechAI} {...props} />} />
      <Route path="/verify-email" component={VerifyEmail} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/2fa" component={TwoFactorAuth} />
      <Route path="/school-code" component={SchoolCodeEntry} />
      <Route path="/admin" component={(props) => <ProtectedRoute component={AdminPanel} {...props} />} />
      <Route path="/profile" component={(props) => <ProtectedRoute component={Profile} {...props} />} />

      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const { user, loading } = useAuth();
  const { toasts, addToast, removeToast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (!loading) {
      setIsAuthenticated(!!user);
    }
  }, [user, loading]);

  const handleLoginRequired = () => {
    addToast("Log in required", "warning", 3000);
  };

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <AdminModeProvider>
          <SchoolCodeProvider>
            <TooltipProvider>
            <Toaster />
            <Toast toasts={toasts} onRemove={removeToast} />
            <Navigation onLoginRequired={handleLoginRequired} />
            <Router isAuthenticated={isAuthenticated} showLoginRequired={handleLoginRequired} />
            <DirectMessagesPanel />
            <Footer />
            </TooltipProvider>
          </SchoolCodeProvider>
        </AdminModeProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

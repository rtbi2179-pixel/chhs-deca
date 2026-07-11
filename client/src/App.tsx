import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Navigation from "./components/Navigation";
import Home from "./pages/Home";
import Events from "./pages/Events";
import Practice from "./pages/Practice";
import CalendarPage from "./pages/CalendarPage";
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
import { useAuth } from "@/_core/hooks/useAuth";
import { useState, useEffect } from "react";
import { Toast, useToast } from "./components/Toast";

function ProtectedRoute({ component: Component, ...rest }: any) {
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

  return <Component {...rest} />;
}

function Router({ isAuthenticated, showLoginRequired }: { isAuthenticated: boolean; showLoginRequired: () => void }) {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={LoginSignup} />
      <Route path="/events" component={Events} />
      <Route path="/practice" component={Practice} />
      <Route path="/leaderboard" component={Leaderboard} />
      <Route path="/calendar" component={CalendarPage} />
      <Route path="/volunteer" component={Volunteer} />
      <Route path="/discussions" component={Discussions} />
      <Route path="/announcements" component={Announcements} />
      <Route path="/speech-ai" component={SpeechAI} />
      <Route path="/verify-email" component={VerifyEmail} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/2fa" component={TwoFactorAuth} />
      <Route path="/school-code" component={SchoolCodeEntry} />
      <Route path="/admin" component={AdminPanel} />

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
        <TooltipProvider>
          <Toaster />
          <Toast toasts={toasts} onRemove={removeToast} />
          <Navigation onLoginRequired={handleLoginRequired} />
          <Router isAuthenticated={isAuthenticated} showLoginRequired={handleLoginRequired} />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

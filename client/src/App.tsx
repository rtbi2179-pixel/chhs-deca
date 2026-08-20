import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AdminModeProvider } from "./contexts/AdminModeContext";
import { SchoolCodeProvider } from "./contexts/SchoolCodeContext";
import { SidebarNavigation } from "./components/SidebarNavigation";
import { SignedOutWelcome } from "./components/SignedOutWelcome";
import Footer from "./components/Footer";
import { useAuth } from "@/_core/hooks/useAuth";
import { SIGNED_OUT_WELCOME_SESSION_KEY, shouldShowSignedOutWelcome } from "./lib/signedOutWelcome";
import { lazy, Suspense, useState, useEffect } from "react";
import { Toast, useToast } from "./components/Toast";
import { useLocation } from "wouter";
import { BlueBlazerCursor } from "./components/BlueBlazerCursor";
import { isStaleDynamicImportError, recoverStaleDynamicImportInBrowser } from "./lib/dynamicImportRecovery";

const NotFound = lazy(() => import("@/pages/NotFound"));
const Home = lazy(() => import("./pages/Home"));
const Events = lazy(() => import("./pages/Events"));
const Practice = lazy(() => import("./pages/Practice"));
const PracticeQuestions = lazy(() => import("./pages/PracticeQuestions"));
const CalendarPage = lazy(() => import("./pages/CalendarPage"));
const MembersPage = lazy(() => import("./pages/MembersPage"));
const Volunteer = lazy(() => import("./pages/Volunteer"));
const Discussions = lazy(() => import("./pages/Discussions"));
const SpeechAI = lazy(() => import("./pages/SpeechAI"));
const RoleplayAI = lazy(() => import("./pages/RoleplayAI"));
const WrittenEventAI = lazy(() => import("./pages/WrittenEventAI"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const LoginSignup = lazy(() => import("./pages/LoginSignup"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail").then((module) => ({ default: module.VerifyEmail })));
const ResetPassword = lazy(() => import("./pages/ResetPassword").then((module) => ({ default: module.ResetPassword })));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword").then((module) => ({ default: module.ForgotPassword })));
const TwoFactorAuth = lazy(() => import("./pages/TwoFactorAuth").then((module) => ({ default: module.TwoFactorAuth })));
const SchoolCodeEntry = lazy(() => import("./pages/SchoolCodeEntry").then((module) => ({ default: module.SchoolCodeEntry })));
const AdminPanel = lazy(() => import("./pages/AdminPanel").then((module) => ({ default: module.AdminPanel })));
const Announcements = lazy(() => import("./pages/Announcements").then((module) => ({ default: module.Announcements })));
const Profile = lazy(() => import("./pages/Profile"));
const PILearning = lazy(() => import("./pages/PILearning"));
const PIQuizlet = lazy(() => import("./pages/PIQuizlet"));
const ChapterMockExam = lazy(() => import("./pages/ChapterMockExam"));
const BlueMarket = lazy(() => import("./pages/BlueMarket"));
const BbxMarketBoard = lazy(() => import("./pages/BbxMarketBoard").then((module) => ({ default: module.BbxMarketBoard })));
const BbxCompanyPage = lazy(() => import("./pages/BbxMarketViews").then((module) => ({ default: module.BbxCompanyPage })));
const BbxLearnPage = lazy(() => import("./pages/BbxMarketViews").then((module) => ({ default: module.BbxLearnPage })));
const BbxNewsPage = lazy(() => import("./pages/BbxMarketViews").then((module) => ({ default: module.BbxNewsPage })));
const BbxPortfolioPage = lazy(() => import("./pages/BbxMarketViews").then((module) => ({ default: module.BbxPortfolioPage })));
const PortfolioUpload = lazy(() => import("./pages/PortfolioUpload"));
const AdminPortfolios = lazy(() => import("./pages/AdminPortfolios"));
const TransactionHistory = lazy(() => import("./pages/TransactionHistory"));
const BankingDashboard = lazy(() => import("./pages/BankingDashboard").then((module) => ({ default: module.BankingDashboard })));
const PracticeDebug = lazy(() => import("./pages/PracticeDebug"));
const SpendingPatterns = lazy(() => import("./pages/SpendingPatterns"));
const SuperAdminDashboard = lazy(() => import("./pages/SuperAdminDashboard"));
const Feedback = lazy(() => import("./pages/Feedback"));
const BluesNews = lazy(() => import("./pages/BluesNews"));
const EventMatchQuiz = lazy(() => import("./pages/EventMatchQuiz"));
const DirectMessagesPanel = lazy(() => import("./components/DirectMessagesPanel").then((module) => ({ default: module.DirectMessagesPanel })));
const FirstSignInTour = lazy(() => import("./components/FirstSignInTour").then((module) => ({ default: module.FirstSignInTour })));

function RouteLoadingFallback() {
  return <main className="flex min-h-[60vh] items-center justify-center px-6" role="status" aria-live="polite"><div className="flex items-center gap-3 rounded-xl border border-blue-300/15 bg-slate-950/70 px-4 py-3 text-sm text-blue-100/80"><span className="h-2.5 w-2.5 animate-pulse rounded-full bg-blue-400" />Loading your workspace…</div></main>;
}

function Router() {
  return (
    <Suspense fallback={<RouteLoadingFallback />}>
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={LoginSignup} />
      <Route path="/events" component={Events} />
      <Route path="/practice" component={Practice} />
      <Route path="/practice/questions" component={PracticeQuestions} />
      <Route path="/leaderboard" component={Leaderboard} />
          <Route path="/calendar" component={CalendarPage} />
          <Route path="/chapter/members" component={MembersPage} />
    
      <Route path="/volunteer" component={Volunteer} />
      <Route path="/discussions" component={Discussions} />
      <Route path="/announcements" component={Announcements} />
      <Route path="/blue-market" component={BlueMarket} />
      <Route path="/blues-news" component={BluesNews} />
      <Route path="/market/portfolio" component={BbxPortfolioPage} />
      <Route path="/market/board" component={BbxMarketBoard} />
      <Route path="/market/news" component={BbxNewsPage} />
      <Route path="/market/learn" component={BbxLearnPage} />
      <Route path="/market/:ticker" component={BbxCompanyPage} />
      <Route path="/market" component={BlueMarket} />
      <Route path="/speech-ai" component={SpeechAI} />
      <Route path="/ai/roleplay" component={RoleplayAI} />
      <Route path="/ai/written" component={WrittenEventAI} />
      <Route path="/portfolio-upload" component={PortfolioUpload} />
      <Route path="/admin-portfolios" component={AdminPortfolios} />
      <Route path="/transaction-history" component={TransactionHistory} />
      <Route path="/banking" component={BankingDashboard} />
      <Route path="/spending-patterns" component={SpendingPatterns} />
      <Route path="/super-admin" component={SuperAdminDashboard} />
      <Route path="/market-analytics" component={BbxPortfolioPage} />
      <Route path="/feedback" component={Feedback} />
      <Route path="/event-match" component={EventMatchQuiz} />
      <Route path="/debug/practice" component={PracticeDebug} />
      <Route path="/verify-email" component={VerifyEmail} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/2fa" component={TwoFactorAuth} />
      <Route path="/school-code" component={SchoolCodeEntry} />
      <Route path="/admin" component={AdminPanel} />
      <Route path="/profile" component={Profile} />
      <Route path="/pi-learning" component={PILearning} />
      <Route path="/pi-quizlet" component={PIQuizlet} />
      <Route path="/study-guide" component={PIQuizlet} />
      <Route path="/mock-exams" component={ChapterMockExam} />
      <Route path="/chapter-mock-exam" component={ChapterMockExam} />

      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
    </Suspense>
  );
}

function App() {
  const { user, loading } = useAuth();
  const { toasts, addToast, removeToast } = useToast();
  const [location] = useLocation();
  const [sessionStartLocation] = useState(location);
  const [welcomeGate, setWelcomeGate] = useState({ resolved: false, shouldShow: false });

  const handleLoginRequired = () => {
    addToast("Log in required", "warning", 3000);
  };

  useEffect(() => {
    if (loading || welcomeGate.resolved) return;

    const hasSeenThisSession = window.sessionStorage.getItem(SIGNED_OUT_WELCOME_SESSION_KEY) === "true";
    const shouldShow = shouldShowSignedOutWelcome({
      location: sessionStartLocation,
      isAuthenticated: Boolean(user),
      isLoading: loading,
      hasSeenThisSession,
    });

    window.sessionStorage.setItem(SIGNED_OUT_WELCOME_SESSION_KEY, "true");
    setWelcomeGate({ resolved: true, shouldShow });
  }, [loading, user, sessionStartLocation, welcomeGate.resolved]);

  useEffect(() => {
    const handlePreloadError = (event: Event) => {
      const preloadError = event as CustomEvent<unknown>;
      if (!isStaleDynamicImportError(preloadError.detail)) return;

      event.preventDefault();
      recoverStaleDynamicImportInBrowser();
    };

    window.addEventListener("vite:preloadError", handlePreloadError);
    return () => window.removeEventListener("vite:preloadError", handlePreloadError);
  }, []);

  const showWelcomeGate = welcomeGate.shouldShow;
  const dismissWelcomeGate = () => setWelcomeGate((current) => ({ ...current, shouldShow: false }));

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <AdminModeProvider>
          <SchoolCodeProvider>
            <TooltipProvider>
            <BlueBlazerCursor />
            <Toaster />
            <Toast toasts={toasts} onRemove={removeToast} />
            {loading || !welcomeGate.resolved ? <SignedOutWelcome isChecking /> : showWelcomeGate ? <SignedOutWelcome isAuthenticated={Boolean(user)} onContinue={dismissWelcomeGate} /> : <>
              {user ? (
                <SidebarNavigation>
                  <Router />
                  <Suspense fallback={null}><DirectMessagesPanel /></Suspense>
                  <Footer />
                  <Suspense fallback={null}><FirstSignInTour /></Suspense>
                </SidebarNavigation>
              ) : (
                <>
                  <Router />
                </>
              )}
            </>}
            </TooltipProvider>
          </SchoolCodeProvider>
        </AdminModeProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

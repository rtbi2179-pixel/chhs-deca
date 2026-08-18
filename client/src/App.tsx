import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AdminModeProvider } from "./contexts/AdminModeContext";
import { SchoolCodeProvider } from "./contexts/SchoolCodeContext";
import { SidebarNavigation } from "./components/SidebarNavigation";
import Home from "./pages/Home";
import Events from "./pages/Events";
import Practice from "./pages/Practice";
import PracticeQuestions from "./pages/PracticeQuestions";
import CalendarPage from "./pages/CalendarPage";
import MembersPage from "./pages/MembersPage";

import Volunteer from "./pages/Volunteer";
import Discussions from "./pages/Discussions";
import SpeechAI from "./pages/SpeechAI";
import RoleplayAI from "./pages/RoleplayAI";
import WrittenEventAI from "./pages/WrittenEventAI";
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
import PILearning from "./pages/PILearning";
import PIQuizlet from "./pages/PIQuizlet";
import ChapterMockExam from "./pages/ChapterMockExam";
import BlueMarket from "./pages/BlueMarket";
import { BbxCompanyPage, BbxLearnPage, BbxNewsPage, BbxPortfolioPage } from "./pages/BbxMarketViews";
import PortfolioUpload from "./pages/PortfolioUpload";
import AdminPortfolios from "./pages/AdminPortfolios";
import TransactionHistory from "./pages/TransactionHistory";
import { BankingDashboard } from "./pages/BankingDashboard";

import PracticeDebug from "./pages/PracticeDebug";
import SpendingPatterns from "./pages/SpendingPatterns";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import MarketAnalytics from "./pages/MarketAnalytics";
import Feedback from "./pages/Feedback";
import BluesNews from "./pages/BluesNews";
import { SignedOutWelcome } from "./components/SignedOutWelcome";
import { FirstSignInTour } from "./components/FirstSignInTour";
import Footer from "./components/Footer";
import { useAuth } from "@/_core/hooks/useAuth";
import { shouldShowSignedOutWelcome } from "./lib/signedOutWelcome";
import { useState, useEffect } from "react";
import { Toast, useToast } from "./components/Toast";
import { useLocation } from "wouter";
import { DirectMessagesPanel } from "./components/DirectMessagesPanel";

function Router() {
  return (
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
  );
}

function App() {
  const { user, loading } = useAuth();
  const { toasts, addToast, removeToast } = useToast();
  const [location] = useLocation();

  const handleLoginRequired = () => {
    addToast("Log in required", "warning", 3000);
  };

  const showWelcomeGate = shouldShowSignedOutWelcome({ location, isAuthenticated: Boolean(user), isLoading: loading });

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <AdminModeProvider>
          <SchoolCodeProvider>
            <TooltipProvider>
            <Toaster />
            <Toast toasts={toasts} onRemove={removeToast} />
            {loading ? <SignedOutWelcome isChecking /> : showWelcomeGate ? <SignedOutWelcome /> : <>
              {user ? (
                <SidebarNavigation>
                  <Router />
                  <DirectMessagesPanel />
                  <Footer />
                  <FirstSignInTour />
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

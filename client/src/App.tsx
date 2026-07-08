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

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/events" component={Events} />
      <Route path="/practice" component={Practice} />
      <Route path="/calendar" component={CalendarPage} />
      <Route path="/volunteer" component={Volunteer} />
      <Route path="/discussions" component={Discussions} />
      <Route path="/speech-ai" component={SpeechAI} />

      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Navigation />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
// Force rebuild 1783376791

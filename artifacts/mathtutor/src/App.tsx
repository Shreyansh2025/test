import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/components/AuthProvider";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Layout from "@/components/Layout";
import ProtectedRoute from "@/components/ProtectedRoute";
import LandingPage from "@/pages/LandingPage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import DashboardPage from "@/pages/DashboardPage";
import PracticePage from "@/pages/PracticePage";
import PracticeSessionPage from "@/pages/PracticeSessionPage";
import TutorPage from "@/pages/TutorPage";
import TutorChatPage from "@/pages/TutorChatPage";
import BattleLobbyPage from "@/pages/BattleLobbyPage";
import BattleArenaPage from "@/pages/BattleArenaPage";
import LeaderboardPage from "@/pages/LeaderboardPage";
import FriendsPage from "@/pages/FriendsPage";
import ProgressPage from "@/pages/ProgressPage";
import BadgesPage from "@/pages/BadgesPage";
import ProfilePage from "@/pages/ProfilePage";
import KnowledgeMapPage from "@/pages/KnowledgeMapPage";
import CoursesPage from "@/pages/CoursesPage";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      <ProtectedRoute path="/dashboard">
        <Layout><DashboardPage /></Layout>
      </ProtectedRoute>
      <ProtectedRoute path="/practice">
        <Layout><PracticePage /></Layout>
      </ProtectedRoute>
      <ProtectedRoute path="/practice/:topicId">
        <Layout><PracticeSessionPage /></Layout>
      </ProtectedRoute>
      <ProtectedRoute path="/tutor">
        <Layout><TutorPage /></Layout>
      </ProtectedRoute>
      <ProtectedRoute path="/tutor/:conversationId">
        <Layout><TutorChatPage /></Layout>
      </ProtectedRoute>
      <ProtectedRoute path="/battle">
        <Layout><BattleLobbyPage /></Layout>
      </ProtectedRoute>
      <ProtectedRoute path="/battle/:id">
        <BattleArenaPage />
      </ProtectedRoute>
      <ProtectedRoute path="/leaderboard">
        <Layout><LeaderboardPage /></Layout>
      </ProtectedRoute>
      <ProtectedRoute path="/friends">
        <Layout><FriendsPage /></Layout>
      </ProtectedRoute>
      <ProtectedRoute path="/progress">
        <Layout><ProgressPage /></Layout>
      </ProtectedRoute>
      <ProtectedRoute path="/badges">
        <Layout><BadgesPage /></Layout>
      </ProtectedRoute>
      <ProtectedRoute path="/profile">
        <Layout><ProfilePage /></Layout>
      </ProtectedRoute>
      <ProtectedRoute path="/knowledge-map">
        <Layout><KnowledgeMapPage /></Layout>
      </ProtectedRoute>
      <ProtectedRoute path="/courses">
        <Layout><CoursesPage /></Layout>
      </ProtectedRoute>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
                <Router />
              </WouterRouter>
              <Toaster />
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

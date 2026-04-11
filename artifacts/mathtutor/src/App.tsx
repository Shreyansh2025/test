import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/components/AuthProvider";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Layout from "@/components/Layout";
import RoleRoute from "@/components/RoleRoute";
import TeacherLayout from "@/components/TeacherLayout";
import AdminLayout from "@/components/AdminLayout";
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
import { GlobalAutoTranslate } from "@/components/GlobalAutoTranslate";
import DoubtsPage from "@/pages/DoubtsPage";
import TeacherDashboardPage from "@/pages/TeacherDashboardPage";
import AdminDashboardPage from "@/pages/AdminDashboardPage";
import GamesPage from "@/pages/GamesPage";

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
      <RoleRoute path="/dashboard" allow={["student"]}>
        <Layout><DashboardPage /></Layout>
      </RoleRoute>
      <RoleRoute path="/practice" allow={["student"]}>
        <Layout><PracticePage /></Layout>
      </RoleRoute>
      <RoleRoute path="/practice/:topicId" allow={["student"]}>
        <Layout><PracticeSessionPage /></Layout>
      </RoleRoute>
      <RoleRoute path="/tutor" allow={["student"]}>
        <Layout><TutorPage /></Layout>
      </RoleRoute>
      <RoleRoute path="/tutor/:conversationId" allow={["student"]}>
        <Layout><TutorChatPage /></Layout>
      </RoleRoute>
      <RoleRoute path="/battle" allow={["student"]}>
        <Layout><BattleLobbyPage /></Layout>
      </RoleRoute>
      <RoleRoute path="/battle/:id" allow={["student"]}>
        <BattleArenaPage />
      </RoleRoute>
      <RoleRoute path="/leaderboard" allow={["student"]}>
        <Layout><LeaderboardPage /></Layout>
      </RoleRoute>
      <RoleRoute path="/friends" allow={["student"]}>
        <Layout><FriendsPage /></Layout>
      </RoleRoute>
      <RoleRoute path="/progress" allow={["student"]}>
        <Layout><ProgressPage /></Layout>
      </RoleRoute>
      <RoleRoute path="/badges" allow={["student"]}>
        <Layout><BadgesPage /></Layout>
      </RoleRoute>
      <RoleRoute path="/profile" allow={["student", "teacher", "admin"]}>
        <Layout><ProfilePage /></Layout>
      </RoleRoute>
      <RoleRoute path="/knowledge-map" allow={["student"]}>
        <Layout><KnowledgeMapPage /></Layout>
      </RoleRoute>
      <RoleRoute path="/courses" allow={["student"]}>
        <Layout><CoursesPage /></Layout>
      </RoleRoute>
      <RoleRoute path="/doubts" allow={["student"]}>
        <Layout><DoubtsPage /></Layout>
      </RoleRoute>
      <RoleRoute path="/games" allow={["student"]}>
        <Layout><GamesPage /></Layout>
      </RoleRoute>
      <RoleRoute path="/teacher-dashboard" allow={["teacher", "admin"]}>
        <TeacherLayout><TeacherDashboardPage /></TeacherLayout>
      </RoleRoute>
      <RoleRoute path="/admin-dashboard" allow={["admin"]}>
        <AdminLayout><AdminDashboardPage /></AdminLayout>
      </RoleRoute>
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
              <GlobalAutoTranslate />
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

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ViewModeProvider } from "@/contexts/ViewModeContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import ConnectPage from "./pages/ConnectPage";
import NotFound from "./pages/NotFound";
import {
  NewcomerOnboardingPage,
  AboutChurchPage,
  ServiceSchedulePage,
  EventsPage,
  BulletinsPage,
  BibleReadingPage,
  AnnouncementsPage,
  GivingPage,
  MinistryStatsPage,
  ManageEventsPage,
  ManageBulletinsPage,
  ManageBibleReadingPage,
  MembersPage,
  FollowUpsPage,
  AttendancePage,
  ReportsPage,
  SystemStatsPage,
  ManageUsersPage,
  RolesPermissionsPage,
  SettingsPage,
  MinistriesPage,
  OnboardingMaintenancePage,
  ScheduleMaintenancePage,
  GivingMaintenancePage,
  GalleryPage,
} from "./pages/RolePages";
import RecordGivingPage from "./pages/RecordGivingPage";
import TransactionHistoryPage from "./pages/TransactionHistoryPage";
import GivingReportsPage from "./pages/GivingReportsPage";
import PrayerRequestsPage from "./pages/PrayerRequestsPage";
import AssignmentsPage from "./pages/AssignmentsPage";
import FirstTimersPage from "./pages/FirstTimersPage";
import AuthRedirectPage from "./pages/AuthRedirectPage";
import { ThemeProvider } from "./components/ThemeProvider";
import { Outlet } from "react-router-dom";
import { Layout } from "@/components/Layout";

function AppLayout() {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

const queryClient = new QueryClient();

const isMultiTenant = import.meta.env.VITE_IS_MULTI_TENANT !== "N";
const prefix = isMultiTenant ? "/:orgSlug" : "";

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ViewModeProvider>
        <TooltipProvider>
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <ThemeProvider>
              <Toaster />
              <Sonner />
              <Routes>
                {/* Post-auth redirect: Clerk always lands here; Convex resolves the real org slug */}
                <Route path="/auth/redirect" element={<AuthRedirectPage />} />

                {/* Public Org-aware Landing Page */}
                <Route path={prefix || "/"} element={<Index />} />

                {/* Auth Routes - also can be org-aware for branding */}
                <Route path={`${prefix}/login`} element={<Login />} />
                <Route path={`${prefix}/signup`} element={<SignUp />} />
                <Route path={`${prefix}/connect`} element={<ConnectPage />} />

                <Route element={<AppLayout />}>
                  {/* Protected Org-aware Routes */}
                <Route path={`${prefix}/dashboard`} element={<Dashboard />} />
                <Route path={`${prefix}/profile`} element={<Profile />} />

                {/* Newcomer Routes */}
                <Route path={`${prefix}/onboarding`} element={<NewcomerOnboardingPage />} />
                <Route path={`${prefix}/about-church`} element={<AboutChurchPage />} />
                <Route path={`${prefix}/schedule`} element={<ServiceSchedulePage />} />

                {/* Member Routes */}
                <Route path={`${prefix}/events`} element={<EventsPage />} />
                <Route path={`${prefix}/bulletins`} element={<BulletinsPage />} />
                <Route path={`${prefix}/bible-reading`} element={<BibleReadingPage />} />
                <Route path={`${prefix}/announcements`} element={<AnnouncementsPage />} />
                <Route path={`${prefix}/giving`} element={<GivingPage />} />

                {/* Leader Routes */}
                <Route path={`${prefix}/ministry-stats`} element={<MinistryStatsPage />} />
                <Route path={`${prefix}/manage-events`} element={<ManageEventsPage />} />
                <Route path={`${prefix}/manage-bulletins`} element={<ManageBulletinsPage />} />
                <Route path={`${prefix}/manage-bible-reading`} element={<ManageBibleReadingPage />} />
                <Route path={`${prefix}/members`} element={<MembersPage />} />
                <Route path={`${prefix}/attendance`} element={<AttendancePage />} />
                <Route path={`${prefix}/follow-ups`} element={<FollowUpsPage />} />
                <Route path={`${prefix}/prayer-requests`} element={<PrayerRequestsPage />} />
                <Route path={`${prefix}/assignments`} element={<AssignmentsPage />} />
                <Route path={`${prefix}/gallery`} element={<GalleryPage />} />
                <Route path={`${prefix}/reports`} element={<ReportsPage />} />
                <Route path={`${prefix}/first-timers`} element={<FirstTimersPage />} />

                {/* Admin Routes */}
                <Route path={`${prefix}/system-stats`} element={<SystemStatsPage />} />
                <Route path={`${prefix}/manage-users`} element={<ManageUsersPage />} />
                <Route path={`${prefix}/onboarding-maintenance`} element={<OnboardingMaintenancePage />} />
                <Route path={`${prefix}/schedule-maintenance`} element={<ScheduleMaintenancePage />} />
                <Route path={`${prefix}/giving-maintenance`} element={<GivingMaintenancePage />} />
                <Route path={`${prefix}/ministries`} element={<MinistriesPage />} />
                <Route path={`${prefix}/roles`} element={<RolesPermissionsPage />} />
                <Route path={`${prefix}/settings`} element={<SettingsPage />} />

                {/* Finance Routes */}
                <Route path={`${prefix}/record-giving`} element={<RecordGivingPage />} />
                <Route path={`${prefix}/transaction-history`} element={<TransactionHistoryPage />} />
                <Route path={`${prefix}/giving-reports`} element={<GivingReportsPage />} />

                </Route>

                {/* Legacy Fallback / Default Redirection */}
                {isMultiTenant && (
                  <>
                    <Route path="/" element={<Index />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<SignUp />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/profile" element={<Profile />} />
                  </>
                )}

                {/* Fallback */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </ThemeProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ViewModeProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

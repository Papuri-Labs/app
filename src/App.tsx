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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ViewModeProvider>
        <TooltipProvider>
          <BrowserRouter>
            <ThemeProvider>
              <Toaster />
              <Sonner />
              <Routes>
                {/* Post-auth redirect: Clerk always lands here; Convex resolves the real org slug */}
                <Route path="/auth/redirect" element={<AuthRedirectPage />} />

                {/* Public Org-aware Landing Page */}
                <Route path="/:orgSlug" element={<Index />} />

                {/* Auth Routes - also can be org-aware for branding */}
                <Route path="/:orgSlug/login" element={<Login />} />
                <Route path="/:orgSlug/signup" element={<SignUp />} />

                <Route element={<AppLayout />}>
                  {/* Protected Org-aware Routes */}
                <Route path="/:orgSlug/dashboard" element={<Dashboard />} />
                <Route path="/:orgSlug/profile" element={<Profile />} />

                {/* Newcomer Routes */}
                <Route path="/:orgSlug/onboarding" element={<NewcomerOnboardingPage />} />
                <Route path="/:orgSlug/about-church" element={<AboutChurchPage />} />
                <Route path="/:orgSlug/schedule" element={<ServiceSchedulePage />} />

                {/* Member Routes */}
                <Route path="/:orgSlug/events" element={<EventsPage />} />
                <Route path="/:orgSlug/bulletins" element={<BulletinsPage />} />
                <Route path="/:orgSlug/bible-reading" element={<BibleReadingPage />} />
                <Route path="/:orgSlug/announcements" element={<AnnouncementsPage />} />
                <Route path="/:orgSlug/giving" element={<GivingPage />} />

                {/* Leader Routes */}
                <Route path="/:orgSlug/ministry-stats" element={<MinistryStatsPage />} />
                <Route path="/:orgSlug/manage-events" element={<ManageEventsPage />} />
                <Route path="/:orgSlug/manage-bulletins" element={<ManageBulletinsPage />} />
                <Route path="/:orgSlug/members" element={<MembersPage />} />
                <Route path="/:orgSlug/attendance" element={<AttendancePage />} />
                <Route path="/:orgSlug/follow-ups" element={<FollowUpsPage />} />
                <Route path="/:orgSlug/prayer-requests" element={<PrayerRequestsPage />} />
                <Route path="/:orgSlug/assignments" element={<AssignmentsPage />} />
                <Route path="/:orgSlug/gallery" element={<GalleryPage />} />
                <Route path="/:orgSlug/reports" element={<ReportsPage />} />

                {/* Admin Routes */}
                <Route path="/:orgSlug/system-stats" element={<SystemStatsPage />} />
                <Route path="/:orgSlug/manage-users" element={<ManageUsersPage />} />
                <Route path="/:orgSlug/onboarding-maintenance" element={<OnboardingMaintenancePage />} />
                <Route path="/:orgSlug/schedule-maintenance" element={<ScheduleMaintenancePage />} />
                <Route path="/:orgSlug/giving-maintenance" element={<GivingMaintenancePage />} />
                <Route path="/:orgSlug/ministries" element={<MinistriesPage />} />
                <Route path="/:orgSlug/roles" element={<RolesPermissionsPage />} />
                <Route path="/:orgSlug/settings" element={<SettingsPage />} />

                {/* Finance Routes */}
                <Route path="/:orgSlug/record-giving" element={<RecordGivingPage />} />
                <Route path="/:orgSlug/transaction-history" element={<TransactionHistoryPage />} />
                <Route path="/:orgSlug/giving-reports" element={<GivingReportsPage />} />

                </Route>

                {/* Legacy Fallback / Default Redirection */}
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/profile" element={<Profile />} />

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

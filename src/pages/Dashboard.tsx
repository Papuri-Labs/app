import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useParams } from "react-router-dom";
import { useViewMode } from "@/contexts/ViewModeContext";
import NewcomerDashboard from "./NewcomerDashboard";
import MemberDashboard from "./MemberDashboard";
import LeaderDashboard from "./LeaderDashboard";
import AdminDashboard from "./AdminDashboard";
import FinanceDashboard from "./FinanceDashboard";

import { Loader2 } from "lucide-react";

export default function Dashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { viewMode } = useViewMode();
  const { orgSlug: urlSlug } = useParams<{ orgSlug?: string }>();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground animate-pulse">Establishing secure connection...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;

  // Slug correction: if the URL slug doesn't match the user's real org slug, redirect to the correct URL
  const realSlug = user.organizationSlug;
  if (realSlug && urlSlug && urlSlug !== realSlug) {
    return <Navigate to={`/${realSlug}/dashboard`} replace />;
  }


  // For leaders and finance users (or users with isFinance permission), respect the view mode preference
  if (user.role === 'leader') {
    if (viewMode === 'finance' && user.isFinance) return <FinanceDashboard />;
    return viewMode === 'member' ? <MemberDashboard /> : <LeaderDashboard />;
  }

  if (user.role === 'finance' || user.isFinance) {
    // If they are primarily finance OR have finance permission
    if (viewMode === 'finance') return <FinanceDashboard />;
    // If they are a leader with finance permission, the above block handles it.
    // If they are a member with finance permission, they might want to switch.
    // If viewMode is 'member', show MemberDashboard.
    return <MemberDashboard />;
  }

  // For other roles, show their specific dashboard
  if (user.role === "admin") return <AdminDashboard />;
  if (user.role === "member") return <MemberDashboard />;
  if (user.role === "newcomer") return <NewcomerDashboard />;

  return <Navigate to="/login" replace />;
}

import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { useViewMode } from "@/contexts/ViewModeContext";
import NewcomerDashboard from "./NewcomerDashboard";
import MemberDashboard from "./MemberDashboard";
import LeaderDashboard from "./LeaderDashboard";
import AdminDashboard from "./AdminDashboard";
import FinanceDashboard from "./FinanceDashboard";

export default function Dashboard() {
  const { user, isAuthenticated } = useAuth();
  const { viewMode } = useViewMode();

  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;

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

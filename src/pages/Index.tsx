import { Navigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import LandingPage from "./LandingPage";

const Index = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { orgSlug } = useParams();
  const urlSlug = orgSlug || "my-church";

  // Wait for auth to resolve before making redirect decisions
  if (isLoading) return null;

  if (isAuthenticated && user) {
    // Always redirect to the user's REAL org slug from Convex, not the URL param
    const realSlug = user.organizationSlug || urlSlug;
    return <Navigate to={`/${realSlug}/dashboard`} replace />;
  }

  // Show the public marketing landing page for unauthenticated visitors
  return <LandingPage />;
};

export default Index;

import { useEffect, useRef } from "react";
import { Navigate, useParams } from "react-router-dom";
import { useAuth, getPersistedOrgSlug } from "@/contexts/AuthContext";
import LandingPage from "./LandingPage";
import { toast } from "sonner";

const Index = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { orgSlug } = useParams();
  const urlSlug = orgSlug || "my-church";
  const toastFired = useRef(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated && user && !toastFired.current) {
        const requestedSlug = getPersistedOrgSlug();
        const homeSlug = user.organizationSlug;

        if (requestedSlug && homeSlug && requestedSlug !== homeSlug && requestedSlug !== "my-church") {
            toastFired.current = true;
            localStorage.setItem("orgSlug", homeSlug);
            toast.info(`Redirected to your home workspace`, {
                description: `You tried to access '${requestedSlug}', but your account is securely registered with '${homeSlug}'.`,
                position: typeof window !== 'undefined' && window.innerWidth < 768 ? "bottom-center" : "bottom-right",
                duration: 6000,
            });
        }
    }
  }, [isLoading, isAuthenticated, user]);

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

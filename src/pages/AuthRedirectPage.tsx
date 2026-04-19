import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

/**
 * Dedicated post-authentication redirect handler.
 *
 * Clerk's forceRedirectUrl always lands here after any sign-in/sign-up.
 * We wait for Convex to fully load the user record (which includes the correct
 * organizationSlug), then navigate to the right dashboard.
 *
 * This keeps Clerk responsible ONLY for authentication.
 * All org/slug/role logic is driven solely by Convex data.
 */
export default function AuthRedirectPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const redirected = useRef(false);

  useEffect(() => {
    // Wait for AuthContext to finish loading Convex data
    if (isLoading) return;

    // Guard: only redirect once per load
    if (redirected.current) return;

    if (isAuthenticated && user) {
      // Convex is the source of truth for the org slug
      const slug = user.organizationSlug;

      if (slug && slug !== "my-church") {
        redirected.current = true;
        console.log(`[AuthRedirect] Redirecting authenticated user to /${slug}/dashboard`);
        navigate(`/${slug}/dashboard`, { replace: true });
      } else {
        // Slug is missing or placeholder — still go to dashboard, Layout will fix it
        redirected.current = true;
        navigate(`/my-church/dashboard`, { replace: true });
      }
    } else {
      // Not authenticated — send back to root landing page
      redirected.current = true;
      navigate("/", { replace: true });
    }
  }, [isLoading, isAuthenticated, user, navigate]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground animate-pulse">
          Setting up your workspace…
        </p>
      </div>
    </div>
  );
}

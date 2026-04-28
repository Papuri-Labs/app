import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth, RESERVED_ROUTE_KEYWORDS } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

/**
 * Dedicated post-authentication redirect handler.
 *
 * Clerk's forceRedirectUrl always lands here after any sign-in/sign-up,
 * with an ?org=<slug> param set by Login.tsx.
 *
 * We immediately persist the ?org param so AuthContext can find it,
 * then wait for Convex to load the user's real organizationSlug before
 * navigating to the correct dashboard.
 */
export default function AuthRedirectPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirected = useRef(false);

  // Step 1: The moment this page loads, grab ?org= from the URL and persist it.
  // This fires synchronously before any useEffect so AuthContext picks it up.
  const orgFromUrl = searchParams.get("org");
  if (orgFromUrl && !RESERVED_ROUTE_KEYWORDS.includes(orgFromUrl)) {
    localStorage.setItem("orgSlug", orgFromUrl);
  }

  useEffect(() => {
    // Wait for AuthContext to finish loading Convex data
    if (isLoading) return;

    // Guard: only redirect once per load
    if (redirected.current) return;

    if (isAuthenticated && user) {
      // Convex is the source of truth for the org slug.
      // Fall back to the ?org= URL param if Convex hasn't resolved it yet.
      const convexSlug = user.organizationSlug;
      const urlSlug = orgFromUrl && !RESERVED_ROUTE_KEYWORDS.includes(orgFromUrl) ? orgFromUrl : null;
      const slug = (convexSlug && convexSlug !== "my-church") ? convexSlug : urlSlug;

      if (slug && slug !== "my-church") {
        redirected.current = true;
        localStorage.setItem("orgSlug", slug);
        console.log(`[AuthRedirect] Redirecting authenticated user to /${slug}/dashboard`);

        // Warn if the user tried to sign in to a different org than their home org
        if (urlSlug && convexSlug && urlSlug !== convexSlug && convexSlug !== "my-church") {
          toast.info(`Redirected to your home workspace`, {
            description: `You tried to sign in to '${urlSlug}', but your account belongs to '${convexSlug}'.`,
            position: typeof window !== 'undefined' && window.innerWidth < 768 ? "bottom-center" : "bottom-right",
            duration: 6000,
          });
        }

        navigate(`/${slug}/dashboard`, { replace: true });
      } else {
        // No valid slug found anywhere — let Layout handle it
        redirected.current = true;
        navigate(`/my-church/dashboard`, { replace: true });
      }
    } else {
      // Not authenticated — send back to root landing page
      redirected.current = true;
      navigate("/", { replace: true });
    }
  }, [isLoading, isAuthenticated, user, navigate, orgFromUrl]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground animate-pulse">
          Setting up your church space…
        </p>
      </div>
    </div>
  );
}

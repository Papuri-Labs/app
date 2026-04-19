import { SignIn } from "@clerk/clerk-react";
import { Church } from "lucide-react";
import { Navigate, useParams } from "react-router-dom";
import { getPersistedOrgSlug, useAuth } from "@/contexts/AuthContext";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export default function Login() {
  const { isAuthenticated } = useAuth();
  const { orgSlug: paramSlug } = useParams<{ orgSlug?: string }>();

  // Use URL param if it's a real org slug, otherwise recover from sessionStorage/redirect_url
  const slug = paramSlug && !["login", "signup", "dashboard"].includes(paramSlug)
    ? paramSlug
    : getPersistedOrgSlug();

  const publicOrg = useQuery(api.organizations.getPublic, { slug: slug || "my-church" });
  const publicSettings = useQuery(api.settings.getPublicBySlug, { slug: slug || "my-church" });

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-8 gradient-mesh relative">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/3 via-transparent to-accent/3 pointer-events-none" />
      <div className="w-full max-w-md relative flex flex-col items-center">
        <div className="flex flex-col items-center gap-4 mb-8 text-center">
          <div className="h-12 w-12 rounded-xl gradient-header flex items-center justify-center shadow-lg overflow-hidden icon-glow">
            {publicSettings?.logoUrl ? (
              <img src={publicSettings.logoUrl} alt="Logo" className="h-full w-full object-cover" />
            ) : (
              <Church className="h-6 w-6 text-primary-foreground" />
            )}
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-primary">{publicOrg?.name || "MAGI Church"}</h2>
            <p className="text-sm text-muted-foreground font-medium">{publicSettings?.welcomeTitle || "Welcome to Worship"}</p>
          </div>
        </div>

        <SignIn
          signUpUrl={`/${slug}/signup`}
          forceRedirectUrl="/auth/redirect"
        />
      </div>
    </div>
  );
}

import { ReactNode } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@/contexts/AuthContext";
import { Id } from "../../convex/_generated/dataModel";
import { useParams } from "react-router-dom";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { orgSlug } = useParams();

  // Authenticated queries: If user is logged in, we use their organization context
  const organization = useQuery(api.organizations.get, user?.organizationId ? { organizationId: user.organizationId as Id<"organizations"> } : "skip");
  const settings = useQuery(api.settings.get);

  // Guest queries: If viewing a public page, we use the slug from the URL
  // Fallback to "my-church" for legacy support if no slug in URL
  const publicOrg = useQuery(api.organizations.getPublic, !user ? { slug: orgSlug || "my-church" } : "skip");
  const publicSettings = useQuery(api.settings.getPublic, (!user && publicOrg) ? { organizationId: publicOrg._id } : "skip");

  const displaySettings = user ? settings : publicSettings;

  return (
    <>
      <style>
        {`
          :root {
            ${displaySettings?.primaryColor ? `
              --primary: ${displaySettings.primaryColor};
              --sidebar-primary: ${displaySettings.primaryColor};
              --sidebar-ring: ${displaySettings.primaryColor};
              --sidebar-accent-foreground: ${displaySettings.primaryColor};
              --ring: ${displaySettings.primaryColor};
            ` : ""}
            ${displaySettings?.accentColor ? `
              --accent: ${displaySettings.accentColor};
            ` : ""}
            ${displaySettings?.typography ? `
              --font-family: ${displaySettings.typography};
            ` : ""}
          }
        `}
      </style>
      {children}
    </>
  );
}

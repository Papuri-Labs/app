import { ReactNode } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth, RESERVED_ROUTE_KEYWORDS } from "@/contexts/AuthContext";
import { Id } from "../../convex/_generated/dataModel";
import { useLocation } from "react-router-dom";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const location = useLocation();

  // Robust slug detection for components outside of <Routes>
  const getSlugFromPath = () => {
    const parts = location.pathname.split("/");
    const slug = parts[1];
    if (!slug || RESERVED_ROUTE_KEYWORDS.includes(slug)) return undefined;
    return slug;
  };

  const orgSlug = getSlugFromPath();

  // Slug-aware settings: Prioritize the slug from the URL to ensure correct branding
  const settings = useQuery(api.settings.get, { orgSlug });

  // Guest queries: Fallback for situations where user is not yet logged in
  const publicOrg = useQuery(api.organizations.getPublic, !user ? { slug: orgSlug || "my-church" } : "skip");
  const publicSettings = useQuery(api.settings.getPublic, (!user && publicOrg) ? { organizationId: publicOrg._id } : "skip");

  const displaySettings = settings || publicSettings;

  // Helper to convert hex to HSL components (e.g., "215 55% 42%") for Tailwind
  const getHslComponents = (hex: string) => {
    if (!hex || !hex.startsWith('#')) return hex;
    
    let r = parseInt(hex.slice(1, 3), 16) / 255;
    let g = parseInt(hex.slice(3, 5), 16) / 255;
    let b = parseInt(hex.slice(5, 7), 16) / 255;

    let max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      let d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
  };

  return (
    <>
      <style>
        {`
          :root {
            ${displaySettings?.primaryColor ? `
              --primary: ${getHslComponents(displaySettings.primaryColor)};
              --sidebar-primary: ${getHslComponents(displaySettings.primaryColor)};
              --sidebar-ring: ${getHslComponents(displaySettings.primaryColor)};
              --sidebar-accent-foreground: ${getHslComponents(displaySettings.primaryColor)};
              --ring: ${getHslComponents(displaySettings.primaryColor)};
            ` : ""}
            ${displaySettings?.accentColor ? `
              --accent: ${getHslComponents(displaySettings.accentColor)};
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

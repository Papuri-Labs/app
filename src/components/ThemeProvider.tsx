import { ReactNode, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth, RESERVED_ROUTE_KEYWORDS, getPersistedOrgSlug } from "@/contexts/AuthContext";
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

  const orgSlug = getSlugFromPath() || getPersistedOrgSlug();

  // Slug-aware settings: Prioritize the slug from the URL to ensure correct branding
  const settings = useQuery(api.settings.get, { orgSlug });

  // Guest queries: Robust direct slug-to-settings fetching for unauthenticated pages
  const guestBranding = useQuery(api.settings.getPublicBySlug, !user ? { slug: orgSlug || "my-church" } : "skip");
  
  // Also fetch the org name for the title if needed
  const guestOrg = useQuery(api.organizations.getPublic, !user ? { slug: orgSlug || "my-church" } : "skip");

  const displaySettings = settings || guestBranding;

  // Helper to convert hex to HSL numeric values or parse existing HSL strings
  const getHslValues = (color: string) => {
    if (!color) return null;

    // Handle Hex
    if (color.startsWith('#')) {
      let r = parseInt(color.slice(1, 3), 16) / 255;
      let g = parseInt(color.slice(3, 5), 16) / 255;
      let b = parseInt(color.slice(5, 7), 16) / 255;

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

      return { 
        h: Math.round(h * 360), 
        s: Math.round(s * 100), 
        l: Math.round(l * 100),
        toString: () => `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
      };
    }

    // Handle HSL string (e.g. "215 55% 42%")
    const hslMatch = color.match(/(\d+)\s+(\d+)%\s+(\d+)%/);
    if (hslMatch) {
      return {
        h: parseInt(hslMatch[1]),
        s: parseInt(hslMatch[2]),
        l: parseInt(hslMatch[3]),
        toString: () => color
      };
    }

    return null;
  };

  // Helper to determine if a color is light or dark
  const getContrastForeground = (hsl: { h: number, s: number, l: number } | null) => {
    if (!hsl) return null;
    // If lightness is > 75%, use a dark foreground
    return hsl.l > 75 ? "220 20% 14%" : "0 0% 100%";
  };

  useEffect(() => {
    const root = document.documentElement;
    const primaryHsl = displaySettings?.primaryColor ? getHslValues(displaySettings.primaryColor) : null;
    const accentHsl = displaySettings?.accentColor ? getHslValues(displaySettings.accentColor) : null;

    if (primaryHsl) {
      const primaryStr = primaryHsl.toString();
      const primaryFg = getContrastForeground(primaryHsl) || "0 0% 100%";
      root.style.setProperty('--primary', primaryStr);
      root.style.setProperty('--primary-foreground', primaryFg);
      root.style.setProperty('--sidebar-primary', primaryStr);
      root.style.setProperty('--sidebar-ring', primaryStr);
      root.style.setProperty('--ring', primaryStr);
    } else {
      root.style.removeProperty('--primary');
      root.style.removeProperty('--primary-foreground');
      root.style.removeProperty('--sidebar-primary');
      root.style.removeProperty('--sidebar-ring');
      root.style.removeProperty('--ring');
    }

    if (accentHsl) {
      const accentStr = accentHsl.toString();
      const accentFg = getContrastForeground(accentHsl) || "0 0% 100%";
      root.style.setProperty('--accent', accentStr);
      root.style.setProperty('--accent-foreground', accentFg);
      root.style.setProperty('--sidebar-accent', `${accentStr} / 0.05`);
      root.style.setProperty('--sidebar-accent-foreground', accentFg);
    } else {
      root.style.removeProperty('--accent');
      root.style.removeProperty('--accent-foreground');
      root.style.removeProperty('--sidebar-accent');
      root.style.removeProperty('--sidebar-accent-foreground');
    }

    if (displaySettings?.typography) {
      root.style.setProperty('--font-family', displaySettings.typography);
    } else {
      root.style.removeProperty('--font-family');
    }
  }, [displaySettings]);

  return <>{children}</>;
}

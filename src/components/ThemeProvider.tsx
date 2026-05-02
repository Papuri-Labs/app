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

  // 1. User's Assigned Org (Source of Truth)
  // 2. URL Path Slug
  // 3. Persisted Session Slug
  // 4. Default "my-church"
  const orgSlug = user?.organizationSlug && user.organizationSlug !== "my-church" 
    ? user.organizationSlug 
    : (getSlugFromPath() || getPersistedOrgSlug());

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

  // Helper to determine if a color is light or dark using perceived brightness (YIQ)
  const getContrastForeground = (color: string) => {
    if (!color) return "0 0% 100%";
    
    // Handle HSL string (e.g. "215 55% 42%")
    const hslMatch = color.match(/(\d+)\s+(\d+)%\s+(\d+)%/);
    if (hslMatch) {
      const lightness = parseInt(hslMatch[3]);
      // If lightness is > 65%, use dark text
      return lightness > 65 ? "220 20% 14%" : "0 0% 100%";
    }

    if (!color.startsWith('#')) return "0 0% 100%";
    
    // Parse hex
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    
    // Calculate perceived brightness (YIQ)
    // Green is weighted heaviest as the human eye is most sensitive to it
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    
    // Threshold 155 is the standard for bright vs dark backgrounds
    return brightness > 155 ? "220 20% 14%" : "0 0% 100%";
  };

  useEffect(() => {
    const root = document.documentElement;
    const primaryStr = displaySettings?.primaryColor;
    const accentStr = displaySettings?.accentColor;

    const primaryHsl = primaryStr ? getHslValues(primaryStr) : null;
    const accentHsl = accentStr ? getHslValues(accentStr) : null;

    if (primaryHsl) {
      const hslVal = primaryHsl.toString();
      const primaryFg = getContrastForeground(primaryStr || '#6366f1');
      root.style.setProperty('--primary', hslVal);
      root.style.setProperty('--primary-foreground', primaryFg);
      root.style.setProperty('--sidebar-primary', hslVal);
      root.style.setProperty('--sidebar-ring', hslVal);
      root.style.setProperty('--ring', hslVal);
    } else {
      root.style.removeProperty('--primary');
      root.style.removeProperty('--primary-foreground');
      root.style.removeProperty('--sidebar-primary');
      root.style.removeProperty('--sidebar-ring');
      root.style.removeProperty('--ring');
    }

    if (accentHsl) {
      const hslVal = accentHsl.toString();
      const accentFg = getContrastForeground(accentStr || '#f59e0b');
      root.style.setProperty('--accent', hslVal);
      root.style.setProperty('--accent-foreground', accentFg);
      root.style.setProperty('--sidebar-accent', `${hslVal} / 0.05`);
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

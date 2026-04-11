import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { useAuth as useClerkAuth, useUser } from "@clerk/clerk-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { getTracing } from "../lib/tracing";

export type UserRole = "newcomer" | "member" | "leader" | "finance" | "admin";

export type Ministry = {
  id: string;
  name: string;
};

export type SystemSettings = {
  inactiveAbsences: number;
  promoteAttendance: number;
  followUpAbsences: number;
};

interface User {
  id: string; // Clerk ID
  _id?: string; // Convex ID
  organizationId?: string; // Organization ID for multi-tenancy
  name: string;
  email: string;
  role: UserRole;
  ministryIds?: string[];
  ministryNames?: string[];
  isFinance?: boolean;
  avatar?: string;
  address?: string;
  birthday?: string;
  gender?: string;
  contactNumber?: string;
  organizationSlug?: string;
  socials?: {
    facebook?: string;
    instagram?: string;
    xHandle?: string;
  };
}

interface AuthContextType {
  user: User | null;
  organizationId?: string; // Expose organizationId at context level for easy access
  isAuthenticated: boolean;
  login: (email: string, password: string, role?: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  switchRole: (role: UserRole) => void;
  ministries: Ministry[];
  addMinistry: (ministry: Ministry) => void;
  settings: SystemSettings;
  updateSettings: (partial: Partial<SystemSettings>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

/** All app route segment names that must NOT be interpreted as organization slugs */
export const RESERVED_ROUTE_KEYWORDS = [
  "login", "signup", "onboarding", "profile", "unauthorized",
  "dashboard", "about-church", "schedule", "events", "bulletins",
  "bible-reading", "announcements", "giving", "ministry-stats",
  "manage-events", "manage-bulletins", "members", "attendance",
  "follow-ups", "prayer-requests", "assignments", "gallery",
  "reports", "system-stats", "manage-users", "onboarding-maintenance",
  "schedule-maintenance", "giving-maintenance", "ministries", "roles",
  "settings", "record-giving", "transaction-history", "giving-reports", "my-church",
];

/** Extract the org slug from the current URL, falling back to "my-church" */
function getOrgSlugFromUrl(): string {
  const pathParts = window.location.pathname.split("/");
  const slug = pathParts[1] || "my-church";
  const effective = RESERVED_ROUTE_KEYWORDS.includes(slug) ? "my-church" : slug;
  // Persist so login/signup pages can recover it even after Clerk redirects
  if (effective !== "my-church") {
    sessionStorage.setItem("orgSlug", effective);
  }
  return effective;
}

/** Read slug from Clerk's redirect_url param or sessionStorage */
export function getPersistedOrgSlug(): string {
  // Clerk appends ?redirect_url=... when redirecting unauthenticated users
  const params = new URLSearchParams(window.location.search);
  const redirectUrl = params.get("redirect_url") || params.get("redirect") || "";
  if (redirectUrl) {
    const parts = decodeURIComponent(redirectUrl).split("/");
    const slugFromRedirect = parts[1] || "";
    if (slugFromRedirect && !RESERVED_ROUTE_KEYWORDS.includes(slugFromRedirect)) {
      sessionStorage.setItem("orgSlug", slugFromRedirect);
      return slugFromRedirect;
    }
  }
  return sessionStorage.getItem("orgSlug") || "my-church";
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { isSignedIn, signOut } = useClerkAuth();
  const { user: clerkUser } = useUser();
  const [user, setUser] = useState<User | null>(null);

  // Keep local state for ministries and settings for now
  const [ministries, setMinistries] = useState<Ministry[]>([
    { id: "worship", name: "Worship" },
    { id: "youth", name: "Youth" },
    { id: "outreach", name: "Outreach" },
    { id: "care", name: "Care & Counseling" },
  ]);
  const [settings, setSettings] = useState<SystemSettings>({
    inactiveAbsences: 4,
    promoteAttendance: 8,
    followUpAbsences: 2,
  });

  const syncUser = useMutation(api.users.syncUser);
  const syncAttempted = React.useRef<string | null>(null);

  // Query user data from Convex
  const convexUser = useQuery(
    api.users.getUser,
    clerkUser ? { userId: clerkUser.id } : "skip"
  );

  // 1. Handle Syncing (Triggered once per sign-in)
  useEffect(() => {
    if (isSignedIn && clerkUser) {
      // Prioritize Clerk Metadata as the Source of Truth, then the URL
      const metadataSlug = clerkUser.publicMetadata?.orgSlug as string;
      const urlSlug = getOrgSlugFromUrl();
      const effectiveSlug = (metadataSlug && !RESERVED_ROUTE_KEYWORDS.includes(metadataSlug)) 
        ? metadataSlug 
        : urlSlug;

      const syncKey = `${clerkUser.id}-${effectiveSlug}`;
      if (syncAttempted.current !== syncKey) {
        console.log(`[AuthContext] Initiating sync for user: ${clerkUser.id} on org: ${effectiveSlug}`);
        syncAttempted.current = syncKey;
        const role = (clerkUser.publicMetadata.role as UserRole) || "newcomer";

        syncUser({
          userId: clerkUser.id,
          name: clerkUser.fullName || clerkUser.username || "User",
          email: clerkUser.primaryEmailAddress?.emailAddress || "",
          role: role,
          orgSlug: effectiveSlug,
          avatar: clerkUser.imageUrl,
          tracing: getTracing(),
        }).catch((err) => {
          console.error("[AuthContext] Sync failed:", err);
          syncAttempted.current = null;
        });
      }
    } else if (!isSignedIn) {
      syncAttempted.current = null;
    }
  }, [isSignedIn, clerkUser?.id]); // Only depend on ID stability

  // 2. Handle User State Calculation (Triggered by data arrivals)
  useEffect(() => {
    if (!isSignedIn || !clerkUser) {
      if (user !== null) {
        console.log("[AuthContext] Clearing user state (signed out)");
        setUser(null);
      }
      return;
    }

    // Determine the most accurate data available
    const role = (clerkUser.publicMetadata.role as UserRole) || "newcomer";
    
    // Determine the organization slug, prioritizing Clerk metadata as the definitive authority
    const metadataSlug = clerkUser.publicMetadata?.orgSlug as string;
    const finalOrgSlug = (metadataSlug && !RESERVED_ROUTE_KEYWORDS.includes(metadataSlug))
      ? metadataSlug
      : (convexUser?.organizationSlug || getOrgSlugFromUrl());

    let nextUser: User;
    if (convexUser) {
      nextUser = {
        id: clerkUser.id,
        _id: convexUser._id,
        organizationId: convexUser.organizationId,
        name: convexUser.name,
        email: convexUser.email,
        role: convexUser.role as UserRole,
        avatar: clerkUser.imageUrl,
        ministryIds: convexUser.ministryIds,
        ministryNames: convexUser.ministryNames || [],
        address: convexUser.address,
        birthday: convexUser.birthday,
        gender: convexUser.gender,
        contactNumber: convexUser.contactNumber,
        isFinance: convexUser.isFinance,
        organizationSlug: finalOrgSlug,
        socials: convexUser.socials,
      };
    } else {
      nextUser = {
        id: clerkUser.id,
        name: clerkUser.fullName || clerkUser.username || "User",
        email: clerkUser.primaryEmailAddress?.emailAddress || "",
        role: role,
        avatar: clerkUser.imageUrl,
        organizationSlug: finalOrgSlug,
        ministryIds: [],
        ministryNames: [],
      };
    }

    // Shallow equality check to prevent redundant re-renders
    const hasChanged = JSON.stringify(user) !== JSON.stringify(nextUser);
    if (hasChanged) {
      console.log("[AuthContext] Updating user state", nextUser.email);
      setUser(nextUser);
    }
  }, [isSignedIn, clerkUser?.id, clerkUser?.imageUrl, convexUser]);

  const login = async () => {
    // This is now handled by Clerk's UI components typically, 
    // but if we kept the custom form we'd use signIn.create() here.
    // For now we'll just redirect to Clerk's login if called manually, although the UI should use Clerk components.
    // This is a placeholder to satisfy the interface.
    console.warn("Manual login called. Use Clerk's SignIn component or redirect.");
  };

  const logout = async () => {
    // Capture current orgSlug before signing out so we redirect to the right login page
    const slug = getOrgSlugFromUrl();
    await signOut({ redirectUrl: `/${slug}/login` });
  };

  const switchRole = (role: UserRole) => {
    if (user) setUser({ ...user, role });
  };

  const addMinistry = (ministry: Ministry) => {
    setMinistries((prev) => (prev.some((m) => m.id === ministry.id) ? prev : [...prev, ministry]));
  };

  const updateSettings = (partial: Partial<SystemSettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        organizationId: user?.organizationId,
        isAuthenticated: !!isSignedIn && !!user,
        login,
        logout,
        switchRole,
        ministries,
        addMinistry,
        settings,
        updateSettings,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

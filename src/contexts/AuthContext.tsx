import React, { createContext, useContext, useState, ReactNode, useEffect, useMemo, useRef } from "react";
import { useAuth as useClerkAuth, useUser } from "@clerk/clerk-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { getTracing } from "../lib/tracing";
import { JoinCodeModal } from "@/components/JoinCodeModal";
import { toast } from "sonner";
import { Id } from "../../convex/_generated/dataModel";

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
  isLoading: boolean;
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
  "settings", "record-giving", "transaction-history", "giving-reports", "my-church", "auth"
];

/** Extract the org slug from the current URL, falling back to "my-church" */
function getOrgSlugFromUrl(): string {
  const params = new URLSearchParams(window.location.search);
  const queryOrg = params.get("org");
  
  if (queryOrg && !RESERVED_ROUTE_KEYWORDS.includes(queryOrg)) {
    localStorage.setItem("orgSlug", queryOrg);
    return queryOrg;
  }

  const pathParts = window.location.pathname.split("/");
  const slug = pathParts[1] || "my-church";
  const effective = RESERVED_ROUTE_KEYWORDS.includes(slug) ? "my-church" : slug;
  // Persist so login/signup pages can recover it even after Clerk redirects
  if (effective !== "my-church") {
    localStorage.setItem("orgSlug", effective);
  }
  return effective;
}

/** Read slug from Clerk's redirect_url param or localStorage */
export function getPersistedOrgSlug(): string {
  // 1. Primary Source of Truth: Active Session Storage
  // This is set the moment a user explicitly visits a church's landing or login page.
  const storedValue = localStorage.getItem("orgSlug");
  if (storedValue && !RESERVED_ROUTE_KEYWORDS.includes(storedValue)) {
    return storedValue;
  }

  // 2. Fallback: Clerk's Redirect URL
  // Used if a fresh guest clicks a direct deep-link to a protected route
  const params = new URLSearchParams(window.location.search);
  const redirectUrl = params.get("redirect_url") || params.get("redirect") || "";
  if (redirectUrl) {
    const parts = decodeURIComponent(redirectUrl).split("/");
    const slugFromRedirect = parts[1] || "";
    if (slugFromRedirect && !RESERVED_ROUTE_KEYWORDS.includes(slugFromRedirect)) {
      localStorage.setItem("orgSlug", slugFromRedirect);
      return slugFromRedirect;
    }
  }
  
  return "my-church";
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { isLoaded, isSignedIn } = useClerkAuth();
  const { user: clerkUser } = useUser();
  const { signOut } = useClerkAuth();
  const [isSyncing, setIsSyncing] = useState(false);

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

  // Join Code States
  const [showJoinCodeModal, setShowJoinCodeModal] = useState(false);
  const [pendingJoinCode, setPendingJoinCode] = useState<string | null>(null);

  // 0. Determine current context
  const urlSlug = getOrgSlugFromUrl();
  const isReserved = RESERVED_ROUTE_KEYWORDS.includes(urlSlug);
  const effectiveSlug = isReserved 
    ? (getPersistedOrgSlug() || "my-church") 
    : (urlSlug || "my-church");

  // Load join code requirement for the target org
  const joinRequirement = useQuery(
    api.organizations.getJoinCodeRequirement,
    { slug: effectiveSlug }
  );

  // Query user data from Convex (scoped to current org)
  const convexUser = useQuery(
    api.users.getUser,
    clerkUser ? { userId: clerkUser.id, orgSlug: effectiveSlug } : "skip"
  );

  const performSync = async (code?: string) => {
    if (!clerkUser) return;
    
    setIsSyncing(true);
    const role = (clerkUser.publicMetadata.role as UserRole) || "newcomer";

    try {
      await syncUser({
        userId: clerkUser.id,
        name: clerkUser.fullName || clerkUser.username || "User",
        email: clerkUser.primaryEmailAddress?.emailAddress || "",
        role: role,
        orgSlug: effectiveSlug,
        joinCode: code,
        avatar: clerkUser.imageUrl,
        tracing: getTracing(),
      });
      console.log("[AuthContext] Sync completed");
      setShowJoinCodeModal(false);
      setPendingJoinCode(null);
    } catch (err: any) {
      console.error("[AuthContext] Sync failed:", err);
      syncAttempted.current = null;
      throw err; // Propagate to caller (JoinCodeModal)
    } finally {
      setIsSyncing(false);
    }
  };

  // 1. Handle Syncing (Triggered once per sign-in or org change)
  useEffect(() => {
    if (isLoaded && isSignedIn && clerkUser && joinRequirement && convexUser !== undefined) {
      const syncKey = `${clerkUser.id}-${effectiveSlug}`;
      
      // If user is already found for this specific org, we don't need to sync/join again
      const isAlreadyInOrg = convexUser && convexUser.organizationSlug === effectiveSlug;
      
      if (isAlreadyInOrg) {
        if (showJoinCodeModal) setShowJoinCodeModal(false);
        syncAttempted.current = syncKey;
        return;
      }

      // DO NOT auto-sync if we are on a reserved route (like landing page or login)
      // AND we don't have a specific church context (effectiveSlug is still my-church).
      // This prevents creating placeholder "my-church" accounts while allowing join code modal 
      // to trigger when a user is specifically trying to join a real church.
      const isAtLandingPage = window.location.pathname === "/";
      const isSyncBlocked = effectiveSlug === "my-church" && (isReserved || isAtLandingPage);

      if (syncAttempted.current !== syncKey && !isSyncBlocked) {
        // If join code is required and user hasn't joined THIS org yet
        if (joinRequirement.isRequired && !isAlreadyInOrg) {
          console.log(`[AuthContext] Join code required for ${effectiveSlug}. Showing modal.`);
          setShowJoinCodeModal(true);
          return;
        }

        console.log(`[AuthContext] Initiating auto-sync for user: ${clerkUser.id} on org: ${effectiveSlug}`);
        syncAttempted.current = syncKey;
        performSync();
      }
    } else if (isLoaded && !isSignedIn) {
      syncAttempted.current = null;
      setShowJoinCodeModal(false);
    }
  }, [isLoaded, isSignedIn, clerkUser?.id, effectiveSlug, joinRequirement, convexUser]); 

  // 2. Atomic User State Derivation (Source of Truth)
  const user = useMemo(() => {
    if (!isSignedIn || !clerkUser || !convexUser) return null;

    // Determine the organization slug from Convex (source of truth) or fallback to URL during initial load
    const finalOrgSlug = (convexUser.organizationSlug && !RESERVED_ROUTE_KEYWORDS.includes(convexUser.organizationSlug))
      ? convexUser.organizationSlug
      : (getOrgSlugFromUrl() || "my-church");

    return {
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
  }, [isSignedIn, clerkUser, convexUser]);

  useEffect(() => {
    if (user) console.log("[AuthContext] Resolved user state:", user.email);
  }, [user]);

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
    console.warn("switchRole is deprecated now that roles are derived purely from Convex. Use ViewModeContext to change UI views without altering database roles.");
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
        isLoading: !isLoaded || (isSignedIn && (convexUser === undefined || isSyncing)),
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
      <JoinCodeModal 
        isOpen={showJoinCodeModal} 
        onClose={async () => {
            setShowJoinCodeModal(false);
            syncAttempted.current = null;
            localStorage.removeItem("orgSlug");
            // If they exit the join flow, sign them out of Clerk so they can try again fresh
            await signOut({ redirectUrl: "/" });
        }}
        onJoin={performSync}
        orgName={joinRequirement?.orgName || effectiveSlug}
      />
    </AuthContext.Provider>
  );
};

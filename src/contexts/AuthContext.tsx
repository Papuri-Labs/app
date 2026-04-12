import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { useAuth as useClerkAuth, useUser } from "@clerk/clerk-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { getTracing } from "../lib/tracing";
import { useParams } from "react-router-dom";

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
  orgSlug?: string; // Real backing org slug
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

// Reserved route segments that are NOT organization slugs
export const RESERVED_PATHS = ["login", "signup", "dashboard", "profile", "api", ""];
// Alias for backward compatibility with AppSidebar.tsx and ThemeProvider.tsx
export const RESERVED_ROUTE_KEYWORDS = RESERVED_PATHS;

const ORG_SLUG_KEY = "papuri_org_slug";

/**
 * Persists the org slug to sessionStorage so it can be recovered on pages
 * that don't have /:orgSlug in their URL (e.g. /login, /signup).
 */
export function persistOrgSlug(slug: string) {
  try { sessionStorage.setItem(ORG_SLUG_KEY, slug); } catch {}
}

/**
 * Reads the previously persisted org slug from sessionStorage.
 * Used by Login and SignUp pages to redirect to the correct org after auth.
 */
export function getPersistedOrgSlug(): string | null {
  try { return sessionStorage.getItem(ORG_SLUG_KEY); } catch { return null; }
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { isSignedIn, signOut } = useClerkAuth();
  const { user: clerkUser } = useUser();
  const { orgSlug } = useParams<{ orgSlug?: string }>();
  const [user, setUser] = useState<User | null>(null);

  // Resolve org slug — ignore reserved path names
  const resolvedOrgSlug = orgSlug && !RESERVED_PATHS.includes(orgSlug) ? orgSlug : undefined;

  // Persist the org slug whenever we have a valid one (for Login/SignUp recovery)
  if (resolvedOrgSlug) persistOrgSlug(resolvedOrgSlug);

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

  // Query user data from Convex to get ministry names
  const convexUser = useQuery(
    api.users.getUser,
    clerkUser ? { userId: clerkUser.id } : "skip"
  );

  useEffect(() => {
    if (isSignedIn && clerkUser) {
      // Map Clerk user to our app's user structure
      const role: UserRole = (clerkUser.publicMetadata.role as UserRole) || "newcomer";

      // Sync user to Convex, passing the church slug from the URL
      syncUser({
        userId: clerkUser.id,
        name: clerkUser.fullName || clerkUser.username || "User",
        email: clerkUser.primaryEmailAddress?.emailAddress || "",
        role: role,
        avatar: clerkUser.imageUrl,
        orgSlug: resolvedOrgSlug,
        tracing: getTracing(),
      }).catch((err) => console.error("Failed to sync user:", err));

      // Use Convex user data if available (with ministry names), otherwise use Clerk data
      if (convexUser) {
        setUser({
          id: clerkUser.id,
          _id: convexUser._id,
          organizationId: convexUser.organizationId,
          orgSlug: convexUser.orgSlug,
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
          socials: convexUser.socials,
        });
      } else {
        setUser({
          id: clerkUser.id,
          name: clerkUser.fullName || clerkUser.username || "User",
          email: clerkUser.primaryEmailAddress?.emailAddress || "",
          role: role,
          avatar: clerkUser.imageUrl,
          ministryIds: [],
          ministryNames: [],
        });
      }
    } else {
      setUser(null);
    }
  }, [isSignedIn, clerkUser, convexUser]);

  const login = async () => {
    // This is now handled by Clerk's UI components typically, 
    // but if we kept the custom form we'd use signIn.create() here.
    // For now we'll just redirect to Clerk's login if called manually, although the UI should use Clerk components.
    // This is a placeholder to satisfy the interface.
    console.warn("Manual login called. Use Clerk's SignIn component or redirect.");
  };

  const logout = async () => {
    await signOut();
    setUser(null);
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
        isAuthenticated: !!isSignedIn,
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

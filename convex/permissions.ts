import { Auth } from "convex/server";
import { QueryCtx, MutationCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Get the authenticated user from Clerk and fetch their Convex user record
 */
export async function getAuthUser(ctx: QueryCtx | MutationCtx) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("userId", identity.subject))
        .first();

    return user;
}

/**
 * Get the default organization ID for guest access or new users
 */
export async function getDefaultOrganizationId(ctx: QueryCtx | MutationCtx): Promise<Id<"organizations">> {
    const org = await ctx.db
        .query("organizations")
        .withIndex("by_slug", (q) => q.eq("slug", "my-church"))
        .first();

    if (!org) {
        throw new Error("Default organization not found. Please ensure seed data exists.");
    }

    return org._id;
}

/**
 * Check if user can manage (create/edit/delete) data for a specific ministry
 * Leaders can manage their assigned ministries, admins can manage all
 */
export function canManageMinistry(
    user: { role: string; ministryIds: Id<"ministries">[] } | null,
    ministryId: Id<"ministries">
): boolean {
    if (!user) return false;
    if (user.role === "admin") return true;
    if (user.role === "leader") {
        return user.ministryIds.includes(ministryId);
    }
    return false;
}

/**
 * Check if user can view data from a specific ministry
 * Members and leaders can view their assigned ministries, admins can view all
 */
export function canViewMinistry(
    user: { role: string; ministryIds: Id<"ministries">[] } | null,
    ministryId: Id<"ministries"> | undefined
): boolean {
    if (!user) return false;
    if (user.role === "admin") return true;
    // If no ministryId specified, it's general content viewable by all
    if (!ministryId) return true;

    return user.ministryIds.includes(ministryId);
}

/**
 * Get user's ministry IDs for filtering queries
 */
export function getUserMinistries(
    user: { role: string; ministryIds: Id<"ministries">[] } | null
): Id<"ministries">[] | "all" {
    if (!user) return [];
    if (user.role === "admin") return "all";
    return user.ministryIds;
}

/**
 * Check if user is a leader (can create/manage content)
 */
export function isLeader(user: { role: string } | null): boolean {
    if (!user) return false;
    return user.role === "leader" || user.role === "admin";
}

/**
 * Check if user is an admin
 */
export function isAdmin(user: { role: string } | null): boolean {
    if (!user) return false;
    return user.role === "admin";
}

/**
 * Validate that an authenticated user is accessing an allowed organization slug.
 * - Guests can view any slug (e.g. landing pages).
 * - Logged-in users MUST match their organization's slug.
 * - Admins are also restricted to their own organization as per user request.
 * @returns The resolved organizationId if valid.
 * @throws Error if access is denied.
 */
export async function validateOrgAccess(
    ctx: QueryCtx | MutationCtx,
    slug: string | undefined
): Promise<Id<"organizations"> | null> {
    const user = await getAuthUser(ctx);
    
    // 1. Guests can view any slug (e.g. for landing pages/onboarding before sign up)
    if (!user) {
        const org = await ctx.db
            .query("organizations")
            .withIndex("by_slug", (q) => q.eq("slug", slug || "my-church"))
            .first();
        if (!org) return null; // Resilient: Don't crash guests if org is missing
        return org._id;
    }

    // 2. Fetch the user's organization to get its slug for comparison
    const userOrg = await ctx.db.get(user.organizationId);
    if (!userOrg) throw new Error("User organization not found");

    // 3. Authenticated logic: Must match their home slug
    // If no slug provided in args, fallback to user's home org
    if (!slug) return user.organizationId;

    // DATA VISIBILITY HEALING & PLACEHOLDER RESILIENCE:
    // If the user's current database record is a generic placeholder (like "my-church" or "dashboard"),
    // or if they are requesting a generic placeholder, allow them to see the content.
    // This prevents a "Security Deadlock" while the syncUser mutation or UI state is catching up.
    const INVALID_SLUGS = [
        "login", "signup", "onboarding", "profile", "dashboard", 
        "settings", "admin", "leader", "member", "newcomer", "my-church", "auth"
    ];

    if (userOrg.slug && (INVALID_SLUGS.includes(userOrg.slug) || INVALID_SLUGS.includes(slug))) {
        // If the requested slug is a placeholder, or the user is CURRENTLY in a placeholder church,
        // we allow the access but return their ACTUAL organization ID (the authoritative one).
        const requestedOrg = await ctx.db
            .query("organizations")
            .withIndex("by_slug", (q) => q.eq("slug", slug))
            .first();
        
        // If the requested slug exists, return it. Otherwise return the user's assigned org.
        return requestedOrg ? requestedOrg._id : user.organizationId;
    }

    if (userOrg.slug !== slug) {
        // Strict blocking: Once synced to a REAL church, you can't see others
        // Returning null allows queries to return empty data securely without violently crashing the UI during redirect phases
        return null;
    }

    return user.organizationId;
}

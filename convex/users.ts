import { v } from "convex/values";
import { mutation, query, internalMutation, internalQuery, QueryCtx, MutationCtx } from "./_generated/server";
import { getAuthUser, getUserMinistries, isLeader, getDefaultOrganizationId } from "./permissions";
import { logAction, logArgs } from "./logs";
import { Id } from "./_generated/dataModel";

/**
 * Helper function to get the default organization ID
 * In single-church mode, there's only one organization
 * In multi-tenant mode, this would get the user's organization
 */
/**
 * Helper function to get or create an organization by slug
 */
async function getOrCreateOrganization(ctx: MutationCtx, slug: string): Promise<Id<"organizations">> {
    // SECURITY: Never create organizations using reserved route keywords
    const RESERVED = [
        "login", "signup", "onboarding", "profile", "dashboard", 
        "settings", "admin", "leader", "member", "newcomer"
    ];
    const safeSlug = (!slug || RESERVED.includes(slug)) ? "my-church" : slug;

    const org = await ctx.db
        .query("organizations")
        .withIndex("by_slug", (q) => q.eq("slug", safeSlug))
        .first();

    if (org) {
        return org._id;
    }

    // Auto-create if not found (Self-Healing)
    const name = safeSlug
        .split("-")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

    const organizationId = await ctx.db.insert("organizations", {
        name: name,
        slug: safeSlug,
        plan: "free",
        status: "active",
        createdAt: Date.now(),
    });

    // Initialize default settings for the new organization
    await ctx.db.insert("settings", {
        organizationId,
        inactiveAbsences: 4,
        promoteAttendance: 8,
        followUpAbsences: 2,
        welcomeTitle: `Welcome to ${name}`,
        welcomeMessage: "We are glad to have you with us!",
    } as any);

    return organizationId;
}

export const syncUser = mutation({
    args: {
        userId: v.string(), // Clerk ID
        name: v.string(),
        email: v.string(),
        role: v.string(),
        orgSlug: v.string(),
        joinCode: v.optional(v.string()),
        avatar: v.optional(v.string()),
        tracing: v.object(logArgs),
    },
    handler: async (ctx, args) => {
        const { tracing } = args;
        const startTime = Date.now();
        
        // Find the target organization first
        const organizationId = await getOrCreateOrganization(ctx, args.orgSlug);
        const org = await ctx.db.get(organizationId);

        const existingUser = await ctx.db
            .query("users")
            .withIndex("by_org_and_clerk", (q) => 
                q.eq("organizationId", organizationId).eq("userId", args.userId)
            )
            .first();

        // Validation for new joiners
        if (!existingUser && org?.joinCode) {
            if (args.joinCode !== org.joinCode) {
                console.error(`[users:syncUser] Join attempt rejected for ${args.email} on ${args.orgSlug}: Invalid code`);
                throw new Error("INVALID_JOIN_CODE");
            }
        }

        if (existingUser) {
            const currentOrg = existingUser.organizationId ? await ctx.db.get(existingUser.organizationId) : null;
            const INVALID_SLUGS = [
                "login", "signup", "onboarding", "profile", "dashboard", 
                "settings", "admin", "leader", "member", "newcomer", "my-church"
            ];
            
            const updates: any = {
                email: args.email,
                avatar: args.avatar,
                isActive: true,
            };

            const isInitialOrGeneric = !existingUser.name || existingUser.name === "User" || existingUser.name === args.email;
            if (isInitialOrGeneric) {
                updates.name = args.name;
            }

            // Only update organization if it's currently invalid or placeholder
            if (!currentOrg || !currentOrg.slug || INVALID_SLUGS.includes(currentOrg.slug)) {
                updates.organizationId = await getOrCreateOrganization(ctx, args.orgSlug);
                console.log(`[users:syncUser] Auto-assigned user ${args.email} to requested org: ${args.orgSlug}`);
            }

            await ctx.db.patch(existingUser._id, updates);

            await logAction(ctx, existingUser, tracing, {
                action: "USER_SYNC",
                resourceType: "users",
                resourceId: existingUser._id,
                details: `User synced: ${args.email}`,
                status: "success",
                duration_ms: Date.now() - startTime,
            });

            return existingUser._id;
        }

        // Global duplicate-email guard — no two users may share the same email
        if (args.email) {
            const emailConflict = await ctx.db
                .query("users")
                .withIndex("by_email", (q) => q.eq("email", args.email))
                .first();
            if (emailConflict) {
                console.error(`[users:syncUser] Duplicate email rejected: ${args.email}`);
                throw new Error("EMAIL_ALREADY_EXISTS");
            }
        }

        const newUserId = await ctx.db.insert("users", {
            organizationId,
            userId: args.userId,
            name: args.name,
            email: args.email,
            role: args.role as any,
            ministryIds: [],
            isActive: true,
        });

        const newUser = await ctx.db.get(newUserId);
        if (newUser) {
            await logAction(ctx, newUser, tracing, {
                action: "ACCOUNT_CREATED",
                resourceType: "users",
                resourceId: newUserId,
                details: `New account created for: ${args.email}`,
                status: "success",
                duration_ms: Date.now() - startTime,
            });
        }

        return newUserId;
    },
});

export const getUser = query({
    args: { 
        userId: v.string(),
        orgSlug: v.optional(v.string())
    },
    handler: async (ctx, args) => {
        let user;
        
        if (args.orgSlug) {
            const org = await ctx.db
                .query("organizations")
                .withIndex("by_slug", (q) => q.eq("slug", args.orgSlug!))
                .first();
            
            if (org) {
                user = await ctx.db
                    .query("users")
                    .withIndex("by_org_and_clerk", (q) => 
                        q.eq("organizationId", org._id).eq("userId", args.userId)
                    )
                    .first();
            }
        }

        if (!user) {
            user = await ctx.db
                .query("users")
                .withIndex("by_clerk_id", (q) => q.eq("userId", args.userId))
                .first();
        }

        // Only return active users
        if (user && user.isActive !== false) {
            // Resolve ministry names from ministryIds
            const ministryNames: string[] = [];
            if (user.ministryIds && user.ministryIds.length > 0) {
                for (const ministryId of user.ministryIds) {
                    const ministry = await ctx.db.get(ministryId);
                    if (ministry) {
                        ministryNames.push(ministry.name);
                    }
                }
            }

            // Resolve organization slug
            let organizationSlug = "my-church";
            if (user.organizationId) {
                const org = await ctx.db.get(user.organizationId);
                const RESERVED = [
                    "login", "signup", "onboarding", "profile", "unauthorized",
                    "dashboard", "about-church", "schedule", "events", "bulletins",
                    "bible-reading", "announcements", "giving", "ministry-stats",
                    "manage-events", "manage-bulletins", "members", "attendance",
                    "follow-ups", "prayer-requests", "assignments", "gallery",
                    "reports", "system-stats", "manage-users", "onboarding-maintenance",
                    "schedule-maintenance", "giving-maintenance", "ministries", "roles",
                    "settings", "record-giving", "transaction-history", "giving-reports", "my-church",
                ];
                if (org && org.slug && !RESERVED.includes(org.slug)) {
                    organizationSlug = org.slug;
                }
            }

            return {
                ...user,
                ministryNames,
                organizationSlug,
            };
        }
        return null;
    },
});

// Admin only: Get all users including inactive
export const getAdminDirectory = query({
    args: {},
    handler: async (ctx) => {
        const user = await getAuthUser(ctx);
        if (!user) throw new Error("Unauthorized");
        
        const ministries = getUserMinistries(user);

        if (ministries !== "all") {
            throw new Error("Unauthorized");
        }

        return await ctx.db
            .query("users")
            .withIndex("by_organization", (q) => q.eq("organizationId", user.organizationId))
            .collect();
    }
});

export const getMemberDirectory = query({
    args: {},
    handler: async (ctx) => {
        const user = await getAuthUser(ctx);
        if (!user) return [];

        const ministries = getUserMinistries(user);

        // Filter by organization
        const allUsers = await ctx.db
            .query("users")
            .withIndex("by_organization", (q) => q.eq("organizationId", user.organizationId))
            .collect();

        // Filter out inactive users
        const activeUsers = allUsers.filter(u => u.isActive !== false);

        // Admin sees all active users in directory
        if (ministries === "all") {
            return activeUsers;
        }

        // Leaders and members see users from their ministries
        return activeUsers.filter(u =>
            u.ministryIds.some(mid => ministries.includes(mid))
        );
    }
});

// Get newcomers and members without ministry assignments
export const getNewcomersAndUnassigned = query({
    args: {},
    handler: async (ctx) => {
        const user = await getAuthUser(ctx);
        if (!user) throw new Error("Unauthorized");

        // Only leaders and admins can access this
        if (!isLeader(user)) {
            throw new Error("Unauthorized");
        }

        // Filter by organization
        const allUsers = await ctx.db
            .query("users")
            .withIndex("by_organization", (q) => q.eq("organizationId", user.organizationId))
            .collect();

        // Filter for active users who are either:
        // 1. Status is "New" (newcomers), OR
        // 2. Have no ministry assignments (empty or no ministryIds)
        const filtered = allUsers.filter(u =>
            u.isActive !== false && (
                u.status === "New" ||
                !u.ministryIds ||
                u.ministryIds.length === 0
            )
        );

        return filtered;
    }
});

export const updateUserRole = mutation({
    args: {
        userId: v.id("users"),
        role: v.string(),
        tracing: v.object(logArgs),
    },
    handler: async (ctx, args) => {
        const user = await getAuthUser(ctx);
        if (!user) throw new Error("Unauthorized");
        if (user.role !== "admin") throw new Error("Unauthorized");

        await ctx.db.patch(args.userId, { role: args.role as any });

        await logAction(ctx, user, args.tracing, {
            action: "MEMBER_ROLE_UPDATE",
            resourceType: "users",
            resourceId: args.userId,
            details: `Updated role for user to ${args.role}`,
            status: "success",
        });

        return args.userId;
    },
});

export const updateUserMinistries = mutation({
    args: {
        userId: v.id("users"),
        ministryIds: v.array(v.id("ministries")),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.userId, { ministryIds: args.ministryIds });
        return args.userId;
    },
});

// Soft delete a user (for Clerk sync)
export const deactivateUser = mutation({
    args: { clerkId: v.string() },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("userId", args.clerkId))
            .first();

        if (user) {
            await ctx.db.patch(user._id, { isActive: false });
        }
        return user?._id;
    },
});

// Hard delete a user (Admin only)
export const deleteUser = mutation({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const user = await getAuthUser(ctx);
        const ministries = getUserMinistries(user);

        if (ministries !== "all") {
            throw new Error("Unauthorized");
        }

        await ctx.db.delete(args.userId);
    }
});

// Internal mutation for webhook (if using Clerk webhooks)
export const internalDeactivateUser = internalMutation({
    args: { clerkId: v.string() },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("userId", args.clerkId))
            .first();

        if (user) {
            await ctx.db.patch(user._id, { isActive: false });
        }
        return user?._id;
    },
});
// Export list of leaders for the About page
export const listLeaders = query({
    args: { orgSlug: v.optional(v.string()) },
    handler: async (ctx, args) => {
        const user = await getAuthUser(ctx);
        let organizationId = user?.organizationId;

        if (!organizationId && args.orgSlug) {
            const org = await ctx.db
                .query("organizations")
                .withIndex("by_slug", (q) => q.eq("slug", args.orgSlug!))
                .first();
            organizationId = org?._id;
        }

        if (!organizationId) return [];

        const leaders = await ctx.db
            .query("users")
            .withIndex("by_organization", (q) => q.eq("organizationId", organizationId))
            .filter(q =>
                q.and(
                    q.eq(q.field("role"), "leader"),
                    q.neq(q.field("isActive"), false)
                )
            )
            .collect();

        // Enhance with ministry names
        return await Promise.all(leaders.map(async (leader) => {
            const ministryNames: string[] = [];
            if (leader.ministryIds) {
                for (const mid of leader.ministryIds) {
                    const m = await ctx.db.get(mid);
                    if (m) ministryNames.push(m.name);
                }
            }
            return { ...leader, ministryNames };
        }));
    },
});

export const getUserById = internalQuery({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.userId);
    }
});

export const internalUpdateRole = internalMutation({
    args: { userId: v.id("users"), role: v.string() },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.userId, { role: args.role as any });
    }
});

export const submitFirstTimer = mutation({
    args: {
        name: v.string(),
        email: v.string(),
        contactNumber: v.optional(v.string()),
        orgSlug: v.string(),
        message: v.optional(v.string()),
        heardFrom: v.optional(v.string()),
        birthday: v.optional(v.string()),
        address: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const org = await ctx.db
            .query("organizations")
            .withIndex("by_slug", (q) => q.eq("slug", args.orgSlug))
            .first();
        if (!org) throw new Error("Organization not found");

        // Global duplicate-email guard — no two users may share the same email
        const emailConflict = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", args.email))
            .first();
        if (emailConflict) {
            throw new Error("EMAIL_ALREADY_EXISTS");
        }

        const firstTimerId = await ctx.db.insert("first_timers", {
            organizationId: org._id,
            name: args.name,
            email: args.email,
            contactNumber: args.contactNumber,
            birthday: args.birthday,
            address: args.address,
            heardFrom: args.heardFrom,
            message: args.message,
            createdAt: Date.now(),
        });

        console.log(`[submitFirstTimer] Processing submission for ${args.email} in org ${args.orgSlug} (ID: ${org._id})`);

        // If they left a message, also save it as a prayer request so staff can see it.
        // Even if no message is provided, we'll create a record so they show up in the "First Timers" tab
        await ctx.db.insert("prayer_requests", {
            organizationId: org._id,
            name: args.name,
            request: args.message 
                ? `${args.message}${args.heardFrom ? `\n\nHeard via: ${args.heardFrom}` : ""}`
                : `New visitor joined! ${args.heardFrom ? `(Heard via: ${args.heardFrom})` : ""}`,
            status: "Open",
            category: "First Timer",
            isFirstTimer: true,
            createdAt: Date.now(),
        });

        return firstTimerId;
    },
});

export const toggleFinanceAccess = mutation({
    args: { userId: v.id("users"), isFinance: v.boolean() },
    handler: async (ctx, args) => {
        const user = await getAuthUser(ctx);
        if (!user) throw new Error("Unauthorized");
        if (user.role !== "admin") throw new Error("Unauthorized");

        await ctx.db.patch(args.userId, { isFinance: args.isFinance });
    }
});

export const createOfflineUser = mutation({
    args: {
        name: v.string(),
        role: v.string(),
        ministryIds: v.optional(v.array(v.id("ministries"))),
        status: v.optional(v.string()),
        birthday: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await getAuthUser(ctx);
        if (!user) throw new Error("Unauthorized");
        if (user.role !== "admin" && user.role !== "leader") {
            throw new Error("Unauthorized");
        }

        const newUserId = await ctx.db.insert("users", {
            organizationId: user.organizationId,
            userId: `offline_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            name: args.name,
            role: args.role as any,
            ministryIds: args.ministryIds || [],
            status: args.status || "Active",
            birthday: args.birthday,
            isActive: true,
        });
        return newUserId;
    },
});

export const updateUser = mutation({
    args: {
        userId: v.id("users"),
        name: v.optional(v.string()),
        role: v.optional(v.string()),
        ministryIds: v.optional(v.array(v.id("ministries"))),
        status: v.optional(v.string()),
        birthday: v.optional(v.string()),
        anniversary: v.optional(v.string()),
        gender: v.optional(v.string()),
        contactNumber: v.optional(v.string()),
        group: v.optional(v.string()),
        socials: v.optional(
            v.object({
                facebook: v.optional(v.string()),
                instagram: v.optional(v.string()),
                xHandle: v.optional(v.string()),
            })
        ),
    },
    handler: async (ctx, args) => {
        const { userId, ...updates } = args;
        const user = await getAuthUser(ctx);
        if (!user) throw new Error("Unauthorized");
        if (user.role !== "admin" && user.role !== "leader") {
            throw new Error("Unauthorized");
        }

        // Optional: restriction check if leader can only update their ministry members?
        // For now keep it simple: admin and leader can update.

        if (updates.role) updates.role = updates.role as any;

        await ctx.db.patch(userId, updates as any);
        return userId;
    },
});
// Update own profile
export const updateProfile = mutation({
    args: {
        name: v.optional(v.string()),
        address: v.optional(v.string()),
        birthday: v.optional(v.string()),
        gender: v.optional(v.string()),
        contactNumber: v.optional(v.string()),
        socials: v.optional(
            v.object({
                facebook: v.optional(v.string()),
                instagram: v.optional(v.string()),
                xHandle: v.optional(v.string()),
            })
        ),
    },
    handler: async (ctx, args) => {
        const user = await getAuthUser(ctx);
        if (!user) throw new Error("Unauthenticated");

        await ctx.db.patch(user._id, {
            ...args,
        });

        return user._id;
    },
});
export const listFirstTimers = query({
    args: { orgSlug: v.string() },
    handler: async (ctx, args) => {
        const user = await getAuthUser(ctx);
        if (!user) throw new Error("Unauthorized");
        if (!isLeader(user) && user.role !== "admin") throw new Error("Unauthorized");

        const org = await ctx.db
            .query("organizations")
            .withIndex("by_slug", (q) => q.eq("slug", args.orgSlug))
            .first();
        if (!org) return [];

        return await ctx.db
            .query("first_timers")
            .withIndex("by_organization", (q) => q.eq("organizationId", org._id))
            .order("desc")
            .collect();
    }
});

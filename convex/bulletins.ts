import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUser, canManageMinistry, getUserMinistries, isLeader, canViewMinistry, validateOrgAccess } from "./permissions";
import { logAction, logArgs } from "./logs";

export const listBulletins = query({
    args: { orgSlug: v.optional(v.string()) },
    handler: async (ctx, args) => {
        const organizationId = await validateOrgAccess(ctx, args.orgSlug);
        if (!organizationId) return [];

        const user = await getAuthUser(ctx);

        const allBulletins = await ctx.db
            .query("bulletins")
            .withIndex("by_organization", (q) => q.eq("organizationId", organizationId))
            .collect();

        // Global Visibility with Draft protection
        if (isLeader(user)) {
            return allBulletins;
        }

        // Non-leaders see only published bulletins
        return allBulletins.filter(b => !b.status || b.status === "Published");
    },
});

export const createBulletin = mutation({
    args: {
        title: v.string(),
        date: v.string(),
        summary: v.string(),
        status: v.string(),
        ministryId: v.optional(v.id("ministries")),
        editor: v.optional(v.string()),
        orgSlug: v.optional(v.string()), // Multi-tenant safety
        tracing: v.object(logArgs),
    },
    handler: async (ctx, args) => {
        const organizationId = await validateOrgAccess(ctx, args.orgSlug);
        if (!organizationId) throw new Error("Organization not found. Please sync your account.");

        const user = await getAuthUser(ctx);
        if (!user) throw new Error("Unauthorized");

        // Only leaders can create bulletins
        if (!isLeader(user)) {
            throw new Error("Only leaders and admins can create bulletins");
        }

        // If ministry-specific, check permission
        if (args.ministryId && !canManageMinistry(user, args.ministryId)) {
            throw new Error("You can only create bulletins for your assigned ministries");
        }

        const { tracing, orgSlug, ...bulletinData } = args;
        const id = await ctx.db.insert("bulletins", {
            organizationId,
            ...bulletinData,
        });

        await logAction(ctx, user, args.tracing, {
            action: "BULLETIN_CREATE",
            resourceType: "bulletin",
            resourceId: id.toString(),
            details: `Created bulletin: ${args.title}`,
            status: "success",
            metadata: { title: args.title },
        });

        return id;
    },
});

export const updateBulletin = mutation({
    args: {
        id: v.id("bulletins"),
        title: v.optional(v.string()),
        date: v.optional(v.string()),
        summary: v.optional(v.string()),
        status: v.optional(v.string()),
        tracing: v.object(logArgs),
    },
    handler: async (ctx, args) => {
        const user = await getAuthUser(ctx);
        if (!user) throw new Error("Unauthorized");
        const bulletin = await ctx.db.get(args.id);

        if (!bulletin) throw new Error("Bulletin not found");

        if (bulletin.ministryId && !canManageMinistry(user, bulletin.ministryId)) {
            throw new Error("You can only edit bulletins for your assigned ministries");
        }

        const { id, tracing, ...updates } = args;
        await ctx.db.patch(id, updates);

        await logAction(ctx, user, args.tracing, {
            action: "BULLETIN_UPDATE",
            resourceType: "bulletin",
            resourceId: id.toString(),
            details: `Updated bulletin: ${bulletin.title}`,
            status: "success",
            metadata: updates,
        });
    },
});

export const deleteBulletin = mutation({
    args: {
        id: v.id("bulletins"),
        tracing: v.object(logArgs),
    },
    handler: async (ctx, args) => {
        const user = await getAuthUser(ctx);
        if (!user) throw new Error("Unauthorized");
        const bulletin = await ctx.db.get(args.id);

        if (!bulletin) return;

        if (bulletin.ministryId && !canManageMinistry(user, bulletin.ministryId)) {
            throw new Error("You can only delete bulletins for your assigned ministries");
        }

        await ctx.db.delete(args.id);

        await logAction(ctx, user, args.tracing, {
            action: "BULLETIN_DELETE",
            resourceType: "bulletin",
            resourceId: args.id.toString(),
            details: `Deleted bulletin: ${bulletin.title}`,
            status: "success",
        });
    },
});

export const listAnnouncements = query({
    args: { orgSlug: v.optional(v.string()) },
    handler: async (ctx, args) => {
        const organizationId = await validateOrgAccess(ctx, args.orgSlug);
        if (!organizationId) return [];

        const user = await getAuthUser(ctx);

        const allAnnouncements = await ctx.db
            .query("announcements")
            .withIndex("by_organization", (q) => q.eq("organizationId", organizationId))
            .collect();

        // Global Visibility with Draft protection
        if (isLeader(user)) {
            return allAnnouncements;
        }

        // Non-leaders see only published announcements
        return allAnnouncements.filter(a => !a.status || a.status === "Published");
    },
});

export const createAnnouncement = mutation({
    args: {
        title: v.string(),
        body: v.string(),
        ministryId: v.optional(v.id("ministries")),
        date: v.string(),
        status: v.string(),
        tracing: v.object(logArgs),
    },
    handler: async (ctx, args) => {
        const user = await getAuthUser(ctx);
        if (!user) throw new Error("Unauthorized");

        // Only leaders can create announcements
        if (!isLeader(user)) {
            throw new Error("Only leaders and admins can create announcements");
        }

        // Check ministry permission (if specific ministry)
        if (args.ministryId && !canManageMinistry(user, args.ministryId)) {
            throw new Error("You can only create announcements for your assigned ministries");
        }

        const { tracing, ...announcementData } = args;
        const id = await ctx.db.insert("announcements", {
            organizationId: user.organizationId,
            ...announcementData,
            createdAt: Date.now(),
        });

        await logAction(ctx, user, args.tracing, {
            action: "ANNOUNCEMENT_CREATE",
            resourceType: "announcement",
            resourceId: id.toString(),
            details: `Created announcement: ${args.title}`,
            status: "success",
            metadata: { title: args.title },
        });

        return id;
    },
});

export const updateAnnouncement = mutation({
    args: {
        id: v.id("announcements"),
        title: v.optional(v.string()),
        body: v.optional(v.string()),
        date: v.optional(v.string()),
        status: v.optional(v.string()),
        tracing: v.object(logArgs),
    },
    handler: async (ctx, args) => {
        const user = await getAuthUser(ctx);
        if (!user) throw new Error("Unauthorized");
        const announcement = await ctx.db.get(args.id);

        if (!announcement) throw new Error("Announcement not found");

        if (announcement.ministryId && !canManageMinistry(user, announcement.ministryId)) {
            throw new Error("You can only edit announcements for your assigned ministries");
        }

        const { id, tracing, ...updates } = args;
        await ctx.db.patch(id, updates);

        await logAction(ctx, user, args.tracing, {
            action: "ANNOUNCEMENT_UPDATE",
            resourceType: "announcement",
            resourceId: id.toString(),
            details: `Updated announcement: ${announcement.title}`,
            status: "success",
            metadata: updates,
        });
    },
});

export const deleteAnnouncement = mutation({
    args: {
        id: v.id("announcements"),
        tracing: v.object(logArgs),
    },
    handler: async (ctx, args) => {
        const user = await getAuthUser(ctx);
        if (!user) throw new Error("Unauthorized");
        const announcement = await ctx.db.get(args.id);

        if (!announcement) return;

        if (announcement.ministryId && !canManageMinistry(user, announcement.ministryId)) {
            throw new Error("You can only delete announcements for your assigned ministries");
        }

        await ctx.db.delete(args.id);

        await logAction(ctx, user, args.tracing, {
            action: "ANNOUNCEMENT_DELETE",
            resourceType: "announcement",
            resourceId: args.id.toString(),
            details: `Deleted announcement: ${announcement.title}`,
            status: "success",
        });
    },
});

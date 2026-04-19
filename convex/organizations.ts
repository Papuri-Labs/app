import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUser } from "./permissions";

export const get = query({
    args: { 
        organizationId: v.optional(v.id("organizations")),
        slug: v.optional(v.string())
    },
    handler: async (ctx, args) => {
        const user = await getAuthUser(ctx);
        if (!user) return null;

        // Admin Isolation: Admins always stay in their own org
        if (user.role === "admin") {
            return await ctx.db.get(user.organizationId);
        }

        // Slug context for non-admins
        if (args.slug) {
            const org = await ctx.db
                .query("organizations")
                .withIndex("by_slug", (q) => q.eq("slug", args.slug!))
                .first();
            if (org) return org;
        }

        // Fallback to user's organizationID
        const orgId = args.organizationId || user.organizationId;
        if (!orgId) return null;

        return await ctx.db.get(orgId);
    },
});

export const getPublic = query({
    args: { slug: v.optional(v.string()) },
    handler: async (ctx, args) => {
        const slug = args.slug || "my-church";
        return await ctx.db
            .query("organizations")
            .withIndex("by_slug", (q) => q.eq("slug", slug))
            .first();
    },
});

export const listPublic = query({
    args: {},
    handler: async (ctx) => {
        // Return a list of all organizations for the landing page
        // Only return safe public fields
        const orgs = await ctx.db.query("organizations").collect();
        return orgs.map(org => ({
            _id: org._id,
            name: org.name,
            slug: org.slug,
        })).filter(org => org.slug !== "auth" && org.slug !== "my-church");
    },
});

export const update = mutation({
    args: {
        organizationId: v.id("organizations"),
        name: v.string(),
        slug: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await getAuthUser(ctx);
        if (!user || user.role !== "admin") throw new Error("Unauthorized");

        // Ensure they can only update their own org
        if (user.organizationId !== args.organizationId) {
            throw new Error("Unauthorized: Can only update your own organization");
        }

        const updates: any = { name: args.name };
        if (args.slug) updates.slug = args.slug;

        await ctx.db.patch(args.organizationId, updates);
    },
});

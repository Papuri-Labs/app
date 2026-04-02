import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUser } from "./permissions";

export const get = query({
    args: { organizationId: v.optional(v.id("organizations")) },
    handler: async (ctx, args) => {
        const user = await getAuthUser(ctx);
        if (!user) return null;

        // Use provided ID or fallback to user's organizationID
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

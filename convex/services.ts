import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUser, validateOrgAccess } from "./permissions";

export const list = query({
    args: { orgSlug: v.optional(v.string()) },
    handler: async (ctx, args) => {
        const organizationId = await validateOrgAccess(ctx, args.orgSlug);
        if (!organizationId) return [];

        return await ctx.db
            .query("services")
            .withIndex("by_organization", (q) => q.eq("organizationId", organizationId))
            .collect();
    },
});

export const create = mutation({
    args: {
        name: v.string(),
        day: v.string(),
        time: v.string(),
        location: v.string(),
        orgSlug: v.optional(v.string()), // Added for multi-tenant safety
    },
    handler: async (ctx, args) => {
        const organizationId = await validateOrgAccess(ctx, args.orgSlug);
        if (!organizationId) throw new Error("Organization not found. Please sync your account.");

        const user = await getAuthUser(ctx);
        if (!user) throw new Error("Unauthorized");

        const { orgSlug, ...serviceData } = args;

        return await ctx.db.insert("services", {
            organizationId,
            ...serviceData,
        });
    },
});

export const remove = mutation({
    args: { id: v.id("services") },
    handler: async (ctx, args) => {
        const user = await getAuthUser(ctx);
        if (!user || user.role !== "admin") throw new Error("Unauthorized");

        await ctx.db.delete(args.id);
    },
});

export const update = mutation({
    args: {
        id: v.id("services"),
        name: v.optional(v.string()),
        day: v.optional(v.string()),
        time: v.optional(v.string()),
        location: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await getAuthUser(ctx);
        if (!user || user.role !== "admin") throw new Error("Unauthorized");

        const { id, ...updates } = args;
        await ctx.db.patch(id, updates);
    },
});

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUser, getDefaultOrganizationId } from "./permissions";

export const list = query({
    args: {},
    handler: async (ctx) => {
        const user = await getAuthUser(ctx);
        const organizationId = user ? user.organizationId : await getDefaultOrganizationId(ctx);

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
    },
    handler: async (ctx, args) => {
        const user = await getAuthUser(ctx);
        if (!user) throw new Error("Unauthorized");

        return await ctx.db.insert("services", {
            organizationId: user.organizationId,
            ...args,
        });
    },
});

export const update = mutation({
    args: {
        id: v.id("services"),
        name: v.string(),
        day: v.string(),
        time: v.string(),
        location: v.string(),
    },
    handler: async (ctx, args) => {
        const { id, ...updates } = args;
        return await ctx.db.patch(id, updates);
    },
});

export const deleteService = mutation({
    args: { id: v.id("services") },
    handler: async (ctx, args) => {
        return await ctx.db.delete(args.id);
    },
});

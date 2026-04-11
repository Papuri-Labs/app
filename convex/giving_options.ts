import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUser, validateOrgAccess } from "./permissions";

export const list = query({
    args: { orgSlug: v.optional(v.string()) },
    handler: async (ctx, args) => {
        const organizationId = await validateOrgAccess(ctx, args.orgSlug);

        if (!organizationId) return [];

        return await ctx.db
            .query("giving_options")
            .withIndex("by_organization", (q) => q.eq("organizationId", organizationId))
            .collect();
    },
});

export const create = mutation({
    args: {
        label: v.string(),
        description: v.string(),
        storageId: v.optional(v.id("_storage")),
        orgSlug: v.optional(v.string()), // Added for multi-tenant safety
    },
    handler: async (ctx, args) => {
        const organizationId = await validateOrgAccess(ctx, args.orgSlug);
        const user = await getAuthUser(ctx);
        if (!user || user.role !== "admin") throw new Error("Unauthorized");

        let qrCodeUrl = undefined;
        if (args.storageId) {
            qrCodeUrl = await ctx.storage.getUrl(args.storageId) || undefined;
        }

        return await ctx.db.insert("giving_options", {
            organizationId,
            label: args.label,
            description: args.description,
            qrCodeUrl,
            isActive: true,
        });
    },
});

export const update = mutation({
    args: {
        id: v.id("giving_options"),
        label: v.optional(v.string()),
        description: v.optional(v.string()),
        storageId: v.optional(v.id("_storage")),
        isActive: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const user = await getAuthUser(ctx);
        if (!user || user.role !== "admin") throw new Error("Unauthorized");

        const { id, storageId, ...updates } = args;

        const patchAttrs: any = { ...updates };
        if (storageId) {
            patchAttrs.qrCodeUrl = await ctx.storage.getUrl(storageId) || undefined;
        }

        await ctx.db.patch(id, patchAttrs);
    },
});

export const remove = mutation({
    args: { id: v.id("giving_options") },
    handler: async (ctx, args) => {
        const user = await getAuthUser(ctx);
        if (!user || user.role !== "admin") throw new Error("Unauthorized");

        await ctx.db.delete(args.id);
    },
});

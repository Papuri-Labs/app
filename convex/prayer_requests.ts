import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUser, isLeader, getDefaultOrganizationId } from "./permissions";

export const submit = mutation({
    args: {
        name: v.string(),
        request: v.string(),
        ministryId: v.optional(v.id("ministries")),
    },
    handler: async (ctx, args) => {
        const user = await getAuthUser(ctx);
        const organizationId = user ? user.organizationId : await getDefaultOrganizationId(ctx);

        await ctx.db.insert("prayer_requests", {
            organizationId,
            userId: user?._id,
            name: args.name,
            request: args.request,
            status: "Open",
            ministryId: args.ministryId,
            createdAt: Date.now(),
        });
    },
});

export const list = query({
    handler: async (ctx) => {
        const user = await getAuthUser(ctx);
        if (!user || !isLeader(user)) throw new Error("Unauthorized");

        // return all for now, maybe filter by ministry later
        const requests = await ctx.db
            .query("prayer_requests")
            .withIndex("by_organization", (q) => q.eq("organizationId", user.organizationId))
            .order("desc")
            .collect();

        return requests;
    },
});

export const toggleStatus = mutation({
    args: { id: v.id("prayer_requests"), status: v.string() }, // "Open" or "Prayed"
    handler: async (ctx, args) => {
        const user = await getAuthUser(ctx);
        if (!user || !isLeader(user)) throw new Error("Unauthorized");

        await ctx.db.patch(args.id, { status: args.status });
    },
});

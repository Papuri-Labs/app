import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUser } from "./permissions";

export const listFunds = query({
    args: {},
    handler: async (ctx) => {
        const user = await getAuthUser(ctx);
        if (!user) return [];

        return await ctx.db
            .query("funds")
            .withIndex("by_organization", (q) => q.eq("organizationId", user.organizationId))
            .filter((q) => q.eq(q.field("isActive"), true))
            .collect();
    },
});

export const createFund = mutation({
    args: {
        name: v.string(),
        description: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await getAuthUser(ctx);
        if (!user || (user.role !== "admin" && !user.isFinance)) {
            throw new Error("Unauthorized");
        }

        return await ctx.db.insert("funds", {
            ...args,
            organizationId: user.organizationId,
            balance: 0,
            isActive: true,
        });
    },
});

import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUser } from "./permissions";

export const listAccounts = query({
    args: {},
    handler: async (ctx) => {
        const user = await getAuthUser(ctx);
        if (!user) return [];

        return await ctx.db
            .query("accounts")
            .withIndex("by_organization", (q) => q.eq("organizationId", user.organizationId))
            .filter((q) => q.eq(q.field("isActive"), true))
            .collect();
    },
});

export const createAccount = mutation({
    args: {
        code: v.string(),
        name: v.string(),
        type: v.union(
            v.literal("Asset"),
            v.literal("Liability"),
            v.literal("Equity"),
            v.literal("Revenue"),
            v.literal("Expense")
        ),
        description: v.optional(v.string()),
        parentAccountId: v.optional(v.id("accounts")),
    },
    handler: async (ctx, args) => {
        const user = await getAuthUser(ctx);
        if (!user || (user.role !== "admin" && !user.isFinance)) {
            throw new Error("Unauthorized");
        }

        return await ctx.db.insert("accounts", {
            ...args,
            organizationId: user.organizationId,
            isActive: true,
        });
    },
});

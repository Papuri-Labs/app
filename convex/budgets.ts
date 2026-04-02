import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUser, isAdmin } from "./permissions";

export const listBudgets = query({
    args: {
        period: v.optional(v.string()), // e.g. "2026-02"
    },
    handler: async (ctx, args) => {
        const user = await getAuthUser(ctx);
        if (!user) return [];

        let q = ctx.db
            .query("budgets")
            .withIndex("by_organization", (q) => q.eq("organizationId", user.organizationId));

        // Simple filter in handler for brevity if index isn't used
        const budgets = await q.collect();

        if (args.period) {
            return budgets.filter(b => b.period === args.period);
        }

        return budgets;
    },
});

export const createBudget = mutation({
    args: {
        fundId: v.id("funds"),
        accountId: v.id("accounts"),
        amount: v.number(),
        period: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await getAuthUser(ctx);
        if (!user) throw new Error("Unauthorized");

        if (!user.isFinance && !isAdmin(user)) {
            throw new Error("Insufficient permissions");
        }

        // Check if budget already exists for this fund/account/period
        const existing = await ctx.db
            .query("budgets")
            .withIndex("by_org_fund_account", (q) =>
                q.eq("organizationId", user.organizationId)
                    .eq("fundId", args.fundId)
                    .eq("accountId", args.accountId)
            )
            .filter(q => q.eq(q.field("period"), args.period))
            .first();

        if (existing) {
            return await ctx.db.patch(existing._id, {
                amount: args.amount,
            });
        }

        return await ctx.db.insert("budgets", {
            organizationId: user.organizationId,
            fundId: args.fundId,
            accountId: args.accountId,
            amount: args.amount,
            period: args.period,
            createdAt: Date.now(),
        });
    },
});

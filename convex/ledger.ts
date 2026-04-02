import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUser } from "./permissions";

export const listLedgerEntries = query({
    args: {
        fundId: v.optional(v.id("funds")),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const user = await getAuthUser(ctx);
        if (!user) return [];

        if (args.fundId) {
            return await ctx.db
                .query("ledger_entries")
                .withIndex("by_org_and_fund", (q) =>
                    q.eq("organizationId", user.organizationId).eq("fundId", args.fundId!)
                )
                .order("desc")
                .take(args.limit ?? 50);
        }

        return await ctx.db
            .query("ledger_entries")
            .withIndex("by_organization", (q) => q.eq("organizationId", user.organizationId))
            .order("desc")
            .take(args.limit ?? 50);
    },
});

export const createLedgerEntry = mutation({
    args: {
        fundId: v.id("funds"),
        accountId: v.id("accounts"),
        amount: v.number(),
        type: v.union(v.literal("debit"), v.literal("credit")),
        date: v.string(),
        description: v.string(),
        reference: v.optional(v.string()),
        metadata: v.optional(v.any()),
    },
    handler: async (ctx, args) => {
        const user = await getAuthUser(ctx);
        if (!user || (user.role !== "admin" && !user.isFinance)) {
            throw new Error("Unauthorized");
        }

        // 1. Insert the ledger entry
        const entryId = await ctx.db.insert("ledger_entries", {
            ...args,
            organizationId: user.organizationId,
            recordedBy: user._id,
            createdAt: Date.now(),
        });

        // 2. Update the fund balance
        const fund = await ctx.db.get(args.fundId);
        if (fund) {
            let delta = args.amount;
            if (args.type === "credit") delta = -args.amount;

            await ctx.db.patch(args.fundId, {
                balance: (fund.balance || 0) + delta,
            });
        }

        return entryId;
    },
});

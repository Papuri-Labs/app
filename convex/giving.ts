import { v } from "convex/values";
import { query } from "./_generated/server";
import { getAuthUser } from "./permissions";

export const getGivingSummary = query({
    args: {
        period: v.optional(v.string()), // "2026-02"
    },
    handler: async (ctx, args) => {
        const user = await getAuthUser(ctx);
        if (!user) return null;

        const transactions = await ctx.db
            .query("givingTransactions")
            .withIndex("by_organization", (q) => q.eq("organizationId", user.organizationId))
            .collect();

        // Filter by period if provided (assuming Transaction date is YYYY-MM-DD)
        const filtered = args.period
            ? transactions.filter(t => t.date.startsWith(args.period!))
            : transactions;

        const total = filtered.reduce((sum, t) => sum + t.amount, 0);
        const uniqueGivers = new Set(filtered.map(t => t.userId)).size;

        // Breakdown by type
        const byType: Record<string, number> = {};
        filtered.forEach(t => {
            byType[t.givingType] = (byType[t.givingType] || 0) + t.amount;
        });

        return {
            total,
            uniqueGivers,
            byType,
            transactionCount: filtered.length
        };
    },
});

export const listGivingByMonth = query({
    args: { months: v.number() },
    handler: async (ctx, args) => {
        const user = await getAuthUser(ctx);
        if (!user) return [];

        const transactions = await ctx.db
            .query("givingTransactions")
            .withIndex("by_organization", (q) => q.eq("organizationId", user.organizationId))
            .collect();

        // Very basic aggregation for 6 months
        // In a real app, this would be more complex/efficient
        const result: any[] = [];
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        // Let's just mock the aggregation structure for now based on available transactions
        // or return the last few months
        const targetMonths = ["2025-09", "2025-10", "2025-11", "2025-12", "2026-01", "2026-02"];

        targetMonths.forEach(m => {
            const mTxns = transactions.filter(t => t.date.startsWith(m));
            result.push({
                month: monthNames[parseInt(m.split("-")[1]) - 1],
                tithes: mTxns.filter(t => t.givingType === "Tithe").reduce((s, t) => s + t.amount, 0),
                offerings: mTxns.filter(t => t.givingType === "Offering").reduce((s, t) => s + t.amount, 0),
                special: mTxns.filter(t => !["Tithe", "Offering"].includes(t.givingType)).reduce((s, t) => s + t.amount, 0),
            });
        });

        return result;
    }
})

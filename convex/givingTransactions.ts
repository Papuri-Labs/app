import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUser } from "./permissions";

// Record a new giving transaction
export const recordTransaction = mutation({
    args: {
        userId: v.id("users"),
        amount: v.number(),
        givingType: v.string(),
        date: v.string(),
        ministryId: v.optional(v.id("ministries")),
        notes: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const currentUser = await getAuthUser(ctx);
        if (!currentUser) throw new Error("Not authenticated");

        // Only finance users can record transactions
        if (currentUser.role !== "finance" && !currentUser.isFinance && currentUser.role !== "admin") {
            throw new Error("Only finance users can record transactions");
        }

        // Verify the target user exists and is in the same organization
        const targetUser = await ctx.db.get(args.userId);
        if (!targetUser) throw new Error("User not found");
        if (targetUser.organizationId !== currentUser.organizationId) {
            throw new Error("Cannot record transaction for user in different organization");
        }

        // If ministryId provided, verify finance user has access to that ministry
        if (args.ministryId) {
            if (!currentUser.ministryIds.includes(args.ministryId)) {
                throw new Error("You can only record transactions for your assigned ministries");
            }
        }

        const transactionId = await ctx.db.insert("givingTransactions", {
            organizationId: currentUser.organizationId,
            userId: args.userId,
            ministryId: args.ministryId,
            amount: args.amount,
            givingType: args.givingType,
            date: args.date,
            notes: args.notes,
            recordedBy: currentUser._id,
            createdAt: Date.now(),
        });

        return transactionId;
    },
});

// Update an existing transaction
export const updateTransaction = mutation({
    args: {
        id: v.id("givingTransactions"),
        amount: v.optional(v.number()),
        givingType: v.optional(v.string()),
        date: v.optional(v.string()),
        notes: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const currentUser = await getAuthUser(ctx);
        if (!currentUser) throw new Error("Not authenticated");

        const transaction = await ctx.db.get(args.id);
        if (!transaction) throw new Error("Transaction not found");

        // Only the recorder or admin can update
        if (transaction.recordedBy !== currentUser._id && currentUser.role !== "admin") {
            throw new Error("You can only edit transactions you recorded");
        }

        const { id, ...updates } = args;
        await ctx.db.patch(id, updates);
    },
});

// Delete a transaction
export const deleteTransaction = mutation({
    args: { id: v.id("givingTransactions") },
    handler: async (ctx, args) => {
        const currentUser = await getAuthUser(ctx);
        if (!currentUser) throw new Error("Not authenticated");

        const transaction = await ctx.db.get(args.id);
        if (!transaction) throw new Error("Transaction not found");

        // Only the recorder or admin can delete
        if (transaction.recordedBy !== currentUser._id && currentUser.role !== "admin") {
            throw new Error("You can only delete transactions you recorded");
        }

        await ctx.db.delete(args.id);
    },
});

// Get transactions for a specific user (for member view)
export const listByUser = query({
    args: { userId: v.optional(v.id("users")) },
    handler: async (ctx, args) => {
        const currentUser = await getAuthUser(ctx);
        if (!currentUser) return [];

        const userId = args.userId || currentUser._id;

        // Get transactions
        const transactions = await ctx.db
            .query("givingTransactions")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .filter((q) => q.eq(q.field("organizationId"), currentUser.organizationId))
            .order("desc")
            .collect();

        // Enrich with recorder info
        const enriched = await Promise.all(
            transactions.map(async (t) => {
                const recorder = await ctx.db.get(t.recordedBy);
                return {
                    ...t,
                    recorderName: recorder?.name || "Unknown",
                };
            })
        );

        return enriched;
    },
});

// Get all transactions for a ministry (for finance view)
export const listByMinistry = query({
    args: { ministryId: v.optional(v.id("ministries")) },
    handler: async (ctx, args) => {
        const currentUser = await getAuthUser(ctx);
        if (!currentUser) return [];

        // Only finance users and admins can view ministry transactions
        if (currentUser.role !== "finance" && !currentUser.isFinance && currentUser.role !== "admin") {
            return [];
        }

        let transactions;
        if (args.ministryId) {
            // Verify user has access to this ministry
            if (!currentUser.ministryIds.includes(args.ministryId) && currentUser.role !== "admin") {
                throw new Error("You don't have access to this ministry");
            }

            transactions = await ctx.db
                .query("givingTransactions")
                .withIndex("by_ministry", (q) => q.eq("ministryId", args.ministryId))
                .filter((q) => q.eq(q.field("organizationId"), currentUser.organizationId))
                .order("desc")
                .collect();
        } else {
            // Get all transactions for user's ministries
            transactions = await ctx.db
                .query("givingTransactions")
                .withIndex("by_organization", (q) => q.eq("organizationId", currentUser.organizationId))
                .filter((q) => {
                    if (currentUser.role === "admin") return true;
                    return currentUser.ministryIds.some((mid) => q.eq(q.field("ministryId"), mid));
                })
                .order("desc")
                .collect();
        }

        // Enrich with user and recorder info
        const enriched = await Promise.all(
            transactions.map(async (t) => {
                const user = await ctx.db.get(t.userId);
                const recorder = await ctx.db.get(t.recordedBy);
                return {
                    ...t,
                    userName: user?.name || "Unknown",
                    recorderName: recorder?.name || "Unknown",
                };
            })
        );

        return enriched;
    },
});

// Get giving statistics for a ministry
export const getStats = query({
    args: { ministryId: v.optional(v.id("ministries")) },
    handler: async (ctx, args) => {
        const currentUser = await getAuthUser(ctx);
        if (!currentUser) return null;

        // Only finance users and admins
        if (currentUser.role !== "finance" && !currentUser.isFinance && currentUser.role !== "admin") {
            return null;
        }

        let transactions;
        if (args.ministryId) {
            if (!currentUser.ministryIds.includes(args.ministryId) && currentUser.role !== "admin") {
                throw new Error("You don't have access to this ministry");
            }

            transactions = await ctx.db
                .query("givingTransactions")
                .withIndex("by_ministry", (q) => q.eq("ministryId", args.ministryId))
                .filter((q) => q.eq(q.field("organizationId"), currentUser.organizationId))
                .collect();
        } else {
            transactions = await ctx.db
                .query("givingTransactions")
                .withIndex("by_organization", (q) => q.eq("organizationId", currentUser.organizationId))
                .collect();
        }

        const now = Date.now();
        const thisMonth = new Date().getMonth();
        const thisYear = new Date().getFullYear();

        const thisMonthTransactions = transactions.filter((t) => {
            const date = new Date(t.date);
            return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
        });

        const totalThisMonth = thisMonthTransactions.reduce((sum, t) => sum + t.amount, 0);
        const totalAllTime = transactions.reduce((sum, t) => sum + t.amount, 0);
        const uniqueGivers = new Set(transactions.map((t) => t.userId)).size;

        return {
            totalThisMonth,
            totalAllTime,
            transactionCount: transactions.length,
            transactionCountThisMonth: thisMonthTransactions.length,
            uniqueGivers,
        };
    },
});

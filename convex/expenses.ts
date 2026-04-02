import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUser, isAdmin, isLeader } from "./permissions";

export const listExpenses = query({
    args: {},
    handler: async (ctx) => {
        const user = await getAuthUser(ctx);
        if (!user) return [];

        return await ctx.db
            .query("expenses")
            .withIndex("by_organization", (q) => q.eq("organizationId", user.organizationId))
            .order("desc")
            .collect();
    },
});

export const createExpenseRequest = mutation({
    args: {
        description: v.string(),
        amount: v.number(),
        fundId: v.id("funds"),
        accountId: v.id("accounts"),
        date: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await getAuthUser(ctx);
        if (!user) throw new Error("Unauthorized");

        // Only leaders or admins or finance can request? 
        // Usually leaders request, finance approves.
        if (!user.isFinance && !isAdmin(user) && !isLeader(user)) {
            throw new Error("Insufficient permissions to request expenses");
        }

        return await ctx.db.insert("expenses", {
            organizationId: user.organizationId,
            description: args.description,
            amount: args.amount,
            fundId: args.fundId,
            accountId: args.accountId,
            submitterId: user._id,
            status: "pending",
            date: args.date,
            createdAt: Date.now(),
        });
    },
});

export const approveExpense = mutation({
    args: {
        expenseId: v.id("expenses"),
    },
    handler: async (ctx, args) => {
        const user = await getAuthUser(ctx);
        if (!user) throw new Error("Unauthorized");

        // Only finance or admin can approve
        if (!user.isFinance && !isAdmin(user)) {
            throw new Error("Only finance or admin can approve expenses");
        }

        const expense = await ctx.db.get(args.expenseId);
        if (!expense || expense.status !== "pending") {
            throw new Error("Expense request not found or already processed");
        }

        // 1. Mark expense as approved
        await ctx.db.patch(args.expenseId, {
            status: "approved",
            approvedBy: user._id,
        });

        // 2. Create ledger entry
        const ledgerEntryId = await ctx.db.insert("ledger_entries", {
            organizationId: expense.organizationId,
            fundId: expense.fundId,
            accountId: expense.accountId,
            amount: expense.amount,
            type: "debit",
            date: expense.date,
            description: `Expense Approval: ${expense.description}`,
            recordedBy: user._id,
            createdAt: Date.now(),
        });

        // 3. Update fund balance
        const fund = await ctx.db.get(expense.fundId);
        if (fund) {
            await ctx.db.patch(expense.fundId, {
                balance: (fund.balance || 0) - expense.amount,
            });
        }

        // 4. Link ledger entry back to expense
        await ctx.db.patch(args.expenseId, { ledgerEntryId });

        return { success: true };
    },
});

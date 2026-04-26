import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUser } from "./permissions";
import { startOfDay, endOfDay } from "date-fns";

export const logDownload = mutation({
    args: {
        type: v.string(),
        startDate: v.string(),
        endDate: v.string(),
        itemCount: v.number(),
    },
    handler: async (ctx, args) => {
        const user = await getAuthUser(ctx);
        if (!user) throw new Error("Unauthorized");

        return await ctx.db.insert("pdf_logs", {
            organizationId: user.organizationId,
            userId: user._id,
            userName: user.name || "Unknown Leader",
            type: args.type,
            startDate: args.startDate,
            endDate: args.endDate,
            itemCount: args.itemCount,
            timestamp: Date.now(),
        });
    },
});

export const checkLogs = query({
    args: {
        type: v.string(),
        todayStart: v.number(),
    },
    handler: async (ctx, args) => {
        const user = await getAuthUser(ctx);
        if (!user) return [];

        return await ctx.db
            .query("pdf_logs")
            .withIndex("by_org_type", (q) => 
                q.eq("organizationId", user.organizationId).eq("type", args.type)
            )
            .filter((q) => q.gte(q.field("timestamp"), args.todayStart))
            .order("desc")
            .collect();
    },
});

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUser, isLeader, canManageMinistry } from "./permissions";
import { logAction, logArgs } from "./logs";

export const create = mutation({
    args: {
        memberId: v.id("users"),
        ministryId: v.id("ministries"),
        title: v.string(),
        description: v.optional(v.string()),
        dueDate: v.string(),
        tracing: v.object(logArgs),
    },
    handler: async (ctx, args) => {
        const user = await getAuthUser(ctx);
        if (!user || !isLeader(user)) {
            throw new Error("Unauthorized: Only leaders can assign tasks.");
        }

        if (!canManageMinistry(user, args.ministryId)) {
            throw new Error("Unauthorized: You don't have permission to manage this ministry.");
        }

        const id = await ctx.db.insert("assignments", {
            organizationId: user.organizationId,
            memberId: args.memberId,
            ministryId: args.ministryId,
            title: args.title,
            description: args.description,
            dueDate: args.dueDate,
            status: "pending",
            assignedBy: user._id,
            createdAt: Date.now(),
        });

        await logAction(ctx, user, args.tracing, {
            action: "ASSIGNMENT_CREATE",
            resourceType: "assignment",
            resourceId: id.toString(),
            details: `Created assignment: ${args.title}`,
            status: "success",
            metadata: { title: args.title, memberId: args.memberId },
        });

        return id;
    },
});

export const listByMember = query({
    args: { memberId: v.id("users") },
    handler: async (ctx, args) => {
        const user = await getAuthUser(ctx);
        if (!user) return [];

        // Members can only see their own assignments
        // Leaders/Admins can see any member's assignments
        if (user._id !== args.memberId && !isLeader(user)) {
            throw new Error("Unauthorized");
        }

        const assignments = await ctx.db
            .query("assignments")
            .withIndex("by_org_and_member", (q) =>
                q.eq("organizationId", user.organizationId).eq("memberId", args.memberId)
            )
            .order("desc")
            .collect();

        // Enhance with ministry names
        return await Promise.all(
            assignments.map(async (a) => {
                const ministry = await ctx.db.get(a.ministryId);
                return {
                    ...a,
                    ministryName: ministry?.name || "Unknown Ministry",
                };
            })
        );
    },
});

export const listByMinistry = query({
    args: { ministryId: v.id("ministries") },
    handler: async (ctx, args) => {
        const user = await getAuthUser(ctx);
        if (!user || !isLeader(user)) {
            throw new Error("Unauthorized");
        }

        const assignments = await ctx.db
            .query("assignments")
            .withIndex("by_ministry", (q) => q.eq("ministryId", args.ministryId))
            .order("desc")
            .collect();

        // Enhance with member names
        return await Promise.all(
            assignments.map(async (a) => {
                const member = await ctx.db.get(a.memberId);
                return {
                    ...a,
                    memberName: member?.name || "Unknown Member",
                };
            })
        );
    },
});

export const updateStatus = mutation({
    args: {
        id: v.id("assignments"),
        status: v.union(v.literal("pending"), v.literal("completed"), v.literal("acknowledged"), v.literal("not_available")),
        tracing: v.object(logArgs),
    },
    handler: async (ctx, args) => {
        const user = await getAuthUser(ctx);
        if (!user) throw new Error("Unauthenticated");

        const assignment = await ctx.db.get(args.id);
        if (!assignment) throw new Error("Assignment not found");

        await ctx.db.patch(args.id, { status: args.status });

        await logAction(ctx, user, args.tracing, {
            action: "ASSIGNMENT_STATUS_UPDATE",
            resourceType: "assignment",
            resourceId: args.id.toString(),
            details: `Updated assignment status to ${args.status}: ${assignment.title}`,
            status: "success",
            metadata: { status: args.status },
        });

        return args.id;
    },
});

export const remove = mutation({
    args: {
        id: v.id("assignments"),
        tracing: v.object(logArgs),
    },
    handler: async (ctx, args) => {
        const user = await getAuthUser(ctx);
        if (!user || !isLeader(user)) {
            throw new Error("Unauthorized");
        }

        const assignment = await ctx.db.get(args.id);
        if (!assignment) throw new Error("Assignment not found");

        await ctx.db.delete(args.id);

        await logAction(ctx, user, args.tracing, {
            action: "ASSIGNMENT_DELETE",
            resourceType: "assignment",
            resourceId: args.id.toString(),
            details: `Deleted assignment: ${assignment.title}`,
            status: "success",
        });

        return args.id;
    },
});

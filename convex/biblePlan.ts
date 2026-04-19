import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Helper to check for leader role without external import
async function checkLeader(ctx: any) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const user = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q: any) => q.eq("userId", identity.subject))
        .first();
    if (!user || (user.role !== "leader" && user.role !== "admin")) return null;
    return user;
}

// Helper to get active user
async function getActiveUser(ctx: any) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    return await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q: any) => q.eq("userId", identity.subject))
        .first();
}

// --- Leader Mutations ---

export const createPlan = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    duration: v.number(),
    readings: v.array(v.object({
      dayNumber: v.number(),
      scripture: v.string(),
      notes: v.optional(v.string()),
    })),
    tracing: v.any(), 
  },
  handler: async (ctx, args) => {
    const user = await checkLeader(ctx);
    if (!user) throw new Error("Unauthorized");

    const planId = await ctx.db.insert("bible_reading_plans", {
      organizationId: user.organizationId,
      title: args.title,
      description: args.description,
      duration: args.duration,
      createdBy: user._id,
      createdAt: Date.now(),
    });

    for (const reading of args.readings) {
      await ctx.db.insert("bible_reading_plan_days", {
        planId,
        dayNumber: reading.dayNumber,
        scripture: reading.scripture,
        notes: reading.notes,
      });
    }

    return planId;
  },
});

export const assignPlan = mutation({
  args: {
    planId: v.id("bible_reading_plans"),
    memberIds: v.array(v.id("users")),
    startDate: v.string(), 
    tracing: v.any(),
  },
  handler: async (ctx, args) => {
    const user = await checkLeader(ctx);
    if (!user) throw new Error("Unauthorized");

    for (const memberId of args.memberIds) {
      const existing = await ctx.db
        .query("bible_reading_assignments")
        .withIndex("by_org_and_member", (q) => 
          q.eq("organizationId", user.organizationId).eq("memberId", memberId)
        )
        .filter((q) => q.eq(q.field("planId"), args.planId))
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, {
          startDate: args.startDate,
          status: "active",
        });
      } else {
        await ctx.db.insert("bible_reading_assignments", {
          organizationId: user.organizationId,
          planId: args.planId,
          memberId,
          startDate: args.startDate,
          status: "active",
          assignedBy: user._id,
          createdAt: Date.now(),
        });
      }
    }
  },
});

// --- Leader Queries ---

export const listPlans = query({
  args: {},
  handler: async (ctx) => {
    const user = await checkLeader(ctx);
    if (!user) return [];

    return await ctx.db
      .query("bible_reading_plans")
      .withIndex("by_organization", (q) => q.eq("organizationId", user.organizationId))
      .order("desc")
      .collect();
  },
});

export const getPlanAssignments = query({
  args: { planId: v.id("bible_reading_plans") },
  handler: async (ctx, args) => {
    const user = await checkLeader(ctx);
    if (!user) return [];

    const assignments = await ctx.db
      .query("bible_reading_assignments")
      .withIndex("by_plan", (q) => q.eq("planId", args.planId))
      .collect();

    return await Promise.all(assignments.map(async (a) => {
      const member = await ctx.db.get(a.memberId);
      const progress = await ctx.db
        .query("bible_reading_progress")
        .withIndex("by_assignment", (q) => q.eq("assignmentId", a._id))
        .collect();
      
      const plan = await ctx.db.get(a.planId);
      const totalDays = plan?.duration || 1;
      const completedDays = progress.length;

      return {
        _id: a._id,
        memberId: a.memberId,
        memberName: member?.name || "Unknown Member",
        memberEmail: member?.email || "",
        startDate: a.startDate,
        completedCount: completedDays,
        totalDays: totalDays,
        percentComplete: Math.round((completedDays / totalDays) * 100),
      };
    }));
  },
});

// --- Member Mutations ---

export const markDayComplete = mutation({
  args: {
    assignmentId: v.id("bible_reading_assignments"),
    dayNumber: v.number(),
    tracing: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const user = await getActiveUser(ctx);
    if (!user) throw new Error("Unauthorized");

    const assignment = await ctx.db.get(args.assignmentId);
    if (!assignment || assignment.memberId !== user._id) throw new Error("Unauthorized");

    const existing = await ctx.db
      .query("bible_reading_progress")
      .withIndex("by_assignment_and_day", (q) => 
        q.eq("assignmentId", args.assignmentId).eq("dayNumber", args.dayNumber)
      )
      .first();

    if (!existing) {
      await ctx.db.insert("bible_reading_progress", {
        organizationId: user.organizationId,
        assignmentId: args.assignmentId,
        dayNumber: args.dayNumber,
        completedAt: Date.now(),
      });
    }
  },
});

// --- Member Queries ---

export const getMyActivePlan = query({
  args: {},
  handler: async (ctx) => {
    const user = await getActiveUser(ctx);
    if (!user) return null;

    const assignment = await ctx.db
      .query("bible_reading_assignments")
      .withIndex("by_org_and_member", (q) => 
        q.eq("organizationId", user.organizationId).eq("memberId", user._id)
      )
      .filter((q) => q.eq(q.field("status"), "active"))
      .order("desc")
      .first();

    if (!assignment) return null;

    const plan = await ctx.db.get(assignment.planId);
    const progress = await ctx.db
      .query("bible_reading_progress")
      .withIndex("by_assignment", (q) => q.eq("assignmentId", assignment._id))
      .collect();

    const readings = await ctx.db
      .query("bible_reading_plan_days")
      .withIndex("by_plan", (q) => q.eq("planId", assignment.planId))
      .collect();

    return {
      assignment,
      plan,
      progress: progress.map(p => p.dayNumber),
      readings,
    };
  },
});

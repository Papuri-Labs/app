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
      book: v.optional(v.string()),
      bookName: v.optional(v.string()),
      chapter: v.optional(v.number()),
      verseStart: v.optional(v.number()),
      verseEnd: v.optional(v.number()),
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
        book: reading.book,
        bookName: reading.bookName,
        chapter: reading.chapter,
        verseStart: reading.verseStart,
        verseEnd: reading.verseEnd,
        notes: reading.notes,
      });
    }

    return planId;
  },
});

export const updatePlan = mutation({
  args: {
    planId: v.id("bible_reading_plans"),
    title: v.string(),
    description: v.optional(v.string()),
    duration: v.number(),
    readings: v.array(v.object({
      dayNumber: v.number(),
      scripture: v.string(),
      book: v.optional(v.string()),
      bookName: v.optional(v.string()),
      chapter: v.optional(v.number()),
      verseStart: v.optional(v.number()),
      verseEnd: v.optional(v.number()),
      notes: v.optional(v.string()),
    })),
    tracing: v.any(),
  },
  handler: async (ctx, args) => {
    const user = await checkLeader(ctx);
    if (!user) throw new Error("Unauthorized");

    const plan = await ctx.db.get(args.planId);
    if (!plan || plan.organizationId !== user.organizationId) throw new Error("Unauthorized");

    await ctx.db.patch(args.planId, {
      title: args.title,
      description: args.description,
      duration: args.duration,
    });

    // Sync readings
    const existingReadings = await ctx.db
      .query("bible_reading_plan_days")
      .withIndex("by_plan", (q) => q.eq("planId", args.planId))
      .collect();

    // Remove days beyond new duration
    for (const er of existingReadings) {
        if (er.dayNumber > args.duration) {
            await ctx.db.delete(er._id);
        }
    }

    // Update or Insert days
    for (const reading of args.readings) {
      const existing = existingReadings.find(er => er.dayNumber === reading.dayNumber);
      if (existing) {
        await ctx.db.patch(existing._id, {
          scripture: reading.scripture,
          book: reading.book,
          bookName: reading.bookName,
          chapter: reading.chapter,
          verseStart: reading.verseStart,
          verseEnd: reading.verseEnd,
          notes: reading.notes,
        });
      } else if (reading.dayNumber <= args.duration) {
        await ctx.db.insert("bible_reading_plan_days", {
          planId: args.planId,
          dayNumber: reading.dayNumber,
          scripture: reading.scripture,
          book: reading.book,
          bookName: reading.bookName,
          chapter: reading.chapter,
          verseStart: reading.verseStart,
          verseEnd: reading.verseEnd,
          notes: reading.notes,
        });
      }
    }
  },
});

export const assignPlan = mutation({
  args: {
    planId: v.id("bible_reading_plans"),
    memberIds: v.optional(v.array(v.id("users"))),
    ministryId: v.optional(v.id("ministries")),
    group: v.optional(v.string()),
    startDate: v.string(), 
    message: v.optional(v.string()),
    tracing: v.any(),
  },
  handler: async (ctx, args) => {
    const user = await checkLeader(ctx);
    if (!user) throw new Error("Unauthorized");

    let targets: Id<"users">[] = [];

    if (args.memberIds) {
      targets = args.memberIds;
    } else if (args.ministryId) {
      const allUsers = await ctx.db
        .query("users")
        .withIndex("by_organization", (q) => q.eq("organizationId", user.organizationId))
        .collect();
      // Filter for those in the ministry AND are members
      targets = allUsers
        .filter(u => u.role === "member" && u.ministryIds.includes(args.ministryId!))
        .map(u => u._id);
    } else if (args.group) {
      const allUsers = await ctx.db
        .query("users")
        .withIndex("by_organization", (q) => q.eq("organizationId", user.organizationId))
        .collect();
      targets = allUsers
        .filter(u => u.role === "member" && u.group === args.group)
        .map(u => u._id);
    }

    if (targets.length === 0) return;

    for (const memberId of targets) {
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
          groupName: args.group,
          message: args.message,
        });
      } else {
        await ctx.db.insert("bible_reading_assignments", {
          organizationId: user.organizationId,
          planId: args.planId,
          memberId,
          startDate: args.startDate,
          groupName: args.group,
          message: args.message,
          status: "active",
          assignedBy: user._id,
          createdAt: Date.now(),
        });
      }
    }
  },
});

export const deletePlan = mutation({
  args: { planId: v.id("bible_reading_plans") },
  handler: async (ctx, args) => {
    const user = await checkLeader(ctx);
    if (!user) throw new Error("Unauthorized");

    const plan = await ctx.db.get(args.planId);
    if (!plan || plan.organizationId !== user.organizationId) {
        throw new Error("Unauthorized");
    }

    // Delete assignments and their progress
    const assignments = await ctx.db
      .query("bible_reading_assignments")
      .withIndex("by_plan", (q) => q.eq("planId", args.planId))
      .collect();

    for (const a of assignments) {
      const progress = await ctx.db
        .query("bible_reading_progress")
        .withIndex("by_assignment", (q) => q.eq("assignmentId", a._id))
        .collect();
      
      for (const p of progress) {
        await ctx.db.delete(p._id);
      }
      await ctx.db.delete(a._id);
    }

    // Delete plan days
    const days = await ctx.db
        .query("bible_reading_plan_days")
        .withIndex("by_plan", (q) => q.eq("planId", args.planId))
        .collect();
    
    for (const d of days) {
        await ctx.db.delete(d._id);
    }

    // Delete plan
    await ctx.db.delete(args.planId);
  }
});

export const removeAssignments = mutation({
  args: {
    assignmentIds: v.array(v.id("bible_reading_assignments")),
  },
  handler: async (ctx, args) => {
    const user = await checkLeader(ctx);
    if (!user) throw new Error("Unauthorized");

    for (const assignmentId of args.assignmentIds) {
      const assignment = await ctx.db.get(assignmentId);
      if (assignment && assignment.organizationId === user.organizationId) {
        // Delete all progress for this assignment
        const progress = await ctx.db
          .query("bible_reading_progress")
          .withIndex("by_assignment", (q) => q.eq("assignmentId", assignmentId))
          .collect();
        
        for (const p of progress) {
          await ctx.db.delete(p._id);
        }

        // Delete the actual assignment
        await ctx.db.delete(assignmentId);
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

export const getPlanDetails = query({
  args: { planId: v.id("bible_reading_plans") },
  handler: async (ctx, args) => {
    const user = await checkLeader(ctx);
    if (!user) return null;

    const plan = await ctx.db.get(args.planId);
    if (!plan || plan.organizationId !== user.organizationId) return null;

    const readings = await ctx.db
      .query("bible_reading_plan_days")
      .withIndex("by_plan", (q) => q.eq("planId", args.planId))
      .collect();

    return { 
      ...plan, 
      readings: readings.sort((a, b) => a.dayNumber - b.dayNumber) 
    };
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

      // Streak & Status Calculation
      const completedDates = progress
        .map(p => {
            const d = new Date(p.completedAt);
            d.setHours(0,0,0,0);
            return d.getTime();
        })
        .sort((a, b) => b - a);
      
      const uniqueDates = Array.from(new Set(completedDates));
      let currentStreak = 0;
      const now = new Date();
      now.setHours(0,0,0,0);
      const today = now.getTime();
      const yesterday = today - 24 * 60 * 60 * 1000;

      if (uniqueDates.length > 0) {
        if (uniqueDates[0] === today || uniqueDates[0] === yesterday) {
            currentStreak = 1;
            let expectedNext = uniqueDates[0] - 24 * 60 * 60 * 1000;
            for (let i = 1; i < uniqueDates.length; i++) {
                if (uniqueDates[i] === expectedNext) {
                    currentStreak++;
                    expectedNext -= 24 * 60 * 60 * 1000;
                } else {
                    break;
                }
            }
        }
      }

      const lastActiveAt = progress.length > 0 ? Math.max(...progress.map(p => p.completedAt)) : null;
      let status = "Inactive";
      if (lastActiveAt) {
          const hoursSinceLastActive = (Date.now() - lastActiveAt) / (1000 * 60 * 60);
          if (hoursSinceLastActive < 24) status = "Active";
          else if (hoursSinceLastActive < 72) status = "At Risk";
      }

      return {
        _id: a._id,
        memberId: a.memberId,
        memberName: member?.name || "Unknown Member",
        memberEmail: member?.email || "",
        avatar: member?.avatar,
        startDate: a.startDate,
        completedCount: completedDays,
        totalDays: totalDays,
        percentComplete: Math.round((completedDays / totalDays) * 100),
        lastActiveAt,
        status,
        currentStreak,
        lastRemindedAt: a.lastRemindedAt,
      };
    }));
  },
});

export const listCellGroups = query({
  args: {},
  handler: async (ctx) => {
    const user = await checkLeader(ctx);
    if (!user) return [];

    const users = await ctx.db
      .query("users")
      .withIndex("by_organization", (q) => q.eq("organizationId", user.organizationId))
      .collect();

    // Extract unique non-empty group names
    const groups = Array.from(new Set(users.map(u => u.group).filter(Boolean))) as string[];
    
    return groups.map(name => ({
      name,
      memberCount: users.filter(u => u.group === name).length
    }));
  },
});

export const getOrganizationStats = query({
  args: {},
  handler: async (ctx) => {
    const user = await checkLeader(ctx);
    if (!user) return null;

    const assignments = await ctx.db
      .query("bible_reading_assignments")
      .withIndex("by_organization", (q) => q.eq("organizationId", user.organizationId))
      .filter(q => q.eq(q.field("status"), "active"))
      .collect();

    if (assignments.length === 0) return { completionRate: 0, totalAssigned: 0, completedToday: 0 };

    let completedToday = 0;
    const now = new Date();
    now.setHours(0,0,0,0);

    for (const a of assignments) {
      const start = new Date(a.startDate);
      start.setHours(0,0,0,0);
      const diffDays = Math.ceil(Math.abs(now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      const todayDayNumber = diffDays + 1;

      const done = await ctx.db
        .query("bible_reading_progress")
        .withIndex("by_assignment_and_day", (q) => 
          q.eq("assignmentId", a._id).eq("dayNumber", todayDayNumber)
        )
        .first();

      if (done) completedToday++;
    }

    return {
      totalAssigned: assignments.length,
      completedToday,
      completionRate: Math.round((completedToday / assignments.length) * 100)
    };
  },
});

// --- Member Mutations ---

export const markDayComplete = mutation({
  args: {
    assignmentId: v.id("bible_reading_assignments"),
    dayNumber: v.number(),
    reflection: v.optional(v.string()),
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
        reflection: args.reflection,
      });
    } else if (args.reflection && !existing.reflection) {
      await ctx.db.patch(existing._id, { reflection: args.reflection });
    }
  },
});

export const sendReminder = mutation({
  args: {
    assignmentId: v.id("bible_reading_assignments"),
  },
  handler: async (ctx, args) => {
    const user = await checkLeader(ctx);
    if (!user) throw new Error("Unauthorized");

    const assignment = await ctx.db.get(args.assignmentId);
    if (!assignment) throw new Error("Assignment not found");

    // Update the timestamp to mark that a reminder was sent.
    // Future proofing: Add resend or email triggers here when requested.
    await ctx.db.patch(args.assignmentId, {
        lastRemindedAt: Date.now()
    });
  }
});

export const postEncouragement = mutation({
  args: {
    planId: v.id("bible_reading_plans"),
    groupName: v.string(),
    dayNumber: v.number(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await checkLeader(ctx);
    if (!user) throw new Error("Unauthorized");

    const existing = await ctx.db
      .query("bible_reading_group_messages")
      .withIndex("by_group_plan_day", (q) => 
        q.eq("organizationId", user.organizationId)
         .eq("groupName", args.groupName)
         .eq("planId", args.planId)
         .eq("dayNumber", args.dayNumber)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        message: args.message,
        postedBy: user._id,
        createdAt: Date.now(),
      });
    } else {
      await ctx.db.insert("bible_reading_group_messages", {
        organizationId: user.organizationId,
        planId: args.planId,
        groupName: args.groupName,
        dayNumber: args.dayNumber,
        message: args.message,
        postedBy: user._id,
        createdAt: Date.now(),
      });
    }
  },
});

export const getGroupProgress = query({
  args: {
    planId: v.id("bible_reading_plans"),
    groupName: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await checkLeader(ctx);
    if (!user) return null;

    const assignments = await ctx.db
      .query("bible_reading_assignments")
      .withIndex("by_plan", (q) => q.eq("planId", args.planId))
      .filter((q) => q.eq(q.field("groupName"), args.groupName))
      .collect();

    if (assignments.length === 0) return { averageProgress: 0, memberCount: 0 };

    let totalCompletedDays = 0;
    let totalPossibleDays = 0;

    const plan = await ctx.db.get(args.planId);
    const duration = plan?.duration || 1;

    for (const a of assignments) {
      const progress = await ctx.db
        .query("bible_reading_progress")
        .withIndex("by_assignment", (q) => q.eq("assignmentId", a._id))
        .collect();
      
      totalCompletedDays += progress.length;
      totalPossibleDays += duration;
    }

    return {
      averageProgress: Math.round((totalCompletedDays / totalPossibleDays) * 100),
      memberCount: assignments.length,
    };
  },
});

export const listGroupMessages = query({
  args: {
    planId: v.id("bible_reading_plans"),
    groupName: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getActiveUser(ctx); // Allow members to see messages too
    if (!user) return [];

    return await ctx.db
      .query("bible_reading_group_messages")
      .withIndex("by_group_plan_day", (q) => 
        q.eq("organizationId", user.organizationId)
         .eq("groupName", args.groupName)
         .eq("planId", args.planId)
      )
      .collect();
  },
});

// --- Member Queries ---

export const getMyActivePlans = query({
  args: {},
  handler: async (ctx) => {
    const user = await getActiveUser(ctx);
    if (!user) return [];

    const assignments = await ctx.db
      .query("bible_reading_assignments")
      .withIndex("by_org_and_member", (q) => 
        q.eq("organizationId", user.organizationId).eq("memberId", user._id)
      )
      .filter((q) => q.eq(q.field("status"), "active"))
      .order("desc")
      .collect();

    if (assignments.length === 0) return [];

    return await Promise.all(assignments.map(async (assignment) => {
      const plan = await ctx.db.get(assignment.planId);
      const progress = await ctx.db
        .query("bible_reading_progress")
        .withIndex("by_assignment", (q) => q.eq("assignmentId", assignment._id))
        .collect();

      const readings = await ctx.db
        .query("bible_reading_plan_days")
        .withIndex("by_plan", (q) => q.eq("planId", assignment.planId))
        .collect();

      // Streak Calculation
      const completedDates = progress
        .map(p => {
            const d = new Date(p.completedAt);
            d.setHours(0,0,0,0);
            return d.getTime();
        })
        .sort((a, b) => b - a);
      
      const uniqueDates = Array.from(new Set(completedDates));
      let currentStreak = 0;
      const now = new Date();
      now.setHours(0,0,0,0);
      const today = now.getTime();
      const yesterday = today - 24 * 60 * 60 * 1000;

      if (uniqueDates.length > 0) {
        if (uniqueDates[0] === today || uniqueDates[0] === yesterday) {
            currentStreak = 1;
            let expectedNext = uniqueDates[0] - 24 * 60 * 60 * 1000;
            for (let i = 1; i < uniqueDates.length; i++) {
                if (uniqueDates[i] === expectedNext) {
                    currentStreak++;
                    expectedNext -= 24 * 60 * 60 * 1000;
                } else {
                    break;
                }
            }
        }
      }

      // Get Group Stats
      let groupStats = null;
      if (assignment.groupName) {
        const groupAssignments = await ctx.db
          .query("bible_reading_assignments")
          .withIndex("by_plan", (q) => q.eq("planId", assignment.planId))
          .filter((q) => q.eq(q.field("groupName"), assignment.groupName))
          .collect();

        let totalCompleted = 0;
        for (const ga of groupAssignments) {
          const gp = await ctx.db
            .query("bible_reading_progress")
            .withIndex("by_assignment", (q) => q.eq("assignmentId", ga._id))
            .collect();
          totalCompleted += gp.length;
        }

        groupStats = {
          name: assignment.groupName,
          averageProgress: Math.round((totalCompleted / (groupAssignments.length * (plan?.duration || 1))) * 100),
          memberCount: groupAssignments.length,
        };
      }

      // Get current day message
      const nowTime = new Date();
      const startTime = new Date(assignment.startDate);
      startTime.setHours(0,0,0,0);
      nowTime.setHours(0,0,0,0);
      const diffDays = Math.floor((nowTime.getTime() - startTime.getTime()) / (1000 * 60 * 60 * 24));
      const currentDay = diffDays + 1;

      const dailyMessage = assignment.groupName ? await ctx.db
        .query("bible_reading_group_messages")
        .withIndex("by_group_plan_day", (q) => 
          q.eq("organizationId", user.organizationId)
           .eq("groupName", assignment.groupName!)
           .eq("planId", assignment.planId)
           .eq("dayNumber", currentDay)
        )
        .first() : null;

      return {
        assignment,
        plan,
        progress: progress.map(p => p.dayNumber),
        progressData: progress,
        readings,
        currentStreak,
        groupStats,
        dailyMessage: dailyMessage?.message || null,
      };
    }));
  },
});

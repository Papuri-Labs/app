import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUser, getUserMinistries, isLeader } from "./permissions";

// Get followups - members who need attention based on absence count
export const getFollowUps = query({
    args: {},
    handler: async (ctx) => {
        const user = await getAuthUser(ctx);
        const ministries = getUserMinistries(user);
        const settings = await ctx.db.query("settings").first();
        const threshold = settings?.followUpAbsences ?? 3;

        // Get all users
        const allUsers = await ctx.db.query("users").collect();

        // Filter users by ministry
        const users = ministries === "all"
            ? allUsers
            : allUsers.filter(u => u.ministryIds?.some((mid: any) => ministries.includes(mid)));

        // For each user, count their recent consecutive absences
        const followUps = await Promise.all(
            users.map(async (user) => {
                // Get attendance records for this user
                const attendanceRecords = await ctx.db
                    .query("attendance")
                    .withIndex("by_member", (q) => q.eq("memberId", user._id))
                    .collect();

                // Sort by date descending
                attendanceRecords.sort((a, b) => b.date.localeCompare(a.date));

                let absences = 0;
                for (const r of attendanceRecords) {
                    if (r.status === "absent") absences++;
                    else break;
                }

                return {
                    ...user,
                    absences,
                };
            })
        );

        // Filter to only those with absences >= threshold and sort
        return followUps
            .filter(u => u.absences >= threshold)
            .sort((a, b) => b.absences - a.absences);
    },
});

export const getByEvent = query({
    args: { eventId: v.id("events") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("attendance")
            .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
            .collect();
    },
});

export const mark = mutation({
    args: {
        memberId: v.id("users"),
        eventId: v.optional(v.id("events")),
        serviceId: v.optional(v.id("services")),
        date: v.string(),
        status: v.union(v.literal("present"), v.literal("absent")),
    },
    handler: async (ctx, args) => {
        const user = await getAuthUser(ctx);
        if (!user) throw new Error("Unauthorized");

        // Only leaders can mark attendance
        if (!isLeader(user)) {
            throw new Error("Only leaders and admins can mark attendance");
        }

        // Check if already marked for this event/service/date/member
        let existing = await ctx.db
            .query("attendance")
            .withIndex("by_date", (q) => q.eq("date", args.date))
            .filter((q) => q.eq(q.field("memberId"), args.memberId))
            .collect();

        // Find the specific record matching event or service
        const specificRecord = existing.find(r =>
            (args.eventId ? r.eventId === args.eventId : !r.eventId) &&
            (args.serviceId ? r.serviceId === args.serviceId : !r.serviceId)
        );

        let recordId = null;
        if (specificRecord) {
            await ctx.db.patch(specificRecord._id, {
                status: args.status,
                markedBy: user._id,
            });
            recordId = specificRecord._id;
        } else {
            recordId = await ctx.db.insert("attendance", {
                organizationId: user.organizationId,
                ...args,
                markedBy: user._id,
            });
        }

        // Automation: Update User Status based on Settings
        const settings = await ctx.db.query("settings").first();
        if (settings) {
            const member = await ctx.db.get(args.memberId);
            if (member) {
                const records = await ctx.db
                    .query("attendance")
                    .withIndex("by_member", (q) => q.eq("memberId", args.memberId))
                    .collect();

                records.sort((a, b) => b.date.localeCompare(a.date));

                let consecutiveAbsences = 0;
                for (const r of records) {
                    if (r.status === "absent") consecutiveAbsences++;
                    else break;
                }

                const totalPresent = records.filter(r => r.status === "present").length;

                // Inactive Check
                if (consecutiveAbsences >= (settings.inactiveAbsences ?? 5)) {
                    if (member.status !== "Inactive") {
                        await ctx.db.patch(member._id, { status: "Inactive" });
                    }
                }
                // Reactivation Check
                else if (member.status === "Inactive" && args.status === "present") {
                    await ctx.db.patch(member._id, { status: "Active" });
                }
                // Promotion Check (New -> Active)
                else if ((member.status === "New" || !member.status) && totalPresent >= (settings.promoteAttendance ?? 3)) {
                    await ctx.db.patch(member._id, { status: "Active" });
                }
            }
        }

        return recordId;
    },
});

export const getDailyAttendance = query({
    args: { date: v.string() },
    handler: async (ctx, args) => {
        const user = await getAuthUser(ctx);
        if (!isLeader(user)) throw new Error("Unauthorized");

        const rawRecords = await ctx.db
            .query("attendance")
            .withIndex("by_date", (q) => q.eq("date", args.date))
            .collect();

        // Defensive: ensure unique records in case of race conditions or data issues
        // Use string conversion to ensure primitive comparison in the Set
        const seen = new Set<string>();
        const records = rawRecords.filter(r => {
            const idStr = r._id.toString();
            if (seen.has(idStr)) return false;
            seen.add(idStr);
            return true;
        });

        const enriched = await Promise.all(records.map(async (r) => {
            let ministryName = "General";
            if (r.eventId) {
                const event = await ctx.db.get(r.eventId);
                if (event && event.ministryId) {
                    const ministry = await ctx.db.get(event.ministryId);
                    if (ministry) ministryName = ministry.name as string;
                }
            } else if (r.serviceId) {
                const service = await ctx.db.get(r.serviceId);
                if (service) ministryName = service.name;
            }

            const member = await ctx.db.get(r.memberId);
            const markedByUser = r.markedBy ? await ctx.db.get(r.markedBy) : null;
            return {
                _id: r._id,
                memberId: r.memberId,
                eventId: r.eventId,
                serviceId: r.serviceId,
                name: member?.name || "Unknown",
                email: member?.email || "",
                status: r.status,
                ministryName,
                markedByName: markedByUser?.name || "Unknown",
            };
        }));

        return enriched;
    },
});

// Get all leaders of a specific ministry for the follow-up assignment picker
export const getLeadersByMinistry = query({
    args: { ministryId: v.optional(v.id("ministries")) },
    handler: async (ctx, args) => {
        const user = await getAuthUser(ctx);
        if (!user || !isLeader(user)) throw new Error("Unauthorized");

        const allUsers = await ctx.db
            .query("users")
            .withIndex("by_organization", (q) => q.eq("organizationId", user.organizationId))
            .collect();

        const leaders = allUsers.filter(u =>
            u.isActive !== false &&
            (u.role === "leader" || u.role === "admin") &&
            (args.ministryId ? u.ministryIds?.includes(args.ministryId) : true)
        );

        return leaders.map(l => ({
            _id: l._id,
            name: l.name,
            email: l.email,
            role: l.role,
            ministryIds: l.ministryIds,
        }));
    },
});

export const assignFollowUp = mutation({
    args: {
        memberId: v.id("users"),
        leaderId: v.id("users"),
        notes: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await getAuthUser(ctx);
        if (!user || !isLeader(user)) throw new Error("Unauthorized");

        // Upsert: if an open assignment already exists for this member, update it
        const existing = await ctx.db
            .query("follow_up_assignments")
            .withIndex("by_org_and_member", (q) =>
                q.eq("organizationId", user.organizationId).eq("memberId", args.memberId)
            )
            .filter((q) => q.neq(q.field("status"), "completed"))
            .first();

        if (existing) {
            await ctx.db.patch(existing._id, {
                leaderId: args.leaderId,
                assignedBy: user._id,
                notes: args.notes,
                status: "pending",
                // notifiedAt will be set here in the future when email is sent
            });
            return existing._id;
        }

        const id = await ctx.db.insert("follow_up_assignments", {
            organizationId: user.organizationId,
            memberId: args.memberId,
            leaderId: args.leaderId,
            assignedBy: user._id,
            notes: args.notes,
            status: "pending",
            createdAt: Date.now(),
        });

        // TODO (email): When email feature is ready, call email scheduler here and set notifiedAt

        return id;
    },
});

export const listFollowUpAssignments = query({
    args: {},
    handler: async (ctx) => {
        const user = await getAuthUser(ctx);
        if (!user || !isLeader(user)) throw new Error("Unauthorized");

        const records = await ctx.db
            .query("follow_up_assignments")
            .withIndex("by_organization", (q) => q.eq("organizationId", user.organizationId))
            .order("desc")
            .collect();

        return await Promise.all(records.map(async (r) => {
            const member = await ctx.db.get(r.memberId);
            const leader = await ctx.db.get(r.leaderId);
            const assignedByUser = await ctx.db.get(r.assignedBy);
            return {
                ...r,
                memberName: member?.name ?? "Unknown",
                leaderName: leader?.name ?? "Unknown",
                leaderEmail: leader?.email ?? "",
                assignedByName: assignedByUser?.name ?? "Unknown",
            };
        }));
    },
});

// Get only the follow-up assignments assigned to the currently logged-in leader
export const getMyFollowUpAssignments = query({
    args: {},
    handler: async (ctx) => {
        const user = await getAuthUser(ctx);
        if (!user || !isLeader(user)) return [];

        const records = await ctx.db
            .query("follow_up_assignments")
            .withIndex("by_leader", (q) => q.eq("leaderId", user._id))
            .order("desc")
            .collect();

        return await Promise.all(records.map(async (r) => {
            const member = await ctx.db.get(r.memberId);
            const assignedByUser = await ctx.db.get(r.assignedBy);
            return {
                ...r,
                memberName: member?.name ?? "Unknown",
                memberEmail: member?.email ?? "",
                memberAbsences: 0, // Not tracked here — just for display
                assignedByName: assignedByUser?.name ?? "Unknown",
            };
        }));
    },
});

export const updateFollowUpStatus = mutation({
    args: {
        id: v.id("follow_up_assignments"),
        status: v.union(v.literal("pending"), v.literal("in_progress"), v.literal("completed")),
    },
    handler: async (ctx, args) => {
        const user = await getAuthUser(ctx);
        if (!user || !isLeader(user)) throw new Error("Unauthorized");

        const record = await ctx.db.get(args.id);
        if (!record) throw new Error("Follow-up assignment not found");

        // Only the assigned leader or an admin can update status
        if (record.leaderId !== user._id && user.role !== "admin") {
            throw new Error("Unauthorized: You are not the assigned leader for this follow-up.");
        }

        await ctx.db.patch(args.id, { status: args.status });
        return args.id;
    },
});

// Update the leader's own field notes on a follow-up assignment
export const updateFollowUpNotes = mutation({
    args: {
        id: v.id("follow_up_assignments"),
        leaderNotes: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await getAuthUser(ctx);
        if (!user || !isLeader(user)) throw new Error("Unauthorized");

        const record = await ctx.db.get(args.id);
        if (!record) throw new Error("Follow-up assignment not found");

        // Only the assigned leader or an admin can write leader notes
        if (record.leaderId !== user._id && user.role !== "admin") {
            throw new Error("Unauthorized: You are not the assigned leader for this follow-up.");
        }

        await ctx.db.patch(args.id, { leaderNotes: args.leaderNotes });
        return args.id;
    },
});

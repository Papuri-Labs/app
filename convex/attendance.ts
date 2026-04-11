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

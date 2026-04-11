import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUser, canManageMinistry, getUserMinistries, isLeader, validateOrgAccess } from "./permissions";
import { logAction, logArgs } from "./logs";

export const list = query({
    args: { orgSlug: v.optional(v.string()) },
    handler: async (ctx, args) => {
        const organizationId = await validateOrgAccess(ctx, args.orgSlug);
        if (!organizationId) return [];
        
        const user = await getAuthUser(ctx);
        const ministries = getUserMinistries(user);

        const allEvents = await ctx.db
            .query("events")
            .withIndex("by_organization", (q) => q.eq("organizationId", organizationId))
            .collect();

        // Global Visibility with Draft protection
        if (isLeader(user)) {
            return allEvents;
        }

        // Non-leaders and guests see only published events
        return allEvents.filter(e => !e.status || e.status === "Published");
    },
});

export const createEvent = mutation({
    args: {
        title: v.string(),
        date: v.string(),
        time: v.string(),
        ministryId: v.optional(v.id("ministries")),
        type: v.optional(v.string()),
        stage: v.optional(v.string()),
        lead: v.optional(v.string()),
        status: v.optional(v.string()),
        orgSlug: v.optional(v.string()), // Multi-tenant safety
        tracing: v.object(logArgs),
    },
    handler: async (ctx, args) => {
        const organizationId = await validateOrgAccess(ctx, args.orgSlug);
        const user = await getAuthUser(ctx);
        if (!user) throw new Error("Unauthorized");
        if (!isLeader(user)) throw new Error("Unauthorized");

        const { tracing, orgSlug, ...eventData } = args;

        const eventId = await ctx.db.insert("events", {
            organizationId,
            ...eventData,
            rsvpCount: 0,
            status: eventData.status || "Draft",
        });

        await logAction(ctx, user, tracing, {
            action: "EVENT_CREATE",
            resourceType: "event",
            resourceId: eventId.toString(),
            details: `Created event: ${eventData.title}`,
            status: "success",
            metadata: { title: eventData.title, date: eventData.date },
        });
    },
});

export const updateEvent = mutation({
    args: {
        id: v.id("events"),
        title: v.optional(v.string()),
        date: v.optional(v.string()),
        time: v.optional(v.string()),
        type: v.optional(v.string()),
        stage: v.optional(v.string()),
        lead: v.optional(v.string()),
        status: v.optional(v.string()),
        tracing: v.object(logArgs),
    },
    handler: async (ctx, args) => {
        const user = await getAuthUser(ctx);
        if (!user) throw new Error("Unauthorized");
        const event = await ctx.db.get(args.id);
        if (!event) throw new Error("Event not found");

        const { id, tracing, ...updates } = args;
        await ctx.db.patch(id, updates);

        await logAction(ctx, user, args.tracing, {
            action: "EVENT_UPDATE",
            resourceType: "event",
            resourceId: id.toString(),
            details: `Updated event: ${event.title}`,
            status: "success",
            metadata: updates,
        });
    },
});

export const deleteEvent = mutation({
    args: {
        id: v.id("events"),
        tracing: v.object(logArgs),
    },
    handler: async (ctx, args) => {
        const user = await getAuthUser(ctx);
        if (!user) throw new Error("Unauthorized");
        const event = await ctx.db.get(args.id);
        if (!event) return;

        await ctx.db.delete(args.id);

        await logAction(ctx, user, args.tracing, {
            action: "EVENT_DELETE",
            resourceType: "event",
            resourceId: args.id.toString(),
            details: `Deleted event: ${event.title}`,
            status: "success",
        });
    },
});

export const rsvp = mutation({
    args: {
        eventId: v.id("events"),
        memberId: v.id("users"),
        tracing: v.object(logArgs),
    },
    handler: async (ctx, args) => {
        const user = await getAuthUser(ctx);
        if (!user) throw new Error("Unauthenticated");

        const event = await ctx.db.get(args.eventId);
        if (!event) throw new Error("Event not found");

        const existing = await ctx.db
            .query("rsvps")
            .withIndex("by_member", (q) => q.eq("memberId", args.memberId))
            .filter((q) => q.eq(q.field("eventId"), args.eventId))
            .first();

        if (existing) {
            await ctx.db.delete(existing._id);
            await ctx.db.patch(args.eventId, { rsvpCount: Math.max(0, event.rsvpCount - 1) });

            await logAction(ctx, user, args.tracing, {
                action: "EVENT_RSVP_CANCEL",
                resourceType: "event",
                resourceId: args.eventId.toString(),
                details: `Cancelled RSVP for: ${event.title}`,
                status: "success",
            });
            return null;
        }

        const id = await ctx.db.insert("rsvps", {
            organizationId: user.organizationId,
            eventId: args.eventId,
            memberId: args.memberId,
            createdAt: Date.now(),
        });

        await ctx.db.patch(args.eventId, { rsvpCount: event.rsvpCount + 1 });

        await logAction(ctx, user, args.tracing, {
            action: "EVENT_RSVP",
            resourceType: "event",
            resourceId: args.eventId.toString(),
            details: `RSVPed for: ${event.title}`,
            status: "success",
        });

        return id;
    },
});


export const getUserRsvps = query({
    args: { memberId: v.id("users") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("rsvps")
            .withIndex("by_member", (q) => q.eq("memberId", args.memberId))
            .collect();
    },
});

export const getEventRsvps = query({
    args: { eventId: v.id("events") },
    handler: async (ctx, args) => {
        const user = await getAuthUser(ctx);
        if (!isLeader(user)) throw new Error("Unauthorized");

        const rsvps = await ctx.db
            .query("rsvps")
            .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
            .collect();

        // Join with users to get names
        const rsvpsWithDetails = await Promise.all(
            rsvps.map(async (r) => {
                const member = await ctx.db.get(r.memberId);
                return {
                    ...r,
                    member,
                };
            })
        );

        return rsvpsWithDetails.filter(r => r.member);
    },
});


import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { getAuthUser } from "./permissions";
import { Doc, Id } from "./_generated/dataModel";

// Industry standard JSON logging fields
export const logArgs = {
    traceId: v.string(),
    spanId: v.optional(v.string()),
};

/**
 * Redacts sensitive fields from objects before logging
 */
function maskData(data: any): any {
    if (!data || typeof data !== "object") return data;
    const masked = { ...data };
    const sensitiveFields = ["password", "token", "clerk_id", "clerkId", "secret", "apiKey"];

    for (const key in masked) {
        if (sensitiveFields.includes(key.toLowerCase())) {
            masked[key] = "[REDACTED]";
        } else if (typeof masked[key] === "object") {
            masked[key] = maskData(masked[key]);
        }
    }
    return masked;
}

/**
 * Standard internal mutation to insert logs
 */
export const insertLog = internalMutation({
    args: {
        organizationId: v.id("organizations"),
        userId: v.optional(v.id("users")),
        traceId: v.string(),
        spanId: v.optional(v.string()),
        level: v.union(v.literal("INFO"), v.literal("WARN"), v.literal("ERROR"), v.literal("DEBUG")),
        action: v.string(),
        resourceType: v.string(),
        resourceId: v.optional(v.string()),
        details: v.string(),
        metadata: v.optional(v.any()),
        duration_ms: v.optional(v.number()),
        status: v.string(),
        timestamp: v.number(),
    },
    handler: async (ctx, args) => {
        const maskedMetadata = maskData(args.metadata);

        // Output to terminal for local development visibility
        console.log(`[${args.level}] ${args.action}: ${args.details}`, {
            traceId: args.traceId,
            resource: `${args.resourceType}:${args.resourceId || 'N/A'}`,
            status: args.status,
            metadata: maskedMetadata,
        });

        await ctx.db.insert("audit_logs", {
            ...args,
            metadata: maskedMetadata,
        });
    },
});

/**
 * Public mutation for the frontend to log UI-level events
 */
export const logUIEvent = mutation({
    args: {
        action: v.string(),
        details: v.string(),
        resourceType: v.optional(v.string()),
        resourceId: v.optional(v.string()),
        metadata: v.optional(v.any()),
        tracing: v.object(logArgs),
    },
    handler: async (ctx, args) => {
        const user = await getAuthUser(ctx);
        if (!user) return; // Skip logging for unauthenticated UI actions if needed

        const maskedMetadata = maskData(args.metadata);

        // Terminal output
        console.log(`[UI_EVENT] ${args.action}: ${args.details}`, {
            user: user.email,
            traceId: args.tracing.traceId,
            metadata: maskedMetadata,
        });

        await ctx.db.insert("audit_logs", {
            organizationId: user.organizationId,
            userId: user._id,
            traceId: args.tracing.traceId,
            spanId: args.tracing.spanId,
            level: "INFO",
            action: args.action,
            resourceType: args.resourceType || "ui",
            resourceId: args.resourceId,
            details: args.details,
            metadata: maskedMetadata,
            status: "success",
            timestamp: Date.now(),
        });
    },
});

/**
 * Admin portal query to fetch logs
 */
export const getLogs = query({
    args: {
        limit: v.optional(v.number()),
        traceId: v.optional(v.string()),
        filterAction: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await getAuthUser(ctx);
        if (!user || user.role !== "admin") {
            throw new Error("Unauthorized");
        }

        let q = ctx.db
            .query("audit_logs")
            .withIndex("by_organization", (q) => q.eq("organizationId", user.organizationId));

        if (args.traceId) {
            // Re-using index by trace if possible, but here we prioritize org index.
            // Convex works best filtering by index. Let's stick to org index and filter in memory if trace is Provided
            // OR use a dedicated index if performance requires.
        }

        const logs = await q.order("desc").take(args.limit || 100);

        let filtered = logs;
        if (args.traceId) filtered = filtered.filter(l => l.traceId === args.traceId);
        if (args.filterAction) filtered = filtered.filter(l => l.action === args.filterAction);

        return await Promise.all(
            filtered.map(async (log) => {
                const actor = log.userId ? await ctx.db.get(log.userId) : null;
                return {
                    ...log,
                    userName: actor?.name || "System",
                    userEmail: actor?.email || "internal@system",
                };
            })
        );
    },
});

/**
 * Helper to log from other mutations easily
 */
export async function logAction(
    ctx: any,
    user: Doc<"users">,
    tracing: { traceId: string; spanId?: string },
    params: {
        action: string;
        resourceType: string;
        resourceId?: string;
        details: string;
        level?: "INFO" | "WARN" | "ERROR" | "DEBUG";
        status: "success" | "error" | "start";
        metadata?: any;
        duration_ms?: number;
    }
) {
    const { internal } = require("./_generated/api");
    await ctx.runMutation(internal.logs.insertLog, {
        organizationId: user.organizationId,
        userId: user._id,
        traceId: tracing.traceId,
        spanId: tracing.spanId,
        level: params.level || "INFO",
        action: params.action,
        resourceType: params.resourceType,
        resourceId: params.resourceId,
        details: params.details,
        metadata: params.metadata,
        duration_ms: params.duration_ms,
        status: params.status,
        timestamp: Date.now(),
    });
}

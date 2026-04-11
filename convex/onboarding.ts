import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUser } from "./permissions";

// List all onboarding steps, sorted by order
export const listSteps = query({
    args: { orgSlug: v.optional(v.string()) },
    handler: async (ctx, args) => {
        const user = await getAuthUser(ctx);
        let organizationId = user?.organizationId;

        if (!organizationId && args.orgSlug) {
            const org = await ctx.db
                .query("organizations")
                .withIndex("by_slug", (q) => q.eq("slug", args.orgSlug!))
                .first();
            organizationId = org?._id;
        }

        if (!organizationId) return [];

        const steps = await ctx.db
            .query("onboarding_steps")
            .withIndex("by_organization", (q) => q.eq("organizationId", organizationId))
            .collect();
        return steps.sort((a, b) => a.order - b.order);
    },
});

// Get user's progress
export const getUserProgress = query({
    args: {},
    handler: async (ctx) => {
        const user = await getAuthUser(ctx);
        if (!user) return [];

        return await ctx.db
            .query("user_onboarding_progress")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .collect();
    },
});

// Complete a step (with sequential check)
export const completeStep = mutation({
    args: { stepId: v.id("onboarding_steps") },
    handler: async (ctx, args) => {
        const user = await getAuthUser(ctx);
        if (!user) return null;

        // Get the step being completed
        const step = await ctx.db.get(args.stepId);
        if (!step) throw new Error("Step not found");

        // Get all steps to check order
        const allSteps = await ctx.db.query("onboarding_steps").collect();
        const sortedSteps = allSteps.sort((a, b) => a.order - b.order);

        // Get user's current progress
        const progress = await ctx.db
            .query("user_onboarding_progress")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .collect();

        const completedStepIds = new Set(progress.map(p => p.stepId));

        // Check if trying to complete this step
        const existing = await ctx.db
            .query("user_onboarding_progress")
            .withIndex("by_user_step", (q) => q.eq("userId", user._id).eq("stepId", args.stepId))
            .first();

        if (existing) {
            // Toggle off - allow unchecking any step
            await ctx.db.delete(existing._id);
            return null;
        }

        // Check if all previous steps are completed
        const stepIndex = sortedSteps.findIndex(s => s._id === args.stepId);
        for (let i = 0; i < stepIndex; i++) {
            if (!completedStepIds.has(sortedSteps[i]._id)) {
                throw new Error("Please complete previous steps first");
            }
        }

        // Mark as complete
        return await ctx.db.insert("user_onboarding_progress", {
            organizationId: user.organizationId,
            userId: user._id,
            stepId: args.stepId,
            completedAt: Date.now(),
        });
    },
});

// Add a new step (auto-assign next order)
export const addStep = mutation({
    args: {
        title: v.string(),
        description: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await getAuthUser(ctx);
        if (!user) throw new Error("Unauthorized");

        // Get the highest order number for this organization
        const allSteps = await ctx.db
            .query("onboarding_steps")
            .withIndex("by_organization", (q) => q.eq("organizationId", user.organizationId))
            .collect();
        const maxOrder = allSteps.length > 0
            ? Math.max(...allSteps.map(s => s.order))
            : -1;

        return await ctx.db.insert("onboarding_steps", {
            organizationId: user.organizationId,
            title: args.title,
            description: args.description,
            order: maxOrder + 1,
        });
    },
});

// Delete a step and reorder remaining steps
export const deleteStep = mutation({
    args: { stepId: v.id("onboarding_steps") },
    handler: async (ctx, args) => {
        const step = await ctx.db.get(args.stepId);
        if (!step) return;

        // Delete the step
        await ctx.db.delete(args.stepId);

        // Get remaining steps and reorder
        const remainingSteps = await ctx.db.query("onboarding_steps").collect();
        const sorted = remainingSteps.sort((a, b) => a.order - b.order);

        // Update order to be sequential
        for (let i = 0; i < sorted.length; i++) {
            if (sorted[i].order !== i) {
                await ctx.db.patch(sorted[i]._id, { order: i });
            }
        }
    },
});

// Reorder steps (for drag-and-drop)
export const reorderSteps = mutation({
    args: {
        stepId: v.id("onboarding_steps"),
        newOrder: v.number(),
    },
    handler: async (ctx, args) => {
        const step = await ctx.db.get(args.stepId);
        if (!step) throw new Error("Step not found");

        const oldOrder = step.order;
        const newOrder = args.newOrder;

        if (oldOrder === newOrder) return;

        // Get all steps
        const allSteps = await ctx.db.query("onboarding_steps").collect();

        // Update orders
        for (const s of allSteps) {
            if (s._id === args.stepId) {
                // Move this step to new position
                await ctx.db.patch(s._id, { order: newOrder });
            } else if (oldOrder < newOrder) {
                // Moving down: shift steps between old and new up
                if (s.order > oldOrder && s.order <= newOrder) {
                    await ctx.db.patch(s._id, { order: s.order - 1 });
                }
            } else {
                // Moving up: shift steps between new and old down
                if (s.order >= newOrder && s.order < oldOrder) {
                    await ctx.db.patch(s._id, { order: s.order + 1 });
                }
            }
        }
    },
});

// Update an existing step
export const updateStep = mutation({
    args: {
        stepId: v.id("onboarding_steps"),
        title: v.string(),
        description: v.string(),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.stepId, {
            title: args.title,
            description: args.description,
        });
        return args.stepId;
    },
});

// Move step up or down
export const moveStep = mutation({
    args: {
        stepId: v.id("onboarding_steps"),
        direction: v.union(v.literal("up"), v.literal("down")),
    },
    handler: async (ctx, args) => {
        const step = await ctx.db.get(args.stepId);
        if (!step) throw new Error("Step not found");

        const allSteps = await ctx.db.query("onboarding_steps").collect();
        const sortedSteps = allSteps.sort((a, b) => a.order - b.order);
        const currentIndex = sortedSteps.findIndex(s => s._id === args.stepId);

        if (args.direction === "up" && currentIndex > 0) {
            // Swap with previous step
            const prevStep = sortedSteps[currentIndex - 1];
            await ctx.db.patch(step._id, { order: prevStep.order });
            await ctx.db.patch(prevStep._id, { order: step.order });
        } else if (args.direction === "down" && currentIndex < sortedSteps.length - 1) {
            // Swap with next step
            const nextStep = sortedSteps[currentIndex + 1];
            await ctx.db.patch(step._id, { order: nextStep.order });
            await ctx.db.patch(nextStep._id, { order: step.order });
        }
    },
});

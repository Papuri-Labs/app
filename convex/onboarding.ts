import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUser, validateOrgAccess } from "./permissions";

// List all onboarding steps, sorted by order
export const listSteps = query({
    args: { orgSlug: v.optional(v.string()) },
    handler: async (ctx, args) => {
        const organizationId = await validateOrgAccess(ctx, args.orgSlug);

        if (!organizationId) return [];

        const steps = await ctx.db
            .query("onboarding_steps")
            .withIndex("by_organization", (q) => q.eq("organizationId", organizationId))
            .collect();
        
        // Resolve storage URLs if present
        const resolvedSteps = await Promise.all(steps.map(async (step) => {
            let fileUrl = null;
            if (step.fileStorageId) {
                fileUrl = await ctx.storage.getUrl(step.fileStorageId);
            }
            return { ...step, fileUrl };
        }));

        return resolvedSteps.sort((a, b) => a.order - b.order);
    },
});

export const generateUploadUrl = mutation(async (ctx) => {
  return await ctx.storage.generateUploadUrl();
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

        // Get all steps for this organization to check order
        const allSteps = await ctx.db
            .query("onboarding_steps")
            .withIndex("by_organization", (q) => q.eq("organizationId", user.organizationId))
            .collect();
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
        linkUrl: v.optional(v.string()),
        fileStorageId: v.optional(v.id("_storage")),
        orgSlug: v.optional(v.string()), // Added for multi-tenant safety
    },
    handler: async (ctx, args) => {
        const organizationId = await validateOrgAccess(ctx, args.orgSlug);
        if (!organizationId) throw new Error("Could not resolve organization context");
        const user = await getAuthUser(ctx);
        if (!user) throw new Error("Unauthorized");

        // Get the highest order number for this organization
        const allSteps = await ctx.db
            .query("onboarding_steps")
            .withIndex("by_organization", (q) => q.eq("organizationId", organizationId))
            .collect();
        const maxOrder = allSteps.length > 0
            ? Math.max(...allSteps.map(s => s.order))
            : -1;

        return await ctx.db.insert("onboarding_steps", {
            organizationId,
            title: args.title,
            description: args.description,
            linkUrl: args.linkUrl,
            fileStorageId: args.fileStorageId,
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

        // Get remaining steps for this organization and reorder
        const remainingSteps = await ctx.db
            .query("onboarding_steps")
            .withIndex("by_organization", (q) => q.eq("organizationId", step.organizationId))
            .collect();
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

        // Get all steps for this organization
        const allSteps = await ctx.db
            .query("onboarding_steps")
            .withIndex("by_organization", (q) => q.eq("organizationId", step.organizationId))
            .collect();

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
        linkUrl: v.optional(v.string()),
        fileStorageId: v.optional(v.id("_storage")),
    },
    handler: async (ctx, args) => {
        const { stepId, ...updates } = args;
        await ctx.db.patch(stepId, updates);
        return stepId;
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

        const allSteps = await ctx.db
            .query("onboarding_steps")
            .withIndex("by_organization", (q) => q.eq("organizationId", step.organizationId))
            .collect();
        const sortedSteps = allSteps.sort((a, b) => a.order - b.order);
        const currentIndex = sortedSteps.findIndex(s => s._id === args.stepId);

        if (args.direction === "up" && currentIndex > 0) {
            // Swap with previous step
            const prevStep = sortedSteps[currentIndex - 1];
            const currentOrder = step.order;
            const prevOrder = prevStep.order;
            
            // If they are the same, we need to normalize first
            if (currentOrder === prevOrder) {
                for (let i = 0; i < sortedSteps.length; i++) {
                    await ctx.db.patch(sortedSteps[i]._id, { order: i });
                }
                // Tell user to try again after normalization
                throw new Error("Orders normalized. Please try moving again.");
            }

            await ctx.db.patch(step._id, { order: prevOrder });
            await ctx.db.patch(prevStep._id, { order: currentOrder });
        } else if (args.direction === "down" && currentIndex < sortedSteps.length - 1) {
            // Swap with next step
            const nextStep = sortedSteps[currentIndex + 1];
            const currentOrder = step.order;
            const nextOrder = nextStep.order;

            if (currentOrder === nextOrder) {
                for (let i = 0; i < sortedSteps.length; i++) {
                    await ctx.db.patch(sortedSteps[i]._id, { order: i });
                }
                throw new Error("Orders normalized. Please try moving again.");
            }

            await ctx.db.patch(step._id, { order: nextOrder });
            await ctx.db.patch(nextStep._id, { order: currentOrder });
        }
        return { success: true };
    },
});

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUser, validateOrgAccess } from "./permissions";

export const get = query({
  args: { orgSlug: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const organizationId = await validateOrgAccess(ctx, args.orgSlug);
    if (!organizationId) return null;
    if (!organizationId) return null;

    const settings = await ctx.db
      .query("settings")
      .withIndex("by_organization", (q) => q.eq("organizationId", organizationId))
      .first();
    return settings;
  },
});

export const getPublic = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("settings")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .first();
  },
});

export const getPublicBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const org = await ctx.db
      .query("organizations")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (!org) return null;

    return await ctx.db
      .query("settings")
      .withIndex("by_organization", (q) => q.eq("organizationId", org._id))
      .first();
  },
});

export const upsert = mutation({
  args: {
    inactiveAbsences: v.number(),
    promoteAttendance: v.number(),
    followUpAbsences: v.number(),
    welcomeTitle: v.optional(v.string()),
    welcomeMessage: v.optional(v.string()),
    vision: v.optional(v.string()),
    mission: v.optional(v.string()),
    aboutChurch: v.optional(v.string()),
    // Branding
    logoUrl: v.optional(v.string()),
    primaryColor: v.optional(v.string()),
    accentColor: v.optional(v.string()),
    // Content & Socials
    socialLinks: v.optional(
      v.object({
        facebook: v.optional(v.string()),
        instagram: v.optional(v.string()),
        x: v.optional(v.string()),
        youtube: v.optional(v.string()),
      })
    ),
    // Configuration
    givingTypes: v.optional(v.array(v.string())),
    address: v.optional(v.string()),
    visitInfo: v.optional(v.string()),
    enabledModules: v.optional(v.array(v.string())),
    typography: v.optional(v.string()),
    connectPageEnabled: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx);
    if (!user) throw new Error("Unauthorized");

    const existing = await ctx.db
      .query("settings")
      .withIndex("by_organization", (q) => q.eq("organizationId", user.organizationId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    }
    return await ctx.db.insert("settings", {
      organizationId: user.organizationId,
      ...args,
    });
  },
});

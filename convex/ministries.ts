import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUser } from "./permissions";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthUser(ctx);
    if (!user) return [];

    return await ctx.db
      .query("ministries")
      .withIndex("by_organization", (q) => q.eq("organizationId", user.organizationId))
      .collect();
  },
});

export const create = mutation({
  args: { name: v.string(), active: v.boolean() },
  handler: async (ctx, { name, active }) => {
    const user = await getAuthUser(ctx);
    if (!user) throw new Error("Unauthorized");

    const existing = await ctx.db
      .query("ministries")
      .withIndex("by_organization", (q) => q.eq("organizationId", user.organizationId))
      .filter(q => q.eq(q.field("name"), name))
      .first();

    if (existing) return existing._id;

    return await ctx.db.insert("ministries", {
      organizationId: user.organizationId,
      name,
      active,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("ministries"),
    name: v.string(),
    active: v.boolean(),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

export const deleteMinistry = mutation({
  args: { id: v.id("ministries") },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx);
    if (!user) throw new Error("Unauthorized");

    const usersWithMinistry = await ctx.db
      .query("users")
      .withIndex("by_organization", (q) => q.eq("organizationId", user.organizationId))
      .collect();

    // Remove ministry from users first
    for (const u of usersWithMinistry) {
      if (u.ministryIds?.includes(args.id)) {
        const newMinistries = u.ministryIds.filter((mid: any) => mid !== args.id);
        await ctx.db.patch(u._id, { ministryIds: newMinistries });
      }
    }

    await ctx.db.delete(args.id);
  },
});

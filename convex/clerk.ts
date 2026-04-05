import { action, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { getDefaultOrganizationId } from "./permissions";

export const sync = action({
    args: {},
    returns: v.any(),
    handler: async (ctx): Promise<any> => {
        const clerkKey = process.env.CLERK_SECRET_KEY;
        if (!clerkKey) throw new Error("Missing CLERK_SECRET_KEY");

        console.log("Syncing users from Clerk...");
        const response = await fetch("https://api.clerk.com/v1/users?limit=100", {
            headers: { Authorization: `Bearer ${clerkKey}` },
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Clerk API Error:", errorText);
            throw new Error(`Clerk API error: ${response.status} ${response.statusText}`);
        }

        const users = await response.json();
        console.log(`Fetched ${users.length} users from Clerk.`);

        // Call internal mutation to update DB
        const result = await ctx.runMutation(internal.clerk.updateDbFromClerk, { users });
        return result;
    },
});

export const updateDbFromClerk = internalMutation({
    args: { users: v.any() },
    handler: async (ctx, args) => {
        const clerkUserIds = new Set<string>();
        let updatedCount = 0;
        let createdCount = 0;
        let deactivatedCount = 0;

        const organizationId = await getDefaultOrganizationId(ctx);

        for (const u of args.users) {
            clerkUserIds.add(u.id);
            const email = u.email_addresses[0]?.email_address || "";
            const firstName = u.first_name || "";
            const lastName = u.last_name || "";
            const name = `${firstName} ${lastName}`.trim() || email;
            const birthday = u.birthday || undefined;

            const role = u.public_metadata?.role || "member";

            const existing = await ctx.db.query("users").withIndex("by_clerk_id", q => q.eq("userId", u.id)).first();

            if (existing) {
                // Only update if changes? For now just patch to ensure sync.
                await ctx.db.patch(existing._id, {
                    name,
                    email,
                    birthday,
                    // We don't overwrite role if it's "member" in Clerk but maybe "admin" in DB? 
                    // But usually Clerk metadata is source of truth for role if using Clerk.
                    // If local dev, be careful. 
                    // Logic: If Clerk has a role, use it. If not, keep existing? 
                    // Implementation: u.public_metadata.role usually exists if set.
                    // If undefined in Clerk, default is "member".
                    // We'll update it.
                    role: role as any,
                    isActive: true
                });
                updatedCount++;
            } else {
                await ctx.db.insert("users", {
                    organizationId,
                    userId: u.id,
                    name,
                    email,
                    birthday,
                    role: role as any,
                    ministryIds: [],
                    isActive: true
                });
                createdCount++;
            }
        }

        // Deactivate missing
        const allUsers = await ctx.db.query("users").collect();
        for (const user of allUsers) {
            // Only process users with Clerk-like IDs to avoid deleting system/test users if any
            if (user.userId && user.userId.startsWith("user_") && !clerkUserIds.has(user.userId)) {
                if (user.isActive !== false) {
                    await ctx.db.patch(user._id, { isActive: false });
                    deactivatedCount++;
                }
            }
        }

        return { updated: updatedCount, created: createdCount, deactivated: deactivatedCount };
    }
});

export const updateRole = action({
    args: { userId: v.id("users"), role: v.string() },
    handler: async (ctx, args) => {
        const user = await ctx.runQuery(internal.users.getUserById, { userId: args.userId });
        if (!user || !user.userId) throw new Error("User not found or missing Clerk ID");

        // Update Clerk (Skip for offline users)
        if (!user.userId.startsWith("offline_")) {
            const clerkKey = process.env.CLERK_SECRET_KEY;
            if (!clerkKey) throw new Error("Missing CLERK_SECRET_KEY");

            const response = await fetch(`https://api.clerk.com/v1/users/${user.userId}/metadata`, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${clerkKey}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    public_metadata: { role: args.role },
                }),
            });

            if (!response.ok) {
                const err = await response.text();
                console.error("Clerk Metadata Update Failed:", err);
                throw new Error(`Clerk update failed: ${response.statusText}`);
            }
        } else {
            console.log(`Skipping Clerk update for offline user: ${user.name}`);
        }

        // Update Convex
        await ctx.runMutation(internal.users.internalUpdateRole, { userId: args.userId, role: args.role });
    }
});

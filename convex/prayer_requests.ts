import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUser, isLeader, getDefaultOrganizationId } from "./permissions";
import { internal } from "./_generated/api";

export const submit = mutation({
    args: {
        name: v.string(),
        request: v.string(),
        category: v.optional(v.string()),
        ministryId: v.optional(v.id("ministries")),
    },
    handler: async (ctx, args) => {
        const user = await getAuthUser(ctx);
        const organizationId = user ? user.organizationId : await getDefaultOrganizationId(ctx);

        const id = await ctx.db.insert("prayer_requests", {
            organizationId,
            userId: user?._id,
            name: args.name,
            request: args.request,
            status: "Open",
            category: args.category,
            ministryId: args.ministryId,
            createdAt: Date.now(),
        });

        // 1. Determine target ministry IDs for notifications
        const targetMinistryIds = args.ministryId 
            ? [args.ministryId] 
            : (user?.ministryIds || []);

        // 2. Find recipients: Admins (all) + Leaders of target ministries
        const potentialRecipients = await ctx.db
            .query("users")
            .withIndex("by_organization", (q) => q.eq("organizationId", organizationId))
            .filter((q) => 
                q.or(
                    q.eq(q.field("role"), "admin"),
                    q.eq(q.field("role"), "leader")
                )
            )
            .collect();

        const recipientEmails = potentialRecipients
            .filter(r => {
                if (r.role === "admin") return true;
                // If it's a leader, check if they belong to any of the target ministries
                if (targetMinistryIds.length > 0) {
                    return r.ministryIds.some(mId => targetMinistryIds.includes(mId));
                }
                // If it's a general request (no target ministries), leaders don't get it, only admins
                return false;
            })
            .map(r => r.email)
            .filter((email): email is string => !!email);

        // 3. Fallback to default if no recipients found
        const finalRecipients = recipientEmails.length > 0 
            ? recipientEmails 
            : [process.env.NOTIFICATION_EMAIL || "delivery@resend.dev"];

        // 4. Send email notification asynchronously via Resend
        await ctx.scheduler.runAfter(0, internal.emails.sendEmail, {
            to: finalRecipients,
            subject: `New Prayer Request: ${args.name}`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
                    <h2 style="color: #333; margin-top: 0;">New Prayer Request</h2>
                    <p style="color: #555; text-transform: uppercase; font-size: 12px; font-weight: bold; margin-bottom: 20px;">
                        From: ${args.name}
                        ${args.category ? `<br/>Category: ${args.category}` : ''}
                        ${args.ministryId ? '<br/>Target Ministry: Selected' : ''}
                    </p>
                    <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #6366f1; font-size: 16px; line-height: 1.5; color: #333;">
                        ${args.request.replace(/\n/g, '<br/>')}
                    </div>
                    <p style="color: #888; font-size: 12px; margin-top: 30px;">
                        This email was sent automatically to assigned Leaders and Admins via the MAGI Platform.
                    </p>
                </div>
            `
        });
        
        return id;
    },
});

export const list = query({
    handler: async (ctx) => {
        const user = await getAuthUser(ctx);
        if (!user || !isLeader(user)) throw new Error("Unauthorized");

        // return all for now, maybe filter by ministry later
        const requests = await ctx.db
            .query("prayer_requests")
            .withIndex("by_organization", (q) => q.eq("organizationId", user.organizationId))
            .order("desc")
            .collect();

        return requests;
    },
});

export const toggleStatus = mutation({
    args: { id: v.id("prayer_requests"), status: v.string() }, // "Open" or "Prayed"
    handler: async (ctx, args) => {
        const user = await getAuthUser(ctx);
        if (!user || !isLeader(user)) throw new Error("Unauthorized");

        await ctx.db.patch(args.id, { status: args.status });
    },
});

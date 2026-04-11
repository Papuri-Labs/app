import { query } from "./_generated/server";

export const inspectData = query({
    args: {},
    handler: async (ctx) => {
        const services = await ctx.db.query("services").collect();
        const orgs = await ctx.db.query("organizations").collect();
        const users = await ctx.db.query("users").collect();

        const serviceBreakdown = await Promise.all(services.map(async s => {
            const org = await ctx.db.get(s.organizationId);
            return {
                id: s._id,
                name: s.name,
                orgSlug: org?.slug || "unknown",
                orgId: s.organizationId
            };
        }));

        const userBreakdown = users.map(u => ({
            email: u.email,
            orgId: u.organizationId,
            clerkId: u.userId
        }));

        return {
            serviceBreakdown,
            orgs: orgs.map(o => ({ id: o._id, slug: o.slug })),
            userBreakdown
        };
    }
});

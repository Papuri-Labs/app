import { query } from "./_generated/server";
import { v } from "convex/values";

export const test = query({
    args: {},
    handler: async (ctx) => {
        const users = await ctx.db.query("users").collect();
        const results = [];
        for (const user of users) {
           const org = user.organizationId ? await ctx.db.get(user.organizationId) : null;
           results.push({ email: user.email, orgSlug: org?.slug, orgName: org?.name });
        }
        return results;
    }
});

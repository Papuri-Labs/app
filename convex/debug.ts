import { query } from "./_generated/server";

export const listAllUsers = query({
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  }
});

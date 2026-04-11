import { v } from "convex/values";
import { query } from "./_generated/server";

export const ping = query({
    args: { message: v.string() },
    handler: async (ctx, args) => {
        return `Pong: ${args.message}`;
    },
});

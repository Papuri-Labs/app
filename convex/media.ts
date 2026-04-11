// Multi-tenant media module
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUser, getUserMinistries, validateOrgAccess } from "./permissions";
import { logArgs } from "./logs";

export const generateUploadUrl = mutation(async (ctx) => {
    const user = await getAuthUser(ctx);
    if (!user) throw new Error("Unauthorized");
    return await ctx.storage.generateUploadUrl();
});

export const getAlbums = query({
    args: { orgSlug: v.optional(v.string()) },
    handler: async (ctx, args) => {
        const organizationId = await validateOrgAccess(ctx, args.orgSlug);
        if (!organizationId) return [];
        const user = await getAuthUser(ctx);

        const ministries = getUserMinistries(user);
        const allAlbums = await ctx.db
            .query("albums")
            .withIndex("by_organization", (q) => q.eq("organizationId", organizationId))
            .collect();

        const accessibleAlbums = allAlbums.filter((album) => {
            if (album.isGlobal) return true;
            if (user && album.ministryId && Array.isArray(ministries) && ministries.includes(album.ministryId)) return true;
            return false;
        });

        return await Promise.all(
            accessibleAlbums.map(async (album) => {
                const photos = await ctx.db
                    .query("photos")
                    .withIndex("by_album", (q) => q.eq("albumId", album._id))
                    .order("desc")
                    .collect();

                return {
                    ...album,
                    photoCount: photos.length,
                    coverUrl: photos[0]?.url,
                };
            })
        );
    },
});

export const getPhotos = query({
    args: { albumId: v.id("albums") },
    handler: async (ctx, args) => {
        const user = await getAuthUser(ctx);
        const album = await ctx.db.get(args.albumId);
        if (!album) return [];

        const ministries = getUserMinistries(user);
        const hasAccess =
            ministries === "all" ||
            album.isGlobal ||
            (user && album.ministryId && Array.isArray(ministries) && ministries.includes(album.ministryId));

        if (!hasAccess) return [];

        const photos = await ctx.db
            .query("photos")
            .withIndex("by_album", (q) => q.eq("albumId", args.albumId))
            .collect();

        return await Promise.all(
            photos.map(async (photo) => {
                const reactions = await ctx.db
                    .query("reactions")
                    .withIndex("by_photo", (q) => q.eq("photoId", photo._id))
                    .collect();

                const comments = await ctx.db
                    .query("comments")
                    .withIndex("by_photo", (q) => q.eq("photoId", photo._id))
                    .collect();

                const commentsWithUser = await Promise.all(
                    comments.map(async (c) => {
                        const commenter = await ctx.db.get(c.userId);
                        return { ...c, userName: commenter?.name || "Unknown" };
                    })
                );

                const hasReacted = user ? reactions.some(r => r.userId === user._id) : false;

                return {
                    ...photo,
                    reactions,
                    reactionCount: reactions.length,
                    comments: commentsWithUser,
                    commentCount: comments.length,
                    hasReacted,
                };
            })
        );
    },
});

export const getRecentPhotos = query({
    args: { limit: v.number(), orgSlug: v.optional(v.string()) },
    handler: async (ctx, args) => {
        const organizationId = await validateOrgAccess(ctx, args.orgSlug);
        if (!organizationId) return [];
        const user = await getAuthUser(ctx);

        const allAlbums = await ctx.db
            .query("albums")
            .withIndex("by_organization", (q) => q.eq("organizationId", organizationId))
            .collect();

        const ministries = getUserMinistries(user);
        const accessibleAlbumIds = allAlbums
            .filter((album) => {
                if (album.isGlobal) return true;
                if (user && album.ministryId && Array.isArray(ministries) && ministries.includes(album.ministryId)) return true;
                return false;
            })
            .map((a) => a._id);

        if (accessibleAlbumIds.length === 0) return [];

        const photos = await ctx.db
            .query("photos")
            .withIndex("by_organization", (q) => q.eq("organizationId", organizationId))
            .order("desc")
            .take(args.limit * 5);

        return photos
            .filter((p) => accessibleAlbumIds.includes(p.albumId))
            .slice(0, args.limit);
    },
});

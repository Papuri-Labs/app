import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUser, getUserMinistries, isLeader, canManageMinistry, validateOrgAccess } from "./permissions";
import { internal } from "./_generated/api";
import { logAction, logArgs } from "./logs";

export const generateUploadUrl = mutation(async (ctx) => {
    const user = await getAuthUser(ctx);
    if (!user) throw new Error("Unauthorized");
    return await ctx.storage.generateUploadUrl();
});

export const createAlbum = mutation({
    args: {
        title: v.string(),
        description: v.optional(v.string()),
        eventId: v.optional(v.id("events")),
        ministryId: v.optional(v.id("ministries")),
        isGlobal: v.boolean(),
        tracing: v.object(logArgs),
    },
    handler: async (ctx, args) => {
        const { tracing, ...rest } = args;
        const user = await getAuthUser(ctx);
        if (!user) throw new Error("Unauthorized");

        // RBAC:
        // 1. Only Admins and Leaders can create Global albums.
        if (args.isGlobal && user.role !== "admin" && user.role !== "leader") {
            throw new Error("Unauthorized: Only admins and leaders can create global albums");
        }

        if (args.ministryId && !canManageMinistry(user, args.ministryId)) {
            throw new Error("Unauthorized: You do not have permission to manage this ministry");
        }

        if (!args.isGlobal && !args.ministryId) {
            throw new Error("Album must be either global or assigned to a ministry");
        }

        const albumId = await ctx.db.insert("albums", {
            ...rest,
            organizationId: user.organizationId,
            createdBy: user._id,
            createdAt: Date.now(),
        });

        await logAction(ctx, user, tracing, {
            action: "ALBUM_CREATE",
            resourceType: "media",
            resourceId: albumId,
            details: `Created album: ${args.title}`,
            status: "success",
        });

        return albumId;
    },
});

export const updateAlbum = mutation({
    args: {
        id: v.id("albums"),
        title: v.optional(v.string()),
        description: v.optional(v.string()),
        ministryId: v.optional(v.union(v.id("ministries"), v.literal("global"))),
        isGlobal: v.optional(v.boolean()),
        tracing: v.object(logArgs),
    },
    handler: async (ctx, args) => {
        const user = await getAuthUser(ctx);
        if (!user) throw new Error("Unauthorized");

        const { id, tracing, ...updates } = args;
        const album = await ctx.db.get(id);
        if (!album) throw new Error("Album not found");

        const isAdmin = user.role === "admin";
        const isLeaderRole = user.role === "leader";

        const canManageOld = isAdmin || (album.ministryId && canManageMinistry(user, album.ministryId)) || album.isGlobal;
        if (!canManageOld) throw new Error("Unauthorized: You cannot manage this album");

        if (updates.isGlobal && !isAdmin && !isLeaderRole) {
            throw new Error("Unauthorized: Only admins and leaders can set global albums");
        }

        if (updates.ministryId && updates.ministryId !== "global" && !canManageMinistry(user, updates.ministryId)) {
            throw new Error("Unauthorized: You do not have permission to manage this ministry");
        }

        const patchAttrs: any = { ...updates };
        if (updates.ministryId === "global") {
            patchAttrs.isGlobal = true;
            patchAttrs.ministryId = undefined;
        } else if (updates.ministryId) {
            patchAttrs.isGlobal = false;
            patchAttrs.ministryId = updates.ministryId;
        }

        await ctx.db.patch(id, patchAttrs);

        await logAction(ctx, user, tracing, {
            action: "ALBUM_UPDATE",
            resourceType: "media",
            resourceId: id,
            details: `Updated album: ${updates.title || album.title}`,
            metadata: { updates },
            status: "success",
        });
    },
});

export const addPhoto = mutation({
    args: {
        albumId: v.id("albums"),
        storageId: v.id("_storage"),
        caption: v.optional(v.string()),
        tracing: v.object(logArgs),
    },
    handler: async (ctx, args) => {
        const user = await getAuthUser(ctx);
        if (!user) throw new Error("Unauthorized");

        const album = await ctx.db.get(args.albumId);
        if (!album) throw new Error("Album not found");

        const canManage =
            user.role === "admin" ||
            (album.ministryId && canManageMinistry(user, album.ministryId));

        if (!canManage) {
            throw new Error("Unauthorized: You do not have permission to upload to this album");
        }

        const url = (await ctx.storage.getUrl(args.storageId)) || "";

        const photoId = await ctx.db.insert("photos", {
            albumId: args.albumId,
            storageId: args.storageId,
            caption: args.caption,
            url,
            organizationId: user.organizationId,
            uploadedBy: user._id,
            createdAt: Date.now(),
        });

        await logAction(ctx, user, args.tracing, {
            action: "PHOTO_UPLOAD",
            resourceType: "media",
            resourceId: photoId,
            details: `Uploaded photo to album: ${album.title}`,
            status: "success",
        });

        return photoId;
    },
});

export const getAlbums = query({
    args: { orgSlug: v.optional(v.string()) },
    handler: async (ctx, args) => {
        const organizationId = await validateOrgAccess(ctx, args.orgSlug);
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

import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { getAuthUser, canManageMinistry, validateOrgAccess } from "./permissions";
import { logAction, logArgs } from "./logs";

export const createAlbumScoped = mutation({
    args: {
        title: v.string(),
        description: v.optional(v.string()),
        eventId: v.optional(v.id("events")),
        ministryId: v.optional(v.id("ministries")),
        isGlobal: v.boolean(),
        orgSlug: v.optional(v.string()),
        tracing: v.object(logArgs),
    },
    handler: async (ctx, args) => {
        const organizationId = await validateOrgAccess(ctx, args.orgSlug);
        if (!organizationId) throw new Error("Could not resolve organization context");
        const { tracing, orgSlug, ...rest } = args;
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
            organizationId: organizationId!,
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

export const updateAlbumScoped = mutation({
    args: {
        id: v.id("albums"),
        title: v.optional(v.string()),
        description: v.optional(v.string()),
        ministryId: v.optional(v.union(v.id("ministries"), v.literal("global"))),
        isGlobal: v.optional(v.boolean()),
        orgSlug: v.optional(v.string()),
        tracing: v.object(logArgs),
    },
    handler: async (ctx, args) => {
        const organizationId = await validateOrgAccess(ctx, args.orgSlug);
        if (!organizationId) throw new Error("Could not resolve organization context");
        const user = await getAuthUser(ctx);
        if (!user) throw new Error("Unauthorized");

        const { id, tracing, orgSlug, ...updates } = args;
        const album = await ctx.db.get(id);
        if (!album) throw new Error("Album not found");

        const isAdmin = user.role === "admin";
        const isLeaderRole = user.role === "leader";

        const canManageOld = isAdmin || (album.ministryId && (user.role === "admin" || user.ministryIds.includes(album.ministryId))) || album.isGlobal;
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

export const addPhotoScoped = mutation({
    args: {
        albumId: v.id("albums"),
        storageId: v.id("_storage"),
        caption: v.optional(v.string()),
        orgSlug: v.optional(v.string()),
        tracing: v.object(logArgs),
    },
    handler: async (ctx, args) => {
        const organizationId = await validateOrgAccess(ctx, args.orgSlug);
        if (!organizationId) throw new Error("Could not resolve organization context");
        const user = await getAuthUser(ctx);
        if (!user) throw new Error("Unauthorized");

        const album = await ctx.db.get(args.albumId);
        if (!album) throw new Error("Album not found");

        const canManage =
            user.role === "admin" ||
            (album.ministryId && canManageMinistry(user, album.ministryId)) ||
            album.isGlobal;

        if (!canManage) {
            throw new Error("Unauthorized: You do not have permission to upload to this album");
        }

        const url = (await ctx.storage.getUrl(args.storageId)) || "";

        const photoId = await ctx.db.insert("photos", {
            albumId: args.albumId,
            storageId: args.storageId,
            caption: args.caption,
            url,
            organizationId: organizationId!,
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

export const deleteAlbumScoped = mutation({
    args: {
        id: v.id("albums"),
        orgSlug: v.optional(v.string()),
        tracing: v.object(logArgs),
    },
    handler: async (ctx, args) => {
        const organizationId = await validateOrgAccess(ctx, args.orgSlug);
        if (!organizationId) throw new Error("Could not resolve organization context");
        const user = await getAuthUser(ctx);
        if (!user) throw new Error("Unauthorized");

        const album = await ctx.db.get(args.id);
        if (!album) throw new Error("Album not found");

        // RBAC: Only admins or ministry leaders for this album (or global)
        const canManage = user.role === "admin" || (album.ministryId && canManageMinistry(user, album.ministryId)) || album.isGlobal;
        if (!canManage) throw new Error("Unauthorized");

        // Delete all photos in the album first
        const photos = await ctx.db
            .query("photos")
            .withIndex("by_album", (q) => q.eq("albumId", args.id))
            .collect();

        for (const photo of photos) {
            await ctx.db.delete(photo._id);
            await ctx.storage.delete(photo.storageId);
        }

        await ctx.db.delete(args.id);

        await logAction(ctx, user, args.tracing, {
            action: "ALBUM_DELETE",
            resourceType: "media",
            resourceId: args.id,
            details: `Deleted album: ${album.title}`,
            status: "success",
        });
    },
});

export const deletePhotoScoped = mutation({
    args: {
        id: v.id("photos"),
        orgSlug: v.optional(v.string()),
        tracing: v.object(logArgs),
    },
    handler: async (ctx, args) => {
        const organizationId = await validateOrgAccess(ctx, args.orgSlug);
        if (!organizationId) throw new Error("Could not resolve organization context");
        const user = await getAuthUser(ctx);
        if (!user) throw new Error("Unauthorized");

        const photo = await ctx.db.get(args.id);
        if (!photo) throw new Error("Photo not found");

        const album = await ctx.db.get(photo.albumId);
        if (!album) throw new Error("Album not found");

        const canManage = user.role === "admin" || (album.ministryId && canManageMinistry(user, album.ministryId)) || album.isGlobal;
        if (!canManage) throw new Error("Unauthorized");

        await ctx.storage.delete(photo.storageId);
        await ctx.db.delete(args.id);

        await logAction(ctx, user, args.tracing, {
            action: "PHOTO_DELETE",
            resourceType: "media",
            resourceId: args.id,
            details: `Deleted photo from album: ${album.title}`,
            status: "success",
        });
    },
});

export const addCommentScoped = mutation({
    args: {
        photoId: v.id("photos"),
        text: v.string(),
        orgSlug: v.optional(v.string()),
        tracing: v.object(logArgs),
    },
    handler: async (ctx, args) => {
        const organizationId = await validateOrgAccess(ctx, args.orgSlug);
        if (!organizationId) throw new Error("Could not resolve organization context");
        const user = await getAuthUser(ctx);
        if (!user) throw new Error("Unauthorized: You must be signed in to comment");

        const photo = await ctx.db.get(args.photoId);
        if (!photo) throw new Error("Photo not found");

        const commentId = await ctx.db.insert("comments", {
            organizationId: organizationId!,
            photoId: args.photoId,
            userId: user._id,
            text: args.text,
            createdAt: Date.now(),
        });

        return commentId;
    },
});

export const reactToPhotoScoped = mutation({
    args: {
        photoId: v.id("photos"),
        type: v.string(),
        orgSlug: v.optional(v.string()),
        tracing: v.object(logArgs),
    },
    handler: async (ctx, args) => {
        const organizationId = await validateOrgAccess(ctx, args.orgSlug);
        if (!organizationId) throw new Error("Could not resolve organization context");
        const user = await getAuthUser(ctx);
        if (!user) throw new Error("Unauthorized: You must be signed in to react");

        const photo = await ctx.db.get(args.photoId);
        if (!photo) throw new Error("Photo not found");

        const existing = await ctx.db
            .query("reactions")
            .withIndex("by_photo", (q) => q.eq("photoId", args.photoId))
            .filter((q) => q.eq(q.field("userId"), user._id))
            .first();

        if (existing) {
            if (existing.type === args.type) {
                await ctx.db.delete(existing._id);
            } else {
                await ctx.db.patch(existing._id, { type: args.type });
            }
        } else {
            await ctx.db.insert("reactions", {
                organizationId: organizationId!,
                photoId: args.photoId,
                userId: user._id,
                type: args.type,
            });
        }
    },
});

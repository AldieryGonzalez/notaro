import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Query to get all uploads
export const getUploads = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("uploads").order("desc").collect();
  },
});

// Query to get recent uploads (last 10)
export const getRecentUploads = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("uploads").order("desc").take(10);
  },
});

// Mutation to create a new upload record
export const createUpload = mutation({
  args: {
    filename: v.string(),
    type: v.union(v.literal("image"), v.literal("pdf")),
    size: v.string(),
    fileId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("uploads", {
      ...args,
      status: "uploading",
      progress: 0,
      itemsExtracted: 0,
      uploadedAt: Date.now(),
    });
  },
});

// Mutation to update upload status
export const updateUpload = mutation({
  args: {
    id: v.id("uploads"),
    status: v.optional(
      v.union(
        v.literal("uploading"),
        v.literal("processing"),
        v.literal("parsed"),
        v.literal("error")
      )
    ),
    progress: v.optional(v.number()),
    itemsExtracted: v.optional(v.number()),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    return await ctx.db.patch(id, updates);
  },
});

// Mutation to delete an upload
export const deleteUpload = mutation({
  args: { id: v.id("uploads") },
  handler: async (ctx, args) => {
    return await ctx.db.delete(args.id);
  },
});

// Query to get upload statistics
export const getUploadStats = query({
  args: {},
  handler: async (ctx) => {
    const allUploads = await ctx.db.query("uploads").collect();

    return {
      recentUploads: allUploads.length,
      successfulExtractions: allUploads.filter(
        (upload) => upload.status === "parsed"
      ).length,
      failedUploads: allUploads.filter((upload) => upload.status === "error")
        .length,
    };
  },
});

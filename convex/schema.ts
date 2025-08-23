import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  workflows: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    userId: v.id("users"),
  }).index("by_user", ["userId"]),

  nodes: defineTable({
    workflowId: v.id("workflows"),
    type: v.union(
      v.literal("file_upload"),
      v.literal("process"),
      v.literal("output")
    ),
    name: v.string(),
    position: v.object({
      x: v.number(),
      y: v.number(),
    }),
    config: v.optional(
      v.object({
        fileId: v.optional(v.id("_storage")),
        fileName: v.optional(v.string()),
        fileType: v.optional(v.string()),
        processingType: v.optional(v.string()),
        outputFormat: v.optional(v.string()),
      })
    ),
  }).index("by_workflow", ["workflowId"]),

  connections: defineTable({
    workflowId: v.id("workflows"),
    sourceNodeId: v.id("nodes"),
    targetNodeId: v.id("nodes"),
  })
    .index("by_workflow", ["workflowId"])
    .index("by_source", ["sourceNodeId"])
    .index("by_target", ["targetNodeId"]),

  uploads: defineTable({
    filename: v.string(),
    type: v.union(v.literal("image"), v.literal("pdf")),
    size: v.string(),
    status: v.union(
      v.literal("uploading"),
      v.literal("processing"),
      v.literal("parsed"),
      v.literal("error")
    ),
    progress: v.number(),
    itemsExtracted: v.number(),
    uploadedAt: v.number(),
    error: v.optional(v.string()),
    fileId: v.optional(v.id("_storage")),
  }),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});

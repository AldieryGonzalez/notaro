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
    type: v.union(v.literal("file_upload"), v.literal("process"), v.literal("output")),
    name: v.string(),
    position: v.object({
      x: v.number(),
      y: v.number(),
    }),
    config: v.optional(v.object({
      fileId: v.optional(v.id("_storage")),
      fileName: v.optional(v.string()),
      fileType: v.optional(v.string()),
      processingType: v.optional(v.string()),
      outputFormat: v.optional(v.string()),
    })),
  }).index("by_workflow", ["workflowId"]),

  connections: defineTable({
    workflowId: v.id("workflows"),
    sourceNodeId: v.id("nodes"),
    targetNodeId: v.id("nodes"),
  }).index("by_workflow", ["workflowId"])
    .index("by_source", ["sourceNodeId"])
    .index("by_target", ["targetNodeId"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});

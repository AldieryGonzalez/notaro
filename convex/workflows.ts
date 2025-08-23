import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }
    
    return await ctx.db
      .query("workflows")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

export const get = query({
  args: { workflowId: v.id("workflows") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const workflow = await ctx.db.get(args.workflowId);
    if (!workflow || workflow.userId !== userId) {
      return null;
    }

    const nodes = await ctx.db
      .query("nodes")
      .withIndex("by_workflow", (q) => q.eq("workflowId", args.workflowId))
      .collect();

    const connections = await ctx.db
      .query("connections")
      .withIndex("by_workflow", (q) => q.eq("workflowId", args.workflowId))
      .collect();

    return {
      workflow,
      nodes,
      connections,
    };
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const workflowId = await ctx.db.insert("workflows", {
      name: args.name,
      description: args.description,
      userId,
    });

    // Create initial file upload node
    await ctx.db.insert("nodes", {
      workflowId,
      type: "file_upload",
      name: "File Upload",
      position: { x: 100, y: 100 },
    });

    return workflowId;
  },
});

export const addNode = mutation({
  args: {
    workflowId: v.id("workflows"),
    type: v.union(v.literal("process"), v.literal("output")),
    name: v.string(),
    position: v.object({
      x: v.number(),
      y: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const workflow = await ctx.db.get(args.workflowId);
    if (!workflow || workflow.userId !== userId) {
      throw new Error("Workflow not found");
    }

    return await ctx.db.insert("nodes", {
      workflowId: args.workflowId,
      type: args.type,
      name: args.name,
      position: args.position,
    });
  },
});

export const updateNodePosition = mutation({
  args: {
    nodeId: v.id("nodes"),
    position: v.object({
      x: v.number(),
      y: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const node = await ctx.db.get(args.nodeId);
    if (!node) {
      throw new Error("Node not found");
    }

    const workflow = await ctx.db.get(node.workflowId);
    if (!workflow || workflow.userId !== userId) {
      throw new Error("Not authorized");
    }

    await ctx.db.patch(args.nodeId, {
      position: args.position,
    });
  },
});

export const updateNodeConfig = mutation({
  args: {
    nodeId: v.id("nodes"),
    config: v.object({
      fileId: v.optional(v.id("_storage")),
      fileName: v.optional(v.string()),
      fileType: v.optional(v.string()),
      processingType: v.optional(v.string()),
      outputFormat: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const node = await ctx.db.get(args.nodeId);
    if (!node) {
      throw new Error("Node not found");
    }

    const workflow = await ctx.db.get(node.workflowId);
    if (!workflow || workflow.userId !== userId) {
      throw new Error("Not authorized");
    }

    await ctx.db.patch(args.nodeId, {
      config: args.config,
    });
  },
});

export const addConnection = mutation({
  args: {
    workflowId: v.id("workflows"),
    sourceNodeId: v.id("nodes"),
    targetNodeId: v.id("nodes"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const workflow = await ctx.db.get(args.workflowId);
    if (!workflow || workflow.userId !== userId) {
      throw new Error("Not authorized");
    }

    // Check if connection already exists
    const existingConnection = await ctx.db
      .query("connections")
      .withIndex("by_source", (q) => q.eq("sourceNodeId", args.sourceNodeId))
      .filter((q) => q.eq(q.field("targetNodeId"), args.targetNodeId))
      .first();

    if (existingConnection) {
      return existingConnection._id;
    }

    return await ctx.db.insert("connections", {
      workflowId: args.workflowId,
      sourceNodeId: args.sourceNodeId,
      targetNodeId: args.targetNodeId,
    });
  },
});

export const removeConnection = mutation({
  args: {
    connectionId: v.id("connections"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const connection = await ctx.db.get(args.connectionId);
    if (!connection) {
      throw new Error("Connection not found");
    }

    const workflow = await ctx.db.get(connection.workflowId);
    if (!workflow || workflow.userId !== userId) {
      throw new Error("Not authorized");
    }

    await ctx.db.delete(args.connectionId);
  },
});

export const getNode = query({
  args: { nodeId: v.id("nodes") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const node = await ctx.db.get(args.nodeId);
    if (!node) {
      return null;
    }

    const workflow = await ctx.db.get(node.workflowId);
    if (!workflow || workflow.userId !== userId) {
      return null;
    }

    return node;
  },
});

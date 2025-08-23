"use node";

import { action, internalAction } from "./_generated/server";
import { v } from "convex/values";
import { api, components } from "./_generated/api";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { Agent, createThread } from "@convex-dev/agent";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { experimental_createMCPClient, FilePart } from "ai";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { z } from "zod";
import { getFileProcessingPrompt } from "../src/llm/file-processing";
import { ActionCache } from "@convex-dev/action-cache";
import { toolProcessingSchema } from "../src/llm/tool-processing";
import { getAuthUserId } from "@convex-dev/auth/server";
type ToolLookoutArgs = z.infer<typeof toolProcessingSchema>;
const toolLookoutCache = new ActionCache(components.actionCache);
const toolLookout = internalAction({
  args: {},
  handler: async (ctx, args): Promise<ToolLookoutArgs> => {
    const userIdentity = await getAuthUserId(ctx);
    if (!userIdentity) {
      throw new Error("User not authenticated");
    }
    const user = await ctx.runQuery((ctx) => api.users.get, { userIdentity });
    if (!user) {
      throw new Error("User not found");
    }
    return {};
  },
});

// Action to process uploaded file with Gemini AI
export const processFileWithGemini = action({
  args: {
    uploadId: v.id("uploads"),
    fileUrl: v.string(),
    filename: v.string(),
    fileType: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      if (!process.env.GOOGLE_GENAI_API_KEY) {
        throw new Error("GOOGLE_GENAI_API_KEY is not set");
      }
      const google = createGoogleGenerativeAI({
        apiKey: process.env.GOOGLE_GENAI_API_KEY,
      });
      const gemini20Flash = google("gemini-2.0-flash");

      // Fetch the file content
      const response = await fetch(args.fileUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();

      // Convert ArrayBuffer to base64 using Node.js Buffer (since we're using "use node")
      const uint8Array = new Uint8Array(arrayBuffer);
      const base64Data = Buffer.from(uint8Array).toString("base64");

      const imagePart = {
        type: "file",
        mediaType: args.fileType,
        data: base64Data,
      } satisfies FilePart;

      console.log("Sending request to Gemini...");
      const httpTransport = new StreamableHTTPClientTransport(
        new URL("mcp.linear.app/mcp")
      );

      const mcpClient = await experimental_createMCPClient({
        transport: httpTransport,
      });
      const tools = await mcpClient.tools();
      const agent = new Agent(components.agent, {
        name: "File Processing Agent",
        languageModel: gemini20Flash,
        tools: tools,
        instructions: getFileProcessingPrompt({
          fileType: args.fileType,
          filename: args.filename,
          lookouts: [],
        }),
      });
      const threadId = await createThread(ctx, components.agent);
      const result = await agent.generateObject(
        ctx,
        { threadId },
        {
          messages: [
            {
              role: "user",
              content: getFileProcessingPrompt({
                fileType: args.fileType,
                filename: args.filename,
                lookouts: [],
              }),
            },
            { content: [imagePart], role: "user" },
          ],
          output: "no-schema",
        }
      );

      console.log("Gemini response received:");

      // Create action items in the databas

      // Update upload status to parsed
      await ctx.runMutation(api.uploads.updateUpload, {
        id: args.uploadId,
        status: "parsed",
      });

      console.log(`Successfully extracted items from ${args.filename}`);

      return {
        success: true,
      };
    } catch (error) {
      console.error("Error processing file:", error);

      // Update upload status to error
      await ctx.runMutation(api.uploads.updateUpload, {
        id: args.uploadId,
        status: "error",
        error: error instanceof Error ? error.message : "Processing failed",
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : "Processing failed",
        summary: `Fallback extraction from ${args.filename} due to processing error`,
      };
    }
  },
});

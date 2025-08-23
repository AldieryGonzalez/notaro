"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { api, components } from "./_generated/api";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { Agent, createThread } from "@convex-dev/agent";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { experimental_createMCPClient } from "ai";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { z } from "zod";

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
        inlineData: {
          data: base64Data,
          mimeType: args.fileType,
        },
      };

      const prompt = `
You are an expert at analyzing documents, images, and visual content to extract actionable tasks and to-dos.

Analyze this ${args.fileType.startsWith("image/") ? "image" : "PDF document"} and identify ALL actionable items, tasks, decisions, or follow-ups mentioned. Look for:

1. **Explicit tasks**: Items clearly stated as "TODO", "Action Item", "Next Steps", etc.
2. **Implicit tasks**: Things that need to be done based on context (meetings to schedule, documents to create, approvals needed)
3. **Decisions requiring follow-up**: Items marked as "decide by", "needs approval", "pending"
4. **Assignments**: Tasks assigned to specific people or roles
5. **Deadlines and timelines**: Items with due dates or time-sensitive actions

For each actionable item found, extract:
- **Title**: Clear, concise description of what needs to be done
- **Description**: Additional context if available from the document
- **Priority**: Based on urgency indicators, deadlines, or visual emphasis (high/medium/low)
- **Assignee**: If a person, role, or team is mentioned
- **Due date**: If mentioned in format YYYY-MM-DD
- **Labels**: Relevant categories (Design, Development, Marketing, Meeting, Research, etc.)
- **Confidence**: Your confidence level (50-100) in this being an actual actionable item

Be thorough and extract everything actionable from the content. Don't miss tasks that are implied or require reading between the lines.

Return ONLY a valid JSON object in this exact format:
{
  "actionItems": [
    {
      "title": "string",
      "description": "string or null", 
      "priority": "low|medium|high",
      "assignee": "string or null",
      "dueDate": "YYYY-MM-DD or null",
      "labels": ["array of strings"],
      "confidence": number
    }
  ],
  "summary": "Brief description of the document content and context",
  "totalItemsFound": number
}

Document type: ${args.fileType}
Document name: ${args.filename}

Analyze the content now and extract all actionable items:`;

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
      });
      const threadId = await createThread(ctx, components.agent);
      const result = await agent.generateObject(
        ctx,
        { threadId },
        { prompt, output: "no-schema" }
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

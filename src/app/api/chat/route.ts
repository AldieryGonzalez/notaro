import { google } from "@/ai/providers";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { createIssue } from "@/linear/action";

import {
  convertToModelMessages,
  generateText,
  streamText,
  UIMessage,
  tool
} from "ai";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { messages }: { messages: UIMessage[] } = await req.json();
    const modelMessages = convertToModelMessages(messages);

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          error:
            "OpenAI API key not configured. Please add OPENAI_API_KEY to your environment variables.",
        },
        { status: 500 }
      );
    }

    const result = await streamText({
      model: google("gemini-2.0-flash"),
      messages: modelMessages,
      system:
        "You are a helpful AI assistant that analyzes files uploaded by users. When a user uploads a file, provide a detailed analysis of its contents, structure, and key information. Be thorough and helpful in your responses. After analyze the file, generate corrspondant title for each key information if you think it's incomplete, then invoke createLinearIssue tool call for each title. Also inform user what issue you create after tool call invocation",
      maxOutputTokens: 1000,
      tools: {
        createLinearIssue: tool({
          description: "create issue on linear",
          inputSchema: z.object({
            title: z
              .string()
              .describe("The title for creating linear issue"),
          }),
          execute: async ({ title}) => (await createIssue(title)),
        }),
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      {
        error:
          "Failed to process request. Please check your API key and try again.",
      },
      { status: 500 }
    );
  }
}

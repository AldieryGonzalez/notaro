import { google } from "@/ai/providers";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

import { linearTools } from "@/plugins/linear/tools";
import { gCalTools } from "@/plugins/gcal/tools";

import {
  convertToModelMessages,
  generateText,
  streamText,
  UIMessage,
  tool,
} from "ai";
import { type NextRequest, NextResponse } from "next/server";
import { getFileProcessingPrompt, ToolProcessingAgent } from "@/lib/context";

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
    const lookouts = await ToolProcessingAgent({
      ...linearTools,
      ...gCalTools,
    });

    const result = await streamText({
      model: google("gemini-2.0-flash"),
      messages: modelMessages,
      system: getFileProcessingPrompt({
        lookouts,
      }),
      tools: { ...linearTools, ...gCalTools },
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

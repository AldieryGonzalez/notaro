import { openai } from "@ai-sdk/openai";
import {
  convertToModelMessages,
  generateText,
  streamText,
  UIMessage,
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
      model: openai("gpt-4o"),
      messages: modelMessages,
      maxOutputTokens: 1000,
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

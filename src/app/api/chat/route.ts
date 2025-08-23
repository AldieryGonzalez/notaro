import { openai } from "@ai-sdk/openai";
import { generateText, streamText } from "ai";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { file, fileName, fileType, message } = await req.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          error:
            "OpenAI API key not configured. Please add OPENAI_API_KEY to your environment variables.",
        },
        { status: 500 }
      );
    }

    let prompt = message || `Analyze this file: ${fileName}`;
    const messages: any[] = [
      {
        role: "user",
        content: [{ type: "text", text: prompt }],
      },
    ];

    // Handle different file types
    if (fileType.startsWith("image/")) {
      // For images, add the image to the message
      messages[0].content.push({
        type: "image",
        image: file, // base64 data URL
      });
    } else if (
      fileType.startsWith("text/") ||
      fileType === "application/json"
    ) {
      // For text files, decode and add as text (file is expected as a data URL)
      const base64Data = (file as string).split(",")[1];
      const textContent = Buffer.from(base64Data, "base64").toString("utf-8");
      messages[0].content[0].text += `\n\nFile content:\n${textContent}`;
    } else {
      // For other file types, provide basic info
      messages[0].content[0].text += `\n\nFile type: ${fileType}\nFile name: ${fileName}\nNote: This file type may require special handling for full analysis.`;
    }

    const result = await streamText({
      model: openai("gpt-4o"),
      messages,
      maxOutputTokens: 1000,
    });

    return result.toTextStreamResponse();
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

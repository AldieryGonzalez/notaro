import { components } from "./_generated/api";
import { Agent, createThread } from "@convex-dev/agent";
import { openai } from "@ai-sdk/openai";
import { action } from "./_generated/server";
import { v } from "convex/values";
import { experimental_createMCPClient } from "ai";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const httpTransport = new StreamableHTTPClientTransport(
  new URL("http://localhost:4000")
);

export const helloWorld = action({
  args: { prompt: v.string() },
  handler: async (ctx, { prompt }) => {
    const clientTwo = await experimental_createMCPClient({
      transport: httpTransport,
    });

    const tools = await clientTwo.tools();

    const agent = new Agent(components.agent, {
      name: "My Agent",
      languageModel: openai.chat("gpt-5-mini"),
      tools: tools,
    });
    const threadId = await createThread(ctx, components.agent);
    const result = await agent.generateText(ctx, { threadId }, { prompt });
    return result.text;
  },
});

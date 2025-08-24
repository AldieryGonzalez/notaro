import { google, openai } from "@/ai/providers";
import { generateObject } from "ai";
import { ToolSet } from "ai";
import z from "zod";

export const toolProcessingPrompt = `
You are an expert at identifying high-level exportable intents from notes. You will receive MCP tools again in the next step, so DO NOT pick specific tools now. Instead, list what the next step should look out for in the note.

Instructions:
- Consider ONLY intents that CREATE or UPDATE things (e.g., issues, tasks, events, docs, PRs, bookmarks, contacts, reminders, checklists).
- Keep output SHORT and tool-agnostic. One item per distinct underlying intent.
- If the same text could map to multiple tools, prefer a single generic item rather than duplicates.
- If nothing applies, return an empty array.

Return ONLY a compact JSON array. Each object must contain:
  - "intent": "create" or "update".
  - "targetType": e.g., "issue", "task", "event", "doc", "pr", "bookmark", "contact", "reminder", "checklist".
  - "watchFor": Short phrases/patterns the processor should detect in notes.
  - "fields": Minimal fields to extract (e.g., title, description, dueDate, assignees, labels, start, end, participants, link, idToUpdate).
  - "sourceText" (optional): Very short snippet if helpful.

Constraints:
- Be tool-agnostic; do not include tool names or schema-specific fields.
- Deduplicate overlapping items. Do not fabricate IDs or details.

Example output:
[
  {
    "intent": "create",
    "targetType": "issue",
    "watchFor": ["Create a bug", "Track this", "Open an issue"],
    "fields": ["title", "description", "labels", "assignee", "project"],
    "sourceText": "Track the login bug (P1, assign Alex)."
  },
  {
    "intent": "create",
    "targetType": "event",
    "watchFor": ["Schedule", "Set up a meeting", "On the calendar"],
    "fields": ["title", "start", "end", "attendees", "location"]
  }
]

If nothing applies, return: []`;

export const toolProcessingSchema = z.array(
  z.object({
    intent: z.enum(["create", "update"]),
    targetType: z.string(),
    watchFor: z.array(z.string()),
    fields: z.array(z.string()),
    sourceText: z.string().optional(),
  })
);

export const ToolProcessingAgent = async (tools: ToolSet) => {
  const condensedTools = Object.entries(tools).map(([name, tool]) => ({
    name,
    description: tool.description,
    parameters: JSON.stringify(tool.inputSchema),
  }));

  const lookouts = await generateObject({
    model: google("gemini-2.0-flash"),
    schema: toolProcessingSchema,
    schemaDescription: toolProcessingPrompt,
    output: "object",
    prompt: `Here are the tools available: ${JSON.stringify(condensedTools)}`,
  });

  return lookouts;
};

export const getFileProcessingPrompt = (args: {
  lookouts: Awaited<ReturnType<typeof ToolProcessingAgent>>;
}) => `
  You are an expert operator with access to MCP tools. Your objective is to scan the content and, guided by the provided "lookouts", proactively CREATE or UPDATE entities by calling the appropriate tools. Use every relevant lookout; do not skip applicable ones.
  
  Lookouts (JSON)
  ${"```json"}
  ${JSON.stringify(args.lookouts, null, 2)}
  ${"```"}
  
  Process
  1) Read all lookouts. Each lookout specifies: intent (create|update), targetType, phrases to watchFor, and minimal fields to extract.
  2) Analyze this file thoroughly. Find every snippet that matches any lookout's watchFor patterns (explicitly or implicitly).
  3) For each match:
     - Extract the listed fields (and any obviously helpful extras like links or context).
     - Choose the most specific tool available for the targetType and CALL IT immediately with a minimal valid payload.
     - For update intents, only proceed if an unambiguous identifier/reference (e.g., idToUpdate or clearly referenced item) is present; otherwise, skip with reason.
     - If the same snippet implies multiple distinct entities (e.g., two tasks), make multiple calls.
  4) Avoid duplicates. If multiple lookouts map to the same underlying action, perform a single best-fit call.
  5) Be precise and concise in titles and descriptions. Infer reasonable defaults only when safe (e.g., duration 30m if meeting time given without end).
  
  Important
  - You DO have tool access in this run; prefer taking action (tool calls) over merely listing items.
  - If a required field is missing and cannot be inferred, skip that action and record a reason.
  - Keep calls minimal but complete according to the spirit of the lookout's fields.
  
  Output (Summary Only)
  After performing all applicable tool calls, return ONLY a summary of the tools you called and more importantly the exports you made to other systems:
  `;

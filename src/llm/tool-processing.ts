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

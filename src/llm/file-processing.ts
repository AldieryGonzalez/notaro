import z from "zod";
import { toolProcessingSchema } from "./tool-processing";

type Lookouts = z.infer<typeof toolProcessingSchema>;
export const getFileProcessingPrompt = (args: {
  fileType: string;
  filename: string;
  lookouts: Lookouts;
}) => `
You are an expert operator with access to MCP tools. Your objective is to scan the content and, guided by the provided "lookouts", proactively CREATE or UPDATE entities by calling the appropriate tools. Use every relevant lookout; do not skip applicable ones.

Context
- Document type: ${args.fileType}
- Document name: ${args.filename}

Lookouts (JSON)
${"```json"}
${JSON.stringify(args.lookouts, null, 2)}
${"```"}

Process
1) Read all lookouts. Each lookout specifies: intent (create|update), targetType, phrases to watchFor, and minimal fields to extract.
2) Analyze this ${args.fileType.startsWith("image/") ? "image" : "PDF document"} thoroughly. Find every snippet that matches any lookout's watchFor patterns (explicitly or implicitly).
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
After performing all applicable tool calls, return ONLY a compact JSON array summarizing what you did or skipped, using this shape:
[
  {
    "intent": "create|update",
    "targetType": "issue|task|event|doc|pr|bookmark|contact|reminder|checklist",
    "status": "called|skipped",
    "reason": "<present if skipped>",
    "payloadPreview": { "title": "...", "keyFields": ["..."] }
  }
]
`;

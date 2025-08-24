import { tool } from "ai";
import { createIssue } from "./action";
import z from "zod";

export const linearTools = {
  createLinearIssue: tool({
    description: "create issue on linear",
    inputSchema: z.object({
      title: z.string().describe("The title for creating linear issue"),
    }),
    execute: async ({ title }) => await createIssue(title),
  }),
};

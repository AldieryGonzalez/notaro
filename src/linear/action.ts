"use server";

import { linearClient } from ".";

export async function getMyIssues() {
  const me = await linearClient.viewer;
  const myIssues = await me.assignedIssues();

  if (myIssues.nodes.length) {
    myIssues.nodes.map((issue) =>
      console.log(`${me.displayName} has issue: ${issue.title}`)
    );
  } else {
    console.log(`${me.displayName} has no issues`);
  }
  return myIssues.nodes.map((n) => n.title);
}

export async function createIssue(title: string, description?: string) {
  const team = await linearClient.teams();
  const teamId = team.nodes[0].id;
  const states = await linearClient.workflowStates();
  const todoState = states.nodes.find((state) => state.name === "Todo");
  const todoStateId = todoState?.id;
  try {
     await linearClient.createIssue({
      teamId: process.env.LINEAR_TEAM_ID ?? teamId,
      title: title,
      description: description,
      stateId: todoStateId,
    });
  } catch (error) {
    console.error("Failed to create issue:", error);
  }
}

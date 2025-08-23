import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Toaster } from "sonner";
import { WorkflowBuilder } from "./components/WorkflowBuilder";
import { WorkflowList } from "./components/WorkflowList";
import { useState } from "react";
import { Id } from "../convex/_generated/dataModel";
import { SignInButton, SignOutButton } from "@clerk/clerk-react";

export default function App() {
  const [selectedWorkflowId, setSelectedWorkflowId] =
    useState<Id<"workflows"> | null>(null);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm h-16 flex justify-between items-center border-b shadow-sm px-4">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-primary">
            Workflow Builder
          </h2>
          {selectedWorkflowId && (
            <button
              onClick={() => setSelectedWorkflowId(null)}
              className="text-sm text-gray-600 hover:text-gray-800 px-3 py-1 rounded-md hover:bg-gray-100"
            >
              ← Back to Workflows
            </button>
          )}
        </div>
        <SignOutButton />
      </header>
      <main className="flex-1">
        <Content
          selectedWorkflowId={selectedWorkflowId}
          onSelectWorkflow={setSelectedWorkflowId}
        />
      </main>
      <Toaster />
    </div>
  );
}

function Content({
  selectedWorkflowId,
  onSelectWorkflow,
}: {
  selectedWorkflowId: Id<"workflows"> | null;
  onSelectWorkflow: (id: Id<"workflows"> | null) => void;
}) {
  return (
    <div className="h-full">
      <Authenticated>
        {selectedWorkflowId ? (
          <WorkflowBuilder
            workflowId={selectedWorkflowId}
            onBack={() => onSelectWorkflow(null)}
          />
        ) : (
          <WorkflowList onSelectWorkflow={onSelectWorkflow} />
        )}
      </Authenticated>
      <Unauthenticated>
        <div className="flex items-center justify-center h-full">
          <div className="w-full max-w-md mx-auto p-8">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-primary mb-4">
                Workflow Builder
              </h1>
              <p className="text-xl text-secondary">
                Create and manage your workflows
              </p>
            </div>
            <SignInButton />
          </div>
        </div>
      </Unauthenticated>
    </div>
  );
}

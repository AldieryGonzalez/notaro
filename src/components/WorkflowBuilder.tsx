import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useState, useRef, useCallback } from "react";
import { Node } from "./Node";
import { Connection } from "./Connection";
import { NodeToolbar } from "./NodeToolbar";

interface WorkflowBuilderProps {
  workflowId: Id<"workflows">;
  onBack: () => void;
}

export function WorkflowBuilder({ workflowId }: WorkflowBuilderProps) {
  const workflowData = useQuery(api.workflows.get, { workflowId });
  const addNode = useMutation(api.workflows.addNode);
  const addConnection = useMutation(api.workflows.addConnection);

  const [selectedNodeId, setSelectedNodeId] = useState<Id<"nodes"> | null>(
    null
  );
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStart, setConnectionStart] = useState<Id<"nodes"> | null>(
    null
  );
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleAddNode = useCallback(
    async (type: "process" | "output", position: { x: number; y: number }) => {
      const name = type === "process" ? "Process Node" : "Output Node";
      await addNode({
        workflowId,
        type,
        name,
        position,
      });
    },
    [addNode, workflowId]
  );

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === canvasRef.current) {
        setSelectedNodeId(null);
        if (isConnecting) {
          setIsConnecting(false);
          setConnectionStart(null);
        }
      }
    },
    [isConnecting]
  );

  const handleNodeClick = useCallback(
    (nodeId: Id<"nodes">) => {
      if (isConnecting && connectionStart && connectionStart !== nodeId) {
        // Complete connection
        void addConnection({
          workflowId,
          sourceNodeId: connectionStart,
          targetNodeId: nodeId,
        });
        setIsConnecting(false);
        setConnectionStart(null);
      } else {
        setSelectedNodeId(nodeId);
      }
    },
    [isConnecting, connectionStart, addConnection, workflowId]
  );

  const handleStartConnection = useCallback((nodeId: Id<"nodes">) => {
    setIsConnecting(true);
    setConnectionStart(nodeId);
  }, []);

  const handleCanvasDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const position = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        };
        void handleAddNode("process", position);
      }
    },
    [handleAddNode]
  );

  if (!workflowData) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const { workflow, nodes, connections } = workflowData;

  return (
    <div className="h-full flex">
      <div className="flex-1 relative overflow-hidden">
        <div className="absolute top-4 left-4 z-10 bg-white rounded-lg shadow-sm border border-gray-200 p-3">
          <h2 className="font-semibold text-gray-900">{workflow.name}</h2>
          {workflow.description && (
            <p className="text-sm text-gray-600 mt-1">{workflow.description}</p>
          )}
        </div>

        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <button
            onClick={() => {
              void handleAddNode("process", { x: 300, y: 200 });
            }}
            className="bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            + Process Node
          </button>
          <button
            onClick={() => {
              void handleAddNode("output", { x: 500, y: 200 });
            }}
            className="bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
          >
            + Output Node
          </button>
        </div>

        <div
          ref={canvasRef}
          className="w-full h-full bg-gray-50 relative cursor-crosshair"
          onClick={handleCanvasClick}
          onDoubleClick={handleCanvasDoubleClick}
          style={{
            backgroundImage: `
              radial-gradient(circle, #e5e7eb 1px, transparent 1px)
            `,
            backgroundSize: "20px 20px",
          }}
        >
          {/* Render connections */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ zIndex: 1 }}
          >
            {connections.map((connection) => {
              const sourceNode = nodes.find(
                (n) => n._id === connection.sourceNodeId
              );
              const targetNode = nodes.find(
                (n) => n._id === connection.targetNodeId
              );

              if (!sourceNode || !targetNode) return null;

              return (
                <Connection
                  key={connection._id}
                  sourcePosition={{
                    x: sourceNode.position.x + 150,
                    y: sourceNode.position.y + 40,
                  }}
                  targetPosition={{
                    x: targetNode.position.x,
                    y: targetNode.position.y + 40,
                  }}
                />
              );
            })}
          </svg>

          {/* Render nodes */}
          {nodes.map((node) => (
            <Node
              key={node._id}
              node={node}
              isSelected={selectedNodeId === node._id}
              isConnecting={isConnecting}
              onClick={() => handleNodeClick(node._id)}
              onStartConnection={() => handleStartConnection(node._id)}
            />
          ))}

          {/* Connection preview */}
          {isConnecting && connectionStart && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ zIndex: 2 }}
            >
              <div className="text-center text-sm text-blue-600 bg-blue-50 border border-blue-200 rounded-md px-3 py-1 absolute top-4 left-1/2 transform -translate-x-1/2">
                Click on another node to connect
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Node configuration panel */}
      {selectedNodeId && (
        <NodeToolbar
          nodeId={selectedNodeId}
          onClose={() => setSelectedNodeId(null)}
        />
      )}
    </div>
  );
}

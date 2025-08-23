import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useState, useRef } from "react";
import { toast } from "sonner";

interface NodeToolbarProps {
  nodeId: Id<"nodes">;
  onClose: () => void;
}

export function NodeToolbar({ nodeId, onClose }: NodeToolbarProps) {
  const node = useQuery(api.workflows.getNode, { nodeId });
  const updateNodeConfig = useMutation(api.workflows.updateNodeConfig);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const getFileUrl = useQuery(api.files.getFileUrl, 
    node?.config?.fileId ? { fileId: node.config.fileId } : "skip"
  );
  
  const [isUploading, setIsUploading] = useState(false);
  const [processingType, setProcessingType] = useState(node?.config?.processingType || "");
  const [outputFormat, setOutputFormat] = useState(node?.config?.outputFormat || "");
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!node) return null;

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    
    setIsUploading(true);
    try {
      // Get upload URL
      const uploadUrl = await generateUploadUrl();
      
      // Upload file
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      
      if (!result.ok) {
        throw new Error("Upload failed");
      }
      
      const { storageId } = await result.json();
      
      // Update node config
      await updateNodeConfig({
        nodeId,
        config: {
          ...node.config,
          fileId: storageId,
          fileName: file.name,
          fileType: file.type,
        },
      });
      
      toast.success("File uploaded successfully!");
    } catch (error) {
      toast.error("Failed to upload file");
    } finally {
      setIsUploading(false);
    }
  };

  const handleConfigUpdate = async (updates: any) => {
    try {
      await updateNodeConfig({
        nodeId,
        config: {
          ...node.config,
          ...updates,
        },
      });
      toast.success("Configuration updated!");
    } catch (error) {
      toast.error("Failed to update configuration");
    }
  };

  return (
    <div className="w-80 bg-white border-l border-gray-200 shadow-lg h-full overflow-y-auto">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">{node.name}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className="text-sm text-gray-600 mt-1 capitalize">{node.type.replace('_', ' ')} Node</p>
      </div>

      <div className="p-4 space-y-6">
        {node.type === "file_upload" && (
          <div>
            <h4 className="font-medium text-gray-900 mb-3">File Upload</h4>
            
            {node.config?.fileId ? (
              <div className="space-y-3">
                <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-medium text-green-800">File uploaded</span>
                  </div>
                  <p className="text-sm text-green-700 mt-1">{node.config.fileName}</p>
                </div>
                
                {getFileUrl && (
                  <a
                    href={getFileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    View file
                  </a>
                )}
              </div>
            ) : (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors text-center disabled:opacity-50"
                >
                  {isUploading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span className="text-sm text-gray-600">Uploading...</span>
                    </div>
                  ) : (
                    <div>
                      <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="text-sm text-gray-600">Click to upload a file</p>
                    </div>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {node.type === "process" && (
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Processing Configuration</h4>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Processing Type
              </label>
              <select
                value={processingType}
                onChange={(e) => {
                  setProcessingType(e.target.value);
                  handleConfigUpdate({ processingType: e.target.value });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select processing type</option>
                <option value="transform">Transform Data</option>
                <option value="filter">Filter Data</option>
                <option value="analyze">Analyze Data</option>
                <option value="convert">Convert Format</option>
              </select>
            </div>
          </div>
        )}

        {node.type === "output" && (
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Output Configuration</h4>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Output Format
              </label>
              <select
                value={outputFormat}
                onChange={(e) => {
                  setOutputFormat(e.target.value);
                  handleConfigUpdate({ outputFormat: e.target.value });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select output format</option>
                <option value="json">JSON</option>
                <option value="csv">CSV</option>
                <option value="pdf">PDF</option>
                <option value="excel">Excel</option>
              </select>
            </div>
          </div>
        )}

        <div>
          <h4 className="font-medium text-gray-900 mb-3">Node Information</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Position:</span>
              <span className="text-gray-900">
                ({Math.round(node.position.x)}, {Math.round(node.position.y)})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Created:</span>
              <span className="text-gray-900">
                {new Date(node._creationTime).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

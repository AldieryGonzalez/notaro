import React, { useState, useRef } from "react";
import { Doc } from "../../convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

interface NodeProps {
  node: Doc<"nodes">;
  isSelected: boolean;
  isConnecting: boolean;
  onClick: () => void;
  onStartConnection: () => void;
}

export function Node({ node, isSelected, isConnecting, onClick, onStartConnection }: NodeProps) {
  const updateNodePosition = useMutation(api.workflows.updateNodePosition);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const nodeRef = useRef<HTMLDivElement>(null);

  const getNodeColor = () => {
    switch (node.type) {
      case "file_upload":
        return "bg-purple-100 border-purple-300 text-purple-800";
      case "process":
        return "bg-blue-100 border-blue-300 text-blue-800";
      case "output":
        return "bg-green-100 border-green-300 text-green-800";
      default:
        return "bg-gray-100 border-gray-300 text-gray-800";
    }
  };

  const getNodeIcon = () => {
    switch (node.type) {
      case "file_upload":
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        );
      case "process":
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
      case "output":
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only handle left click
    
    e.preventDefault();
    e.stopPropagation();
    
    const rect = nodeRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
      setIsDragging(true);
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !nodeRef.current?.parentElement) return;
    
    const parentRect = nodeRef.current.parentElement.getBoundingClientRect();
    const newPosition = {
      x: Math.max(0, e.clientX - parentRect.left - dragOffset.x),
      y: Math.max(0, e.clientY - parentRect.top - dragOffset.y),
    };
    
    // Update position immediately for smooth dragging
    nodeRef.current.style.left = `${newPosition.x}px`;
    nodeRef.current.style.top = `${newPosition.y}px`;
  };

  const handleMouseUp = async () => {
    if (!isDragging || !nodeRef.current?.parentElement) return;
    
    const parentRect = nodeRef.current.parentElement.getBoundingClientRect();
    const rect = nodeRef.current.getBoundingClientRect();
    
    const finalPosition = {
      x: Math.max(0, rect.left - parentRect.left),
      y: Math.max(0, rect.top - parentRect.top),
    };
    
    await updateNodePosition({
      nodeId: node._id,
      position: finalPosition,
    });
    
    setIsDragging(false);
  };

  // Add event listeners for mouse move and up
  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isDragging) {
      onClick();
    }
  };

  const handleConnectionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onStartConnection();
  };

  return (
    <div
      ref={nodeRef}
      className={`
        absolute w-36 bg-white border-2 rounded-lg shadow-sm cursor-move select-none
        ${getNodeColor()}
        ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
        ${isConnecting ? 'hover:ring-2 hover:ring-blue-400' : ''}
        ${isDragging ? 'shadow-lg scale-105' : 'hover:shadow-md'}
        transition-all duration-200
      `}
      style={{
        left: node.position.x,
        top: node.position.y,
        zIndex: isSelected || isDragging ? 10 : 5,
      }}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
    >
      <div className="p-3">
        <div className="flex items-center gap-2 mb-2">
          {getNodeIcon()}
          <span className="font-medium text-sm truncate">{node.name}</span>
        </div>
        
        {node.config?.fileName && (
          <div className="text-xs text-gray-600 truncate">
            {node.config.fileName}
          </div>
        )}
        
        {node.type === "process" && node.config?.processingType && (
          <div className="text-xs text-gray-600 truncate">
            {node.config.processingType}
          </div>
        )}
        
        {node.type === "output" && node.config?.outputFormat && (
          <div className="text-xs text-gray-600 truncate">
            Format: {node.config.outputFormat}
          </div>
        )}
      </div>
      
      {/* Connection points */}
      <div className="absolute -right-2 top-1/2 transform -translate-y-1/2">
        <button
          onClick={handleConnectionClick}
          className="w-4 h-4 bg-white border-2 border-gray-400 rounded-full hover:border-blue-500 hover:bg-blue-50 transition-colors"
          title="Connect to another node"
        />
      </div>
      
      <div className="absolute -left-2 top-1/2 transform -translate-y-1/2">
        <div className="w-4 h-4 bg-white border-2 border-gray-400 rounded-full" />
      </div>
    </div>
  );
}

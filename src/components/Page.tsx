import { useState } from "react";
import type React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Server,
  Plus,
  Settings,
  Trash2,
  CheckCircle,
  AlertCircle,
  Zap,
  Network,
  Activity,
  Upload,
  FileText,
  ImageIcon,
  PenTool as Tool,
  Eye,
  EyeOff,
} from "lucide-react";

interface MCPServer {
  id: string;
  name: string;
  endpoint: string;
  status: "active" | "inactive" | "error";
  description: string;
  lastTriggered?: Date;
  tools: string[];
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: Date;
}

export default function MCPServerManagement() {
  const [servers, setServers] = useState<MCPServer[]>([
    {
      id: "1",
      name: "Notion Export Agent",
      endpoint: "https://api.notaro.com/mcp/notion",
      status: "active",
      description: "Exports notes to Notion workspaces",
      lastTriggered: new Date(Date.now() - 1000 * 60 * 30),
      tools: [
        "create_page",
        "update_database",
        "search_content",
        "export_markdown",
      ],
    },
    {
      id: "2",
      name: "Google Docs Processor",
      endpoint: "https://api.notaro.com/mcp/gdocs",
      status: "inactive",
      description: "Converts notes to Google Docs format",
      tools: [
        "create_document",
        "format_text",
        "insert_images",
        "share_document",
      ],
    },
  ]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newServer, setNewServer] = useState({
    name: "",
    endpoint: "",
    description: "",
  });

  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showTools, setShowTools] = useState<{ [key: string]: boolean }>({});

  const handleFileUpload = (files: FileList | null) => {
    if (!files) return;

    console.log("TODO: Upload files to Convex", files);

    Array.from(files).forEach((file) => {
      const uploadedFile: UploadedFile = {
        id: Date.now().toString() + Math.random(),
        name: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: new Date(),
      };
      setUploadedFiles((prev) => [...prev, uploadedFile]);
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileUpload(e.dataTransfer.files);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (
      Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
    );
  };

  const toggleTools = (serverId: string) => {
    setShowTools((prev) => ({
      ...prev,
      [serverId]: !prev[serverId],
    }));
  };

  const handleAddServer = () => {
    console.log("TODO: Add server", newServer);

    const server: MCPServer = {
      id: Date.now().toString(),
      name: newServer.name,
      endpoint: newServer.endpoint,
      description: newServer.description,
      status: "inactive",
      tools: [],
    };

    setServers([...servers, server]);
    setNewServer({ name: "", endpoint: "", description: "" });
    setShowAddForm(false);
  };

  const handleTriggerServer = (serverId: string) => {
    console.log("TODO: Trigger server", serverId);

    setServers(
      servers.map((server) =>
        server.id === serverId
          ? { ...server, status: "active" as const, lastTriggered: new Date() }
          : server
      )
    );
  };

  const handleDeleteServer = (serverId: string) => {
    console.log("TODO: Delete server", serverId);

    setServers(servers.filter((server) => server.id !== serverId));
  };

  const getStatusIcon = (status: MCPServer["status"]) => {
    switch (status) {
      case "active":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "inactive":
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusBadge = (status: MCPServer["status"]) => {
    const variants = {
      active: "bg-green-100 text-green-800 border-green-200",
      inactive: "bg-gray-100 text-gray-600 border-gray-200",
      error: "bg-red-100 text-red-800 border-red-200",
    };

    return (
      <Badge className={`${variants[status]} border`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen grid-dot-background">
      <div className="container mx-auto p-6 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
              <Network className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Notaro</h1>
              <p className="text-muted-foreground">
                Agentic Note Processing System
              </p>
            </div>
          </div>

          <p className="text-lg text-muted-foreground max-w-2xl">
            Upload your notes and manage MCP servers to export and process your
            content across different services.
          </p>
        </div>

        {/* File Upload Section */}
        <Card className="mb-8 border-2 border-dashed border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Upload className="w-5 h-5" />
              Upload Notes & Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragOver
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50 hover:bg-primary/5"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Upload className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Drop your files here or click to browse
              </h3>
              <p className="text-muted-foreground mb-4">
                Support for images, documents, and text files
              </p>
              <input
                type="file"
                multiple
                accept="image/*,.txt,.md,.pdf,.docx"
                onChange={(e) => handleFileUpload(e.target.files)}
                className="hidden"
                id="file-upload"
              />
              <Button asChild className="bg-primary hover:bg-primary/90">
                <label htmlFor="file-upload" className="cursor-pointer">
                  <FileText className="w-4 h-4 mr-2" />
                  Choose Files
                </label>
              </Button>
            </div>

            {/* Uploaded Files Display */}
            {uploadedFiles.length > 0 && (
              <div className="mt-6">
                <h4 className="font-medium text-foreground mb-3">
                  Uploaded Files ({uploadedFiles.length})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {uploadedFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center gap-3 p-3 bg-background border border-border rounded-lg"
                    >
                      <div className="w-8 h-8 bg-primary/10 rounded flex items-center justify-center flex-shrink-0">
                        {file.type.startsWith("image/") ? (
                          <ImageIcon className="w-4 h-4 text-primary" />
                        ) : (
                          <FileText className="w-4 h-4 text-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(file.size)} •{" "}
                          {file.uploadedAt.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Bar */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-foreground">
              MCP Servers
            </h2>
            <Badge
              variant="secondary"
              className="bg-accent/10 text-accent border-accent/20"
            >
              {servers.length} configured
            </Badge>
          </div>

          <Button
            onClick={() => setShowAddForm(true)}
            className="bg-accent hover:bg-accent/90 text-accent-foreground"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Server
          </Button>
        </div>

        {/* Add Server Form */}
        {showAddForm && (
          <Card className="mb-6 border-2 border-accent/20 shadow-lg">
            <CardHeader className="bg-accent/5">
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Settings className="w-5 h-5" />
                Add New MCP Server
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="server-name"
                    className="text-foreground font-medium"
                  >
                    Server Name
                  </Label>
                  <Input
                    id="server-name"
                    placeholder="e.g., Slack Export Agent"
                    value={newServer.name}
                    onChange={(e) =>
                      setNewServer({ ...newServer, name: e.target.value })
                    }
                    className="bg-input border-border"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="server-endpoint"
                    className="text-foreground font-medium"
                  >
                    Endpoint URL
                  </Label>
                  <Input
                    id="server-endpoint"
                    placeholder="https://api.example.com/mcp/slack"
                    value={newServer.endpoint}
                    onChange={(e) =>
                      setNewServer({ ...newServer, endpoint: e.target.value })
                    }
                    className="bg-input border-border"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="server-description"
                  className="text-foreground font-medium"
                >
                  Description
                </Label>
                <Input
                  id="server-description"
                  placeholder="Brief description of what this server does"
                  value={newServer.description}
                  onChange={(e) =>
                    setNewServer({ ...newServer, description: e.target.value })
                  }
                  className="bg-input border-border"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleAddServer}
                  disabled={!newServer.name || !newServer.endpoint}
                  className="bg-accent hover:bg-accent/90 text-accent-foreground"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Server
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowAddForm(false)}
                  className="border-border"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Server Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {servers.map((server) => (
            <Card
              key={server.id}
              className="border border-border shadow-md hover:shadow-lg transition-shadow"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Server className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-foreground">
                        {server.name}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        {getStatusIcon(server.status)}
                        {getStatusBadge(server.status)}
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {server.description}
                </p>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Network className="w-3 h-3" />
                    <span className="font-mono truncate">
                      {server.endpoint}
                    </span>
                  </div>

                  {server.lastTriggered && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Activity className="w-3 h-3" />
                      <span>
                        Last triggered{" "}
                        {server.lastTriggered.toLocaleTimeString()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Tools Section for Each Server */}
                {server.tools.length > 0 && (
                  <div className="border-t border-border pt-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Tool className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs font-medium text-muted-foreground">
                          Available Tools ({server.tools.length})
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleTools(server.id)}
                        className="h-6 w-6 p-0"
                      >
                        {showTools[server.id] ? (
                          <EyeOff className="w-3 h-3" />
                        ) : (
                          <Eye className="w-3 h-3" />
                        )}
                      </Button>
                    </div>

                    {showTools[server.id] && (
                      <div className="flex flex-wrap gap-1">
                        {server.tools.map((tool, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="text-xs bg-muted/50 border-muted-foreground/20"
                          >
                            {tool}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    onClick={() => handleTriggerServer(server.id)}
                    className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground"
                  >
                    <Zap className="w-3 h-3 mr-1" />
                    Trigger
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteServer(server.id)}
                    className="border-border hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {servers.length === 0 && (
          <Card className="border-2 border-dashed border-border bg-muted/30">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Server className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No MCP Servers Configured
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Add your first MCP server to start processing and exporting your
                notes to different services.
              </p>
              <Button
                onClick={() => setShowAddForm(true)}
                className="bg-accent hover:bg-accent/90 text-accent-foreground"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Server
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Stats Footer */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Uploaded Files Stat */}
          <Card className="border border-border">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">
                {uploadedFiles.length}
              </div>
              <div className="text-sm text-muted-foreground">
                Files Uploaded
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-accent">
                {servers.filter((s) => s.status === "active").length}
              </div>
              <div className="text-sm text-muted-foreground">
                Active Servers
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-foreground">
                {servers.length}
              </div>
              <div className="text-sm text-muted-foreground">
                Total Configured
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {servers.filter((s) => s.lastTriggered).length}
              </div>
              <div className="text-sm text-muted-foreground">Recently Used</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

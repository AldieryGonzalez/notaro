"use client";

import type React from "react";

import { useState, useRef, useEffect } from "react";
import { Webcam } from "webcam-easy";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Upload,
  FileText,
  ImageIcon,
  File,
  Loader2,
  Camera,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useChat } from "@ai-sdk/react";
import { convertFileListToFileUIParts, DefaultChatTransport } from "ai";

interface ChatMessage {
  id: string;
  type: "user" | "assistant";
  content: string;
  fileName?: string;
  fileType?: string;
  timestamp: Date;
}

async function convertFilesToDataURLs(
  files: FileList
): Promise<
  { type: "file"; filename: string; mediaType: string; url: string }[]
> {
  return Promise.all(
    Array.from(files).map(
      (file) =>
        new Promise<{
          type: "file";
          filename: string;
          mediaType: string;
          url: string;
        }>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            resolve({
              type: "file",
              filename: file.name,
              mediaType: file.type,
              url: reader.result as string, // Data URL
            });
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        })
    )
  );
}

export default function FileChatApp() {
  const [isLoading, setIsLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const webcamRef = useRef<Webcam | null>(null);
  const { messages, sendMessage } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),
  });

  const [files, setFiles] = useState<FileList | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  const processFile = async (file: File) => {
    setIsLoading(true);

    // Add user message with file info
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "user",
      content: `Uploaded: ${file.name}`,
      fileName: file.name,
      fileType: file.type,
      timestamp: new Date(),
    };

    try {
      // Convert file to base64 for processing
      const base64 = await fileToBase64(file);
      const fileParts =
        files && files.length > 0 ? await convertFilesToDataURLs(files) : [];

      // Send to AI API
      sendMessage({
        role: "user",
        parts: fileParts,
      });
    } catch (error) {
      console.error("Error processing file:", error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content:
          error instanceof Error
            ? error.message
            : "Sorry, I encountered an error processing your file. Please try again.",
        timestamp: new Date(),
      };
    } finally {
      setIsLoading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const startCamera = async () => {
    try {
      setShowCamera(true);
      // Initialize webcam after modal is shown
      setTimeout(() => {
        if (videoRef.current && !webcamRef.current) {
          webcamRef.current = new Webcam(videoRef.current, "environment");
          webcamRef.current
            .start()
            .then(() => {
              console.log("Webcam started successfully");
            })
            .catch((err: any) => {
              console.error("Error starting webcam:", err);
              alert("Unable to access camera. Please check permissions.");
              setShowCamera(false);
            });
        }
      }, 100);
    } catch (error) {
      console.error("Error accessing camera:", error);
      alert("Unable to access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (webcamRef.current) {
      webcamRef.current.stop();
      webcamRef.current = null;
    }
    setShowCamera(false);
  };

  const capturePhoto = async () => {
    if (!webcamRef.current) return;

    try {
      // Capture image as base64
      const imageSrc = webcamRef.current.snap();

      // Convert base64 to blob
      const response = await fetch(imageSrc);
      const blob = await response.blob();

      // Create a File object from the blob
      const fileName = `camera-capture-${Date.now()}.jpg`;
      const file = Object.assign(blob, {
        name: fileName,
        lastModified: Date.now(),
      }) as File;

      await stopCamera();
      await processFile(file);
    } catch (error) {
      console.error("Error capturing photo:", error);
      alert("Failed to capture photo. Please try again.");
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) return <ImageIcon className="h-4 w-4" />;
    if (fileType === "application/pdf" || fileType.startsWith("text/"))
      return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-foreground">File Chat AI</h1>
          <p className="text-muted-foreground">
            Upload files to chat with AI - no text input needed
          </p>
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 container mx-auto px-4 py-6 max-w-4xl">
        <Card className="h-[calc(100vh-200px)] flex flex-col">
          <CardContent className="flex-1 p-0">
            <ScrollArea className="h-full p-6">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Upload className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      Upload a file to start chatting
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      I can analyze images, documents, text files, and more.
                      Just drag and drop or click to upload.
                    </p>
                    <div className="flex gap-2">
                      <Button onClick={triggerFileUpload} className="gap-2">
                        <Upload className="h-4 w-4" />
                        Choose File
                      </Button>
                      <Button
                        onClick={startCamera}
                        variant="outline"
                        className="gap-2"
                      >
                        <Camera className="h-4 w-4" />
                        Take Photo
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "flex gap-3",
                        message.role === "user"
                          ? "justify-end"
                          : "justify-start"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[80%] rounded-lg px-4 py-2",
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {message.role === "user" &&
                          message.parts.length > 0 && (
                            <>
                              {message.parts.map((part) => (
                                <div className="flex items-center gap-2 mb-1">
                                  {getFileIcon(part.type || "")}
                                  <span className="text-sm font-medium">
                                    {"File"}
                                  </span>
                                </div>
                              ))}
                            </>
                          )}
                        <p className="text-sm leading-relaxed">
                          {message.parts.map((part) => part.text).join("\n")}
                        </p>
                        <p className="text-xs opacity-70 mt-1">
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-muted text-muted-foreground rounded-lg px-4 py-2 flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">Analyzing your file...</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>
          </CardContent>

          {/* File Upload Area */}
          <div className="border-t p-4">
            <div className="flex gap-2 mb-4">
              <Button
                onClick={triggerFileUpload}
                variant="outline"
                className="flex-1 gap-2"
              >
                <Upload className="h-4 w-4" />
                Upload File
              </Button>
              <Button
                onClick={startCamera}
                variant="outline"
                className="flex-1 gap-2"
              >
                <Camera className="h-4 w-4" />
                Take Photo
              </Button>
            </div>
            <div
              className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
              onClick={triggerFileUpload}
              onDragOver={(e) => {
                e.preventDefault();
                e.currentTarget.classList.add("border-primary");
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.currentTarget.classList.remove("border-primary");
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.classList.remove("border-primary");
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                  const event = {
                    target: { files },
                  } as React.ChangeEvent<HTMLInputElement>;
                  handleFileUpload(event);
                }
              }}
            >
              <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground mb-1">
                Drop your file here or click to browse
              </p>
              <p className="text-xs text-muted-foreground">
                Supports images, PDFs, text files, and more
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileUpload}
              className="hidden"
              accept="*/*"
            />
          </div>
        </Card>
      </div>

      {/* Camera Modal */}
      {showCamera && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-4 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Take a Photo</h3>
              <Button onClick={stopCamera} variant="ghost" size="sm">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full rounded-lg"
              />
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={capturePhoto} className="flex-1">
                <Camera className="h-4 w-4 mr-2" />
                Capture
              </Button>
              <Button onClick={stopCamera} variant="outline" className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

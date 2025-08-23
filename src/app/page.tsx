"use client";

import type React from "react";

import { useState, useRef } from "react";
import Webcam from "react-webcam";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Upload,
  FileText,
  ImageIcon,
  File,
  Camera,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Loader } from "@/components/ai-elements/loader";


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
  const [webcamDir, setWebcamDir] = useState("user");
  const [isLoading, setIsLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
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
    const selectedFiles = event.target.files;
    if (!selectedFiles) return;
    setFiles(selectedFiles);
    await processFile(selectedFiles);
  };

  const processFile = async (fileList: FileList) => {
    setIsLoading(true);

    try {
      const fileParts = await convertFilesToDataURLs(fileList);

      if (fileParts.length === 0) {
        throw new Error("No file parts found");
      }

      // Send to AI API
      sendMessage({
        role: "user",
        parts: fileParts,
      });
    } catch (error) {
      console.error("Error processing file:", error);
    } finally {
      setIsLoading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setFiles(undefined);
    }
  };


  const capturePhoto = async () => {
    if (!webcamRef.current) {
      console.error("Webcam ref is not available");
      return;
    }

    try {
      // Capture image as base64
      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) {
        console.error("Failed to capture image");
        return;
      }

      // Convert base64 to blob
      const response = await fetch(imageSrc);
      const blob = await response.blob();

      // Create a File object from the blob
      const fileName = `camera-capture-${Date.now()}.jpg`;
      const file = Object.assign(blob, {
        name: fileName,
        lastModified: Date.now(),
      }) as File;

      setShowCamera(false);
      
      // Create a FileList-like object
      const fileList = {
        0: file,
        length: 1,
        item: (index: number) => (index === 0 ? file : null),
        [Symbol.iterator]: function* () {
          yield file;
        },
      } as FileList;
      
      setFiles(fileList);
      await processFile(fileList);
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
                <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center shadow-lg">
                    <Upload className="h-10 w-10 text-primary" />
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-foreground">
                      Upload a file to start chatting
                    </h3>
                    <p className="text-muted-foreground max-w-md">
                      I can analyze images, documents, text files, and more.
                      Just drag and drop or click to upload.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                      <Button
                        onClick={triggerFileUpload}
                        className="gap-2 min-w-[140px]"
                      >
                        <Upload className="h-4 w-4" />
                        Choose File
                      </Button>
                      <Button
                        onClick={() => setShowCamera(true)}
                        variant="outline"
                        className="gap-2 min-w-[140px]"
                      >
                        <Camera className="h-4 w-4" />
                        Take Photo
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {messages.map((message, index) => (
                    <div
                      key={message.id || index}
                      className={cn(
                        "flex gap-3 mb-6",
                        message.role === "user"
                          ? "justify-end"
                          : "justify-start"
                      )}
                    >
                      {message.role === "assistant" && (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                          AI
                        </div>
                      )}
                      <div
                        className={cn(
                          "max-w-[80%] rounded-lg px-4 py-3 shadow-sm",
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-card text-card-foreground border"
                        )}
                      >
                        {message.role === "user" ? (
                          <div className="space-y-2">
                            {message.parts?.map((part, partIndex) => {
                              switch (part.type) {
                                case "text":
                                  return (
                                    <p key={partIndex} className="text-sm">
                                      {part.text}
                                    </p>
                                  );
                                case "file":
                                  return (
                                    <div
                                      key={partIndex}
                                      className="flex items-center gap-2 text-sm opacity-90"
                                    >
                                      {getFileIcon(part.mediaType || "")}
                                      <span>Uploaded: {part.filename}</span>
                                    </div>
                                  );
                                default:
                                  return null;
                              }
                            }) || <p className="text-sm">File uploaded</p>}
                          </div>
                        ) : (
                          <div className="text-sm">
                            {message.parts?.map((part, partIndex) => {
                              if (part.type === "text") {
                                return <p key={partIndex}>{part.text}</p>;
                              }
                              return null;
                            }) || <p>AI response</p>}
                          </div>
                        )}
                      </div>
                      {message.role === "user" && (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                          You
                        </div>
                      )}
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex gap-3 mb-6 justify-start">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                        AI
                      </div>
                      <div className="max-w-[80%] rounded-lg px-4 py-3 shadow-sm bg-card text-card-foreground border">
                        <div className="flex items-center gap-3">
                          <Loader size={16} />
                          <span className="text-sm text-muted-foreground">
                            Analyzing your file...
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>
          </CardContent>

          {/* File Upload Area */}
          <div className="border-t bg-muted/30 p-4">
            <div className="flex gap-3 mb-4">
              <Button
                onClick={triggerFileUpload}
                variant="outline"
                className="flex-1 gap-2 hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                <Upload className="h-4 w-4" />
                Upload File
              </Button>
              <Button
                onClick={() => setShowCamera(true)}
                variant="outline"
                className="flex-1 gap-2 hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                <Camera className="h-4 w-4" />
                Take Photo
              </Button>
            </div>
            <div
              className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer group"
              onClick={triggerFileUpload}
              onDragOver={(e) => {
                e.preventDefault();
                e.currentTarget.classList.add(
                  "border-primary",
                  "bg-primary/10"
                );
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.currentTarget.classList.remove(
                  "border-primary",
                  "bg-primary/10"
                );
              }}
              onDrop={async (e) => {
                e.preventDefault();
                e.currentTarget.classList.remove(
                  "border-primary",
                  "bg-primary/10"
                );
                const droppedFiles = e.dataTransfer.files;
                if (droppedFiles.length > 0) {
                  setFiles(droppedFiles);
                  await processFile(droppedFiles);
                }
              }}
            >
              <Upload className="h-8 w-8 text-muted-foreground group-hover:text-primary mx-auto mb-3 transition-colors" />
              <p className="text-sm text-muted-foreground group-hover:text-foreground mb-1 transition-colors">
                Drop your file here or click to browse
              </p>
              <p className="text-xs text-muted-foreground/80">
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
              <Button
                onClick={() => setShowCamera(false)}
                variant="ghost"
                size="sm"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="relative">
              <Webcam
                audio={false}
                videoConstraints={{ facingMode: webcamDir }}
                ref={webcamRef}
              />
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={capturePhoto} className="flex-1">
                <Camera className="h-4 w-4 mr-2" />
                Capture
              </Button>
              <Button
                onClick={() => setShowCamera(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Upload, FileText, ImageIcon, File, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import Linear from "@/components/linear"

interface ChatMessage {
  id: string
  type: "user" | "assistant"
  content: string
  fileName?: string
  fileType?: string
  timestamp: Date
}

export default function FileChatApp() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsLoading(true)

    // Add user message with file info
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "user",
      content: `Uploaded: ${file.name}`,
      fileName: file.name,
      fileType: file.type,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])

    try {
      // Convert file to base64 for processing
      const base64 = await fileToBase64(file)

      // Simulate AI response (replace with actual AI integration)
      setTimeout(() => {
        const aiResponse: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: "assistant",
          content: getFileAnalysisResponse(file),
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, aiResponse])
        setIsLoading(false)
      }, 2000)
    } catch (error) {
      console.error("Error processing file:", error)
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: "Sorry, I encountered an error processing your file. Please try again.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
      setIsLoading(false)
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = (error) => reject(error)
    })
  }

  const getFileAnalysisResponse = (file: File): string => {
    const fileType = file.type
    const fileName = file.name
    const fileSize = (file.size / 1024).toFixed(2)

    if (fileType.startsWith("image/")) {
      return `I can see you've uploaded an image file "${fileName}" (${fileSize} KB). This appears to be a ${fileType.split("/")[1].toUpperCase()} image. To provide detailed analysis of the image content, I would need an AI integration like GPT-4 Vision or similar. Would you like me to help you set up an AI integration?`
    } else if (fileType === "application/pdf") {
      return `You've uploaded a PDF document "${fileName}" (${fileSize} KB). To analyze the content of this PDF, I would need an AI integration that can process documents. I can help you set up an integration like OpenAI's GPT-4 to read and analyze your PDF content.`
    } else if (fileType.startsWith("text/")) {
      return `I received your text file "${fileName}" (${fileSize} KB). To analyze the content of this text file, I would need an AI integration. Once connected, I could help you summarize, analyze, or answer questions about the text content.`
    } else {
      return `You've uploaded "${fileName}" (${fileSize} KB, ${fileType}). To properly analyze this file type, I would need an appropriate AI integration. Different file types may require different processing capabilities.`
    }
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) return <ImageIcon className="h-4 w-4" />
    if (fileType === "application/pdf" || fileType.startsWith("text/")) return <FileText className="h-4 w-4" />
    return <File className="h-4 w-4" />
  }

  const triggerFileUpload = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-foreground">File Chat AI</h1>
          <p className="text-muted-foreground">Upload files to chat with AI - no text input needed</p>
        </div>
      </header>
      <Linear/>

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
                    <h3 className="text-lg font-semibold mb-2">Upload a file to start chatting</h3>
                    <p className="text-muted-foreground mb-4">
                      I can analyze images, documents, text files, and more. Just drag and drop or click to upload.
                    </p>
                    <Button onClick={triggerFileUpload} className="gap-2">
                      <Upload className="h-4 w-4" />
                      Choose File
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn("flex gap-3", message.type === "user" ? "justify-end" : "justify-start")}
                    >
                      <div
                        className={cn(
                          "max-w-[80%] rounded-lg px-4 py-2",
                          message.type === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        {message.type === "user" && message.fileName && (
                          <div className="flex items-center gap-2 mb-1">
                            {getFileIcon(message.fileType || "")}
                            <span className="text-sm font-medium">{message.fileName}</span>
                          </div>
                        )}
                        <p className="text-sm leading-relaxed">{message.content}</p>
                        <p className="text-xs opacity-70 mt-1">{message.timestamp.toLocaleTimeString()}</p>
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
            <div
              className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
              onClick={triggerFileUpload}
              onDragOver={(e) => {
                e.preventDefault()
                e.currentTarget.classList.add("border-primary")
              }}
              onDragLeave={(e) => {
                e.preventDefault()
                e.currentTarget.classList.remove("border-primary")
              }}
              onDrop={(e) => {
                e.preventDefault()
                e.currentTarget.classList.remove("border-primary")
                const files = e.dataTransfer.files
                if (files.length > 0) {
                  const event = { target: { files } } as React.ChangeEvent<HTMLInputElement>
                  handleFileUpload(event)
                }
              }}
            >
              <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground mb-1">Drop your file here or click to browse</p>
              <p className="text-xs text-muted-foreground">Supports images, PDFs, text files, and more</p>
            </div>
            <input ref={fileInputRef} type="file" onChange={handleFileUpload} className="hidden" accept="*/*" />
          </div>
        </Card>
      </div>
    </div>
  )
}

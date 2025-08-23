import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

export interface Upload {
  _id: Id<"uploads">;
  filename: string;
  type: "image" | "pdf";
  size: string;
  status: "uploading" | "processing" | "parsed" | "error";
  progress: number;
  itemsExtracted: number;
  uploadedAt: number;
  error?: string;
  fileId?: Id<"_storage">;
}

export const useUploads = () => {
  const uploads = useQuery(api.uploads.getUploads) || [];
  const uploadStats = useQuery(api.uploads.getUploadStats);
  const createUploadMutation = useMutation(api.uploads.createUpload);
  const updateUploadMutation = useMutation(api.uploads.updateUpload);
  const deleteUploadMutation = useMutation(api.uploads.deleteUpload);
  const generateUploadUrlMutation = useMutation(
    api.fileStorage.generateUploadUrl
  );
  const processFileAction = useAction(api.fileProcessing.processFileWithGemini);
  const getFileUrlMutation = useMutation(api.fileStorage.getFileUrl);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const addUpload = async (file: File): Promise<Id<"uploads">> => {
    try {
      // Generate upload URL
      const uploadUrl = await generateUploadUrlMutation();

      // Create upload record
      const uploadId = await createUploadMutation({
        filename: file.name,
        type: file.type.startsWith("image/") ? "image" : "pdf",
        size: formatFileSize(file.size),
      });

      // Upload file to Convex storage
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!result.ok) {
        throw new Error(`Upload failed: ${result.statusText}`);
      }

      const { storageId } = await result.json();

      // Update upload record with file ID
      await updateUploadMutation({
        id: uploadId,
        progress: 100,
        status: "processing",
      });

      // Get file URL and process with Gemini
      const fileUrl = await getFileUrlMutation({ fileId: storageId });

      if (fileUrl) {
        // Process file with Gemini AI
        await processFileAction({
          uploadId,
          fileUrl,
          filename: file.name,
          fileType: file.type,
        });
      }

      return uploadId;
    } catch (error) {
      console.error("Error uploading file:", error);
      throw error;
    }
  };

  const removeUpload = async (uploadId: Id<"uploads">) => {
    await deleteUploadMutation({ id: uploadId });
  };

  return {
    uploads: uploads.map((upload) => ({
      ...upload,
      id: upload._id, // Add legacy id field for compatibility
    })),
    stats: uploadStats || {
      recentUploads: 0,
      successfulExtractions: 0,
      failedUploads: 0,
    },
    addUpload,
    removeUpload,
  };
};

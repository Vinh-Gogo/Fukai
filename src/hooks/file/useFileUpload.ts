import { useState, useCallback } from "react";

export interface UploadProgress {
  id: string;
  fileName: string;
  progress: number; // 0-100
  status: "uploading" | "completed" | "error";
  error?: string;
  size: string;
  file: File;
}

export const useFileUpload = () => {
  const [uploads, setUploads] = useState<UploadProgress[]>([]);

  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }, []);

  const simulateUpload = useCallback(
    async (file: File): Promise<UploadProgress> => {
      const uploadId = `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const upload: UploadProgress = {
        id: uploadId,
        fileName: file.name,
        progress: 0,
        status: "uploading",
        size: formatFileSize(file.size),
        file,
      };

      // Add to uploads list
      setUploads((prev) => [...prev, upload]);

      // Simulate upload progress
      return new Promise((resolve) => {
        let progress = 0;
        const interval = setInterval(
          () => {
            progress += Math.random() * 15; // Random progress increment

            if (progress >= 100) {
              progress = 100;
              clearInterval(interval);

              // Update to completed
              setUploads((prev) =>
                prev.map((u) =>
                  u.id === uploadId
                    ? { ...u, progress: 100, status: "completed" as const }
                    : u,
                ),
              );

              resolve({ ...upload, progress: 100, status: "completed" });
            } else {
              // Update progress
              setUploads((prev) =>
                prev.map((u) =>
                  u.id === uploadId
                    ? { ...u, progress: Math.round(progress) }
                    : u,
                ),
              );
            }
          },
          200 + Math.random() * 300,
        ); // Random interval between 200-500ms
      });
    },
    [formatFileSize],
  );

  const uploadFiles = useCallback(
    async (files: File[]) => {
      const uploadPromises = files.map((file) => simulateUpload(file));

      try {
        const results = await Promise.allSettled(uploadPromises);

        // Clean up completed uploads after 3 seconds
        setTimeout(() => {
          setUploads((prev) => prev.filter((u) => u.status !== "completed"));
        }, 3000);

        return results;
      } catch (error) {
        console.error("Upload error:", error);
        return [];
      }
    },
    [simulateUpload],
  );

  const cancelUpload = useCallback((uploadId: string) => {
    setUploads((prev) => prev.filter((u) => u.id !== uploadId));
  }, []);

  const clearCompletedUploads = useCallback(() => {
    setUploads((prev) => prev.filter((u) => u.status !== "completed"));
  }, []);

  return {
    uploads,
    uploadFiles,
    cancelUpload,
    clearCompletedUploads,
    formatFileSize,
  };
};

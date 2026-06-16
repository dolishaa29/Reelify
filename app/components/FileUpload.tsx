"use client";

import {
  upload,
  ImageKitAbortError,
  ImageKitInvalidRequestError,
  ImageKitServerError,
  ImageKitUploadNetworkError,
} from "@imagekit/next";
import type { UploadResponse } from "@imagekit/next";
import { useRef, useState } from "react";

interface FileUploadProps {
  onSuccess: (res: UploadResponse) => void;
  onProgress?: (progress: number) => void;
  fileType?: "image" | "video";
}

const FileUpload = ({ onSuccess, onProgress, fileType = "video" }: FileUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // AbortController lets us cancel an in-progress upload (e.g. on unmount).
  const abortController = useRef<AbortController | null>(null);

  const validateFile = (file: File) => {
    if (fileType === "video") {
      if (!file.type.startsWith("video/")) {
        setError("Please upload a valid video file");
        return false;
      }
    } else {
      if (!file.type.startsWith("image/")) {
        setError("Please upload a valid image file");
        return false;
      }
    }

    if (file.size > 100 * 1024 * 1024) {
      setError("File size must be less than 100MB");
      return false;
    }

    return true;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !validateFile(file)) return;

    setUploading(true);
    setError(null);

    try {
      // Get a fresh signature/token/expire from our server before every upload.
      const authRes = await fetch("/api/imagekit-auth");
      if (!authRes.ok) {
        throw new Error("Failed to fetch upload auth params");
      }
      const auth = await authRes.json();

      abortController.current = new AbortController();

      const res = await upload({
        file,
        fileName: file.name,
        publicKey: auth.publicKey,
        signature: auth.signature,
        expire: auth.expire,
        token: auth.token,
        abortSignal: abortController.current.signal,
        onProgress: (event) => {
          if (onProgress && event.lengthComputable) {
            const percent = (event.loaded / event.total) * 100;
            onProgress(Math.round(percent));
          }
        },
      });

      onSuccess(res);
    } catch (error) {
      if (error instanceof ImageKitAbortError) {
        setError("Upload aborted");
      } else if (error instanceof ImageKitInvalidRequestError) {
        setError(error.message || "Invalid upload request");
      } else if (error instanceof ImageKitServerError) {
        setError(error.message || "ImageKit server error");
      } else if (error instanceof ImageKitUploadNetworkError) {
        setError("Network error during upload");
      } else {
        setError("Something went wrong while uploading");
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <input
        type="file"
        accept={fileType === "video" ? "video/*" : "image/*"}
        onChange={handleFileChange}
        disabled={uploading}
        className="text-sm text-zinc-700 dark:text-zinc-300"
      />
      {uploading && (
        <span className="text-sm text-zinc-500 dark:text-zinc-400">Uploading...</span>
      )}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
};

export default FileUpload;

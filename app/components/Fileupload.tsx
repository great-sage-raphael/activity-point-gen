"use client";
import React, { useState, useEffect } from "react";
import { FileUpload } from "./ui/file-upload";
import axios from "axios";

interface UploadState {
  uploading: boolean;
  progress: number;
  error: string | null;
  success: boolean;
}

export function FileUploadComponent() {
  const [files, setFiles] = useState<File[]>([]);
  const [uploadState, setUploadState] = useState<UploadState>({
    uploading: false,
    progress: 0,
    error: null,
    success: false,
  });

  const handleFileUpload = (newFiles: File[]) => {
    setFiles(newFiles);
  };

  useEffect(() => {
    const uploadFiles = async () => {
      if (files.length === 0) return;

      setUploadState({
        uploading: true,
        progress: 0,
        error: null,
        success: false,
      });

      try {
        const formData = new FormData();
        files.forEach((file, index) => {
          formData.append(`file${index}`, file);
        });

        const response = await axios.post('/your-upload-url', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const progress = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              setUploadState(prev => ({
                ...prev,
                progress,
              }));
            }
          },
        });

        setUploadState(prev => ({
          ...prev,
          uploading: false,
          success: true,
          error: null,
        }));

        // Optional: Clear files after successful upload
        setFiles([]);

      } catch (error) {
        setUploadState(prev => ({
          ...prev,
          uploading: false,
          error: error instanceof Error ? error.message : 'Upload failed',
          success: false,
        }));
      }
    };

    uploadFiles();
  }, [files]);

  return (
    <div className="w-full max-w-4xl mx-auto min-h-96 border border-dashed bg-white dark:bg-[#866ec7] border-neutral-200 dark:border-[#8160dd] rounded-lg">
      <div className="p-6">
        <FileUpload 
          onChange={handleFileUpload} 
        />

        {/* Upload Progress */}
        {uploadState.uploading && (
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-[#866ec7] h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${uploadState.progress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
              Uploading: {uploadState.progress}%
            </p>
          </div>
        )}

        {/* Success Message */}
        {uploadState.success && (
          <div className="mt-4 p-4 bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-100 rounded-lg">
            Files uploaded successfully!
          </div>
        )}

        {/* Error Message */}
        {uploadState.error && (
          <div className="mt-4 p-4 bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-100 rounded-lg">
            Error: {uploadState.error}
          </div>
        )}

        {/* File List */}
        {files.length > 0 && !uploadState.success && (
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200">
              Selected Files:
            </h3>
            <ul className="mt-2 space-y-2">
              {files.map((file, index) => (
                <li 
                  key={index}
                  className="text-sm text-gray-600 dark:text-gray-300"
                >
                  {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
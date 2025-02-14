"use client";
import React, { useState } from "react";
import { FileUpload } from "./ui/file-upload";


export function FileUploadcomponent() {
  const [files, setFiles] = useState<File[]>([]);
  const handleFileUpload = (files: File[]) => {
    setFiles(files);
    console.log(files);
  };

  return (
    <div className="w-full max-w-4xl mx-auto min-h-96 border border-dashed bg-white dark:bg-[#866ec7] border-neutral-200 dark:border-[#8160dd] rounded-lg">
      <FileUpload onChange={handleFileUpload} />
    </div>
  );
}

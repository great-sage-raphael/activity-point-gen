"use client";

import { useState, ChangeEvent } from "react";
import { Upload, AlertCircle, CheckCircle, X } from "lucide-react";
import Image from "next/image";

interface ExtractedData {
  certificateName: string;
  participantName: string;
  certificateType: string;
  issuer: string;
  dateOfIssue: string;
  fileObject: File;
}

interface CertificateUploadProps {
  onDataExtracted: (data: ExtractedData) => void;
}

type UploadStatus = 'success' | 'error' | 'extracting' | null;

export const CertificateUploadComponent = ({ onDataExtracted }: CertificateUploadProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>(null);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Check file type
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!validTypes.includes(selectedFile.type)) {
      setUploadStatus('error');
      setStatusMessage("Please upload a valid certificate (PDF, JPG, PNG)");
      return;
    }

    // Check file size (max 5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      setUploadStatus('error');
      setStatusMessage("File size should be less than 5MB");
      return;
    }

    setFile(selectedFile);
    setUploadStatus(null);
    setStatusMessage("");

    // Create preview for images
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setPreviewUrl(e.target?.result as string);
      reader.readAsDataURL(selectedFile);
    } else {
      setPreviewUrl('/pdf-icon.png');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setUploadStatus('error');
      setStatusMessage("Please select a file first");
      return;
    }

    setIsUploading(true);
    setUploadStatus('extracting');
    setStatusMessage("Extracting certificate information...");

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('http://localhost:5001/api/v1/extract', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.status === 'success') {
        setUploadStatus('success');
        setStatusMessage("Certificate information extracted successfully!");
        
        onDataExtracted({
          certificateName: result.data.certificate_name,
          participantName: result.data.participant_name,
          certificateType: result.data.certificate_type,
          issuer: result.data.issuer,
          dateOfIssue: result.data.date_of_issue,
          fileObject: file
        });
      } else {
        setUploadStatus('error');
        setStatusMessage(result.message || "Failed to extract certificate information");
      }
    } catch (error) {
      console.error("Error uploading certificate:", error);
      setUploadStatus('error');
      setStatusMessage("Network error. Please try again later.");
    } finally {
      setIsUploading(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setPreviewUrl(null);
    setUploadStatus(null);
    setStatusMessage("");
  };

  return (
    <div className="w-full">
      <label className="block text-gray-700 text-sm font-bold mb-2">
        Upload Certificate
      </label>
      
      {/* File Drop Area */}
      <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md relative">
        <div className="space-y-1 text-center">
          {!previewUrl ? (
            <>
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="flex text-sm text-gray-600">
                <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-[#7469B6] hover:text-[#AD88C6]">
                  <span>Upload a file</span>
                  <input 
                    id="file-upload" 
                    name="file-upload" 
                    type="file" 
                    className="sr-only"
                    onChange={handleFileChange}
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500">
                PDF, PNG, JPG up to 5MB
              </p>
            </>
          ) : (
            <div className="relative">
             {file && file.type.startsWith('image/') ? (
     <Image
     src={previewUrl} 
     alt="Certificate preview" 
     className="max-h-48 mx-auto" 
     width={500} 
     height={300} 
     unoptimized
   />
         ) : file ? (
             <div className="flex flex-col items-center">
            <Image 
          src="/pdf-icon.png" 
          alt="PDF file" 
          width={64} 
          height={64} 
          className="h-16 w-16"
        />
              <p className="text-sm mt-2">{file.name}</p>
             </div>
         ) : null}
              <button 
                onClick={clearFile}
                className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
              >
                <X size={16} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Status Message */}
      {statusMessage && (
        <div className={`mt-2 text-sm flex items-center ${
          uploadStatus === 'error' ? 'text-red-600' : 
          uploadStatus === 'success' ? 'text-green-600' : 
          'text-blue-600'
        }`}>
          {uploadStatus === 'error' && <AlertCircle size={16} className="mr-1" />}
          {uploadStatus === 'success' && <CheckCircle size={16} className="mr-1" />}
          {statusMessage}
        </div>
      )}

      {/* Upload Button */}
      {file && !uploadStatus && (
        <button
          type="button"
          onClick={handleUpload}
          disabled={isUploading}
          className="mt-4 bg-[#7469B6] text-white py-2 px-4 rounded-lg hover:bg-[#AD88C6] transition-colors"
        >
          {isUploading ? "Processing..." : "Extract Certificate Data"}
        </button>
      )}
    </div>
  );
};
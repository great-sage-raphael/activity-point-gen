"use client";

import { useState, useEffect, ChangeEvent, FormEvent } from "react";

// Define types for your form data and props
interface FormData {
  certificateName: string;
  certificateType: string;
  issuer: string;
  dateOfIssue: string;
  description: string;
  fileObject: any; // Consider using a more specific type if possible
}

interface ExtractedData {
  certificateName: string;
  certificateType: string;
  issuer: string;
  dateOfIssue: string;
  fileObject: any;
  [key: string]: any;
}

interface CertificateFormProps {
  extractedData: ExtractedData;
  onSubmit: (data: FormData) => void;
}

type FieldName = 'certificateName' | 'certificateType' | 'issuer' | 'dateOfIssue';

export const CertificateForm = ({ extractedData, onSubmit }: CertificateFormProps) => {
  const [formData, setFormData] = useState<FormData>({
    certificateName: "",
    certificateType: "",
    issuer: "",
    dateOfIssue: "",
    description: "",
    fileObject: null
  });

  const [missingFields, setMissingFields] = useState<FieldName[]>([]);

  useEffect(() => {
    if (extractedData) {
      // Populate form with extracted data
      const newFormData = {
        certificateName: extractedData.certificateName !== "Not Found" ? extractedData.certificateName : "",
        certificateType: extractedData.certificateType !== "Not Found" ? extractedData.certificateType : "",
        issuer: extractedData.issuer !== "Not Found" ? extractedData.issuer : "",
        dateOfIssue: extractedData.dateOfIssue !== "Not Found" ? extractedData.dateOfIssue : "",
        description: "",
        fileObject: extractedData.fileObject
      };
      
      setFormData(newFormData);
      
      // Check for missing required fields
      const missing: FieldName[] = [];
      if (newFormData.certificateName === "") missing.push("certificateName");
      if (newFormData.certificateType === "") missing.push("certificateType");
      if (newFormData.issuer === "") missing.push("issuer");
      if (newFormData.dateOfIssue === "") missing.push("dateOfIssue");
      
      setMissingFields(missing);
    }
  }, [extractedData]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Remove field from missing fields if it's filled
    if (value.trim() !== "" && (name === "certificateName" || name === "certificateType" || name === "issuer" || name === "dateOfIssue")) {
      setMissingFields(prev => prev.filter(field => field !== name));
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Check if all required fields are filled
    if (missingFields.length > 0) {
      alert("Please fill in all required fields");
      return;
    }
    
    // Pass data to parent component
    onSubmit(formData);
  };

  const certificateTypes = [
    "MOOC", "Internship", "Workshop", "Paper Presentation", 
    "Tech Fest", "Sports Event", "Participation", "Completion", 
    "Achievement", "Appreciation", "Other"
  ];

  // Add readable names for form fields
  const fieldNames: Record<FieldName, string> = {
    certificateName: "Certificate Name",
    certificateType: "Certificate Type",
    issuer: "Issuer",
    dateOfIssue: "Date of Issue"
  };

  return (
    <div className="w-full mt-6">
      {missingFields.length > 0 && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-yellow-700 font-medium">
            Please fill in the following missing information:
          </p>
          <ul className="list-disc pl-5 mt-1">
            {missingFields.map(field => (
              <li key={field} className="text-yellow-600">
                {fieldNames[field]}
              </li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Certificate Name*
            </label>
            <input
              type="text"
              name="certificateName"
              value={formData.certificateName}
              onChange={handleInputChange}
              className={`shadow appearance-none border ${
                missingFields.includes("certificateName") ? "border-red-500" : "border-gray-300"
              } rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-[#7469B6]`}
              placeholder="Enter certificate name"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Certificate Type*
            </label>
            <select
              name="certificateType"
              value={formData.certificateType}
              onChange={handleInputChange}
              className={`shadow appearance-none border ${
                missingFields.includes("certificateType") ? "border-red-500" : "border-gray-300"
              } rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-[#7469B6]`}
              required
            >
              <option value="">Select certificate type</option>
              {certificateTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Issuer*
            </label>
            <input
              type="text"
              name="issuer"
              value={formData.issuer}
              onChange={handleInputChange}
              className={`shadow appearance-none border ${
                missingFields.includes("issuer") ? "border-red-500" : "border-gray-300"
              } rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-[#7469B6]`}
              placeholder="Enter issuer name"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Date of Issue*
            </label>
            <input
              type="text"
              name="dateOfIssue"
              value={formData.dateOfIssue}
              onChange={handleInputChange}
              className={`shadow appearance-none border ${
                missingFields.includes("dateOfIssue") ? "border-red-500" : "border-gray-300"
              } rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-[#7469B6]`}
              placeholder="Enter date of issue (e.g., 01/01/2023)"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="shadow appearance-none border border-gray-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-[#7469B6]"
              placeholder="Enter additional details about your certificate"
              rows={3}
            />
          </div>

          <button
            type="submit"
            className="w-full bg-[#7469B6] text-white py-2 px-4 rounded-lg hover:bg-[#AD88C6] transition-colors"
          >
            Submit Certificate
          </button>
        </div>
      </form>
    </div>
  );
};
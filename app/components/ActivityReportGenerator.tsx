"use client";
import React, { useState, useEffect } from 'react';
import { FileText } from 'lucide-react';
import Section from "@/app/components/Section";
import supabase from '@/lib/supabase';

interface Student {
  id: string;
  email?: string;
  name?: string;
  student_name?: string;
}

type SortOrder = 'asc' | 'desc';

export default function ActivityReportGenerator() {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [fromYear, setFromYear] = useState<string>('2024');
  const [toYear, setToYear] = useState<string>('2024');

  // Fetch students when component mounts
  useEffect(() => {
    async function fetchStudents() {
      try {
        setIsLoading(true);
        setError(null);
        
        const { data: studentProfiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, role, student_name')
          .eq('role', 'student');
        
        if (profilesError) {
          console.error('Error fetching student profiles:', profilesError);
          setError('Failed to load students. Please try again.');
          return;
        }
        
        if (!studentProfiles || studentProfiles.length === 0) {
          return;
        }
        
        const studentData = studentProfiles.map(profile => ({
          id: profile.id,
          student_name: profile.student_name,
          name: profile.student_name
        }));
        
        setStudents(studentData);
      } catch (error) {
        console.error('Error in fetchStudents:', error);
        setError('An unexpected error occurred. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchStudents();
  }, []);

  // Handle generating the Excel report
  const generateReport = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Build the URL with query params
      let url = '/api/generate-excel';
      const params = new URLSearchParams();
      
      if (selectedStudent) {
        params.append('studentId', selectedStudent);
      }
      
      params.append('sortBy', sortBy);
      params.append('sortOrder', sortOrder);
      params.append('fromYear', fromYear);
      params.append('toYear', toYear);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      // Use fetch API for better error handling
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }
      });
      
      if (!response.ok) {
        // Try to get error message from response
        let errorMessage = 'Failed to generate report';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // If parsing fails, use status text
          errorMessage = `${errorMessage}: ${response.statusText}`;
          console.error('Error parsing response:', e);
        }
        throw new Error(errorMessage);
      }
      
      // Get the blob from the response
      const blob = await response.blob();
      
      // Create a URL for the blob
      const downloadUrl = window.URL.createObjectURL(blob);
      
      // Extract filename from Content-Disposition if available
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'activity-report.xlsx';
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename=([^;]+)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/["']/g, '');
        }
      }
      
      // Create and click a download link
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
      }, 100);
      
    } catch (error : any) {
      console.error('Error generating report:', error);
      setError(error.message || 'Failed to generate the report. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Get display name for a student
  const getStudentDisplayName = (student: Student) => {
    return student.student_name || student.name || student.email || `Student ID: ${student.id}`;
  };

  if (isLoading && students.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-[#7469B6] text-xl">Loading students...</div>
      </div>
    );
  }

  return (
    <Section title="Generate Activity Report">
      <div className="bg-white rounded-lg shadow-md p-6">
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        
        <div className="mb-4">
          <label htmlFor="student-select" className="block text-sm font-medium text-gray-800 mb-1">
            Select Student (optional)
          </label>
          <select
            id="student-select"
            className="w-full p-2 border border-gray-300 text-gray-600 rounded-md focus:ring-[#7469B6] focus:border-[#7469B6]"
            value={selectedStudent}
            onChange={(e) => setSelectedStudent(e.target.value)}
          >
            <option value="">All Students</option>
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {getStudentDisplayName(student)}
              </option>
            ))}
          </select>
        </div>
        
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="sort-by" className="block text-sm font-medium text-gray-700 mb-1">
              Sort By
            </label>
            <select
              id="sort-by"
              className="w-full p-2 border text-gray-600 border-gray-300 rounded-md focus:ring-[#7469B6] focus:border-[#7469B6]"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="date">Date</option>
              <option value="activity_name">Activity Name</option>
              <option value="points">Points</option>
              <option value="certificate_type">Certificate Type</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="sort-order" className="block text-sm font-medium text-gray-700 mb-1">
              Sort Order
            </label>
            <select
              id="sort-order"
              className="w-full p-2 border text-gray-600 border-gray-300 rounded-md focus:ring-[#7469B6] focus:border-[#7469B6]"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as SortOrder)}
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="from-year" className="block text-sm font-medium text-gray-700 mb-1">
              From Year
            </label>
            <input
              id="from-year"
              type="number"
              className="w-full p-2 border text-gray-600 border-gray-300 rounded-md focus:ring-[#7469B6] focus:border-[#7469B6]"
              value={fromYear}
              onChange={(e) => setFromYear(e.target.value)}
              min="2000"
              max="2100"
            />
          </div>
          
          <div>
            <label htmlFor="to-year" className="block text-sm font-medium text-gray-700 mb-1">
              To Year
            </label>
            <input
              id="to-year"
              type="number"
              className="w-full p-2 border text-gray-600 border-gray-300 rounded-md focus:ring-[#7469B6] focus:border-[#7469B6]"
              value={toYear}
              onChange={(e) => setToYear(e.target.value)}
              min="2000"
              max="2100"
            />
          </div>
        </div>
        
        <button
          onClick={generateReport}
          disabled={isLoading}
          className="w-full bg-[#7469B6] hover:bg-[#5D5494] text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#AD88C6] transition-colors flex justify-center items-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
              <span>Generating...</span>
            </>
          ) : (
            <>
              <FileText size={20} />
              <span>Generate Excel Report</span>
            </>
          )}
        </button>
        
        <p className="mt-4 text-sm text-gray-600">
          {`This will generate a report ${selectedStudent ? 'for the selected student' : 'for all students'}, 
           sorted by ${sortBy.replace('_', ' ')} in ${sortOrder === 'asc' ? 'ascending' : 'descending'} order 
           from ${fromYear} to ${toYear}.`}
        </p>
      </div>
    </Section>
  );
}
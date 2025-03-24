"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import supabase from "@/lib/supabase";
import { Activity, Award, Book, Calendar } from "lucide-react";
import { CertificateUploadComponent } from "@/app/components/CertificateUploadComponent";
import { CertificateForm } from "@/app/components/CertificateForm";


// Define interfaces for data types
interface UserData {
  class_name: string;
  role: string;
  student_name: string;
}

interface ActivityData {
  id: number;
  activity_name: string;
  date: string;
  points: number;
  status: string;
}

// Define interface for extracted data
interface ExtractedData {
  certificateName: string;
  certificateType: string;
  issuer: string;
  dateOfIssue: string;
  fileObject: File | null;
  [key: string]: any;
}

// Define certificate types and points mapping
type CertificateType = 
  | "MOOC" 
  | "Internship" 
  | "Workshop" 
  | "Paper Presentation" 
  | "Tech Fest" 
  | "Sports Event" 
  | "Participation" 
  | "Completion" 
  | "Achievement" 
  | "Appreciation" 
  | "Other";

const StudentDashboard = () => {
  const params = useParams();
  const router = useRouter();
  const userId = params?.id as string; // Get user ID from URL

  const [userData, setUserData] = useState<UserData | null>(null);
  const [activities, setActivities] = useState<ActivityData[]>([]);
  
  // Certificate upload state
  const [showCertificateForm, setShowCertificateForm] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  

  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("class_name, role, student_name")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Error fetching user data:", error.message);
      } else {
        setUserData(data);
      }
    };

    const fetchActivities = async () => {
      const { data, error } = await supabase
        .from("activities")
        .select("id, activity_name, date, points, status")
        .eq("user_id", userId);
    
      if (error) {
        console.error("Error fetching activities:", error.message);
      } else {
        setActivities(data);
      }
    };
    
    fetchUserData();
    fetchActivities();
  }, [userId]);

  // Handle certificate data extraction
  const handleDataExtracted = (data: ExtractedData) => {
    setExtractedData(data);
    setShowCertificateForm(true);
  };

  // Handle form submission
  const handleFormSubmit = async (formData: any) => {
    if (!userId) return;
    
    
    try {
      // First upload the certificate file to storage
      let fileUrl = "";
      if (formData.fileObject) {
        const fileExt = formData.fileObject.name.split('.').pop();
        const fileName = `${userId}_${Date.now()}.${fileExt}`;
        const filePath = `certificates/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('autopint_files')
          .upload(filePath, formData.fileObject);
          
        if (uploadError) {
          throw new Error(`Error uploading file: ${uploadError.message}`);
        }
        
        const { data } = supabase.storage
          .from('autopint_files')
          .getPublicUrl(filePath);
          
        fileUrl = data.publicUrl;
      }
      
      // Then create activity record
      const { error } = await supabase.from("activities").insert([
        {
          user_id: userId,
          activity_name: formData.certificateName,
          certificate_type: formData.certificateType,
          issuer: formData.issuer,
          date: formData.dateOfIssue,
          points: calculatePoints(formData.certificateType as CertificateType),
          status: "pending",
          description: formData.description,
          file_url: fileUrl,
        },
      ]);
      
      if (error) {
        throw new Error(`Error submitting activity: ${error.message}`);
      }
      
      // Refresh activities
      const { data, error: fetchError } = await supabase
        .from("activities")
        .select("id, activity_name, date, points, status")
        .eq("user_id", userId);
        
      if (!fetchError) {
        setActivities(data);
      }
      
      // Reset form state
      setExtractedData(null);
      setShowCertificateForm(false);
      
      alert("Certificate submitted successfully!");
    } catch (error: any) {
      console.error("Error:", error.message);
      alert(`Failed to submit certificate: ${error.message}`);
    } finally {
      
    }
  };
  
  // Calculate points based on certificate type
  const calculatePoints = (certificateType: CertificateType): number => {
    const pointsMap: Record<CertificateType, number> = {
      "MOOC": 15,
      "Internship": 30,
      "Workshop": 10,
      "Paper Presentation": 25,
      "Tech Fest": 20,
      "Sports Event": 15,
      "Participation": 5,
      "Completion": 10,
      "Achievement": 20,
      "Appreciation": 10,
      "Other": 5
    };
    
    return pointsMap[certificateType] || 5;
  };

  // Handle Logout
  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      router.push("/");
    } else {
      console.error("Sign out error:", error.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFE6E6]">
      {/* Header */}
      <header className="bg-[#7469B6] text-white py-4">
        <div className="container mx-auto px-6 bg-[#7469B6]">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Student Dashboard</h1>
            <button onClick={handleSignOut} className="bg-[#AD88C6] px-4 py-2 rounded-lg hover:bg-[#E1AFD1] transition-colors">
              Sign Out
            </button>
          </div>
        </div>
        <div>
          {userData && (
            <div className="container mx-auto px-6 mt-4 rounded-md bg-[#a69be2]">
              <p className="text-lg">
                <span className="font-semibold">Name:</span> {userData.student_name}
              </p>
              <p className="text-lg">
                <span className="font-semibold">Class:</span> {userData.class_name}
              </p>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[#7469B6]">Total Points</h3>
              <Award className="h-6 w-6 text-[#7469B6]" />
            </div>
            <p className="text-3xl font-bold text-[#7469B6]">
              {activities.reduce((total, act) => total + act.points, 0)}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[#7469B6]">Activities</h3>
              <Activity className="h-6 w-6 text-[#7469B6]" />
            </div>
            <p className="text-3xl font-bold text-[#7469B6]">{activities.length}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[#7469B6]">Pending</h3>
              <Calendar className="h-6 w-6 text-[#7469B6]" />
            </div>
            <p className="text-3xl font-bold text-[#7469B6]">
              {activities.filter((act) => act.status === "pending").length}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[#7469B6]">Approved</h3>
              <Book className="h-6 w-6 text-[#7469B6]" />
            </div>
            <p className="text-3xl font-bold text-[#7469B6]">
              {activities.filter((act) => act.status === "approved").length}
            </p>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-[#7469B6] mb-6">Recent Activities</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-4 text-gray-800">Activity</th>
                  <th className="text-left py-3 px-4 text-gray-800">Date</th>
                  <th className="text-left py-3 px-4 text-gray-800">Points</th>
                  <th className="text-left py-3 px-4 text-gray-800">Status</th>
                </tr>
              </thead>  
              <tbody>
                {activities.length > 0 ? (
                  activities.map((activity) => (
                    <tr key={activity.id} className="border-b border-gray-100">
                      <td className="py-3 px-4 text-gray-800">{activity.activity_name}</td>
                      <td className="py-3 px-4 text-gray-800">{activity.date}</td>
                      <td className="py-3 px-4 text-gray-800">{activity.points}</td>
                      <td className="py-3 px-4 text-gray-800">
                        <span className={`px-2 py-1 rounded-full text-sm ${
                          activity.status === "Approved" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                        }`}>
                          {activity.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-gray-800">
                      No activities found. Upload your first certificate below!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Upload Certificate Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-[#7469B6] mb-6">Upload Certificate</h2>
          
          {!showCertificateForm ? (
            <CertificateUploadComponent onDataExtracted={handleDataExtracted} />
          ) : (
            <div>
              <CertificateForm 
                extractedData={extractedData as ExtractedData} 
                onSubmit={handleFormSubmit} 
              />
              <button 
                onClick={() => setShowCertificateForm(false)}
                className="mt-4 text-[#7469B6] hover:text-[#AD88C6]"
              >
                ← Back to upload
              </button>
            </div>
          )}
        </div>
      </main>
            
    </div>
  );
};

export default StudentDashboard;
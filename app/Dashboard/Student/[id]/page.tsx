"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import supabase from "@/lib/supabase";
import { Activity, Award, Book, Calendar } from "lucide-react";
import { FileUploadComponent } from "@/app/components/Fileupload";


const StudentDashboard = () => {
  const params = useParams();
  const router = useRouter();
  const userId = params?.id as string; // Get user ID from URL

  const [userData, setUserData] = useState<{ class_name: string; role: string; student_name: string } | null>(null);
  const [activities, setActivities] = useState<
    { id: number; name: string; date: string; points: number; status: string }[]
  >([]);
  
  const [formData, setFormData] = useState({
    activityType: "",
    date: "",                   //{ nameof ceritificate , type ,who issue ,time issued,}
    description: "",
    file: "",
    
  });

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
        .select("id, name, date, points, status")
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

  // Handle Form Input Changes
  const handleInputChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

                  // Handle Form Submission
                const handleSubmit = async (e: React.FormEvent) => {
                e.preventDefault();
                const nowdate=Date.now()
                 if (!userId) return;
                   
                 const { error } = await supabase.from("activities").insert([
                    {
                      id: userId,
                      activity_name: formData.activityType,
                      date: formData.date,
                      points: 10, 
                      status: "pending",
                      description: formData.description,
                      file_url: formData.file,
                    },
                 ]);
                

                    if (error) {
                      console.error("Error submitting activity:", error.message);
                    } else {
                      alert("Activity submitted successfully!");
                      setFormData({ activityType: "Workshop", date:`${nowdate}`, description: "", file: "" });
                    }
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
        <div className="container mx-auto px-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Student Dashboard</h1>
            <button onClick={handleSignOut} className="bg-[#AD88C6] px-4 py-2 rounded-lg hover:bg-[#E1AFD1] transition-colors">
              Sign Out
            </button>
          </div>
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
              {activities.filter((act) => act.status === "Pending").length}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[#7469B6]">Approved</h3>
              <Book className="h-6 w-6 text-[#7469B6]" />
            </div>
            <p className="text-3xl font-bold text-[#7469B6]">
              {activities.filter((act) => act.status === "Approved").length}
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
                  <th className="text-left py-3 px-4">Activity</th>
                  <th className="text-left py-3 px-4">Date</th>
                  <th className="text-left py-3 px-4">Points</th>
                  <th className="text-left py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {activities.map((activity) => (
                  <tr key={activity.id} className="border-b border-gray-100">
                    <td className="py-3 px-4">{activity.name}</td>
                    <td className="py-3 px-4">{activity.date}</td>
                    <td className="py-3 px-4">{activity.points}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-sm ${
                        activity.status === "Approved" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                      }`}>
                        {activity.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Upload Activity Form */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-[#7469B6] mb-6">Upload New Activity</h2>
          <form onSubmit={handleSubmit}>
            <div className="py-3">
            <FileUploadComponent />
            </div>
           <div className="flex justify-center">
           <button type="submit" className="w-1/2  bg-[#7469B6] text-white py-2 px-4 rounded-lg">
              Submit Activity
            </button>
           </div>
           
          </form>
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;
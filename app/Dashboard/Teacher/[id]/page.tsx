"use client";
import React, { useState, useEffect } from "react";
import { Users, CheckCircle, XCircle, Clock, Award, FileText, Edit, Eye, ArrowLeft } from "lucide-react";
import supabase from "@/lib/supabase";
import Table from "@/app/components/Table";
import StatCard from "@/app/components/StatCard";
import Section from "@/app/components/Section";
import { useRouter } from "next/navigation";

interface Student {
  id: string;
  student_name: string;
  total_activities: number;
  total_points: number;
  status: string;
}

interface Activity {
  id: string;
  user_id?: string;
  student_name?: string;
  activity_name: string;
  date: string;
  points: number;
  status: string;
  file_url?: string; // Changed from certificate_url to file_url to match DB schema
}

interface Stats {
  totalStudents: number;
  pendingReview: number;
  approved: number;
  rejected: number;
}

export default function TeacherDashboard() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [pendingActivities, setPendingActivities] = useState<Activity[]>([]);
  const [allActivities, setAllActivities] = useState<Activity[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentActivities, setStudentActivities] = useState<Activity[]>([]);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [stats, setStats] = useState<Stats>({
    totalStudents: 0,
    pendingReview: 0,
    approved: 0,
    rejected: 0,
  });
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [teacherName, setTeacherName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState<"dashboard" | "student-details">("dashboard");

  useEffect(() => {
    fetchTeacherData();
  }, []);

  const fetchTeacherData = async () => {
    try {
      setIsLoading(true);
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error("Error fetching user:", userError);
        router.push('/');
        return;
      }

      if (!userData?.user?.id) {
        console.error("No user found");
        router.push('/');
        return;
      }

      const { data: teacherData, error: teacherError } = await supabase
        .from("teachers")
        .select("id, name")
        .eq("id", userData.user.id)
        .single();

      if (teacherError) {
        console.error("Error fetching teacher data:", teacherError);
        router.push('/');
        return;
      }

      if (!teacherData) {
        console.error("No teacher data found");
        router.push('/');
        return;
      }

      setTeacherId(teacherData.id);
      setTeacherName(teacherData.name);

      await Promise.all([
        fetchStats(teacherData.id),
        fetchStudents(teacherData.id),
        fetchPendingActivities(teacherData.id),
        fetchAllActivities(teacherData.id)
      ]);

    } catch (error) {
      console.error("Unexpected error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async (teacherId: string) => {
    if (!teacherId) return;

    try {
      // First, get all student profiles for this teacher
      const { data: studentProfiles, error: studentError } = await supabase
        .from("profiles")
        .select("id")
        .eq("teacher", teacherId)
        .eq("role", "student");

      if (studentError) {
        console.error("Error fetching student profiles for stats:", studentError);
        return;
      }

      // If no students, set zeroes and return
      if (!studentProfiles || studentProfiles.length === 0) {
        setStats({
          totalStudents: 0,
          pendingReview: 0,
          approved: 0,
          rejected: 0,
        });
        return;
      }

      // Extract student IDs
      const studentIds = studentProfiles.map(profile => profile.id);

      // Now count activities based on these student IDs
      const [
        { count: totalStudents },
        { count: pendingReview },
        { count: approved },
        { count: rejected }
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("teacher", teacherId)
          .eq("role", "student"),
        supabase
          .from("activities")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending")
          .in("user_id", studentIds),
        supabase
          .from("activities")
          .select("*", { count: "exact", head: true })
          .eq("status", "approved")
          .in("user_id", studentIds),
        supabase
          .from("activities")
          .select("*", { count: "exact", head: true })
          .eq("status", "rejected")
          .in("user_id", studentIds)
      ]);

      setStats({
        totalStudents: totalStudents || 0,
        pendingReview: pendingReview || 0,
        approved: approved || 0,
        rejected: rejected || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchStudents = async (teacherId: string) => {
    if (!teacherId) return;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, student_name, total_activities, total_points, status")
        .eq("teacher", teacherId)
        .eq("role", "student");

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error("Error fetching students:", error);
    }
  };

  const fetchPendingActivities = async (teacherId: string) => {
    if (!teacherId) return;
  
    try {
      // First, get all student profiles IDs for this teacher
      const { data: studentProfiles, error: studentError } = await supabase
        .from("profiles")
        .select("id")
        .eq("teacher", teacherId)
        .eq("role", "student");
  
      if (studentError) {
        console.error("Error fetching student profiles:", studentError);
        return;
      }
      
      // If no students found, set empty array and return
      if (!studentProfiles || studentProfiles.length === 0) {
        console.log("No students found for this teacher");
        setPendingActivities([]);
        return;
      }
  
      // Extract the student IDs into a simple array
      const studentIds = studentProfiles.map(profile => profile.id);
      
      // Now fetch activities where user_id is in the list of student IDs
      // and status is pending
      const { data: activities, error: activitiesError } = await supabase
        .from("activities")
        .select("id, user_id, activity_name, date, points, status, file_url")
        .in("user_id", studentIds)
        .eq("status", "pending");
  
      if (activitiesError) {
        console.error("Error fetching pending activities:", activitiesError);
        return;
      }
      
      // We need to get the student names for these activities
      if (activities && activities.length > 0) {
        // Create a map of user_ids to activities for easy lookup
        const userIdToActivities = new Map();
        activities.forEach(activity => {
          userIdToActivities.set(activity.user_id, [
            ...(userIdToActivities.get(activity.user_id) || []),
            activity
          ]);
        });
        
        // Fetch student names
        const { data: students, error: namesError } = await supabase
          .from("profiles")
          .select("id, student_name")
          .in("id", Array.from(userIdToActivities.keys()));
          
        if (namesError) {
          console.error("Error fetching student names:", namesError);
          return;
        }
        
        // Now create the final activities with student names included
        const activitiesWithNames = activities.map(activity => {
          const student = students?.find(s => s.id === activity.user_id);
          return {
            id: activity.id,
            user_id: activity.user_id,
            student_name: student?.student_name || "Unknown Student",
            activity_name: activity.activity_name,
            date: activity.date,
            points: activity.points,
            status: activity.status,
            file_url: activity.file_url
          };
        });
        
        setPendingActivities(activitiesWithNames);
      } else {
        setPendingActivities([]);
      }
    } catch (error) {
      console.error("Error in fetchPendingActivities:", error);
    }
  };

  const fetchAllActivities = async (teacherId: string) => {
    if (!teacherId) return;
  
    try {
      // First, get all student profiles IDs for this teacher
      const { data: studentProfiles, error: studentError } = await supabase
        .from("profiles")
        .select("id")
        .eq("teacher", teacherId)
        .eq("role", "student");
  
      if (studentError) {
        console.error("Error fetching student profiles:", studentError);
        return;
      }
      
      // If no students found, set empty array and return
      if (!studentProfiles || studentProfiles.length === 0) {
        console.log("No students found for this teacher");
        setAllActivities([]);
        return;
      }
  
      // Extract the student IDs into a simple array
      const studentIds = studentProfiles.map(profile => profile.id);
      
      // Now fetch all activities where user_id is in the list of student IDs
      const { data: activities, error: activitiesError } = await supabase
        .from("activities")
        .select("id, user_id, activity_name, date, points, status, file_url")
        .in("user_id", studentIds)
        .order('date', { ascending: false });
  
      if (activitiesError) {
        console.error("Error fetching all activities:", activitiesError);
        return;
      }
      
      // We need to get the student names for these activities
      if (activities && activities.length > 0) {
        // Fetch student names
        const { data: students, error: namesError } = await supabase
          .from("profiles")
          .select("id, student_name")
          .in("id", studentIds);
          
        if (namesError) {
          console.error("Error fetching student names:", namesError);
          return;
        }
        
        // Now create the final activities with student names included
        const activitiesWithNames = activities.map(activity => {
          const student = students?.find(s => s.id === activity.user_id);
          return {
            id: activity.id,
            user_id: activity.user_id,
            student_name: student?.student_name || "Unknown Student",
            activity_name: activity.activity_name,
            date: activity.date,
            points: activity.points,
            status: activity.status,
            file_url: activity.file_url
          };
        });
        
        setAllActivities(activitiesWithNames);
      } else {
        setAllActivities([]);
      }
    } catch (error) {
      console.error("Error in fetchAllActivities:", error);
    }
  };

  const fetchStudentActivities = async (studentId: string) => {
    try {
      const { data, error } = await supabase
        .from("activities")
        .select("id, activity_name, date, points, status, file_url")
        .eq("user_id", studentId)
        .order('date', { ascending: false });

      if (error) throw error;
      setStudentActivities(data || []);
    } catch (error) {
      console.error("Error fetching student activities:", error);
      setStudentActivities([]);
    }
  };

  const handleApprove = async (activityId: string) => {
    try {
      const { error } = await supabase
        .from("activities")
        .update({ status: "approved" })
        .eq("id", activityId);

      if (error) throw error;
      
      if (teacherId) {
        await Promise.all([
          fetchStats(teacherId),
          fetchPendingActivities(teacherId),
          fetchAllActivities(teacherId)
        ]);

        // If we're in student view, refresh that student's activities
        if (selectedStudent) {
          fetchStudentActivities(selectedStudent.id);
        }
      }
    } catch (error) {
      console.error("Error approving activity:", error);
    }
  };

  const handleReject = async (activityId: string) => {
    try {
      const { error } = await supabase
        .from("activities")
        .update({ status: "rejected" })
        .eq("id", activityId);

      if (error) throw error;
      
      if (teacherId) {
        await Promise.all([
          fetchStats(teacherId),
          fetchPendingActivities(teacherId),
          fetchAllActivities(teacherId)
        ]);

        // If we're in student view, refresh that student's activities
        if (selectedStudent) {
          fetchStudentActivities(selectedStudent.id);
        }
      }
    } catch (error) {
      console.error("Error rejecting activity:", error);
    }
  };

  const handleViewStudent = async (student: Student) => {
    setSelectedStudent(student);
    await fetchStudentActivities(student.id);
    setView("student-details");
  };

  const handleBackToDashboard = () => {
    setSelectedStudent(null);
    setStudentActivities([]);
    setView("dashboard");
  };

  const handleEditActivity = (activity: Activity) => {
    setEditingActivity(activity);
  };

  const handleSaveActivityEdit = async () => {
    if (!editingActivity) return;

    try {
      const { error } = await supabase
        .from("activities")
        .update({
          points: editingActivity.points
        })
        .eq("id", editingActivity.id);

      if (error) throw error;
      
      // Reset editing state
      setEditingActivity(null);
      
      // Refresh data
      if (teacherId) {
        fetchAllActivities(teacherId);
        
        // If we're in student view, refresh that student's activities
        if (selectedStudent) {
          fetchStudentActivities(selectedStudent.id);
        }
      }
    } catch (error) {
      console.error("Error updating activity points:", error);
    }
  };

  const handleCancelEdit = () => {
    setEditingActivity(null);
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.push("/");
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const renderCertificateLink = (fileUrl: string | undefined) => {
    if (!fileUrl) return "No certificate";
    
    return (
      <a 
        href={fileUrl} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="text-blue-600 hover:underline flex items-center gap-1"
      >
        <FileText size={16} />
        View Certificate
      </a>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FFE6E6] flex items-center justify-center">
        <div className="text-[#7469B6] text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFE6E6]">
      <header className="bg-[#7469B6] text-white py-4">
        <div className="container mx-auto px-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Teacher Dashboard</h1>
            <p className="text-sm opacity-90">
              {teacherName ? `Welcome, ${teacherName}` : 'Welcome'}
            </p>
          </div>
          <button
            className="bg-[#AD88C6] px-4 py-2 rounded-lg hover:bg-[#E1AFD1] transition-colors"
            onClick={handleSignOut}
          >
            Sign Out
          </button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {view === "dashboard" ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <StatCard title="Total Students" value={stats.totalStudents} Icon={Users} />
              <StatCard title="Pending Review" value={stats.pendingReview} Icon={Clock} />
              <StatCard title="Approved" value={stats.approved} Icon={CheckCircle} />
              <StatCard title="Rejected" value={stats.rejected} Icon={XCircle} />
            </div>

            <Section title="Students">
              {students.length > 0 ? (
                <Table
                  headers={["Name", "Total Activities", "Total Points", "Status", "Actions"]}
                  data={students.map((student) => [
                    student.student_name,
                    student.total_activities,
                    student.total_points,
                    <span key={`status-${student.id}`} className={`px-2 py-1 rounded-full text-xs ${
                      student.status === "active" ? "bg-green-100 text-green-800" : 
                      student.status === "inactive" ? "bg-gray-100 text-gray-800" : 
                      "bg-yellow-100 text-yellow-800"
                    }`}>
                      {student.status}
                    </span>,
                    <button 
                      key={`view-${student.id}`}
                      onClick={() => handleViewStudent(student)} 
                      className="bg-[#AD88C6] text-white px-3 py-1 rounded hover:bg-[#7469B6] flex items-center gap-1"
                    >
                      <Eye size={16} />
                      View Details
                    </button>,
                  ])}
                />
              ) : (
                <div className="text-center py-8 text-gray-600">
                  No students found
                </div>
              )}
            </Section>

            <Section title="Pending Activities">
              {pendingActivities.length > 0 ? (
                <Table
                  headers={["Student", "Activity", "Date", "Points", "Certificate", "Actions"]}
                  data={pendingActivities.map((activity) => [
                    activity.student_name,
                    activity.activity_name,
                    activity.date,
                    activity.points,
                    renderCertificateLink(activity.file_url),
                    <div className="flex space-x-2" key={activity.id}>
                      <button 
                        onClick={() => handleApprove(activity.id)} 
                        className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 flex items-center gap-1"
                      >
                        <CheckCircle size={16} />
                        Approve
                      </button>
                      <button 
                        onClick={() => handleReject(activity.id)} 
                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 flex items-center gap-1"
                      >
                        <XCircle size={16} />
                        Reject
                      </button>
                    </div>,
                  ])}
                />
              ) : (
                <div className="text-center py-8 text-gray-600">
                  No pending activities to review
                </div>
              )}
            </Section>

            <Section title="All Activities">
              {allActivities.length > 0 ? (
                <Table
                  headers={["Student", "Activity", "Date", "Points", "Status", "Certificate", "Actions"]}
                  data={allActivities.map((activity) => [
                    activity.student_name,
                    activity.activity_name,
                    activity.date,
                    editingActivity?.id === activity.id ? (
                      <input
                        type="number"
                        value={editingActivity.points}
                        onChange={(e) => setEditingActivity({
                          ...editingActivity,
                          points: parseInt(e.target.value) || 0
                        })}
                        className="w-20 p-1 border rounded"
                      />
                    ) : (
                      activity.points
                    ),
                    <span key={`status-${activity.id}`} className={`px-2 py-1 rounded-full text-xs ${
                      activity.status === "approved" ? "bg-green-100 text-green-800" : 
                      activity.status === "rejected" ? "bg-red-100 text-red-800" : 
                      "bg-yellow-100 text-yellow-800"
                    }`}>
                      {activity.status}
                    </span>,
                    renderCertificateLink(activity.file_url),
                    editingActivity?.id === activity.id ? (
                      <div className="flex space-x-2" key={`edit-actions-${activity.id}`}>
                        <button
                          onClick={handleSaveActivityEdit}
                          className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        key={`edit-${activity.id}`}
                        onClick={() => handleEditActivity(activity)}
                        className="bg-[#AD88C6] text-white px-3 py-1 rounded hover:bg-[#7469B6] flex items-center gap-1"
                      >
                        <Edit size={16} />
                        Edit Points
                      </button>
                    ),
                  ])}
                />
              ) : (
                <div className="text-center py-8 text-gray-600">
                  No activities found
                </div>
              )}
            </Section>
          </>
        ) : (
          <>
            <div className="mb-6 flex items-center">
              <button
                onClick={handleBackToDashboard}
                className="bg-[#AD88C6] text-white px-4 py-2 rounded-lg hover:bg-[#7469B6] transition-colors flex items-center gap-2 mb-4"
              >
                <ArrowLeft size={16} />
                Back to Dashboard
              </button>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-[#7469B6] text-white p-4 rounded-lg">
                  <Users size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-[#7469B6]">{selectedStudent?.student_name}</h2>
                  <div className="flex gap-6 mt-2">
                    <p className="text-gray-600">
                      <span className="font-semibold">Total Activities:</span> {selectedStudent?.total_activities}
                    </p>
                    <p className="text-gray-600">
                      <span className="font-semibold">Total Points:</span> {selectedStudent?.total_points}
                    </p>
                    <p className="text-gray-600">
                      <span className="font-semibold">Status:</span> 
                      <span className={`ml-1 px-2 py-1 rounded-full text-xs ${
                        selectedStudent?.status === "active" ? "bg-green-100 text-green-800" : 
                        selectedStudent?.status === "inactive" ? "bg-gray-100 text-gray-800" : 
                        "bg-yellow-100 text-yellow-800"
                      }`}>
                        {selectedStudent?.status}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Section title="Student Activities">
              {studentActivities.length > 0 ? (
                <Table
                  headers={["Activity", "Date", "Points", "Status", "Certificate", "Actions"]}
                  data={studentActivities.map((activity) => [
                    activity.activity_name,
                    activity.date,
                    editingActivity?.id === activity.id ? (
                      <input
                        type="number"
                        value={editingActivity.points}
                        onChange={(e) => setEditingActivity({
                          ...editingActivity,
                          points: parseInt(e.target.value) || 0
                        })}
                        className="w-20 p-1 border rounded"
                      />
                    ) : (
                      activity.points
                    ),
                    <span key={`status-${activity.id}`} className={`px-2 py-1 rounded-full text-xs ${
                      activity.status === "approved" ? "bg-green-100 text-green-800" : 
                      activity.status === "rejected" ? "bg-red-100 text-red-800" : 
                      "bg-yellow-100 text-yellow-800"
                    }`}>
                      {activity.status}
                    </span>,
                    renderCertificateLink(activity.file_url),
                    activity.status === "pending" ? (
                      <div className="flex space-x-2" key={`pending-actions-${activity.id}`}>
                        <button 
                          onClick={() => handleApprove(activity.id)} 
                          className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 flex items-center gap-1"
                        >
                          <CheckCircle size={16} />
                          Approve
                        </button>
                        <button 
                          onClick={() => handleReject(activity.id)} 
                          className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 flex items-center gap-1"
                        >
                          <XCircle size={16} />
                          Reject
                        </button>
                      </div>
                    ) : (
                      editingActivity?.id === activity.id ? (
                        <div className="flex space-x-2" key={`edit-actions-${activity.id}`}>
                          <button
                            onClick={handleSaveActivityEdit}
                            className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                          >
                            Save
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          key={`edit-${activity.id}`}
                          onClick={() => handleEditActivity(activity)}
                          className="bg-[#AD88C6] text-white px-3 py-1 rounded hover:bg-[#7469B6] flex items-center gap-1"
                        >
                          <Edit size={16} />
                          Edit Points
                        </button>
                      )
                    ),
                  ])}
                />
              ) : (
                <div className="text-center py-8 text-gray-600">
                  No activities found for this student
                </div>
              )}
            </Section>
          </>
        )}
      </main>
    </div>
  );
}
"use client";
import React, { useState, useEffect } from "react";
import { Users, CheckCircle, XCircle, Clock } from "lucide-react";
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
  student_name: string;
  activity_name: string;
  date: string;
  points: number;
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
  const [stats, setStats] = useState<Stats>({
    totalStudents: 0,
    pendingReview: 0,
    approved: 0,
    rejected: 0,
  });
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [teacherName, setTeacherName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

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
        fetchPendingActivities(teacherData.id)
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
      const [
        { count: totalStudents },
        { count: pendingReview },
        { count: approved },
        { count: rejected }
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("teacher", teacherId),
        supabase
          .from("activities")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending")
          .eq("teacher_id", teacherId),
        supabase
          .from("activities")
          .select("*", { count: "exact", head: true })
          .eq("status", "approved")
          .eq("teacher_id", teacherId),
        supabase
          .from("activities")
          .select("*", { count: "exact", head: true })
          .eq("status", "rejected")
          .eq("teacher_id", teacherId)
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
      const { data, error } = await supabase
        .from("activities")
        .select("id, student_name, activity_name, date, points")
        .eq("status", "pending")
        .eq("teacher_id", teacherId);

      if (error) throw error;
      setPendingActivities(data || []);
    } catch (error) {
      console.error("Error fetching activities:", error);
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
          fetchPendingActivities(teacherId)
        ]);
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
          fetchPendingActivities(teacherId)
        ]);
      }
    } catch (error) {
      console.error("Error rejecting activity:", error);
    }
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard title="Total Students" value={stats.totalStudents} Icon={Users} />
          <StatCard title="Pending Review" value={stats.pendingReview} Icon={Clock} />
          <StatCard title="Approved" value={stats.approved} Icon={CheckCircle} />
          <StatCard title="Rejected" value={stats.rejected} Icon={XCircle} />
        </div>

        <Section title="Pending Activities">
          {pendingActivities.length > 0 ? (
            <Table
              headers={["Student", "Activity", "Date", "Points", "Actions"]}
              data={pendingActivities.map((activity) => [
                activity.student_name,
                activity.activity_name,
                activity.date,
                activity.points,
                <div className="flex space-x-2" key={activity.id}>
                  <button 
                    onClick={() => handleApprove(activity.id)} 
                    className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                  >
                    Approve
                  </button>
                  <button 
                    onClick={() => handleReject(activity.id)} 
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                  >
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
      </main>
    </div>
  );
}
"use client";
import React, { useState, useEffect } from "react";
import { Users, CheckCircle, XCircle, Clock } from "lucide-react";
import supabase from "@/lib/supabase";

import Table from "@/app/components/Table";
import StatCard from "@/app/components/StatCard";
import Section from "@/app/components/Section";

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

  useEffect(() => {
    fetchTeacherData();
  }, []);

  async function fetchTeacherData() {
    const { data: userData, error } = await supabase.auth.getUser();
    if (error || !userData?.user) {
      console.error("Error fetching user:", error);
      return;
    }

    const userId = userData.user.id;

    // Fetch teacher data from teachers table instead of profiles
    const { data: teacherData, error: teacherError } = await supabase
      .from("teachers")
      .select("id, name")
      .eq("id", userId)
      .single();

    if (teacherError) {
      console.error("Error fetching teacher data:", teacherError);
      return;
    }

    setTeacherId(teacherData.id);
    setTeacherName(teacherData.name);

    fetchStats(teacherData.id);
    fetchStudents(teacherData.id);
    fetchPendingActivities(teacherData.id);
  }

  async function fetchStats(teacherId: string) {
    if (!teacherId) return;

    // Get students associated with this teacher
    const { count: totalStudents } = await supabase
      .from("profiles")
      .select("*", { count: "exact" })
      .eq("teacher", teacherId); // Updated to match Auth component's field name

    const { count: pendingReview } = await supabase
      .from("activities")
      .select("*", { count: "exact" })
      .eq("status", "pending")
      .eq("teacher_id", teacherId);

    const { count: approved } = await supabase
      .from("activities")
      .select("*", { count: "exact" })
      .eq("status", "approved")
      .eq("teacher_id", teacherId);

    const { count: rejected } = await supabase
      .from("activities")
      .select("*", { count: "exact" })
      .eq("status", "rejected")
      .eq("teacher_id", teacherId);

    setStats({
      totalStudents: totalStudents || 0,
      pendingReview: pendingReview || 0,
      approved: approved || 0,
      rejected: rejected || 0,
    });
  }

  async function fetchStudents(teacherId: string) {
    if (!teacherId) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("id, student_name, total_activities, total_points, status")
      .eq("teacher", teacherId) 
      .eq("role", "student");

    if (error) console.error("Error fetching students:", error);
    else setStudents(data || []);
  }

  async function fetchPendingActivities(teacherId: string) {
    if (!teacherId) return;

    const { data, error } = await supabase
      .from("activities")
      .select("id, student_name, activity_name, date, points")
      .eq("status", "pending")
      .eq("teacher_id", teacherId);

    if (error) console.error("Error fetching activities:", error);
    else setPendingActivities(data || []);
  }

  async function handleApprove(activityId: string) {
    const { error } = await supabase
      .from("activities")
      .update({ status: "approved" })
      .eq("id", activityId);

    if (error) console.error("Error approving:", error);
    else {
      fetchStats(teacherId!);
      fetchPendingActivities(teacherId!);
    }
  }

  async function handleReject(activityId: string) {
    const { error } = await supabase
      .from("activities")
      .update({ status: "rejected" })
      .eq("id", activityId);

    if (error) console.error("Error rejecting:", error);
    else {
      fetchStats(teacherId!);
      fetchPendingActivities(teacherId!);
    }
  }

  async function handleSignOut() {
    const { error } = await supabase.auth.signOut();
    if (error) console.error("Error signing out:", error);
    else window.location.href = "/";  // Updated to redirect to root where Auth component is
  }

  return (
    <div className="min-h-screen bg-[#FFE6E6]">
      <header className="bg-[#7469B6] text-white py-4">
        <div className="container mx-auto px-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Teacher Dashboard</h1>
            <p className="text-sm opacity-90">Welcome, {teacherName}</p>
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
          <Table
            headers={["Student", "Activity", "Date", "Points", "Actions"]}
            data={pendingActivities.map((activity) => [
              activity.student_name,
              activity.activity_name,
              activity.date,
              activity.points,
              <div className="flex space-x-2" key={activity.id}>
                <button onClick={() => handleApprove(activity.id)} className="bg-green-500 text-white px-3 py-1 rounded">
                  Approve
                </button>
                <button onClick={() => handleReject(activity.id)} className="bg-red-500 text-white px-3 py-1 rounded">
                  Reject
                </button>
              </div>,
            ])}
          />
        </Section>
      </main>
    </div>
  );
}
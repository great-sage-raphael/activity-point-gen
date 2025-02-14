"use client";
import React, { useState, useEffect } from 'react';
import supabase from '../../lib/supabase';
import { UserPlus, LogIn } from 'lucide-react';
import { useRouter } from "next/navigation";

const Auth = () => {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [student_name, setStudentName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [class_name, setClassName] = useState('');
  const [teacher_id, setTeacherId] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setMessage('');
  }, [isLogin]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    
    if (!email.trim() || !password.trim()) {
      setMessage('Email and password are required.');
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setMessage('Password must be at least 6 characters long.');
      setIsLoading(false);
      return;
    }

    
    if (!isLogin && role === 'student') {
      if (!class_name.trim()) {
        setMessage('Class name is required for students.');
        setIsLoading(false);
        return;
      }
      
   
      if (teacher_id.trim() && !isValidUUID(teacher_id.trim())) {
        setMessage('Invalid teacher ID format.');
        setIsLoading(false);
        return;
      }
    }

    try {
      if (isLogin) {
        
        const { error, data } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password.trim(),
        });

        if (error || !data.user) {
          setMessage('Invalid email or password.');
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();

        if (profileError || !profile) {
          setMessage('Error fetching user role.');
          return;
        }

        if (profile.role === 'teacher') {
          router.push(`/Dashboard/Teacher/${data.user.id}`);
        } else {
          router.push(`/Dashboard/Student/${data.user.id}`);
        }
      } else {
        // Sign Up
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password.trim(),
        });

        if (error) {
          setMessage(error.message.includes('already registered')
            ? 'This email is already registered. Please log in instead.'
            : error.message);
          return;
        }

        if (data.user) {
          // Prepare profile data with proper handling of teacher_id
          const profileData: any = {
            id: data.user.id,
            role,
            student_name: student_name.trim(),
            class_name: role === 'student' ? class_name.trim() : null,
            teacher: role === 'student' && teacher_id.trim() ? teacher_id.trim() : null
          };

          // Verify teacher exists if teacher_id is provided
          if (profileData.teacher) {
            const { data: teacherData, error: teacherError } = await supabase
              .from('profiles')
              .select('id')
              .eq('id', profileData.teacher)
              .eq('role', 'teacher')
              .single();

            if (teacherError || !teacherData) {
              setMessage('Invalid teacher ID or teacher not found.');
              setIsLoading(false);
              return;
            }
          }

          // Insert into profiles table
          const { error: profileError } = await supabase
            .from('profiles')
            .insert([profileData]);

          if (profileError) {
            setMessage('Error saving profile: ' + profileError.message);
            return;
          }

          setMessage('Account created successfully! You can now log in.');
          setIsLogin(true);
          resetForm();
        }
      }
    } catch (error: any) {
      setMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to validate UUID format
  const isValidUUID = (uuid: string) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setStudentName('');
    setClassName('');
    setTeacherId('');
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    resetForm();
    setMessage('');
  };

  // Rest of the component remains the same...
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto bg-white/90 p-8 rounded-lg shadow-lg">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-[#866ec7]">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-gray-600 mt-2">
            {isLogin ? 'Sign in to continue' : 'Sign up to get started and verify your email to sign in'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-6">
          <div>
            <label className="block text-gray-700 mb-2" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border text-gray-600 rounded-lg focus:outline-none focus:border-[#866ec7]"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border text-gray-700 rounded-lg focus:outline-none focus:border-[#866ec7]"
              placeholder="Minimum 6 characters"
              minLength={6}
            />
          </div>

          {!isLogin && (
            <>
              <div>
                <label className="block text-gray-700 mb-2" htmlFor="student_name">Name</label>
                <input
                  id="student_name"
                  type="text"
                  value={student_name}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="w-full px-4 py-2 border text-gray-600 rounded-lg focus:outline-none focus:border-[#866ec7]"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2" htmlFor="role">Role</label>
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-4 py-2 border text-gray-700 rounded-lg focus:outline-none focus:border-[#866ec7]"
                >
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                </select>
              </div>

              {role === 'student' && (
                <>
                  <div>
                    <label className="block text-gray-700 mb-2" htmlFor="class_name">Class</label>
                    <input
                      id="class_name"
                      type="text"
                      value={class_name}
                      onChange={(e) => setClassName(e.target.value)}
                      className="w-full px-4 py-2 border text-gray-700 rounded-lg focus:outline-none focus:border-[#866ec7]"
                      placeholder="Enter your class (e.g., csec1, csec2)"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2" htmlFor="teacher_id">Teacher ID (UUID format)</label>
                    <input
                      id="teacher_id"
                      type="text"
                      value={teacher_id}
                      onChange={(e) => setTeacherId(e.target.value)}
                      className="w-full px-4 py-2 border text-gray-700 rounded-lg focus:outline-none focus:border-[#866ec7]"
                      placeholder="Enter your teacher's UUID"
                    />
                  </div>
                </>
              )}
            </>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#866ec7] text-white py-3 rounded-lg hover:bg-[#bf9fee] transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              'Processing...'
            ) : isLogin ? (
              <>
                <LogIn size={20} />
                <span>Sign In</span>
              </>
            ) : (
              <>
                <UserPlus size={20} />
                <span>Create Account</span>
              </>
            )}
          </button>
        </form>

        {message && (
          <div className={`mt-4 p-4 rounded-lg text-center text-sm ${
            message.includes('successfully') 
              ? 'bg-green-100 text-green-700 border border-green-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message}
          </div>
        )}

        <div className="mt-6 text-center">
          <button onClick={switchMode} className="text-[#866ec7] hover:underline">
            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
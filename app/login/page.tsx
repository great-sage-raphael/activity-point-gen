"use client";
import React, { useState, useEffect } from 'react';
import supabase from '../../lib/supabase';
import { UserPlus, LogIn } from 'lucide-react';
import { useRouter } from "next/navigation";

interface Teacher {
  id: string;
  name: string;
  email: string;
}

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
  const [availableTeachers, setAvailableTeachers] = useState<Teacher[]>([]);
  const [teacherFetchError, setTeacherFetchError] = useState<string>('');

  useEffect(() => {
    setMessage('');
  }, [isLogin]);

  useEffect(() => {
    const fetchTeachers = async () => {
      if (role === 'student' && !isLogin) {
        setTeacherFetchError('');
        try {
          const { data, error } = await supabase
            .from('teachers')
            .select('id, name, email');

          if (error) {
            console.error('Supabase error:', error);
            setTeacherFetchError('Failed to load teachers. Please try again.');
            setAvailableTeachers([]);
            return;
          }

          if (!data) {
            setAvailableTeachers([]);
            return;
          }

          const validTeachers = data.filter((teacher): teacher is Teacher => {
            return (
              typeof teacher.id === 'string' &&
              typeof teacher.name === 'string' &&
              typeof teacher.email === 'string'
            );
          });

          setAvailableTeachers(validTeachers);
        } catch (err) {
          console.error('Fetch error:', err);
          setTeacherFetchError('An unexpected error occurred. Please try again.');
          setAvailableTeachers([]);
        }
      }
    };

    fetchTeachers();
  }, [role, isLogin]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    // Basic validation
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

    // Additional validation for students
    if (!isLogin && role === 'student') {
      if (!class_name.trim()) {
        setMessage('Class name is required for students.');
        setIsLoading(false);
        return;
      }

      if (!teacher_id) {
        setMessage('Please select a teacher.');
        setIsLoading(false);
        return;
      }
    }

    try {
      if (isLogin) {
        // Sign In
        console.log('Attempting sign in with:', { email: email.trim() });
        const { error: signInError, data: signInData } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password.trim(),
        });

        if (signInError || !signInData.user) {
          console.error('Sign in error:', signInError);
          setMessage('Invalid email or password.');
          setIsLoading(false);
          return;
        }

        console.log('Sign in successful:', signInData);

        // First check teachers table
        const { data: teacherData, error: teacherError } = await supabase
          .from('teachers')
          .select('id')
          .eq('id', signInData.user.id)
          .single();

        console.log('Teacher check:', { teacherData, teacherError });

        if (teacherData) {
          // User is a teacher
          router.push(`/Dashboard/Teacher/${signInData.user.id}`);
          return;
        }

        // If not a teacher, check profiles table
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('role, id')
          .eq('id', signInData.user.id)
          .single();

        console.log('Profile check:', { profileData, profileError });

        if (profileError || !profileData) {
          setMessage('Error: User profile not found');
          setIsLoading(false);
          return;
        }

        if (profileData.role === 'student') {
          router.push(`/Dashboard/Student/${signInData.user.id}`);
        } else {
          setMessage('Error: Invalid user role');
          setIsLoading(false);
        }

      } else {
        // Sign Up
        console.log('Attempting sign up with:', { email: email.trim(), role });
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password.trim(),
        });

        if (error) {
          console.error('Sign up error:', error);
          setMessage(error.message.includes('already registered')
            ? 'This email is already registered. Please log in instead.'
            : error.message);
          setIsLoading(false);
          return;
        }

        if (data.user) {
          try {
            if (role === 'teacher') {
              // Insert into teachers table
              const { error: teacherError } = await supabase
                .from('teachers')
                .insert([{
                  id: data.user.id,
                  name: student_name.trim(),
                  email: email.trim(),
                  password: password.trim() // Note: Consider hashing this password
                }]);

              if (teacherError) {
                console.error('Teacher creation error:', teacherError);
                setMessage('Error creating teacher account: ' + teacherError.message);
                setIsLoading(false);
                return;
              }
            } else {
              // Insert student profile
              const { error: profileError } = await supabase
                .from('profiles')
                .insert([{
                  id: data.user.id,
                  student_name: student_name.trim(),
                  role: 'student',
                  class_name: class_name.trim(),
                  teacher: teacher_id
                }]);

              if (profileError) {
                console.error('Student profile creation error:', profileError);
                setMessage('Error creating student profile: ' + profileError.message);
                setIsLoading(false);
                return;
              }
            }

            setMessage('Account created successfully! Please verify your email and then log in.');
            setIsLogin(true);
            resetForm();
          } catch (error: any) {
            console.error('Profile creation error:', error);
            setMessage('Error during registration: ' + error.message);
          }
        }
      }
    } catch (error: any) {
      console.error('Authentication error:', error);
      setMessage(error.message);
    } finally {
      setIsLoading(false);
    }
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto bg-white/90 p-8 rounded-lg shadow-lg">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-[#866ec7]">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-gray-600 mt-2">
            {isLogin 
              ? 'Sign in to continue' 
              : 'Sign up to get started and verify your email to sign in'}
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
              required
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
              required
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
                  required
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
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2" htmlFor="teacher_id">
                      Select Teacher
                      {teacherFetchError && (
                        <span className="text-red-500 text-sm ml-2">({teacherFetchError})</span>
                      )}
                    </label>
                    <select
                      id="teacher_id"
                      value={teacher_id}
                      onChange={(e) => setTeacherId(e.target.value)}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-[#866ec7] ${
                        teacherFetchError ? 'border-red-300' : 'text-gray-700'
                      }`}
                      required
                      disabled={teacherFetchError !== ''}
                    >
                      <option value="">Select a teacher</option>
                      {availableTeachers.map((teacher) => (
                        <option key={teacher.id} value={teacher.id}>
                          {teacher.name} ({teacher.email})
                        </option>
                      ))}
                    </select>
                    {teacherFetchError && (
                      <button
                        type="button"
                        onClick={() => {
                          setTeacherFetchError('');
                          setRole(role); // This will trigger the useEffect to fetch teachers again
                        }}
                        className="mt-2 text-sm text-[#866ec7] hover:underline"
                      >
                        Try loading teachers again
                      </button>
                    )}
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
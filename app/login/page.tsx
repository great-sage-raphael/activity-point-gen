"use client";
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { UserPlus, LogIn } from 'lucide-react';
// import { useNavigate } from 'react-router-dom';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

const Auth = () => {
  // const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student'); // Default role
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setMessage('');
  }, [isLogin]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    if (!email.trim()) {
      setMessage('Please enter your email address');
      setIsLoading(false);
      return;
    }

    if (!password.trim()) {
      setMessage('Please enter your password');
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setMessage('Password must be at least 6 characters long');
      setIsLoading(false);
      return;
    }

    try {
      if (isLogin) {
        const { error, data } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password.trim(),
        });

        if (error) {
          setMessage('Invalid email or password. Please try again.');
          return;
        }

        if (data.user) {
          setEmail('');
          setPassword('');
          setMessage('');
          // navigate('/');
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
          // Insert role in profiles table
          const { error: profileError } = await supabase.from('profiles').insert([
            { id: data.user.id, role }
          ]);

          if (profileError) {
            setMessage('Error saving role: ' + profileError.message);
            return;
          }

          setMessage('Account created successfully! You can now log in.');
          setIsLogin(true);
          setEmail('');
          setPassword('');
        }
      }
    } catch (error: any) {
      setMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setEmail('');
    setPassword('');
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
            {isLogin ? 'Sign in to continue' : 'Sign up to get started'}
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
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-[#866ec7]"
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
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-[#866ec7]"
              placeholder={isLogin ? '••••••••' : 'Minimum 6 characters'}
              minLength={6}
            />
          </div>

          {!isLogin && (
            <div>
              <label className="block text-gray-700 mb-2" htmlFor="role">Role</label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-[#866ec7]"
              >
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
              </select>
            </div>
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
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

interface AdminAuthProps {
  children: React.ReactNode;
}

const AdminAuth = ({ children }: AdminAuthProps) => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState('');
  const [isTeacher, setIsTeacher] = useState(false);

  const checkTeacherStatus = async (userEmail: string) => {
    try {
      // Check if user is super admin (hardcoded for initial access)
      if (userEmail === 'grantmatai@gmail.com') {
        setIsTeacher(true);
        return true;
      }

      // Check if user is a teacher in the database
      const { data, error } = await supabase
        .from('teachers')
        .select('id, is_active')
        .eq('email', userEmail)
        .eq('is_active', true)
        .single();

      if (!error && data) {
        setIsTeacher(true);
        return true;
      }

      setIsTeacher(false);
      return false;
    } catch (error) {
      console.error('Error checking teacher status:', error);
      setIsTeacher(false);
      return false;
    }
  };

  useEffect(() => {
    // Check if user is already signed in
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.email) {
        await checkTeacherStatus(user.email);
      }
      setUser(user);
      setLoading(false);
    };

    getUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user?.email) {
        await checkTeacherStatus(session.user.email);
      } else {
        setIsTeacher(false);
      }
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/');
    }
  }, [loading, user, router]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSigningIn(true);
    setError('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
      } else if (data.user && data.user.email) {
        // Check if user has teacher access
        const hasAccess = await checkTeacherStatus(data.user.email);
        if (!hasAccess) {
          setError('You are not authorized to access the admin panel.');
          await supabase.auth.signOut();
        }
      }
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error('An unknown error occurred');
      setError(error.message);
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleEnterSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      (e.currentTarget.form as HTMLFormElement | null)?.requestSubmit();
    }
  };

  if (loading) {
    return (
      <div className="admin-shell flex items-center justify-center">
        <div className="text-sm text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!user) return null;

  // Check if user has teacher access
  const hasAccess = user && isTeacher;

  if (!hasAccess) {
    return (
      <div className="admin-shell flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="admin-card">
            <div className="mb-6">
              <h1 className="text-xl font-semibold text-gray-900 mb-1">Teacher Access</h1>
              <p className="text-sm text-gray-600">Sign in to access the admin panel</p>
            </div>

            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="username"
                  onKeyDown={handleEnterSubmit}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="admin-input w-full"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  onKeyDown={handleEnterSubmit}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="admin-input w-full"
                  placeholder="Enter your password"
                />
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isSigningIn}
                className="admin-btn admin-btn-primary w-full"
              >
                {isSigningIn ? 'Signing In...' : 'Sign In'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Admin Content */}
      {children}
    </div>
  );
};

export default AdminAuth;

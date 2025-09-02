'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Bars3Icon, XMarkIcon, UserIcon, CogIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { createBrowserClient } from '@supabase/ssr';
import type { User } from '@supabase/supabase-js';

const navigation = [
  { name: 'Home', href: '/' },
  { name: 'Music', href: '/music' },
  { name: 'Blog', href: '/blog' },
  { name: 'Contact', href: '/contact-us' },
];

export default function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState('');
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Check if the user is the admin
  const adminEmail = process.env.NEXT_PUBLIC_BLOG_ADMIN_EMAIL || 'your_email@example.com';
  const isAdmin = user?.email === adminEmail;

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleSignIn = () => {
    setShowAuthModal(true);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSigningIn(true);
    setAuthError('');

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setAuthError(error.message);
      } else {
        setShowAuthModal(false);
        setEmail('');
        setPassword('');
      }
    } catch (err) {
      setAuthError('An unexpected error occurred');
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <header className="shadow-soft sticky top-0 z-50" style={{backgroundColor: '#BC6A1B', borderBottom: '2px solid #602718'}}>
      <nav className="mx-auto flex max-w-7xl items-center justify-between p-6 lg:px-8" aria-label="Global">
        <div className="flex lg:flex-1">
          <Link href="/" className="-m-1.5 p-1.5 flex items-center space-x-3">
            <div className="h-12 w-12 flex items-center justify-center">
              <img 
                src="/guitar-logo.png" 
                alt="Chief's Music Logo" 
                className="w-10 h-10 object-contain"
              />
            </div>
            <div>
              <span className="text-white font-bold text-xl">Chief&apos;s Music</span>
              <p className="text-white text-opacity-80 text-sm">Guitar & Lessons</p>
            </div>
          </Link>
        </div>
        
        <div className="flex lg:hidden">
          <button
            type="button"
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-white"
            onClick={() => setMobileMenuOpen(true)}
          >
            <span className="sr-only">Open main menu</span>
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>
        
        <div className="hidden lg:flex lg:gap-x-12">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="text-sm font-semibold leading-6 text-white hover:text-white hover:text-opacity-80 transition-colors"
            >
              {item.name}
            </Link>
          ))}
          
          {/* Show authentication-based navigation items */}
          {user ? (
            <>
              <Link
                href="/portal"
                className="text-sm font-semibold leading-6 text-white hover:text-white hover:text-opacity-80 transition-colors"
              >
                Student Portal
              </Link>
              {isAdmin && (
                <Link
                  href="/admin"
                  className="text-sm font-semibold leading-6 text-white hover:text-white hover:text-opacity-80 transition-colors"
                >
                  Admin Panel
                </Link>
              )}
              <button
                onClick={handleSignOut}
                className="text-sm font-semibold leading-6 text-white hover:text-white hover:text-opacity-80 transition-colors"
              >
                Sign Out
              </button>
            </>
          ) : (
            <button
              onClick={handleSignIn}
              className="text-sm font-semibold leading-6 text-white hover:text-white hover:text-opacity-80 transition-colors"
            >
              Sign In
            </button>
          )}
        </div>
        
        <div className="hidden lg:flex lg:flex-1 lg:justify-end">
        </div>
      </nav>
      
      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden">
          <div className="fixed inset-0 z-50" />
          <div className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10" style={{backgroundColor: '#BC6A1B'}}>
            <div className="flex items-center justify-between">
              <Link href="/" className="-m-1.5 p-1.5 flex items-center space-x-2">
                <div className="h-8 w-8 flex items-center justify-center">
                  <img 
                    src="/guitar-logo.png" 
                    alt="Chief's Music Logo" 
                    className="w-full h-full object-contain filter brightness-0 invert"
                  />
                </div>
                <span className="text-white font-bold">Chief&apos;s Music</span>
              </Link>
              <button
                type="button"
                className="-m-2.5 rounded-md p-2.5 text-white"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="sr-only">Close menu</span>
                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
            <div className="mt-6 flow-root">
              <div className="-my-6 divide-y divide-gray-500/10">
                <div className="space-y-2 py-6">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-white hover:bg-white hover:bg-opacity-20 hover:text-white"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.name}
                    </Link>
                  ))}
                  
                  {/* Show authentication-based navigation items */}
                  {user ? (
                    <>
                      <Link
                        href="/portal"
                        className="flex items-center -mx-3 rounded-lg px-3 py-2 text-base font-semibold leading-7 text-white hover:bg-white hover:bg-opacity-20 hover:text-white"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <UserIcon className="mr-3 h-5 w-5" />
                        Student Portal
                      </Link>
                      {isAdmin && (
                        <Link
                          href="/admin"
                          className="flex items-center -mx-3 rounded-lg px-3 py-2 text-base font-semibold leading-7 text-white hover:bg-white hover:bg-opacity-20 hover:text-white"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <CogIcon className="mr-3 h-5 w-5" />
                          Admin Panel
                        </Link>
                      )}
                      <button
                        onClick={() => {
                          handleSignOut();
                          setMobileMenuOpen(false);
                        }}
                        className="flex items-center -mx-3 rounded-lg px-3 py-2 text-base font-semibold leading-7 text-white hover:bg-white hover:bg-opacity-20 hover:text-white w-full text-left"
                      >
                        <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5" />
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => {
                        handleSignIn();
                        setMobileMenuOpen(false);
                      }}
                      className="flex items-center -mx-3 rounded-lg px-3 py-2 text-base font-semibold leading-7 text-white hover:bg-white hover:bg-opacity-20 hover:text-white w-full text-left"
                    >
                      Sign In
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <div className="fixed inset-0 bg-opacity-75 transition-opacity" style={{backgroundColor: '#87AA6A'}} onClick={() => setShowAuthModal(false)}></div>
            
            <div className="relative transform overflow-hidden rounded-lg px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-sm sm:p-6" style={{backgroundColor: '#535925'}}>
              <form onSubmit={handleAuthSubmit}>
                <div>
                  <h3 className="text-base font-semibold leading-6 text-white mb-4">Sign In</h3>
                  
                  {authError && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                      {authError}
                    </div>
                  )}
                  
                  <div className="mb-4">
                    <label htmlFor="email" className="block text-sm font-medium text-white mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white bg-transparent placeholder-gray-300"
                      required
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label htmlFor="password" className="block text-sm font-medium text-white mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white bg-transparent placeholder-gray-300"
                      required
                    />
                  </div>
                </div>
                
                <div className="mt-5 sm:mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAuthModal(false)}
                    className="inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                    style={{color: '#87AA6A'}}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSigningIn}
                    className="inline-flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50"
                    style={{backgroundColor: '#BC6A1B'}}
                  >
                    {isSigningIn ? 'Signing in...' : 'Sign In'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  DocumentTextIcon,
  DocumentArrowDownIcon,
  CheckIcon,
  CalendarDaysIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';
import Navigation from '@/components/Navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { User } from '@supabase/auth-helpers-nextjs';

const StudentPortal = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [materials, setMaterials] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
      
      if (user) {
        loadStudentData(user.id);
      }
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          loadStudentData(session.user.id);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const loadStudentData = async (userId: string) => {
    try {
      // Load materials
      const { data: materialsData, error: materialsError } = await supabase
        .from('student_materials')
        .select('*')
        .eq('student_id', userId)
        .order('created_at', { ascending: false });

      if (materialsError) {
        console.error('Error loading materials:', materialsError);
      } else {
        setMaterials(materialsData || []);
      }

      // Load assignments
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('student_assignments')
        .select('*')
        .eq('student_id', userId)
        .order('day_order', { ascending: true });

      if (assignmentsError) {
        console.error('Error loading assignments:', assignmentsError);
      } else {
        setAssignments(assignmentsData || []);
      }
    } catch (error) {
      console.error('Error loading student data:', error);
    }
  };

  const downloadMaterial = async (material: any) => {
    try {
      const { data, error } = await supabase.storage
        .from('student-materials')
        .download(material.file_path);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = material.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Error downloading file');
    }
  };

  const toggleAssignmentComplete = async (assignmentId: string, completed: boolean) => {
    try {
      const { error } = await supabase
        .from('student_assignments')
        .update({ completed: !completed })
        .eq('id', assignmentId);

      if (error) throw error;

      // Reload assignments
      if (user) {
        loadStudentData(user.id);
      }
    } catch (error) {
      console.error('Error updating assignment:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{backgroundColor: '#87AA6A'}}>
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen flex items-center justify-center" style={{backgroundColor: '#87AA6A'}}>
          <div className="text-center text-white">
            <AcademicCapIcon className="h-16 w-16 mx-auto mb-4 opacity-80" />
            <h1 className="text-2xl font-bold mb-4">Student Portal</h1>
            <p className="text-lg mb-8">Please sign in to access your materials and assignments.</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen" style={{backgroundColor: '#87AA6A'}}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl font-bold text-white mb-2">Student Portal</h1>
            <p className="text-white text-opacity-80">Welcome back, {user.email}</p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Materials Section */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="p-6 rounded-lg"
              style={{backgroundColor: 'rgba(255,255,255,0.9)'}}
            >
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <DocumentTextIcon className="h-6 w-6 mr-2" />
                Your Materials
              </h2>

              {materials.length === 0 ? (
                <div className="text-gray-600 text-center py-8">
                  <DocumentTextIcon className="h-12 w-12 mx-auto mb-3 opacity-40" />
                  <p>No materials have been shared yet.</p>
                  <p className="text-sm mt-2">Check back later for sheet music and practice materials.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {materials.map((material) => (
                    <div
                      key={material.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center">
                        <DocumentTextIcon className="h-5 w-5 text-gray-600 mr-3" />
                        <div>
                          <p className="font-medium text-gray-800">{material.file_name}</p>
                          <p className="text-sm text-gray-500">
                            Added {new Date(material.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => downloadMaterial(material)}
                        className="flex items-center px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                      >
                        <DocumentArrowDownIcon className="h-4 w-4 mr-1" />
                        Download
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Assignments Section */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="p-6 rounded-lg"
              style={{backgroundColor: 'rgba(255,255,255,0.9)'}}
            >
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <CalendarDaysIcon className="h-6 w-6 mr-2" />
                Weekly Schedule
              </h2>

              {assignments.length === 0 ? (
                <div className="text-gray-600 text-center py-8">
                  <CalendarDaysIcon className="h-12 w-12 mx-auto mb-3 opacity-40" />
                  <p>No assignments scheduled yet.</p>
                  <p className="text-sm mt-2">Your weekly practice schedule will appear here.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => {
                    const dayAssignments = assignments.filter(a => a.day === day);
                    if (dayAssignments.length === 0) return null;
                    
                    return (
                      <div key={day} className="border-l-4 border-blue-500 pl-4">
                        <h3 className="font-semibold text-gray-800 capitalize mb-2">{day}</h3>
                        <div className="space-y-2">
                          {dayAssignments.map((assignment) => (
                            <div
                              key={assignment.id}
                              className={`p-3 rounded-lg transition-all ${
                                assignment.completed 
                                  ? 'bg-green-50 border border-green-200' 
                                  : 'bg-gray-50 border border-gray-200'
                              }`}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h4 className={`font-medium ${
                                    assignment.completed 
                                      ? 'text-green-800 line-through' 
                                      : 'text-gray-800'
                                  }`}>
                                    {assignment.title}
                                  </h4>
                                  {assignment.description && (
                                    <p className={`text-sm mt-1 ${
                                      assignment.completed 
                                        ? 'text-green-600' 
                                        : 'text-gray-600'
                                    }`}>
                                      {assignment.description}
                                    </p>
                                  )}
                                </div>
                                <button
                                  onClick={() => toggleAssignmentComplete(assignment.id, assignment.completed)}
                                  className={`ml-3 p-1 rounded ${
                                    assignment.completed
                                      ? 'text-green-600 hover:text-green-800'
                                      : 'text-gray-400 hover:text-green-600'
                                  }`}
                                >
                                  <CheckIcon className="h-5 w-5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
};

export default StudentPortal;
} from '@heroicons/react/24/outline';

export default function StudentPortal() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignedIn, setIsSignedIn] = useState(false);

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    // This is a demo - in production, this would connect to Supabase auth
    if (email && password) {
      setIsSignedIn(true);
    }
  };

  if (isSignedIn) {
    return (
      <div className="min-h-screen" style={{backgroundColor: '#87AA6A'}}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-4">
              Welcome to Your Student Portal
            </h1>
            <p className="text-white text-opacity-80 text-xl">
              Access your lesson materials, practice guides, and progress tracking
            </p>
          </div>

          {/* Dashboard Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Lesson Materials */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="rounded-2xl p-6 hover-lift"
              style={{backgroundColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)'}}
            >
              <div className="flex items-center mb-4">
                <BookOpenIcon className="h-8 w-8 text-white mr-3" />
                <h3 className="text-xl font-bold text-white">Lesson Materials</h3>
              </div>
              <p className="text-white text-opacity-80 mb-4">
                Access sheet music, tabs, and lesson notes from your recent sessions.
              </p>
              <button className="w-full py-2 px-4 bg-white bg-opacity-20 text-white rounded-lg hover:bg-opacity-30 transition-colors">
                View Materials
              </button>
            </motion.div>

            {/* Practice Tracks */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="rounded-2xl p-6 hover-lift"
              style={{backgroundColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)'}}
            >
              <div className="flex items-center mb-4">
                <MusicalNoteIcon className="h-8 w-8 text-white mr-3" />
                <h3 className="text-xl font-bold text-white">Practice Tracks</h3>
              </div>
              <p className="text-white text-opacity-80 mb-4">
                Backing tracks and play-along recordings to enhance your practice.
              </p>
              <button className="w-full py-2 px-4 bg-white bg-opacity-20 text-white rounded-lg hover:bg-opacity-30 transition-colors">
                Listen to Tracks
              </button>
            </motion.div>

            {/* Progress Tracking */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="rounded-2xl p-6 hover-lift"
              style={{backgroundColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)'}}
            >
              <div className="flex items-center mb-4">
                <DocumentTextIcon className="h-8 w-8 text-white mr-3" />
                <h3 className="text-xl font-bold text-white">Progress Notes</h3>
              </div>
              <p className="text-white text-opacity-80 mb-4">
                Review your progress and see notes from your instructor.
              </p>
              <button className="w-full py-2 px-4 bg-white bg-opacity-20 text-white rounded-lg hover:bg-opacity-30 transition-colors">
                View Progress
              </button>
            </motion.div>

            {/* Upcoming Lessons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="rounded-2xl p-6 hover-lift"
              style={{backgroundColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)'}}
            >
              <div className="flex items-center mb-4">
                <CalendarIcon className="h-8 w-8 text-white mr-3" />
                <h3 className="text-xl font-bold text-white">Upcoming Lessons</h3>
              </div>
              <p className="text-white text-opacity-80 mb-4">
                View and manage your scheduled lesson times.
              </p>
              <button className="w-full py-2 px-4 bg-white bg-opacity-20 text-white rounded-lg hover:bg-opacity-30 transition-colors">
                View Schedule
              </button>
            </motion.div>

            {/* Practice Timer */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="rounded-2xl p-6 hover-lift"
              style={{backgroundColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)'}}
            >
              <div className="flex items-center mb-4">
                <ClockIcon className="h-8 w-8 text-white mr-3" />
                <h3 className="text-xl font-bold text-white">Practice Timer</h3>
              </div>
              <p className="text-white text-opacity-80 mb-4">
                Track your practice time and build consistent habits.
              </p>
              <button className="w-full py-2 px-4 bg-white bg-opacity-20 text-white rounded-lg hover:bg-opacity-30 transition-colors">
                Start Timer
              </button>
            </motion.div>

            {/* Quick Message */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="rounded-2xl p-6 hover-lift"
              style={{backgroundColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)'}}
            >
              <div className="flex items-center mb-4">
                <UserIcon className="h-8 w-8 text-white mr-3" />
                <h3 className="text-xl font-bold text-white">Contact Instructor</h3>
              </div>
              <p className="text-white text-opacity-80 mb-4">
                Send a quick message or question to your instructor.
              </p>
              <button className="w-full py-2 px-4 bg-white bg-opacity-20 text-white rounded-lg hover:bg-opacity-30 transition-colors">
                Send Message
              </button>
            </motion.div>
          </div>

          {/* Sign Out */}
          <div className="text-center mt-12">
            <button
              onClick={() => setIsSignedIn(false)}
              className="text-white text-opacity-80 hover:text-opacity-100 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{backgroundColor: '#87AA6A'}}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full mx-4"
      >
        <div
          className="rounded-2xl p-8"
          style={{backgroundColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)'}}
        >
          <div className="text-center mb-8">
            <UserIcon className="h-12 w-12 text-white mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Student Portal</h2>
            <p className="text-white text-opacity-80">
              Sign in to access your lesson materials and practice resources
            </p>
          </div>

          <form onSubmit={handleSignIn} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg bg-white bg-opacity-10 border border-white border-opacity-20 text-white placeholder-white placeholder-opacity-60 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg bg-white bg-opacity-10 border border-white border-opacity-20 text-white placeholder-white placeholder-opacity-60 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 font-semibold text-white rounded-lg transition-all hover-lift"
              style={{backgroundColor: '#BC6A1B'}}
            >
              Sign In to Portal
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-white text-opacity-60 text-sm">
              Need access? Contact your instructor for login credentials.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

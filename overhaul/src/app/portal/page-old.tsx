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
import { createBrowserClient } from '@supabase/ssr';
import type { User } from '@supabase/supabase-js';

const StudentPortal = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [materials, setMaterials] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

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

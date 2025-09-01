'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  DocumentTextIcon,
  DocumentArrowDownIcon,
  CheckIcon,
  CalendarDaysIcon,
  AcademicCapIcon,
  EyeIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlayIcon,
  MusicalNoteIcon,
  SpeakerWaveIcon,
  HeartIcon,
  ShareIcon,
  ArrowTopRightOnSquareIcon,
  ForwardIcon,
  BackwardIcon
} from '@heroicons/react/24/outline';
import Navigation from '@/components/Navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { User } from '@supabase/auth-helpers-nextjs';

// YouTube API types
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

const StudentPortal = () => {
  const [materials, setMaterials] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'materials' | 'videos' | 'schedule'>('materials');
  const [currentMaterialIndex, setCurrentMaterialIndex] = useState(0);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [materialUrls, setMaterialUrls] = useState<{[key: string]: string}>({});
  const supabase = createClientComponentClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
      
      if (user) {
        // Check if user is admin
        const isAdmin = user.email === 'grantmatai@gmail.com';
        setIsAdminMode(isAdmin);
        
        if (!isAdmin) {
          // Load data for regular student only
          loadStudentData(user.id);
        } else {
          // For admin users, clear data until they select a student
          setMaterials([]);
          setAssignments([]);
          setVideos([]);
        }
      }
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          const isAdmin = session.user.email === 'grantmatai@gmail.com';
          setIsAdminMode(isAdmin);
          
          if (!isAdmin) {
            loadStudentData(session.user.id);
          } else {
            // For admin users, clear data until they select a student
            setMaterials([]);
            setAssignments([]);
            setVideos([]);
          }
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  // Load students when user is set and is admin
  useEffect(() => {
    if (user && isAdminMode) {
      console.log('User is admin, loading students...');
      loadStudentsForAdmin();
    }
  }, [user, isAdminMode]);

  // Reset material index when materials change
  useEffect(() => {
    if (materials.length > 0 && currentMaterialIndex >= materials.length) {
      setCurrentMaterialIndex(0);
    }
  }, [materials, currentMaterialIndex]);

  // Reset video index when videos change
  useEffect(() => {
    if (videos.length > 0 && currentVideoIndex >= videos.length) {
      setCurrentVideoIndex(0);
    }
  }, [videos, currentVideoIndex]);

  // Load students list for admin mode
  const loadStudentsForAdmin = async () => {
    if (!user || !user.email) {
      console.error('No user or email available for loading students');
      return;
    }

    try {
      console.log('Loading students for admin:', user.email);
      const response = await fetch(`/api/admin/students?userEmail=${encodeURIComponent(user.email)}`);
      const result = await response.json();

      console.log('Students API response:', { status: response.status, result });
      console.log('Full result data:', result.data);
      console.log('Result data type:', typeof result.data, Array.isArray(result.data));

      if (response.ok) {
        setStudents(result.data || []);
        console.log('Loaded students:', result.data?.length || 0);
        
        // Auto-select first student if available
        if (result.data && result.data.length > 0) {
          const firstStudentId = result.data[0].id;
          setSelectedStudentId(firstStudentId);
          loadStudentDataViaAPI(firstStudentId);
        }
      } else {
        console.error('Error loading students:', result.error);
      }
    } catch (error) {
      console.error('Error loading students:', error);
    }
  };

  // Load student data via API for admin mode (bypasses RLS issues)
  const loadStudentDataViaAPI = async (studentId: string) => {
    if (!user || !isAdminMode) return;
    
    try {
      console.log('Loading student data via API for student ID:', studentId);
      const response = await fetch(`/api/admin/materials?studentId=${studentId}&userEmail=${user.email}`);
      const result = await response.json();

      console.log('API materials response:', result);

      if (response.ok) {
        console.log('Setting materials from API:', result.data?.length || 0, 'items');
        setMaterials(result.data || []);
      } else {
        console.error('Error loading materials via API:', result.error);
        setMaterials([]);
      }

      // Load assignments via API (for admin mode)
      const assignmentsResponse = await fetch(`/api/admin/assignments?studentId=${studentId}&userEmail=${encodeURIComponent(user?.email || '')}`);
      
      if (assignmentsResponse.ok) {
        const assignmentsResult = await assignmentsResponse.json();
        if (assignmentsResult.success) {
          setAssignments(assignmentsResult.data || []);
        } else {
          console.error('Error loading assignments via API:', assignmentsResult.error);
          setAssignments([]);
        }
      } else {
        console.error('Error loading assignments via API:', assignmentsResponse.statusText);
        setAssignments([]);
      }

      // Load videos via API (for admin mode)
      const videosResponse = await fetch(`/api/admin/videos?studentId=${studentId}&userEmail=${encodeURIComponent(user?.email || '')}`);
      
      if (videosResponse.ok) {
        const videosResult = await videosResponse.json();
        if (videosResult.success) {
          setVideos(videosResult.data || []);
        } else {
          console.error('Error loading videos via API:', videosResult.error);
          setVideos([]);
        }
      } else {
        console.error('Error loading videos via API:', videosResponse.statusText);
        setVideos([]);
      }
    } catch (error) {
      console.error('Error loading student data via API:', error);
      setMaterials([]);
      setAssignments([]);
      setVideos([]);
    }
  };

  // Handle student selection change in admin mode
  const handleStudentChange = (studentId: string) => {
    setSelectedStudentId(studentId);
    loadStudentDataViaAPI(studentId);
  };

  const loadStudentData = async (userId: string) => {
    try {
      console.log('Loading student data for user ID:', userId);
      
      // Load materials
      const { data: materialsData, error: materialsError } = await supabase
        .from('student_materials')
        .select('*')
        .eq('student_id', userId)
        .order('created_at', { ascending: false });

      console.log('Materials query result:', { materialsData, materialsError });

      if (materialsError) {
        console.error('Error loading materials:', materialsError);
      } else {
        console.log('Setting materials:', materialsData?.length || 0, 'items');
        setMaterials(materialsData || []);
      }

      // Load assignments via student API
      const assignmentsResponse = await fetch(`/api/student/assignments?studentId=${userId}`);
      
      if (assignmentsResponse.ok) {
        const assignmentsResult = await assignmentsResponse.json();
        if (assignmentsResult.success) {
          setAssignments(assignmentsResult.data || []);
        } else {
          console.error('Error loading assignments:', assignmentsResult.error);
          setAssignments([]);
        }
      } else {
        console.error('Error loading assignments:', assignmentsResponse.statusText);
        setAssignments([]);
      }

      // Load videos via student API
      const videosResponse = await fetch(`/api/student/videos?studentId=${userId}`);
      
      if (videosResponse.ok) {
        const videosResult = await videosResponse.json();
        if (videosResult.success) {
          setVideos(videosResult.data || []);
        } else {
          console.error('Error loading videos:', videosResult.error);
          setVideos([]);
        }
      } else {
        console.error('Error loading videos:', videosResponse.statusText);
        setVideos([]);
      }
    } catch (error) {
      console.error('Error loading student data:', error);
    }
  };

  const downloadMaterial = async (material: any) => {
    try {
      const response = await fetch(`/api/materials/download?filePath=${encodeURIComponent(material.file_path)}&studentId=${isAdminMode ? selectedStudentId : user?.id}&userEmail=${encodeURIComponent(user?.email || '')}`);
      
      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = material.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading material:', error);
    }
  };

  // Memoize the load function to prevent dependency loops
  const loadMaterialForViewing = useCallback(async (material: any) => {
    if (materialUrls[material.id]) {
      return materialUrls[material.id];
    }

    try {
      const response = await fetch(`/api/materials/download?filePath=${encodeURIComponent(material.file_path)}&studentId=${isAdminMode ? selectedStudentId : user?.id}&userEmail=${encodeURIComponent(user?.email || '')}`);
      
      if (!response.ok) {
        throw new Error(`Load failed: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setMaterialUrls(prev => ({ ...prev, [material.id]: url }));
      return url;
    } catch (error) {
      console.error('Error loading material for viewing:', error);
      return null;
    }
  }, [materialUrls, isAdminMode, selectedStudentId, user?.id, user?.email]);

  const nextMaterial = () => {
    if (materials.length > 0) {
      setCurrentMaterialIndex((prev) => (prev + 1) % materials.length);
    }
  };

  const previousMaterial = () => {
    if (materials.length > 0) {
      setCurrentMaterialIndex((prev) => (prev - 1 + materials.length) % materials.length);
    }
  };

  const nextVideo = () => {
    if (videos.length > 0) {
      setCurrentVideoIndex((prev) => (prev + 1) % videos.length);
    }
  };

  const previousVideo = () => {
    if (videos.length > 0) {
      setCurrentVideoIndex((prev) => (prev - 1 + videos.length) % videos.length);
    }
  };

  const isViewableFileType = (fileType: string) => {
    return fileType.startsWith('image/') || fileType === 'application/pdf';
  };

// Video Player Component (simplified version based on music page)
const VideoPlayer = ({ videos, currentIndex, onVideoChange }: any) => {
  const [player, setPlayer] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentKey, setCurrentKey] = useState(0);
  
  const currentVideo = videos[currentIndex];

  // Load YouTube Player API
  useEffect(() => {
    if (typeof window === 'undefined' || !currentVideo) return;

    // Load YouTube API if not already loaded
    if (!window.YT) {
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      script.async = true;
      document.body.appendChild(script);

      window.onYouTubeIframeAPIReady = () => {
        initializePlayer();
      };
    } else {
      initializePlayer();
    }
  }, [currentVideo?.youtube_id, currentKey]);

  const initializePlayer = () => {
    if (!window.YT || !window.YT.Player || !currentVideo) return;

    // Destroy old player if it exists
    if (player) {
      try {
        player.destroy();
      } catch (error) {
        console.log('Error destroying old player:', error);
      }
      setPlayer(null);
    }

    try {
      const newPlayer = new window.YT.Player(`youtube-player-${currentKey}`, {
        height: '100%',
        width: '100%',
        videoId: currentVideo.youtube_id,
        playerVars: {
          rel: 0,
          modestbranding: 1,
          controls: 1,
          autoplay: 0,
          origin: window.location.origin,
        },
        events: {
          onReady: (event: any) => {
            setPlayer(event.target);
          },
          onError: (event: any) => {
            console.error('YouTube player error:', event.data);
          }
        },
      });
    } catch (error) {
      console.error('Error creating YouTube player:', error);
    }
  };

  const togglePlay = () => {
    if (player) {
      if (isPlaying) {
        player.pauseVideo();
        setIsPlaying(false);
      } else {
        player.playVideo();
        setIsPlaying(true);
      }
    }
  };

  const selectVideo = (index: number) => {
    onVideoChange(index);
    setIsPlaying(false);
    setCurrentKey(prev => prev + 1);
  };

  if (!currentVideo) {
    return (
      <div className="h-96 flex items-center justify-center bg-gray-100">
        <p className="text-gray-500">No videos available</p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl p-8 shadow-forest" style={{backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(20px)'}}>
      {/* Main Video Player */}
      <div className="aspect-video rounded-2xl overflow-hidden mb-6 relative">
        <div
          id={`youtube-player-${currentKey}`}
          className="w-full h-full rounded-2xl"
        ></div>
      </div>
      
      {/* Video Info */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-white mb-2">
            {currentVideo.title}
          </h3>
          {currentVideo.description && (
            <p className="text-white text-opacity-70 text-sm">
              {currentVideo.description}
            </p>
          )}
        </div>
        
        <div className="flex items-center space-x-4 ml-8">
          <button
            onClick={() => {
              const newIndex = (currentIndex - 1 + videos.length) % videos.length;
              selectVideo(newIndex);
            }}
            className="p-3 rounded-full hover:scale-110 transition-transform"
            style={{backgroundColor: '#BC6A1B'}}
            disabled={videos.length <= 1}
          >
            <BackwardIcon className="w-6 h-6 text-white" />
          </button>
          
          <button
            onClick={togglePlay}
            className="p-4 rounded-full hover:scale-110 transition-transform"
            style={{backgroundColor: '#602718'}}
          >
            {isPlaying ? (
              <div className="w-8 h-8 flex items-center justify-center">
                <div className="w-2 h-6 bg-white rounded mr-1"></div>
                <div className="w-2 h-6 bg-white rounded"></div>
              </div>
            ) : (
              <PlayIcon className="w-8 h-8 text-white ml-1" />
            )}
          </button>
          
          <button
            onClick={() => {
              const newIndex = (currentIndex + 1) % videos.length;
              selectVideo(newIndex);
            }}
            className="p-3 rounded-full hover:scale-110 transition-transform"
            style={{backgroundColor: '#BC6A1B'}}
            disabled={videos.length <= 1}
          >
            <ForwardIcon className="w-6 h-6 text-white" />
          </button>
        </div>
      </div>
      
      {/* Video List */}
      {videos.length > 1 && (
        <div className="border-t border-white border-opacity-20 pt-6">
          <h4 className="text-lg font-semibold text-white mb-4">Assigned Videos ({videos.length})</h4>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {videos.map((video: any, index: number) => (
              <button
                key={video.id}
                onClick={() => selectVideo(index)}
                className={`w-full flex items-center space-x-4 p-3 rounded-xl transition-all hover:bg-white hover:bg-opacity-10 ${
                  index === currentIndex ? 'ring-2 ring-orange-400 bg-orange-900 bg-opacity-30' : ''
                }`}
              >
                <div className="relative flex-shrink-0">
                  <img
                    src={video.thumbnail_url || `https://img.youtube.com/vi/${video.youtube_id}/mqdefault.jpg`}
                    alt={video.title}
                    className="w-20 h-12 object-cover rounded-lg"
                  />
                  {index === currentIndex && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{backgroundColor: '#BC6A1B'}}>
                        <PlayIcon className="w-3 h-3 text-white ml-0.5" />
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex-1 text-left">
                  <p className={`font-medium text-sm line-clamp-1 ${
                    index === currentIndex ? 'text-white' : 'text-white'
                  }`}>
                    {video.title}
                  </p>
                  {video.description && (
                    <p className={`text-xs line-clamp-1 ${
                      index === currentIndex ? 'text-white text-opacity-80' : 'text-white text-opacity-60'
                    }`}>
                      {video.description}
                    </p>
                  )}
                </div>
                <div className="text-xs text-white text-opacity-60">
                  {index + 1}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Material Viewer Component
const MaterialViewer = ({ material, materialUrls, loadMaterialForViewing }: any) => {
  const [viewUrl, setViewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMaterial = async () => {
      if (!material) return;
      
      setLoading(true);
      if (materialUrls[material.id]) {
        setViewUrl(materialUrls[material.id]);
        setLoading(false);
      } else if (isViewableFileType(material.file_type)) {
        const url = await loadMaterialForViewing(material);
        setViewUrl(url);
        setLoading(false);
      } else {
        setLoading(false);
      }
    };

    loadMaterial();
  }, [material, materialUrls, loadMaterialForViewing]);

  if (!material) {
    return (
      <div className="h-96 flex items-center justify-center bg-gray-100">
        <p className="text-gray-500">No material selected</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
          <p className="text-gray-500">Loading material...</p>
        </div>
      </div>
    );
  }

  if (!isViewableFileType(material.file_type)) {
    return (
      <div className="h-96 flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <DocumentTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">{material.file_name}</p>
          <p className="text-gray-500 text-sm mt-2">Preview not available for this file type</p>
          <p className="text-gray-500 text-sm">Use the download button to view this file</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative bg-gray-100">
      {material.file_type.startsWith('image/') ? (
        <div className="flex items-center justify-center min-h-96 p-4">
          <img
            src={viewUrl || ''}
            alt={material.file_name}
            className="max-w-full max-h-96 object-contain rounded-lg shadow-lg"
          />
        </div>
      ) : material.file_type === 'application/pdf' ? (
        <iframe
          src={viewUrl || ''}
          className="w-full h-96 border-0"
          title={material.file_name}
        />
      ) : null}
    </div>
  );
};

  const toggleAssignmentComplete = async (assignmentId: string, completed: boolean) => {
    try {
      if (isAdminMode && selectedStudentId) {
        // Admin mode - use admin API
        const userEmail = encodeURIComponent(user?.email || '');
        const response = await fetch(`/api/admin/assignments?userEmail=${userEmail}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            assignmentId,
            completed: !completed
          })
        });

        if (!response.ok) {
          throw new Error('Failed to update assignment');
        }

        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error || 'Failed to update assignment');
        }

        // Reload assignments
        loadStudentDataViaAPI(selectedStudentId);
      } else if (user) {
        // Student mode - use student API
        const response = await fetch(`/api/student/assignments?studentId=${user.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            assignmentId,
            completed: !completed
          })
        });

        if (!response.ok) {
          throw new Error('Failed to update assignment');
        }

        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error || 'Failed to update assignment');
        }

        // Reload assignments
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
            <h1 className="text-3xl font-bold text-white mb-2">
              {isAdminMode ? 'Student Portal - Admin Preview' : 'Student Portal'}
            </h1>
            <p className="text-white text-opacity-80">
              {isAdminMode ? `Logged in as Admin: ${user.email}` : `Welcome back, ${user.email}`}
            </p>
          </motion.div>

          {/* Admin Student Selector */}
          {isAdminMode && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-8 p-4 rounded-lg"
              style={{backgroundColor: 'rgba(255,255,255,0.1)'}}
            >
              <div className="flex items-center justify-center space-x-4">
                <label className="text-white font-semibold">Preview Student Portal for:</label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => handleStudentChange(e.target.value)}
                  className="px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  <option value="">Select a student...</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.user_metadata?.first_name && student.user_metadata?.last_name 
                        ? `${student.user_metadata.first_name} ${student.user_metadata.last_name} (${student.email})`
                        : student.email}
                    </option>
                  ))}
                </select>
                {selectedStudentId && (
                  <span className="text-white text-sm opacity-80">
                    (Viewing as: {(() => {
                      const student = students.find(s => s.id === selectedStudentId);
                      if (!student) return 'Unknown Student';
                      if (student.user_metadata?.first_name && student.user_metadata?.last_name) {
                        return `${student.user_metadata.first_name} ${student.user_metadata.last_name}`;
                      }
                      return student.email;
                    })()})
                  </span>
                )}
              </div>
            </motion.div>
          )}

          {/* Show content only if: not admin mode OR admin mode with student selected */}
          {(!isAdminMode || selectedStudentId) ? (
            <>
              {/* Tab Navigation */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-8"
              >
                <div className="flex space-x-2 bg-white bg-opacity-20 p-2 rounded-lg">
                  <button
                    onClick={() => setActiveTab('materials')}
                    className={`flex-1 px-6 py-3 rounded-md font-medium transition-all duration-200 border-2 ${
                      activeTab === 'materials'
                        ? 'bg-green-600 text-white shadow-md border-green-600'
                        : 'text-green-800 bg-white hover:bg-gray-100 border-white'
                    }`}
                  >
                    <DocumentTextIcon className="h-5 w-5 inline mr-2" />
                    Your Materials
                  </button>
                  <button
                    onClick={() => setActiveTab('videos')}
                    className={`flex-1 px-6 py-3 rounded-md font-medium transition-all duration-200 border-2 ${
                      activeTab === 'videos'
                        ? 'bg-green-600 text-white shadow-md border-green-600'
                        : 'text-green-800 bg-white hover:bg-gray-100 border-white'
                    }`}
                  >
                    <PlayIcon className="h-5 w-5 inline mr-2" />
                    Videos
                  </button>
                  <button
                    onClick={() => setActiveTab('schedule')}
                    className={`flex-1 px-6 py-3 rounded-md font-medium transition-all duration-200 border-2 ${
                      activeTab === 'schedule'
                        ? 'bg-green-600 text-white shadow-md border-green-600'
                        : 'text-green-800 bg-white hover:bg-gray-100 border-white'
                    }`}
                  >
                    <CalendarDaysIcon className="h-5 w-5 inline mr-2" />
                    Weekly Schedule
                  </button>
                </div>
              </motion.div>

              {/* Tab Content */}
              {activeTab === 'materials' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white bg-opacity-90 backdrop-blur-sm rounded-xl shadow-xl overflow-hidden"
                >
                  {materials.length === 0 ? (
                    <div className="text-center py-12 p-8">
                      <DocumentTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      {isAdminMode && !selectedStudentId ? (
                        <>
                          <p className="text-gray-600 text-lg">Please select a student to view their materials.</p>
                          <p className="text-gray-500">Use the dropdown above to choose a student.</p>
                        </>
                      ) : (
                        <>
                          <p className="text-gray-600 text-lg">No materials uploaded yet.</p>
                          <p className="text-gray-500">Check back later for new materials from your instructor.</p>
                        </>
                      )}
                    </div>
                  ) : (
                    <>
                      {/* Material Viewer */}
                      <div className="relative">
                        <MaterialViewer 
                          material={materials[currentMaterialIndex]}
                          materialUrls={materialUrls}
                          loadMaterialForViewing={loadMaterialForViewing}
                        />
                        
                        {/* Navigation Controls */}
                        {materials.length > 1 && (
                          <>
                            <button
                              onClick={previousMaterial}
                              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-3 shadow-lg transition-all"
                            >
                              <ChevronLeftIcon className="h-6 w-6 text-gray-700" />
                            </button>
                            <button
                              onClick={nextMaterial}
                              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-3 shadow-lg transition-all"
                            >
                              <ChevronRightIcon className="h-6 w-6 text-gray-700" />
                            </button>
                          </>
                        )}
                      </div>

                      {/* Material Info Bar */}
                      <div className="flex items-center justify-between p-4 bg-gray-50 border-t">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800">{materials[currentMaterialIndex]?.file_name}</h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                            <span>Added {new Date(materials[currentMaterialIndex]?.created_at).toLocaleDateString()}</span>
                            {materials[currentMaterialIndex]?.file_size && (
                              <span>{(materials[currentMaterialIndex].file_size / 1024 / 1024).toFixed(1)} MB</span>
                            )}
                            {materials.length > 1 && (
                              <span>{currentMaterialIndex + 1} of {materials.length}</span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => downloadMaterial(materials[currentMaterialIndex])}
                          className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                          Download
                        </button>
                      </div>

                      {/* Material Thumbnails */}
                      {materials.length > 1 && (
                        <div className="p-4 bg-gray-50">
                          <div className="flex space-x-2 overflow-x-auto">
                            {materials.map((material, index) => (
                              <button
                                key={material.id}
                                onClick={() => setCurrentMaterialIndex(index)}
                                className={`flex-shrink-0 w-16 h-16 rounded-lg border-2 transition-all ${
                                  index === currentMaterialIndex
                                    ? 'border-green-500 bg-green-50'
                                    : 'border-gray-200 bg-white hover:border-gray-300'
                                }`}
                              >
                                <div className="w-full h-full flex items-center justify-center">
                                  <DocumentTextIcon className={`h-6 w-6 ${
                                    index === currentMaterialIndex ? 'text-green-600' : 'text-gray-400'
                                  }`} />
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </motion.div>
              )}

              {activeTab === 'videos' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="rounded-xl shadow-xl overflow-hidden"
                  style={{backgroundColor: '#66732C'}}
                >
                  {videos.length === 0 ? (
                    <div className="text-center py-12 p-8">
                      <PlayIcon className="h-16 w-16 text-white text-opacity-60 mx-auto mb-4" />
                      {isAdminMode && !selectedStudentId ? (
                        <>
                          <p className="text-white text-lg">Please select a student to view their videos.</p>
                          <p className="text-white text-opacity-80">Use the dropdown above to choose a student.</p>
                        </>
                      ) : (
                        <>
                          <p className="text-white text-lg">No videos assigned yet.</p>
                          <p className="text-white text-opacity-80">Check back later for new educational videos from your instructor.</p>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="relative p-8">
                      <VideoPlayer 
                        videos={videos}
                        currentIndex={currentVideoIndex}
                        onVideoChange={setCurrentVideoIndex}
                      />
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'schedule' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white bg-opacity-90 backdrop-blur-sm rounded-xl shadow-xl p-8"
                >
                  <div className="flex items-center mb-6">
                    <CalendarDaysIcon className="h-8 w-8 text-green-700 mr-3" />
                    <h2 className="text-2xl font-bold text-gray-800">Weekly Schedule</h2>
                  </div>

                  {assignments.length === 0 ? (
                    <div className="text-center py-12">
                      <CalendarDaysIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 text-lg">No assignments scheduled yet.</p>
                      <p className="text-gray-500">Your weekly practice schedule will appear here.</p>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {assignments.map((assignment, index) => (
                        <motion.div
                          key={assignment.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className={`border rounded-lg p-4 transition-all ${
                            assignment.completed
                              ? 'border-green-200 bg-green-50'
                              : 'border-gray-200 bg-white hover:shadow-md'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <button
                                onClick={() => toggleAssignmentComplete(assignment.id, assignment.completed)}
                                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                                  assignment.completed
                                    ? 'border-green-500 bg-green-500'
                                    : 'border-gray-300 hover:border-green-400'
                                }`}
                              >
                                {assignment.completed && (
                                  <CheckIcon className="h-4 w-4 text-white" />
                                )}
                              </button>
                              <div>
                                <h3 className={`font-semibold ${
                                  assignment.completed ? 'text-green-800' : 'text-gray-800'
                                }`}>
                                  Day {assignment.day_order}: {assignment.title}
                                </h3>
                                <p className={`text-sm whitespace-pre-wrap ${
                                  assignment.completed ? 'text-green-600' : 'text-gray-600'
                                }`}>
                                  {assignment.description}
                                </p>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </>
          ) : (
            /* Show message when admin hasn't selected a student */
            <div className="text-center text-white py-12">
              <AcademicCapIcon className="h-16 w-16 mx-auto mb-4 opacity-60" />
              <h2 className="text-xl font-semibold mb-2">Select a Student</h2>
              <p className="opacity-80">Choose a student from the dropdown above to preview their portal view.</p>
            </div>
          )}

          {/* Material Viewer Modal */}
        </div>
      </div>
    </>
  );
};

export default StudentPortal;

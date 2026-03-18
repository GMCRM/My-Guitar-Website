'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CalendarDaysIcon,
  TagIcon,
  MusicalNoteIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  PlayIcon,
  LinkIcon,
  XMarkIcon,
  AcademicCapIcon,
  UserGroupIcon,
  DocumentArrowUpIcon,
  CheckIcon,
  EyeIcon,
  EyeSlashIcon,
  ChartBarIcon,
  ChevronUpIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import AdminAuth from '@/components/admin/AdminAuth';
import Navigation from '@/components/Navigation';
import PracticeManagement from '@/components/admin/PracticeManagement';
import StudentPracticeAssignment from '@/components/admin/StudentPracticeAssignment';
import PracticeAnalytics from '@/components/admin/PracticeAnalytics';
import { supabase, BlogPost, TeacherPermissions } from '@/lib/supabase';

interface MusicVideo {
  dbId: number;
  id: string;
  title: string;
  author: string;
  thumbnail: string | null;
  addedDate: string;
  order: number;
}

interface MusicAudioTrack {
  dbId: number;
  title: string;
  publicUrl: string;
  addedDate: string;
  order: number;
}

const AdminDashboardContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Initialize activeTab from URL params, localStorage, or default to 'blog'
  const getInitialTab = () => {
    // First check URL params
    const urlTab = searchParams.get('tab');
    if (urlTab && ['blog', 'music', 'messages', 'students', 'practice', 'analytics', 'teachers'].includes(urlTab)) {
      return urlTab;
    }
    
    // Then check localStorage
    if (typeof window !== 'undefined') {
      const savedTab = localStorage.getItem('admin-active-tab');
      if (savedTab && ['blog', 'music', 'messages', 'students', 'practice', 'analytics', 'teachers'].includes(savedTab)) {
        return savedTab;
      }
    }
    
    // Default to blog
    return 'blog';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPosts: 0,
    publishedPosts: 0,
    draftPosts: 0,
    subscribers: 0,
    unreadMessages: 0
  });
  const [currentUserEmail, setCurrentUserEmail] = useState('');
  const [currentUserId, setCurrentUserId] = useState('');
  const [accessResolved, setAccessResolved] = useState(false);

  const defaultPermissions: TeacherPermissions = {
    can_manage_blog: false,
    can_manage_materials: false,
    can_assign_practice: false,
    can_view_analytics: false,
    can_manage_students: false,
    can_upload_videos: false,
    can_manage_messages: false
  };

  const [currentUserPermissions, setCurrentUserPermissions] = useState<TeacherPermissions>(defaultPermissions);

  // YouTube Videos State
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [addingMusicVideo, setAddingMusicVideo] = useState(false);
  const [videoList, setVideoList] = useState<MusicVideo[]>([]);

  // Music Audio State
  const [audioTitle, setAudioTitle] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [addingMusicAudio, setAddingMusicAudio] = useState(false);
  const [audioTrackList, setAudioTrackList] = useState<MusicAudioTrack[]>([]);

  // Messages State
  const [messages, setMessages] = useState<any[]>([]);
  const [messageFilter, setMessageFilter] = useState('all'); // 'all', 'unread', 'read'
  const [selectedMessage, setSelectedMessage] = useState<any>(null);

  // Students State
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [studentMaterials, setStudentMaterials] = useState<any[]>([]);
  const [studentAssignments, setStudentAssignments] = useState<any[]>([]);
  const [studentVideos, setStudentVideos] = useState<any[]>([]);
  const [studentOptIns, setStudentOptIns] = useState<Map<string, boolean>>(new Map());
  const [studentAnalyticsOptIns, setStudentAnalyticsOptIns] = useState<Map<string, boolean>>(new Map());
  const [uploadingFile, setUploadingFile] = useState(false);
  const [newAssignment, setNewAssignment] = useState({
    day: 'monday',
    title: '',
    description: '',
    completed: false
  });
  const [editingAssignment, setEditingAssignment] = useState<any>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Video management state
  const [newVideoUrl, setNewVideoUrl] = useState('');

  // Teachers State
  const [teachers, setTeachers] = useState<any[]>([]);
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [selectedStudentForPromotion, setSelectedStudentForPromotion] = useState<string>('');
  const [teacherPermissions, setTeacherPermissions] = useState<any>({
    can_manage_blog: false,
    can_manage_materials: true,
    can_assign_practice: true,
    can_view_analytics: true,
    can_manage_students: false,
    can_upload_videos: false,
    can_manage_messages: false
  });
  const [selectedTeacherForEdit, setSelectedTeacherForEdit] = useState<any>(null);
  const [teacherStudentAssignments, setTeacherStudentAssignments] = useState<string[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [newVideoDescription, setNewVideoDescription] = useState('');
  const [addingVideo, setAddingVideo] = useState(false);

  // New Student Creation State
  const [creatingStudent, setCreatingStudent] = useState(false);
  const [newStudentForm, setNewStudentForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: ''
  });

  // Edit Student State
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [editStudentForm, setEditStudentForm] = useState({
    email: '',
    firstName: '',
    lastName: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);

  // Edit Post State
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    excerpt: '',
    content: '',
    tags: [] as string[],
    image_url: ''
  });
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const [uploadingEditImage, setUploadingEditImage] = useState(false);

  const loadCurrentUserAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) {
      setCurrentUserEmail('');
      setCurrentUserId('');
      setCurrentUserPermissions(defaultPermissions);
      setAccessResolved(true);
      return { email: '', permissions: defaultPermissions, isSuperAdmin: false };
    }

    setCurrentUserEmail(user.email);
    setCurrentUserId(user.id);

    if (user.email === 'grantmatai@gmail.com') {
      const superAdminPermissions: TeacherPermissions = {
        can_manage_blog: true,
        can_manage_materials: true,
        can_assign_practice: true,
        can_view_analytics: true,
        can_manage_students: true,
        can_upload_videos: true,
        can_manage_messages: true
      };
      setCurrentUserPermissions(superAdminPermissions);
      setAccessResolved(true);
      return { email: user.email, permissions: superAdminPermissions, isSuperAdmin: true };
    }

    const { data: teacher } = await supabase
      .from('teachers')
      .select('permissions')
      .eq('email', user.email)
      .eq('is_active', true)
      .single();

    const normalizedPermissions: TeacherPermissions = {
      can_manage_blog: Boolean(teacher?.permissions?.can_manage_blog),
      can_manage_materials: Boolean(teacher?.permissions?.can_manage_materials),
      can_assign_practice: Boolean(teacher?.permissions?.can_assign_practice),
      can_view_analytics: Boolean(teacher?.permissions?.can_view_analytics),
      can_manage_students: Boolean(teacher?.permissions?.can_manage_students),
      can_upload_videos: Boolean(teacher?.permissions?.can_upload_videos),
      can_manage_messages: Boolean(teacher?.permissions?.can_manage_messages)
    };

    setCurrentUserPermissions(normalizedPermissions);
    setAccessResolved(true);
    return { email: user.email, permissions: normalizedPermissions, isSuperAdmin: false };
  };

  // Teacher Management Functions
  const loadTeachers = async () => {
    setLoadingTeachers(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.email !== 'grantmatai@gmail.com') {
        throw new Error('Super admin access required');
      }

      const response = await fetch(`/api/admin/teachers?userEmail=${user.email}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load teachers');
      }

      setTeachers(data.teachers || []);
      setAllStudents(data.allStudents || []);
    } catch (error: any) {
      console.error('Error loading teachers:', error);
      alert(`Error loading teachers: ${error.message}`);
    } finally {
      setLoadingTeachers(false);
    }
  };

  const promoteStudentToTeacher = async () => {
    if (!selectedStudentForPromotion) {
      alert('Please select a student to promote');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.email !== 'grantmatai@gmail.com') {
        throw new Error('Super admin access required');
      }

      const response = await fetch('/api/admin/teachers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userEmail: user.email,
          studentId: selectedStudentForPromotion,
          permissions: teacherPermissions
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to promote student');
      }

      // Reset form
      setSelectedStudentForPromotion('');
      setTeacherPermissions({
        can_manage_blog: false,
        can_manage_materials: true,
        can_assign_practice: true,
        can_view_analytics: true,
        can_manage_students: false,
        can_upload_videos: false,
        can_manage_messages: false
      });

      // Reload teachers
      loadTeachers();
      
      alert('Student promoted to teacher successfully!');
    } catch (error: any) {
      console.error('Error promoting student:', error);
      alert(`Error promoting student: ${error.message}`);
    }
  };

  const updateTeacherPermissions = async (teacherId: string) => {
    if (!selectedTeacherForEdit) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.email !== 'grantmatai@gmail.com') {
        throw new Error('Super admin access required');
      }

      const response = await fetch('/api/admin/teachers', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userEmail: user.email,
          teacherId,
          permissions: selectedTeacherForEdit.permissions,
          action: 'updatePermissions'
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update permissions');
      }

      // Reset edit state
      setSelectedTeacherForEdit(null);

      // Reload teachers
      loadTeachers();
      
      alert('Teacher permissions updated successfully!');
    } catch (error: any) {
      console.error('Error updating teacher permissions:', error);
      alert(`Error updating teacher permissions: ${error.message}`);
    }
  };

  const updateStudentAssignments = async (teacherId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.email !== 'grantmatai@gmail.com') {
        throw new Error('Super admin access required');
      }

      const response = await fetch('/api/admin/teachers', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userEmail: user.email,
          teacherId,
          studentAssignments: teacherStudentAssignments,
          action: 'updateAssignments'
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update student assignments');
      }

      // Reset assignment state
      setTeacherStudentAssignments([]);

      // Reload teachers
      loadTeachers();
      
      alert('Student assignments updated successfully!');
    } catch (error: any) {
      console.error('Error updating student assignments:', error);
      alert(`Error updating student assignments: ${error.message}`);
    }
  };

  const demoteTeacher = async (teacherId: string, teacherEmail: string) => {
    if (teacherEmail === 'grantmatai@gmail.com') {
      alert('Cannot demote super admin');
      return;
    }

    if (!confirm(`Are you sure you want to demote this teacher? All their assigned students will be reassigned to you.`)) {
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.email !== 'grantmatai@gmail.com') {
        throw new Error('Super admin access required');
      }

      const response = await fetch(`/api/admin/teachers?userEmail=${user.email}&teacherId=${teacherId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to demote teacher');
      }

      // Reload teachers
      loadTeachers();
      
      alert('Teacher demoted successfully! Students have been reassigned to you.');
    } catch (error: any) {
      console.error('Error demoting teacher:', error);
      alert(`Error demoting teacher: ${error.message}`);
    }
  };

  const initializeDashboardData = async () => {
    const { email, permissions, isSuperAdmin } = await loadCurrentUserAccess();

    if (!email) {
      return;
    }

    if (permissions.can_manage_blog) {
      loadPosts();
      loadStats();
    }

    if (permissions.can_upload_videos) {
      loadVideoList(email);
      loadAudioTrackList(email);
    }

    if (permissions.can_manage_messages) {
      loadMessages(email);
    }

    loadStudents(email);

    if (isSuperAdmin) {
      loadTeachers();
    }
  };

  useEffect(() => {
    initializeDashboardData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      initializeDashboardData();
    });

    return () => subscription.unsubscribe();
  }, []);

  // Update stats when messages change
  useEffect(() => {
    if (messages.length >= 0) {
      setStats(prevStats => ({
        ...prevStats,
        unreadMessages: messages.filter(msg => !msg.read).length
      }));
    }
  }, [messages]);

  // Update URL and localStorage when tab changes
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin-active-tab', tabId);
    }
    
    // Update URL without page refresh
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('tab', tabId);
    router.replace(newUrl.pathname + newUrl.search, { scroll: false });
  };

  // Update activeTab when URL changes (back/forward navigation)
  useEffect(() => {
    const urlTab = searchParams.get('tab');
    if (urlTab && ['blog', 'music', 'messages', 'students', 'practice', 'analytics', 'teachers'].includes(urlTab)) {
      setActiveTab(urlTab);
    }
  }, [searchParams]);

  const loadPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading posts:', error);
      } else {
        setPosts(data || []);
      }
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const { data: postsData } = await supabase
        .from('blog_posts')
        .select('published');

      const { data: subscribersData } = await supabase
        .from('subscribers')
        .select('id');

      if (postsData) {
        const totalPosts = postsData.length;
        const publishedPosts = postsData.filter(p => p.published).length;
        const draftPosts = totalPosts - publishedPosts;

        setStats(prevStats => ({
          ...prevStats,
          totalPosts,
          publishedPosts,
          draftPosts,
          subscribers: subscribersData?.length || 0
        }));
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadVideoList = async (emailOverride?: string) => {
    try {
      const userEmail = emailOverride || currentUserEmail || (await supabase.auth.getUser()).data.user?.email;
      if (!userEmail) {
        setVideoList([]);
        return;
      }

      const response = await fetch(`/api/admin/music-videos?userEmail=${encodeURIComponent(userEmail)}`);
      const result = await response.json();

      if (!response.ok || !result?.success) {
        throw new Error(result?.error || 'Failed to load videos');
      }

      const normalizedVideos: MusicVideo[] = (result.data || []).map((video: any, index: number) => ({
        dbId: video.id,
        id: video.youtube_id,
        title: video.title,
        author: video.author_name || 'Grant Matai Cross',
        thumbnail: video.thumbnail_url || null,
        addedDate: video.created_at,
        order: video.display_order ?? index
      }));

      setVideoList(normalizedVideos);
    } catch (error) {
      console.error('Error in loadVideoList:', error);
      setVideoList([]);
    }
  };

  const loadAudioTrackList = async (emailOverride?: string) => {
    try {
      const userEmail = emailOverride || currentUserEmail || (await supabase.auth.getUser()).data.user?.email;
      if (!userEmail) {
        setAudioTrackList([]);
        return;
      }

      const response = await fetch(`/api/admin/music-audio?userEmail=${encodeURIComponent(userEmail)}`);
      const result = await response.json();

      if (!response.ok || !result?.success) {
        throw new Error(result?.error || 'Failed to load audio tracks');
      }

      const normalizedTracks: MusicAudioTrack[] = (result.data || []).map((track: {
        id: number;
        title: string;
        public_url: string;
        created_at: string;
        display_order: number | null;
      }, index: number) => ({
        dbId: track.id,
        title: track.title,
        publicUrl: track.public_url,
        addedDate: track.created_at,
        order: track.display_order ?? index
      }));

      setAudioTrackList(normalizedTracks);
    } catch (error) {
      console.error('Error in loadAudioTrackList:', error);
      setAudioTrackList([]);
    }
  };

  const loadMessages = async (emailOverride?: string) => {
    try {
      const userEmail = emailOverride || currentUserEmail || (await supabase.auth.getUser()).data.user?.email || '';
      const response = await fetch(`/api/contact?userEmail=${encodeURIComponent(userEmail)}`);
      if (response.ok) {
        const data = await response.json();
        // Transform the data to match the expected format
        const transformedMessages = data.messages.map((msg: any) => ({
          id: msg.id,
          type: msg.type,
          from: msg.email || 'Anonymous',
          name: msg.name,
          phone: msg.phone,
          subject: msg.subject,
          message: msg.message,
          date: new Date(msg.created_at).toLocaleDateString(),
          read: msg.status === 'read'
        }));
        setMessages(transformedMessages);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to load messages', {
          status: response.status,
          error: errorData?.error || response.statusText
        });
        // Fallback to empty array
        setMessages([]);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      setMessages([]);
    }
  };

  const loadStudents = async (emailOverride?: string) => {
    try {
      const userEmail = emailOverride || currentUserEmail || (await supabase.auth.getUser()).data.user?.email;
      if (!userEmail) {
        return;
      }

      // Load all users from API route
      const response = await fetch(`/api/admin/students?userEmail=${encodeURIComponent(userEmail)}`);
      const data = await response.json();

      if (!response.ok) {
        console.error('Error loading students:', data.error);
      } else {
        console.log('Admin page: loaded students:', data.data?.length || 0);
        const studentsList = data.data || [];
        setStudents(studentsList);
        
        // Load opt-in status for each student
        const leaderboardOptIns = new Map<string, boolean>();
        const analyticsOptIns = new Map<string, boolean>();
        
        for (const student of studentsList) {
          try {
            const optInResponse = await fetch(`/api/student/settings?studentId=${student.id}`);
            if (optInResponse.ok) {
              const optInData = await optInResponse.json();
              leaderboardOptIns.set(student.id, optInData.leaderboard_opt_in || false);
              analyticsOptIns.set(student.id, optInData.analytics_opt_in || false);
              console.log(`Student ${student.id} leaderboard opt-in:`, optInData.leaderboard_opt_in, 'analytics opt-in:', optInData.analytics_opt_in);
            }
          } catch (err) {
            console.error(`Error loading opt-in for student ${student.id}:`, err);
            leaderboardOptIns.set(student.id, false);
            analyticsOptIns.set(student.id, false);
          }
        }
        
        console.log('Total leaderboard opt-ins loaded:', leaderboardOptIns.size);
        console.log('Total analytics opt-ins loaded:', analyticsOptIns.size);
        setStudentOptIns(leaderboardOptIns);
        setStudentAnalyticsOptIns(analyticsOptIns);
      }
    } catch (error) {
      console.error('Error loading students:', error);
    }
  };

  const createStudent = async () => {
    if (!newStudentForm.email || !newStudentForm.password) {
      alert('Please enter email and password');
      return;
    }

    setCreatingStudent(true);
    
    try {
      const userEmail = currentUserEmail || (await supabase.auth.getUser()).data.user?.email || '';

      // Create new user via API route
      const response = await fetch('/api/admin/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: newStudentForm.email,
          password: newStudentForm.password,
          firstName: newStudentForm.firstName,
          lastName: newStudentForm.lastName,
          userEmail
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create student');
      }

      // Reset form
      setNewStudentForm({
        email: '',
        password: '',
        firstName: '',
        lastName: ''
      });

      // Reload students list
      loadStudents(currentUserEmail);
      
      alert('Student created successfully!');
    } catch (error: any) {
      console.error('Error creating student:', error);
      alert(`Error creating student: ${error.message}`);
    } finally {
      setCreatingStudent(false);
    }
  };

  const startEditStudent = (student: any) => {
    setEditingStudent(student);
    setEditStudentForm({
      email: student.email,
      firstName: student.user_metadata?.first_name || '',
      lastName: student.user_metadata?.last_name || '',
      password: ''
    });
  };

  const cancelEditStudent = () => {
    setEditingStudent(null);
    setEditStudentForm({
      email: '',
      firstName: '',
      lastName: '',
      password: ''
    });
    setShowPassword(false);
  };

  const updateStudent = async () => {
    if (!editingStudent || !editStudentForm.email) {
      alert('Please enter a valid email');
      return;
    }

    try {
      const userEmail = currentUserEmail || (await supabase.auth.getUser()).data.user?.email || '';

      // Update user via API route
      const response = await fetch(`/api/admin/students/${editingStudent.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: editStudentForm.email,
          firstName: editStudentForm.firstName,
          lastName: editStudentForm.lastName,
          password: editStudentForm.password,
          userEmail
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update student');
      }

      // Reset form and reload
      cancelEditStudent();
      loadStudents(currentUserEmail);
      
      alert('Student updated successfully!');
    } catch (error: any) {
      console.error('Error updating student:', error);
      alert(`Error updating student: ${error.message}`);
    }
  };

  const deleteStudent = async (student: any) => {
    const studentName = getStudentDisplayName(student);
    if (!confirm(`Are you sure you want to delete student "${studentName}"? This will also delete all their materials and assignments.`)) {
      return;
    }

    try {
      const userEmail = currentUserEmail || (await supabase.auth.getUser()).data.user?.email || '';

      // Delete user via API route
      const response = await fetch(`/api/admin/students/${student.id}?userEmail=${encodeURIComponent(userEmail)}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete student');
      }

      // If this was the selected student, clear selection
      if (selectedStudent === student.id) {
        setSelectedStudent('');
        setStudentMaterials([]);
        setStudentAssignments([]);
        setStudentVideos([]);
      }

      // Reload students list
      loadStudents(currentUserEmail);
      
      alert(`Student ${studentName} deleted successfully!`);
    } catch (error: any) {
      console.error('Error deleting student:', error);
      alert(`Error deleting student: ${error.message}`);
    }
  };

  const toggleLeaderboardOptIn = async (studentId: string, currentOptIn: boolean) => {
    try {
      const userEmail = currentUserEmail || (await supabase.auth.getUser()).data.user?.email || '';
      console.log(`Toggling leaderboard opt-in for ${studentId} from ${currentOptIn} to ${!currentOptIn}`);
      const response = await fetch(`/api/admin/students/${studentId}/leaderboard`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          leaderboard_opt_in: !currentOptIn,
          userEmail
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update leaderboard opt-in');
      }

      const result = await response.json();
      console.log('Toggle successful:', result);

      // Update local state
      const newOptIns = new Map(studentOptIns);
      newOptIns.set(studentId, !currentOptIn);
      setStudentOptIns(newOptIns);
      
    } catch (error: any) {
      console.error('Error toggling leaderboard opt-in:', error);
      alert(`Error updating leaderboard setting: ${error.message}`);
    }
  };

  const toggleAnalyticsOptIn = async (studentId: string, currentOptIn: boolean) => {
    try {
      const userEmail = currentUserEmail || (await supabase.auth.getUser()).data.user?.email || '';
      console.log(`Toggling analytics opt-in for ${studentId} from ${currentOptIn} to ${!currentOptIn}`);
      const response = await fetch(`/api/admin/students/${studentId}/analytics`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          analytics_opt_in: !currentOptIn,
          userEmail
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update analytics opt-in');
      }

      const result = await response.json();
      console.log('Toggle successful:', result);

      // Update local state
      const newOptIns = new Map(studentAnalyticsOptIns);
      newOptIns.set(studentId, !currentOptIn);
      setStudentAnalyticsOptIns(newOptIns);
      
    } catch (error: any) {
      console.error('Error toggling analytics opt-in:', error);
      alert(`Error updating analytics setting: ${error.message}`);
    }
  };

  const loadStudentMaterials = async (studentId: string) => {
    if (!studentId) return;
    
    try {
      // Get current user for API authentication
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user?.email) {
        console.error('Not authenticated user');
        return;
      }

      console.log('Loading materials via admin API for student:', studentId);
      
      // Use admin API route to load materials (bypasses RLS issues)
      const response = await fetch(`/api/admin/materials?studentId=${studentId}&userEmail=${user.email}`);
      
      const result = await response.json();

      if (!response.ok) {
        console.error('API materials load failed:', result);
        throw new Error(result.error || 'Failed to load materials');
      }

      console.log('Materials loaded successfully:', result.data.length, 'items');
      setStudentMaterials(result.data || []);
      
    } catch (error: any) {
      console.error('Error loading student materials:', error);
      setStudentMaterials([]); // Clear materials on error
    }
  };

  const loadStudentAssignments = async (studentId: string) => {
    if (!studentId) return;
    
    try {
      const userEmail = currentUserEmail || (await supabase.auth.getUser()).data.user?.email;
      if (!userEmail) return;
      const response = await fetch(`/api/admin/assignments?studentId=${studentId}&userEmail=${encodeURIComponent(userEmail)}`);
      
      if (!response.ok) {
        throw new Error('Failed to load assignments');
      }

      const result = await response.json();
      
      if (result.success) {
        setStudentAssignments(result.data || []);
      } else {
        console.error('Error loading student assignments:', result.error);
        setStudentAssignments([]);
      }
    } catch (error) {
      console.error('Error loading student assignments:', error);
      setStudentAssignments([]);
    }
  };

  const loadStudentVideos = async (studentId: string) => {
    if (!studentId) return;
    
    try {
      const userEmail = currentUserEmail || (await supabase.auth.getUser()).data.user?.email;
      if (!userEmail) return;
      const response = await fetch(`/api/admin/videos?studentId=${studentId}&userEmail=${encodeURIComponent(userEmail)}`);
      
      if (!response.ok) {
        throw new Error('Failed to load videos');
      }

      const result = await response.json();
      
      if (result.success) {
        setStudentVideos(result.data || []);
      } else {
        console.error('Error loading student videos:', result.error);
        setStudentVideos([]);
      }
    } catch (error) {
      console.error('Error loading student videos:', error);
      setStudentVideos([]);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!selectedStudent) {
      alert('Please select a student first');
      return;
    }

    setUploadingFile(true);
    
    try {
      console.log('Starting file upload for:', file.name, 'Type:', file.type, 'Size:', file.size);
      console.log('Selected student ID:', selectedStudent);
      
      // Check authentication status and refresh if needed
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      console.log('Current user:', user?.email, 'Auth error:', authError);
      
      if (!user?.email) {
        throw new Error('Authentication issue: Please refresh the page and log in again.');
      }
      
      console.log('Using admin API route for upload...');
      
      // Create form data for API route
      const formData = new FormData();
      formData.append('file', file);
      formData.append('studentId', selectedStudent);
      formData.append('userEmail', user.email);

      // Upload via API route (uses service role, bypasses RLS issues)
      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('API upload failed:', result);
        throw new Error(result.error || 'Upload failed');
      }

      console.log('API upload successful:', result);
      console.log('File uploaded to path:', result.data.path);
      // Reload materials
      loadStudentMaterials(selectedStudent);
      alert(`File "${file.name}" uploaded successfully via admin API!`);
    } catch (error: any) {
      console.error('Error uploading file:', error);
      let errorMessage = 'Error uploading file';
      
      if (error.message?.includes('bucket') || error.message?.includes('storage')) {
        errorMessage = 'Storage bucket issue. Try running the public_storage_setup.sql script.';
      } else if (error.message?.includes('policy') || error.message?.includes('permission')) {
        errorMessage = 'Permission denied. Try running the diagnose_admin_permissions.sql script to check your admin setup.';
      } else if (error.message?.includes('student_materials')) {
        errorMessage = 'Database table missing. Please run the create_materials_table.sql script.';
      } else if (error.message?.includes('Bad Request')) {
        errorMessage = 'Storage upload failed. Try the public bucket approach with public_storage_setup.sql.';
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`;
      }
      
      alert(errorMessage);
      console.log('Full error object:', error);
    } finally {
      setUploadingFile(false);
    }
  };

  const addAssignment = async () => {
    if (!selectedStudent || !newAssignment.title) {
      alert('Please select a student and enter assignment details');
      return;
    }

    try {
      const userEmail = currentUserEmail || (await supabase.auth.getUser()).data.user?.email;
      if (!userEmail) return;
      const response = await fetch(`/api/admin/assignments?userEmail=${encodeURIComponent(userEmail)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student_id: selectedStudent,
          day: newAssignment.day,
          title: newAssignment.title,
          description: newAssignment.description
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add assignment');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to add assignment');
      }

      // Reset form and edit mode
      setNewAssignment({
        day: 'monday',
        title: '',
        description: '',
        completed: false
      });
      setIsEditMode(false);
      setEditingAssignment(null);

      // Reload assignments
      loadStudentAssignments(selectedStudent);
    } catch (error) {
      console.error('Error adding assignment:', error);
      alert('Error adding assignment');
    }
  };

  const editAssignment = (assignment: any) => {
    setEditingAssignment(assignment);
    setNewAssignment({
      day: assignment.day,
      title: assignment.title,
      description: assignment.description || '',
      completed: assignment.completed
    });
    setIsEditMode(true);
  };

  const updateAssignment = async () => {
    if (!selectedStudent || !newAssignment.title || !editingAssignment) {
      alert('Please ensure all fields are filled');
      return;
    }

    try {
      const userEmail = currentUserEmail || (await supabase.auth.getUser()).data.user?.email;
      if (!userEmail) return;
      const response = await fetch(`/api/admin/assignments?userEmail=${encodeURIComponent(userEmail)}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignmentId: editingAssignment.id,
          day: newAssignment.day,
          title: newAssignment.title,
          description: newAssignment.description,
          completed: newAssignment.completed
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update assignment');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update assignment');
      }

      // Reset form
      cancelEditAssignment();

      // Reload assignments
      loadStudentAssignments(selectedStudent);
    } catch (error) {
      console.error('Error updating assignment:', error);
      alert('Error updating assignment');
    }
  };

  const cancelEditAssignment = () => {
    setEditingAssignment(null);
    setIsEditMode(false);
    setNewAssignment({
      day: 'monday',
      title: '',
      description: '',
      completed: false
    });
  };

  const deleteStudentMaterial = async (materialId: string) => {
    if (!confirm('Are you sure you want to delete this material? This action cannot be undone.')) {
      return;
    }

    try {
      const userEmail = currentUserEmail || (await supabase.auth.getUser()).data.user?.email;
      if (!userEmail) return;
      const response = await fetch(`/api/admin/materials/${materialId}?userEmail=${encodeURIComponent(userEmail)}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete material');
      }

      console.log('Material deleted successfully');
      // Reload materials for the selected student
      if (selectedStudent) {
        loadStudentMaterials(selectedStudent);
      }
    } catch (error) {
      console.error('Error deleting material:', error);
      alert('Failed to delete material. Please try again.');
    }
  };

  const deleteAssignment = async (assignmentId: string) => {
    if (!confirm('Are you sure you want to delete this assignment?')) {
      return;
    }

    try {
      const userEmail = currentUserEmail || (await supabase.auth.getUser()).data.user?.email;
      if (!userEmail) return;
      const response = await fetch(`/api/admin/assignments/${assignmentId}?userEmail=${encodeURIComponent(userEmail)}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete assignment');
      }

      console.log('Assignment deleted successfully');
      // Reload assignments for the selected student
      if (selectedStudent) {
        loadStudentAssignments(selectedStudent);
      }
    } catch (error) {
      console.error('Error deleting assignment:', error);
      alert('Failed to delete assignment. Please try again.');
    }
  };

  // Load student data when student is selected
  useEffect(() => {
    if (selectedStudent) {
      loadStudentMaterials(selectedStudent);
      loadStudentAssignments(selectedStudent);
      loadStudentVideos(selectedStudent);
    }
  }, [selectedStudent]);

  // Video management functions
  const addStudentVideo = async () => {
    if (!selectedStudent || !newVideoUrl.trim()) return;
    
    setAddingVideo(true);
    try {
      const userEmail = currentUserEmail || (await supabase.auth.getUser()).data.user?.email;
      if (!userEmail) return;
      const response = await fetch(`/api/admin/videos?userEmail=${encodeURIComponent(userEmail)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: selectedStudent,
          youtubeUrl: newVideoUrl.trim(),
          description: newVideoDescription.trim() || null
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add video');
      }

      const result = await response.json();
      if (result.success) {
        setNewVideoUrl('');
        setNewVideoDescription('');
        loadStudentVideos(selectedStudent);
      } else {
        throw new Error(result.error || 'Failed to add video');
      }
    } catch (error: any) {
      console.error('Error adding video:', error);
      alert('Error adding video: ' + error.message);
    } finally {
      setAddingVideo(false);
    }
  };

  const deleteStudentVideo = async (videoId: string) => {
    if (!confirm('Are you sure you want to delete this video?')) return;
    
    try {
      const userEmail = currentUserEmail || (await supabase.auth.getUser()).data.user?.email;
      if (!userEmail) return;
      const response = await fetch(`/api/admin/videos?userEmail=${encodeURIComponent(userEmail)}&videoId=${videoId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete video');
      }

      const result = await response.json();
      if (result.success) {
        loadStudentVideos(selectedStudent);
      } else {
        throw new Error(result.error || 'Failed to delete video');
      }
    } catch (error: any) {
      console.error('Error deleting video:', error);
      alert('Error deleting video: ' + error.message);
    }
  };

  const addYouTubeVideo = async () => {
    if (!youtubeUrl) return;

    setAddingMusicVideo(true);

    try {
      const userEmail = currentUserEmail || (await supabase.auth.getUser()).data.user?.email;
      if (!userEmail) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`/api/admin/music-videos?userEmail=${encodeURIComponent(userEmail)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          youtubeUrl: youtubeUrl.trim()
        })
      });

      const result = await response.json();
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || 'Failed to add video');
      }

      setYoutubeUrl('');
      await loadVideoList(userEmail);
    } catch (error) {
      console.error('Error adding video:', error);
      alert(error instanceof Error ? error.message : 'Error adding video. Please try again.');
    } finally {
      setAddingMusicVideo(false);
    }
  };

  const getTitleFromFileName = (fileName: string) => {
    return fileName.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ').trim();
  };

  const addAudioTrack = async () => {
    if (!audioFile) return;

    setAddingMusicAudio(true);

    try {
      const userEmail = currentUserEmail || (await supabase.auth.getUser()).data.user?.email;
      if (!userEmail) {
        throw new Error('Not authenticated');
      }

      const formData = new FormData();
      formData.append('file', audioFile);
      formData.append('userEmail', userEmail);

      const normalizedTitle = audioTitle.trim() || getTitleFromFileName(audioFile.name);
      if (normalizedTitle) {
        formData.append('title', normalizedTitle);
      }

      const response = await fetch('/api/admin/music-audio', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || 'Failed to upload audio');
      }

      setAudioFile(null);
      setAudioTitle('');
      await loadAudioTrackList(userEmail);
    } catch (error) {
      console.error('Error adding audio track:', error);
      alert(error instanceof Error ? error.message : 'Error uploading audio track. Please try again.');
    } finally {
      setAddingMusicAudio(false);
    }
  };

  const removeAudioTrack = async (trackId: number) => {
    try {
      const userEmail = currentUserEmail || (await supabase.auth.getUser()).data.user?.email;
      if (!userEmail) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`/api/admin/music-audio?userEmail=${encodeURIComponent(userEmail)}&trackId=${trackId}`, {
        method: 'DELETE'
      });
      const result = await response.json();

      if (!response.ok || !result?.success) {
        throw new Error(result?.error || 'Failed to delete audio track');
      }

      await loadAudioTrackList(userEmail);
    } catch (error) {
      console.error('Error deleting audio track:', error);
      alert(error instanceof Error ? error.message : 'Error deleting audio track. Please try again.');
    }
  };

  const moveAudioTrack = async (trackId: number, direction: 'up' | 'down') => {
    const trackIndex = audioTrackList.findIndex((track) => track.dbId === trackId);
    if (trackIndex === -1) return;

    const newIndex = direction === 'up' ? trackIndex - 1 : trackIndex + 1;
    if (newIndex < 0 || newIndex >= audioTrackList.length) return;

    const updatedTracks = [...audioTrackList];
    const [movedTrack] = updatedTracks.splice(trackIndex, 1);
    updatedTracks.splice(newIndex, 0, movedTrack);

    const reorderedTracks = updatedTracks.map((track, index) => ({
      ...track,
      order: index
    }));

    setAudioTrackList(reorderedTracks);

    try {
      const userEmail = currentUserEmail || (await supabase.auth.getUser()).data.user?.email;
      if (!userEmail) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`/api/admin/music-audio?userEmail=${encodeURIComponent(userEmail)}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderedAudioIds: reorderedTracks.map((track) => track.dbId)
        })
      });
      const result = await response.json();

      if (!response.ok || !result?.success) {
        throw new Error(result?.error || 'Failed to reorder audio tracks');
      }

      await loadAudioTrackList(userEmail);
    } catch (error) {
      console.error('Error reordering audio tracks:', error);
      alert(error instanceof Error ? error.message : 'Error reordering audio tracks. Please try again.');
      loadAudioTrackList();
    }
  };

  const removeVideo = async (videoId: number) => {
    try {
      const userEmail = currentUserEmail || (await supabase.auth.getUser()).data.user?.email;
      if (!userEmail) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`/api/admin/music-videos?userEmail=${encodeURIComponent(userEmail)}&videoId=${videoId}`, {
        method: 'DELETE'
      });
      const result = await response.json();

      if (!response.ok || !result?.success) {
        throw new Error(result?.error || 'Failed to delete video');
      }

      await loadVideoList(userEmail);
    } catch (error) {
      console.error('Error deleting video:', error);
      alert(error instanceof Error ? error.message : 'Error deleting video. Please try again.');
    }
  };

  const moveVideo = async (videoId: number, direction: 'up' | 'down') => {
    const videoIndex = videoList.findIndex(v => v.dbId === videoId);
    if (videoIndex === -1) return;

    const newIndex = direction === 'up' ? videoIndex - 1 : videoIndex + 1;
    if (newIndex < 0 || newIndex >= videoList.length) return;

    const updatedVideos = [...videoList];
    const [movedVideo] = updatedVideos.splice(videoIndex, 1);
    updatedVideos.splice(newIndex, 0, movedVideo);

    // Update order property for all videos
    const reorderedVideos = updatedVideos.map((video, index) => ({
      ...video,
      order: index
    }));

    setVideoList(reorderedVideos);

    try {
      const userEmail = currentUserEmail || (await supabase.auth.getUser()).data.user?.email;
      if (!userEmail) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`/api/admin/music-videos?userEmail=${encodeURIComponent(userEmail)}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderedVideoIds: reorderedVideos.map((video) => video.dbId)
        })
      });
      const result = await response.json();

      if (!response.ok || !result?.success) {
        throw new Error(result?.error || 'Failed to reorder videos');
      }

      await loadVideoList(userEmail);
    } catch (error) {
      console.error('Error reordering videos:', error);
      alert(error instanceof Error ? error.message : 'Error reordering videos. Please try again.');
      loadVideoList();
    }
  };

  const markMessageAsRead = async (messageId: string) => {
    try {
      const userEmail = currentUserEmail || (await supabase.auth.getUser()).data.user?.email || '';
      const response = await fetch('/api/contact', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: messageId,
          status: 'read',
          userEmail
        }),
      });

      if (response.ok) {
        setMessages(prev => prev.map(msg => 
          msg.id === messageId ? { ...msg, read: true } : msg
        ));
      } else {
        console.error('Failed to mark message as read');
      }
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const deleteMessage = async (messageId: string) => {
    if (!confirm('Are you sure you want to delete this message? This action cannot be undone.')) {
      return;
    }

    try {
      const userEmail = currentUserEmail || (await supabase.auth.getUser()).data.user?.email || '';
      const response = await fetch('/api/contact', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: messageId,
          userEmail
        }),
      });

      if (response.ok) {
        setMessages(prev => prev.filter(msg => msg.id !== messageId));
      } else {
        console.error('Failed to delete message');
        alert('Failed to delete message. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      alert('Error deleting message. Please try again.');
    }
  };

  // Filter messages based on selected filter
  const filteredMessages = messages.filter(message => {
    if (messageFilter === 'unread') return !message.read;
    if (messageFilter === 'read') return message.read;
    return true; // 'all'
  });

  const openMessageModal = (message: any) => {
    setSelectedMessage(message);
    // Mark as read when opening
    if (!message.read) {
      markMessageAsRead(message.id);
    }
  };

  const closeMessageModal = () => {
    setSelectedMessage(null);
  };

  const deletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', postId);

      if (error) {
        console.error('Error deleting post:', error);
        alert('Error deleting post');
      } else {
        loadPosts();
        loadStats();
      }
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const startEditPost = (post: BlogPost) => {
    setEditingPost(post);
    setEditForm({
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      tags: post.tags || [],
      image_url: post.image_url || ''
    });
    // Set existing image as preview if it exists
    setEditImagePreview(post.image_url || null);
    setEditImageFile(null);
  };

  const cancelEdit = () => {
    setEditingPost(null);
    setEditForm({
      title: '',
      excerpt: '',
      content: '',
      tags: [],
      image_url: ''
    });
    setEditImageFile(null);
    setEditImagePreview(null);
  };

  const handleEditImageUpload = (file: File) => {
    setEditImageFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setEditImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const uploadEditImage = async (): Promise<string | null> => {
    if (!editImageFile) return editForm.image_url || null;

    setUploadingEditImage(true);
    try {
      // Convert HEIC to JPG if needed
      let fileToUpload = editImageFile;
      if (editImageFile.type === 'image/heic' || editImageFile.name.toLowerCase().endsWith('.heic')) {
        // For HEIC files, we'll need to handle conversion or ask user to convert
        alert('Please convert HEIC files to JPG format before uploading.');
        setUploadingEditImage(false);
        return null;
      }

      const fileName = `blog-edit-${Date.now()}-${editImageFile.name}`;
      
      const { data, error } = await supabase.storage
        .from('blog-images')
        .upload(fileName, fileToUpload);

      if (error) {
        console.error('Error uploading image:', error);
        alert('Error uploading image');
        return null;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('blog-images')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error uploading image');
      return null;
    } finally {
      setUploadingEditImage(false);
    }
  };

  const saveEditPost = async () => {
    if (!editingPost) return;

    try {
      // Upload new image if one was selected
      let imageUrl = editForm.image_url;
      if (editImageFile) {
        const uploadedUrl = await uploadEditImage();
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        } else {
          return; // Upload failed, don't save the post
        }
      }

      const { error } = await supabase
        .from('blog_posts')
        .update({
          title: editForm.title,
          excerpt: editForm.excerpt,
          content: editForm.content,
          tags: editForm.tags,
          image_url: imageUrl || null
        })
        .eq('id', editingPost.id);

      if (error) {
        console.error('Error updating post:', error);
        alert('Error updating post');
      } else {
        loadPosts();
        cancelEdit();
        alert('Post updated successfully!');
      }
    } catch (error) {
      console.error('Error updating post:', error);
    }
  };

  const tabs = [
    { id: 'blog', name: 'Blog', fullName: 'Blog Posts', icon: DocumentTextIcon },
    { id: 'music', name: 'Music', fullName: 'Music Videos', icon: MusicalNoteIcon },
    { id: 'messages', name: 'Messages', fullName: 'Messages', icon: ChatBubbleLeftRightIcon },
    { id: 'students', name: 'Students', fullName: 'Students', icon: AcademicCapIcon },
    { id: 'practice', name: 'Practice', fullName: 'Guitar Practice', icon: PlayIcon },
    { id: 'analytics', name: 'Analytics', fullName: 'Practice Analytics', icon: ChartBarIcon },
    { id: 'teachers', name: 'Teachers', fullName: 'Teachers', icon: UserGroupIcon }
  ];

  const visibleTabs = tabs.filter((tab) => {
    if (currentUserEmail === 'grantmatai@gmail.com') {
      return true;
    }

    if (tab.id === 'students') return true;
    if (tab.id === 'teachers') return false;
    if (tab.id === 'blog') return currentUserPermissions.can_manage_blog;
    if (tab.id === 'music') return currentUserPermissions.can_upload_videos;
    if (tab.id === 'messages') return currentUserPermissions.can_manage_messages;
    if (tab.id === 'practice') return currentUserPermissions.can_assign_practice;
    if (tab.id === 'analytics') return currentUserPermissions.can_view_analytics;

    return false;
  });

  const isSuperAdmin = currentUserEmail === 'grantmatai@gmail.com';
  const canManageStudents = isSuperAdmin || currentUserPermissions.can_manage_students;
  const canViewBlogStats = isSuperAdmin || currentUserPermissions.can_manage_blog;
  const canViewMessageStats = isSuperAdmin || currentUserPermissions.can_manage_messages;

  useEffect(() => {
    if (!accessResolved) {
      return;
    }

    if (!visibleTabs.length) {
      return;
    }

    const activeIsVisible = visibleTabs.some((tab) => tab.id === activeTab);
    if (!activeIsVisible) {
      handleTabChange(visibleTabs[0].id);
    }
  }, [activeTab, visibleTabs, accessResolved]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStudentDisplayName = (student: any) => {
    const firstName = student.user_metadata?.first_name || student.first_name || '';
    const lastName = student.user_metadata?.last_name || student.last_name || '';
    const fullName = `${firstName} ${lastName}`.trim();
    if (fullName) return fullName;
    if (student.name && !String(student.name).includes('@')) return student.name;
    const shortId = String(student.id || '').slice(0, 6);
    return shortId ? `Student ${shortId}` : 'Student';
  };

  return (
    <AdminAuth>
      {/* Main Navigation */}
      <Navigation />
      
      <div className="min-h-screen" style={{backgroundColor: '#87AA6A'}}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">{isSuperAdmin ? 'Admin Dashboard' : 'Teacher Dashboard'}</h1>
            <p className="text-white text-opacity-80">
              {isSuperAdmin ? 'Manage your blog, music, and messages' : 'Manage your assigned students and permitted tools'}
            </p>
          </div>

          {/* Stats Cards */}
          {(canViewBlogStats || canViewMessageStats) && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6 mb-8">
              {canViewBlogStats && (
                <>
                  <div className="rounded-2xl p-4 md:p-6" style={{backgroundColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)'}}>
                    <div className="text-white text-opacity-60 text-xs md:text-sm">Total Posts</div>
                    <div className="text-white text-xl md:text-2xl font-bold">{stats.totalPosts}</div>
                  </div>
                  <div className="rounded-2xl p-4 md:p-6" style={{backgroundColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)'}}>
                    <div className="text-white text-opacity-60 text-xs md:text-sm">Published</div>
                    <div className="text-white text-xl md:text-2xl font-bold">{stats.publishedPosts}</div>
                  </div>
                  <div className="rounded-2xl p-4 md:p-6" style={{backgroundColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)'}}>
                    <div className="text-white text-opacity-60 text-xs md:text-sm">Drafts</div>
                    <div className="text-white text-xl md:text-2xl font-bold">{stats.draftPosts}</div>
                  </div>
                  <div className="rounded-2xl p-4 md:p-6" style={{backgroundColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)'}}>
                    <div className="text-white text-opacity-60 text-xs md:text-sm">Subscribers</div>
                    <div className="text-white text-xl md:text-2xl font-bold">{stats.subscribers}</div>
                  </div>
                </>
              )}

              {canViewMessageStats && (
                <div className="rounded-2xl p-4 md:p-6 col-span-2 md:col-span-1" style={{backgroundColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)'}}>
                  <div className="text-white text-opacity-60 text-xs md:text-sm">Unread Messages</div>
                  <div className="text-white text-xl md:text-2xl font-bold text-orange-300">{stats.unreadMessages}</div>
                </div>
              )}
            </div>
          )}

          {/* Tab Navigation */}
          <div className="rounded-2xl p-1 mb-8" style={{backgroundColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)'}}>
            {/* Desktop Tab Navigation */}
            <nav className="hidden md:flex space-x-1">
              {visibleTabs.map((tab) => {
                const Icon = tab.icon;
                const unreadCount = tab.id === 'messages' ? messages.filter(m => !m.read).length : 0;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`flex items-center px-6 py-3 rounded-xl text-sm font-medium transition-all relative ${
                      activeTab === tab.id
                        ? 'text-white shadow-lg'
                        : 'text-gray-700 hover:text-white hover:shadow-md'
                    }`}
                    style={{
                      backgroundColor: activeTab === tab.id 
                        ? '#66732C' 
                        : 'rgba(255,255,255,0.8)',
                      backdropFilter: 'blur(8px)'
                    }}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {tab.fullName}
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Mobile Tab Navigation */}
            <div className="md:hidden">
              {/* Mobile Tab Buttons - Horizontal Scroll */}
              <div className="flex space-x-1 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {visibleTabs.map((tab) => {
                  const Icon = tab.icon;
                  const unreadCount = tab.id === 'messages' ? messages.filter(m => !m.read).length : 0;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id)}
                      className={`flex flex-col items-center px-4 py-3 rounded-xl text-xs font-medium transition-all whitespace-nowrap flex-shrink-0 relative ${
                        activeTab === tab.id
                          ? 'text-white shadow-lg'
                          : 'text-gray-700 hover:text-white hover:shadow-md'
                      }`}
                      style={{
                        backgroundColor: activeTab === tab.id 
                          ? '#66732C' 
                          : 'rgba(255,255,255,0.8)',
                        backdropFilter: 'blur(8px)',
                        minWidth: '80px'
                      }}
                    >
                      <Icon className="w-5 h-5 mb-1" />
                      {tab.name}
                      {/* Unread badges for mobile */}
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {unreadCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              
              {/* Hide scrollbar on mobile webkit browsers */}
              <style jsx>{`
                .overflow-x-auto::-webkit-scrollbar {
                  display: none;
                }
              `}</style>
            </div>
          </div>

          {/* Tab Content */}
          <div 
            className="rounded-2xl p-6" 
            style={{
              backgroundColor: 'rgba(102, 115, 44, 0.1)', 
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.1)'
            }}
          >
            {activeTab === 'blog' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-800">Blog Posts</h2>
                  <Link
                    href="/admin/posts/new"
                    className="flex items-center px-4 py-2 rounded-lg font-medium text-white transition-all hover-lift"
                    style={{backgroundColor: '#BC6A1B'}}
                  >
                    <PlusIcon className="w-4 h-4 mr-2" />
                    New Post
                  </Link>
                </div>

                {loading ? (
                  <div className="text-gray-600 text-center py-8">Loading posts...</div>
                ) : posts.length === 0 ? (
                  <div className="text-gray-600 text-center py-8">
                    No posts yet. Create your first post!
                  </div>
                ) : (
                  <div className="space-y-4">
                    {posts.map((post) => (
                      <div
                        key={post.id}
                        className="flex items-center justify-between p-4 rounded-lg border border-gray-200"
                        style={{backgroundColor: 'rgba(255,255,255,0.9)'}}
                      >
                        <div className="flex-1">
                          <h3 className="text-gray-800 font-medium">{post.title}</h3>
                          <div className="flex items-center space-x-4 mt-1">
                            <span className={`px-2 py-1 rounded text-xs ${
                              post.published 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {post.published ? 'Published' : 'Draft'}
                            </span>
                            <span className="text-gray-600 text-sm">
                              {formatDate(post.created_at)}
                            </span>
                            {post.featured && (
                              <span className="px-2 py-1 rounded text-xs bg-orange-100 text-orange-700">
                                Featured
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button className="p-2 text-gray-600 hover:text-gray-800 transition-colors">
                            <EyeIcon className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => startEditPost(post)}
                            className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => deletePost(post.id)}
                            className="p-2 text-red-300 hover:text-red-200 transition-colors"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Edit Post Modal */}
            {editingPost && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-bold text-gray-800">Edit Blog Post</h3>
                      <button
                        onClick={cancelEdit}
                        className="p-2 text-gray-400 hover:text-gray-600"
                      >
                        <XMarkIcon className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="space-y-4">
                      {/* Title */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Title
                        </label>
                        <input
                          type="text"
                          value={editForm.title}
                          onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
                        />
                      </div>

                      {/* Excerpt */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Excerpt
                        </label>
                        <textarea
                          value={editForm.excerpt}
                          onChange={(e) => setEditForm({...editForm, excerpt: e.target.value})}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
                        />
                      </div>

                      {/* Content */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Content
                        </label>
                        <textarea
                          value={editForm.content}
                          onChange={(e) => setEditForm({...editForm, content: e.target.value})}
                          rows={10}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
                        />
                      </div>

                      {/* Tags */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tags (comma-separated)
                        </label>
                        <input
                          type="text"
                          value={editForm.tags.join(', ')}
                          onChange={(e) => setEditForm({
                            ...editForm, 
                            tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)
                          })}
                          placeholder="music, teaching, guitar"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
                        />
                      </div>

                      {/* Image Upload */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Post Image
                        </label>
                        <div
                          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
                          onDrop={(e) => {
                            e.preventDefault();
                            const files = Array.from(e.dataTransfer.files);
                            if (files.length > 0 && files[0].type.startsWith('image/')) {
                              handleEditImageUpload(files[0]);
                            }
                          }}
                          onDragOver={(e) => e.preventDefault()}
                          onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = 'image/*';
                            input.onchange = (e) => {
                              const file = (e.target as HTMLInputElement).files?.[0];
                              if (file) handleEditImageUpload(file);
                            };
                            input.click();
                          }}
                        >
                          {editImagePreview ? (
                            <div className="space-y-2">
                              <img
                                src={editImagePreview}
                                alt="Preview"
                                className="max-h-32 mx-auto rounded-lg"
                              />
                              <p className="text-sm text-gray-600">
                                Click or drag to change image
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <div className="text-gray-400 text-4xl">📸</div>
                              <div>
                                <p className="text-gray-600">Click to upload or drag and drop</p>
                                <p className="text-sm text-gray-400">PNG, JPG, GIF up to 10MB</p>
                              </div>
                            </div>
                          )}
                        </div>
                        {editImageFile && (
                          <p className="text-sm text-gray-600 mt-2">
                            Selected: {editImageFile.name}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                      <button
                        onClick={cancelEdit}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={saveEditPost}
                        disabled={uploadingEditImage}
                        className="px-6 py-2 rounded-lg font-medium text-white transition-all hover-lift disabled:opacity-50"
                        style={{backgroundColor: '#BC6A1B'}}
                      >
                        {uploadingEditImage ? 'Uploading...' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Edit Student Modal */}
            {editingStudent && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-lg max-w-md w-full">
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-bold text-gray-800">Edit Student</h3>
                      <button
                        onClick={cancelEditStudent}
                        className="p-2 text-gray-400 hover:text-gray-600"
                      >
                        <XMarkIcon className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="space-y-4">
                      {/* Email */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={editStudentForm.email}
                          onChange={(e) => setEditStudentForm({...editStudentForm, email: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      {/* First Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          First Name
                        </label>
                        <input
                          type="text"
                          value={editStudentForm.firstName}
                          onChange={(e) => setEditStudentForm({...editStudentForm, firstName: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      {/* Last Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Last Name
                        </label>
                        <input
                          type="text"
                          value={editStudentForm.lastName}
                          onChange={(e) => setEditStudentForm({...editStudentForm, lastName: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      {/* New Password */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          New Password
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? "text" : "password"}
                            value={editStudentForm.password}
                            onChange={(e) => setEditStudentForm({...editStudentForm, password: e.target.value})}
                            placeholder="Leave blank to keep current password"
                            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                          >
                            {showPassword ? (
                              <EyeSlashIcon className="h-5 w-5" />
                            ) : (
                              <EyeIcon className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Leave blank to keep the current password unchanged
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                      <button
                        onClick={cancelEditStudent}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={updateStudent}
                        className="px-6 py-2 rounded-lg font-medium text-white transition-all hover-lift"
                        style={{backgroundColor: '#BC6A1B'}}
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'music' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-800">Music Videos</h2>
                </div>

                {/* Music Audio Upload Form */}
                <div className="mb-6 p-4 rounded-lg" style={{backgroundColor: 'rgba(255,255,255,0.9)'}}>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-gray-800 font-medium">Upload Audio Track</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input
                      type="text"
                      value={audioTitle}
                      onChange={(e) => setAudioTitle(e.target.value)}
                      placeholder="Track title (auto-fills from file name)"
                      className="md:col-span-1 px-4 py-2 rounded-lg border text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-400"
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.95)',
                        borderColor: '#66732C'
                      }}
                    />
                    <input
                      type="file"
                      accept="audio/*,.mp3,.wav,.ogg,.aac,.m4a,.webm"
                      onChange={(e) => {
                        const selectedFile = e.target.files?.[0] || null;
                        setAudioFile(selectedFile);
                        if (selectedFile && !audioTitle.trim()) {
                          setAudioTitle(getTitleFromFileName(selectedFile.name));
                        }
                      }}
                      className="md:col-span-1 px-4 py-2 rounded-lg border text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-400"
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.95)',
                        borderColor: '#66732C'
                      }}
                    />
                    <button
                      onClick={addAudioTrack}
                      disabled={addingMusicAudio || !audioFile}
                      className="px-4 py-2 rounded-lg font-medium text-white transition-all hover-lift disabled:opacity-50"
                      style={{backgroundColor: '#BC6A1B'}}
                    >
                      {addingMusicAudio ? 'Uploading...' : 'Upload Audio'}
                    </button>
                  </div>
                </div>

                {/* Music Audio List */}
                <div className="space-y-4 mb-10">
                  {audioTrackList.length === 0 ? (
                    <div className="text-gray-600 text-center py-6 rounded-lg" style={{backgroundColor: 'rgba(255,255,255,0.9)'}}>
                      No audio tracks uploaded yet.
                    </div>
                  ) : (
                    audioTrackList.map((track, index) => (
                      <div
                        key={track.dbId}
                        className="p-4 rounded-lg border border-gray-200"
                        style={{backgroundColor: 'rgba(255,255,255,0.9)'}}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start space-x-4 min-w-0 flex-1">
                            <div className="flex flex-col items-center space-y-1">
                              <div className="text-xs text-gray-500 font-medium">#{index + 1}</div>
                              <div className="flex flex-col space-y-1">
                                <button
                                  onClick={() => moveAudioTrack(track.dbId, 'up')}
                                  disabled={index === 0}
                                  className={`p-1 rounded ${
                                    index === 0
                                      ? 'text-gray-300 cursor-not-allowed'
                                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                                  } transition-colors`}
                                  title="Move up"
                                >
                                  <ChevronUpIcon className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => moveAudioTrack(track.dbId, 'down')}
                                  disabled={index === audioTrackList.length - 1}
                                  className={`p-1 rounded ${
                                    index === audioTrackList.length - 1
                                      ? 'text-gray-300 cursor-not-allowed'
                                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                                  } transition-colors`}
                                  title="Move down"
                                >
                                  <ChevronDownIcon className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="text-gray-800 font-medium truncate">{track.title}</h3>
                              <p className="text-gray-500 text-xs">
                                Added {new Date(track.addedDate).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => removeAudioTrack(track.dbId)}
                            className="p-2 text-red-600 hover:text-red-800 transition-colors"
                            title="Remove audio track"
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                        </div>

                        <audio controls className="w-full mt-3">
                          <source src={track.publicUrl} />
                          Your browser does not support audio playback.
                        </audio>
                      </div>
                    ))
                  )}
                </div>

                {/* Add Video Form */}
                <div className="mb-6 p-4 rounded-lg" style={{backgroundColor: 'rgba(255,255,255,0.9)'}}>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-gray-800 font-medium">Add New YouTube Video</h3>
                  </div>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={youtubeUrl}
                      onChange={(e) => setYoutubeUrl(e.target.value)}
                      placeholder="Paste YouTube URL here..."
                      className="flex-1 px-4 py-2 rounded-lg border text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-400"
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.95)',
                        borderColor: '#66732C'
                      }}
                    />
                    <button
                      onClick={addYouTubeVideo}
                      disabled={addingMusicVideo}
                      className="px-4 py-2 rounded-lg font-medium text-white transition-all hover-lift disabled:opacity-50"
                      style={{backgroundColor: '#BC6A1B'}}
                    >
                      {addingMusicVideo ? 'Adding...' : 'Add Video'}
                    </button>
                  </div>
                </div>

                {/* Video List */}
                <div className="space-y-4">
                  {videoList.length === 0 ? (
                    <div className="text-gray-600 text-center py-8">
                      No videos added yet. Add a YouTube URL above to get started!
                    </div>
                  ) : (
                    videoList.map((video, index) => (
                      <div
                        key={video.dbId}
                        className="flex items-center justify-between p-4 rounded-lg border border-gray-200"
                        style={{backgroundColor: 'rgba(255,255,255,0.9)'}}
                      >
                        <div className="flex items-center space-x-4">
                          {/* Order number and reorder buttons */}
                          <div className="flex flex-col items-center space-y-1">
                            <div className="text-xs text-gray-500 font-medium">#{index + 1}</div>
                            <div className="flex flex-col space-y-1">
                              <button
                                onClick={() => moveVideo(video.dbId, 'up')}
                                disabled={index === 0}
                                className={`p-1 rounded ${
                                  index === 0 
                                    ? 'text-gray-300 cursor-not-allowed' 
                                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                                } transition-colors`}
                                title="Move up"
                              >
                                <ChevronUpIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => moveVideo(video.dbId, 'down')}
                                disabled={index === videoList.length - 1}
                                className={`p-1 rounded ${
                                  index === videoList.length - 1 
                                    ? 'text-gray-300 cursor-not-allowed' 
                                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                                } transition-colors`}
                                title="Move down"
                              >
                                <ChevronDownIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          
                          <img
                            src={video.thumbnail || `https://img.youtube.com/vi/${video.id}/mqdefault.jpg`}
                            alt={video.title}
                            className="w-16 h-12 object-cover rounded"
                          />
                          <div>
                            <h3 className="text-gray-800 font-medium">{video.title}</h3>
                            <p className="text-gray-600 text-sm">{video.author}</p>
                            <p className="text-gray-500 text-xs">
                              Added {new Date(video.addedDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <a
                            href={`https://youtube.com/watch?v=${video.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-blue-600 hover:text-blue-800 transition-colors"
                            title="Watch on YouTube"
                          >
                            <PlayIcon className="w-4 h-4" />
                          </a>
                          <button
                            onClick={() => removeVideo(video.dbId)}
                            className="p-2 text-red-600 hover:text-red-800 transition-colors"
                            title="Remove video"
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === 'messages' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-800">Messages & Comments</h2>
                  <div className="text-sm text-gray-600">
                    Total: {messages.length} | 
                    Unread: {messages.filter(m => !m.read).length} | 
                    Read: {messages.filter(m => m.read).length}
                  </div>
                </div>

                {/* Filter Tabs */}
                <div className="mb-6">
                  <div className="flex space-x-1 rounded-lg bg-gray-100 p-1 overflow-x-auto">
                    {[
                      { id: 'all', label: 'All', count: messages.length },
                      { id: 'unread', label: 'Unread', count: messages.filter(m => !m.read).length },
                      { id: 'read', label: 'Read', count: messages.filter(m => m.read).length }
                    ].map((filter) => (
                      <button
                        key={filter.id}
                        onClick={() => setMessageFilter(filter.id)}
                        className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
                          messageFilter === filter.id
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                        style={{ minWidth: 'fit-content' }}
                      >
                        <span className="hidden sm:inline">{filter.label} Messages </span>
                        <span className="sm:hidden">{filter.label} </span>
                        ({filter.count})
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  {filteredMessages.length === 0 ? (
                    <div className="text-gray-600 text-center py-8">
                      {messageFilter === 'all' && 'No messages yet.'}
                      {messageFilter === 'unread' && 'No unread messages.'}
                      {messageFilter === 'read' && 'No read messages.'}
                    </div>
                  ) : (
                    filteredMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`p-4 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                          message.read 
                            ? 'border border-gray-200 hover:border-gray-300' 
                            : 'border border-orange-400 border-2 hover:border-orange-500'
                        }`}
                        style={{
                          backgroundColor: message.read 
                            ? 'rgba(255,255,255,0.8)' 
                            : 'rgba(255,255,255,0.95)'
                        }}
                        onClick={() => openMessageModal(message)}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="text-gray-800 font-medium">{message.subject}</h3>
                              {!message.read && (
                                <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">
                                  New
                                </span>
                              )}
                            </div>
                            <p className="text-gray-600 text-sm">
                              From: {message.name}
                              {message.from !== 'Anonymous' && ` (${message.from})`}
                              {message.phone && ` • ${message.phone}`}
                              {' '} • {formatDate(message.date)}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded text-xs ${
                              message.type === 'contact' 
                                ? 'bg-blue-100 text-blue-700' 
                                : 'bg-green-100 text-green-700'
                            }`}>
                              {message.type === 'contact' ? 'Contact' : 'Comment'}
                            </span>
                            {!message.read && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markMessageAsRead(message.id);
                                }}
                                className="px-2 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 text-xs rounded"
                              >
                                Mark as read
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteMessage(message.id);
                              }}
                              className="p-2 text-red-600 hover:text-red-800 transition-colors"
                              title="Delete message"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <p className="text-gray-700 line-clamp-2">{message.message}</p>
                        <div className="mt-2 text-xs text-gray-500">
                          Click to view full message
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Message Detail Modal */}
                {selectedMessage && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
                      <div className="flex justify-between items-center p-6 border-b border-gray-200">
                        <div className="flex-1">
                          <h2 className="text-xl font-bold text-gray-800">{selectedMessage.subject}</h2>
                          <div className="flex items-center space-x-4 mt-2">
                            <span className={`px-2 py-1 rounded text-xs ${
                              selectedMessage.type === 'contact' 
                                ? 'bg-blue-100 text-blue-700' 
                                : 'bg-green-100 text-green-700'
                            }`}>
                              {selectedMessage.type === 'contact' ? 'Contact Form' : 'Comment'}
                            </span>
                            <span className={`px-2 py-1 rounded text-xs ${
                              selectedMessage.read 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-orange-100 text-orange-700'
                            }`}>
                              {selectedMessage.read ? 'Read' : 'Unread'}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={closeMessageModal}
                          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <XMarkIcon className="w-6 h-6" />
                        </button>
                      </div>
                      
                      <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                        {/* Contact Information */}
                        <div className="bg-gray-50 rounded-lg p-4 mb-6">
                          <h3 className="text-sm font-semibold text-gray-700 mb-3">Contact Information</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500 block">Name:</span>
                              <span className="text-gray-800 font-medium">{selectedMessage.name}</span>
                            </div>
                            <div>
                              <span className="text-gray-500 block">Email:</span>
                              <span className="text-gray-800">{selectedMessage.from !== 'Anonymous' ? selectedMessage.from : 'Not provided'}</span>
                            </div>
                            <div>
                              <span className="text-gray-500 block">Phone:</span>
                              <span className="text-gray-800">{selectedMessage.phone || 'Not provided'}</span>
                            </div>
                            <div>
                              <span className="text-gray-500 block">Date:</span>
                              <span className="text-gray-800">{formatDate(selectedMessage.date)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Message Content */}
                        <div>
                          <h3 className="text-sm font-semibold text-gray-700 mb-3">Message</h3>
                          <div className="bg-white border border-gray-200 rounded-lg p-4">
                            <div className="prose prose-sm max-w-none">
                              <div className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                                {selectedMessage.message}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50">
                        <div className="flex space-x-3">
                          {!selectedMessage.read && (
                            <button
                              onClick={() => {
                                markMessageAsRead(selectedMessage.id);
                                setSelectedMessage({...selectedMessage, read: true});
                              }}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              Mark as Read
                            </button>
                          )}
                          <button
                            onClick={() => {
                              deleteMessage(selectedMessage.id);
                              closeMessageModal();
                            }}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                          >
                            Delete Message
                          </button>
                        </div>
                        <button
                          onClick={closeMessageModal}
                          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'students' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-800">Student Management</h2>
                </div>

                {/* Create New Student */}
                {canManageStudents && (
                <div className="mb-6 p-4 rounded-lg" style={{backgroundColor: 'rgba(255,255,255,0.8)'}}>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <UserGroupIcon className="h-5 w-5 mr-2" />
                    Create New Student
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2 md:col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        value={newStudentForm.email}
                        onChange={(e) => setNewStudentForm({...newStudentForm, email: e.target.value})}
                        placeholder="student@example.com"
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={creatingStudent}
                      />
                    </div>
                    
                    <div className="sm:col-span-2 md:col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Password *
                      </label>
                      <input
                        type="password"
                        value={newStudentForm.password}
                        onChange={(e) => setNewStudentForm({...newStudentForm, password: e.target.value})}
                        placeholder="Minimum 6 characters"
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={creatingStudent}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={newStudentForm.firstName}
                        onChange={(e) => setNewStudentForm({...newStudentForm, firstName: e.target.value})}
                        placeholder="John"
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={creatingStudent}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={newStudentForm.lastName}
                        onChange={(e) => setNewStudentForm({...newStudentForm, lastName: e.target.value})}
                        placeholder="Doe"
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={creatingStudent}
                      />
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <button
                      onClick={createStudent}
                      disabled={creatingStudent || !newStudentForm.email || !newStudentForm.password}
                      className={`px-4 py-2 rounded-md text-white font-medium ${
                        creatingStudent || !newStudentForm.email || !newStudentForm.password
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                    >
                      {creatingStudent ? 'Creating Student...' : 'Create Student Account'}
                    </button>
                  </div>
                </div>
                )}

                {/* Students List */}
                <div className="mb-6 p-4 rounded-lg" style={{backgroundColor: 'rgba(255,255,255,0.8)'}}>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <UserGroupIcon className="h-5 w-5 mr-2" />
                    {isSuperAdmin ? `All Students (${students.length})` : `Assigned Students (${students.length})`}
                  </h3>
                  
                  {students.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No accessible students found.</p>
                  ) : (
                    <div className="space-y-3">
                      {students.map((student) => {
                        const isOwnProfile = student.id === currentUserId;
                        const canEditStudentProfile = isOwnProfile || canManageStudents;
                        const canDeleteStudentProfile = canManageStudents && !isOwnProfile;

                        return (
                        <div
                          key={student.id}
                          className="p-3 bg-gray-50 rounded-lg border"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div className="flex-1">
                              <h4 className="text-gray-800 font-medium">{getStudentDisplayName(student)}</h4>
                              <div className="text-sm text-gray-600">
                                {student.user_metadata?.first_name && student.user_metadata?.last_name ? (
                                  <span>{student.user_metadata.first_name} {student.user_metadata.last_name}</span>
                                ) : (
                                  <span className="text-gray-400 italic">No name provided</span>
                                )}
                                <span className="mx-2">•</span>
                                <span>Joined: {new Date(student.created_at).toLocaleDateString()}</span>
                              </div>
                              {/* Leaderboard Opt-In Checkbox */}
                              <label className="flex items-center mt-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={studentOptIns.get(student.id) || false}
                                  onChange={() => toggleLeaderboardOptIn(student.id, studentOptIns.get(student.id) || false)}
                                  disabled={!canEditStudentProfile}
                                  className="h-4 w-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
                                />
                                <span className="ml-2 text-sm text-gray-700">
                                  {studentOptIns.get(student.id) ? (
                                    <span className="text-green-600 font-medium">✓ Leaderboard Enabled</span>
                                  ) : (
                                    <span>Enable Leaderboard</span>
                                  )}
                                </span>
                              </label>
                              {/* Analytics Opt-In Checkbox */}
                              <label className="flex items-center mt-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={studentAnalyticsOptIns.get(student.id) || false}
                                  onChange={() => toggleAnalyticsOptIn(student.id, studentAnalyticsOptIns.get(student.id) || false)}
                                  disabled={!canEditStudentProfile}
                                  className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                />
                                <span className="ml-2 text-sm text-gray-700">
                                  {studentAnalyticsOptIns.get(student.id) ? (
                                    <span className="text-blue-600 font-medium">✓ Analytics Enabled</span>
                                  ) : (
                                    <span>Enable Analytics</span>
                                  )}
                                </span>
                              </label>
                            </div>
                            <div className="flex items-center justify-between sm:justify-end gap-2">
                              <button
                                onClick={() => setSelectedStudent(student.id)}
                                className={`px-3 py-1 rounded text-sm font-medium flex-1 sm:flex-none ${
                                  selectedStudent === student.id
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                }`}
                              >
                                {selectedStudent === student.id ? 'Selected' : 'Manage'}
                              </button>
                              <button
                                onClick={() => startEditStudent(student)}
                                disabled={!canEditStudentProfile}
                                className="p-2 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                <PencilIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => deleteStudent(student)}
                                disabled={!canDeleteStudentProfile}
                                className="p-2 text-red-600 hover:text-red-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )})}
                    </div>
                  )}
                </div>

                {/* Student Selection (Keep for backward compatibility) */}
                <div className="mb-6 p-4 rounded-lg" style={{backgroundColor: 'rgba(255,255,255,0.8)'}}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Student for Materials/Assignments Management
                  </label>
                  <select
                    value={selectedStudent}
                    onChange={(e) => setSelectedStudent(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Choose a student...</option>
                    {students.map((student) => (
                      <option key={student.id} value={student.id}>
                        {getStudentDisplayName(student)}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedStudent && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Practice Config Section */}
                    <div className="p-4 rounded-lg order-0 lg:order-0 lg:col-span-3" style={{backgroundColor: 'rgba(255,255,255,0.8)'}}>
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                        <PlayIcon className="h-5 w-5 mr-2" />
                        Practice Configuration
                      </h3>
                      <StudentPracticeAssignment studentId={selectedStudent} />
                    </div>
                    {/* Materials Section */}
                    <div className="p-4 rounded-lg order-1 lg:order-1" style={{backgroundColor: 'rgba(255,255,255,0.8)'}}>
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                        <DocumentArrowUpIcon className="h-5 w-5 mr-2" />
                        <span className="hidden sm:inline">Materials & Sheet Music</span>
                        <span className="sm:hidden">Materials</span>
                      </h3>

                      {/* File Upload */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Upload Files (PDFs, Images)
                        </label>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png,.gif"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload(file);
                          }}
                          disabled={uploadingFile}
                          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {uploadingFile && (
                          <p className="text-sm text-blue-600 mt-1">Uploading...</p>
                        )}
                      </div>

                      {/* Materials List */}
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {studentMaterials.length === 0 ? (
                          <p className="text-gray-500 text-sm">No materials uploaded yet.</p>
                        ) : (
                          studentMaterials.map((material) => (
                            <div
                              key={material.id}
                              className="flex items-center justify-between p-2 bg-gray-50 rounded"
                            >
                              <div>
                                <p className="text-sm font-medium text-gray-800">{material.file_name}</p>
                                <p className="text-xs text-gray-500">
                                  {new Date(material.created_at).toLocaleDateString()}
                                </p>
                              </div>
                              <button
                                onClick={() => deleteStudentMaterial(material.id)}
                                className="text-red-600 hover:text-red-800 p-1"
                              >
                                <XMarkIcon className="h-4 w-4" />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Assignments Section */}
                    <div className="p-4 rounded-lg order-2 lg:order-2" style={{backgroundColor: 'rgba(255,255,255,0.8)'}}>
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                        <CheckIcon className="h-5 w-5 mr-2" />
                        <span className="hidden sm:inline">Weekly Assignments</span>
                        <span className="sm:hidden">Assignments</span>
                      </h3>

                      {/* Add/Edit Assignment Form */}
                      <div className="mb-4 p-3 bg-gray-50 rounded">
                        {isEditMode && (
                          <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded">
                            <p className="text-sm text-blue-800 font-medium">
                              Editing: {editingAssignment?.title}
                            </p>
                          </div>
                        )}
                        <div className="mb-2">
                          <input
                            type="text"
                            placeholder="Assignment title"
                            value={newAssignment.title}
                            onChange={(e) => setNewAssignment({...newAssignment, title: e.target.value})}
                            className="w-full p-2 border border-gray-300 rounded text-sm"
                          />
                        </div>
                        <textarea
                          placeholder="Assignment description/instructions (press Enter for new lines)"
                          value={newAssignment.description}
                          onChange={(e) => setNewAssignment({...newAssignment, description: e.target.value})}
                          className="w-full p-2 border border-gray-300 rounded text-sm mb-2"
                          rows={3}
                        />
                        <div className="flex gap-2">
                          {isEditMode ? (
                            <>
                              <button
                                onClick={updateAssignment}
                                className="flex-1 bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 text-sm"
                              >
                                Update Assignment
                              </button>
                              <button
                                onClick={cancelEditAssignment}
                                className="flex-1 bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700 text-sm"
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={addAssignment}
                              className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 text-sm"
                            >
                              Add Assignment
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Assignments List */}
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {studentAssignments.length === 0 ? (
                          <p className="text-gray-500 text-sm">No assignments created yet.</p>
                        ) : (
                          studentAssignments.map((assignment) => (
                            <div
                              key={assignment.id}
                              className="flex items-start justify-between p-2 bg-gray-50 rounded mb-1"
                            >
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-800">{assignment.title}</p>
                                {assignment.description && (
                                  <p className="text-xs text-gray-600 whitespace-pre-wrap">{assignment.description}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => editAssignment(assignment)}
                                  className="text-blue-600 hover:text-blue-800 p-1"
                                  title="Edit Assignment"
                                >
                                  <PencilIcon className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => deleteAssignment(assignment.id)}
                                  className="text-red-600 hover:text-red-800 p-1"
                                  title="Delete Assignment"
                                >
                                  <XMarkIcon className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Videos Section */}
                    <div className="p-4 rounded-lg order-3 lg:order-3" style={{backgroundColor: 'rgba(255,255,255,0.8)'}}>
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                        <PlayIcon className="h-5 w-5 mr-2" />
                        <span className="hidden sm:inline">Educational Videos</span>
                        <span className="sm:hidden">Videos</span>
                      </h3>

                      {/* Add Video Form */}
                      <div className="mb-4 p-3 bg-gray-50 rounded">
                        <div className="mb-2">
                          <input
                            type="url"
                            placeholder="YouTube URL (e.g., https://www.youtube.com/watch?v=...)"
                            value={newVideoUrl}
                            onChange={(e) => setNewVideoUrl(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded text-sm mb-2"
                            disabled={addingVideo}
                          />
                          <textarea
                            placeholder="Optional description or notes about this video"
                            value={newVideoDescription}
                            onChange={(e) => setNewVideoDescription(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded text-sm"
                            rows={2}
                            disabled={addingVideo}
                          />
                        </div>
                        <button
                          onClick={addStudentVideo}
                          disabled={addingVideo || !newVideoUrl.trim()}
                          className={`w-full py-2 px-4 rounded text-sm font-medium ${
                            addingVideo || !newVideoUrl.trim()
                              ? 'bg-gray-400 text-white cursor-not-allowed'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          {addingVideo ? 'Adding Video...' : 'Add Video'}
                        </button>
                      </div>

                      {/* Videos List */}
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {studentVideos.length === 0 ? (
                          <p className="text-gray-500 text-sm">No videos assigned yet.</p>
                        ) : (
                          studentVideos.map((video) => (
                            <div
                              key={video.id}
                              className="flex items-start justify-between p-2 bg-gray-50 rounded"
                            >
                              <div className="flex items-start space-x-2 flex-1">
                                <img
                                  src={video.thumbnail_url || `https://img.youtube.com/vi/${video.youtube_id}/mqdefault.jpg`}
                                  alt={video.title}
                                  className="w-16 h-12 object-cover rounded flex-shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-800 truncate">{video.title}</p>
                                  {video.description && (
                                    <p className="text-xs text-gray-600 mt-1">{video.description}</p>
                                  )}
                                  <p className="text-xs text-gray-500">
                                    {new Date(video.created_at).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 ml-2">
                                <a
                                  href={`https://www.youtube.com/watch?v=${video.youtube_id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 p-1"
                                  title="Open on YouTube"
                                >
                                  <LinkIcon className="h-4 w-4" />
                                </a>
                                <button
                                  onClick={() => deleteStudentVideo(video.id)}
                                  className="text-red-600 hover:text-red-800 p-1"
                                  title="Delete Video"
                                >
                                  <XMarkIcon className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Practice Tab Content */}
            {activeTab === 'practice' && (
              <PracticeManagement />
            )}

            {/* Analytics Tab Content */}
            {activeTab === 'analytics' && (
              <PracticeAnalytics />
            )}

            {/* Teachers Tab Content */}
            {activeTab === 'teachers' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-800">Teacher Management</h2>
                  <div className="text-sm text-gray-600">
                    Total Teachers: {teachers.length}
                  </div>
                </div>

                {/* Promote Student to Teacher */}
                <div className="mb-8 p-6 rounded-lg border-2 border-green-200" style={{backgroundColor: 'rgba(255,255,255,0.9)'}}>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Promote Student to Teacher</h3>
                  
                  {/* Student Selection */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Student to Promote
                    </label>
                    <select
                      value={selectedStudentForPromotion}
                      onChange={(e) => setSelectedStudentForPromotion(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="">Choose a student...</option>
                      {allStudents.filter(student => 
                        !teachers.some(teacher => teacher.email === student.email)
                      ).map((student) => (
                        <option key={student.id} value={student.id}>
                          {getStudentDisplayName(student)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Permissions */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Teacher Permissions
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {Object.entries(teacherPermissions).map(([key, value]) => (
                        <label key={key} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={value}
                            onChange={(e) => setTeacherPermissions(prev => ({
                              ...prev,
                              [key]: e.target.checked
                            }))}
                            className="mr-2 rounded focus:ring-green-500"
                          />
                          <span className="text-sm text-gray-700">
                            {key.replace('can_', '').replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={promoteStudentToTeacher}
                    disabled={!selectedStudentForPromotion}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Promote to Teacher
                  </button>
                </div>

                {/* Teachers List */}
                <div className="space-y-4">
                  {loadingTeachers ? (
                    <div className="text-center py-8 text-gray-600">Loading teachers...</div>
                  ) : teachers.length === 0 ? (
                    <div className="text-center py-8 text-gray-600">
                      No teachers yet. Promote a student to get started!
                    </div>
                  ) : (
                    teachers.map((teacher) => (
                      <div
                        key={teacher.id}
                        className="p-6 rounded-lg border border-gray-200"
                        style={{backgroundColor: 'rgba(255,255,255,0.9)'}}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-800">
                              {teacher.student?.name || teacher.email}
                              {teacher.email === 'grantmatai@gmail.com' && (
                                <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                                  Super Admin
                                </span>
                              )}
                            </h3>
                            <p className="text-sm text-gray-600">{teacher.email}</p>
                            <p className="text-xs text-gray-500">
                              Created: {formatDate(teacher.created_at)}
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            {teacher.email !== 'grantmatai@gmail.com' && (
                              <>
                                <button
                                  onClick={() => setSelectedTeacherForEdit(teacher)}
                                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200"
                                >
                                  Edit Permissions
                                </button>
                                <button
                                  onClick={() => demoteTeacher(teacher.id, teacher.email)}
                                  className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200"
                                >
                                  Demote
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Current Permissions */}
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Permissions:</h4>
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(teacher.permissions).map(([key, value]) => (
                              <span
                                key={key}
                                className={`px-2 py-1 text-xs rounded-full ${
                                  value 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-gray-100 text-gray-600'
                                }`}
                              >
                                {key.replace('can_', '').replace('_', ' ')}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Assigned Students */}
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">
                            Assigned Students ({teacher.assignedStudents?.length || 0}):
                          </h4>
                          {teacher.assignedStudents && teacher.assignedStudents.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {teacher.assignedStudents.map((student: any) => (
                                <span
                                  key={student.id}
                                  className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                                >
                                  {getStudentDisplayName(student)}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-gray-500">No students assigned</p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Edit Teacher Permissions Modal */}
                {selectedTeacherForEdit && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                      <div className="p-6">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-semibold text-gray-800">
                            Edit Permissions: {selectedTeacherForEdit.email}
                          </h3>
                          <button
                            onClick={() => setSelectedTeacherForEdit(null)}
                            className="p-2 text-gray-400 hover:text-gray-600"
                          >
                            <XMarkIcon className="w-5 h-5" />
                          </button>
                        </div>

                        {/* Permissions Grid */}
                        <div className="mb-6">
                          <h4 className="text-sm font-medium text-gray-700 mb-3">Permissions</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Object.entries(selectedTeacherForEdit.permissions).map(([key, value]) => (
                              <label key={key} className="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50">
                                <input
                                  type="checkbox"
                                  checked={value}
                                  onChange={(e) => setSelectedTeacherForEdit(prev => ({
                                    ...prev,
                                    permissions: {
                                      ...prev.permissions,
                                      [key]: e.target.checked
                                    }
                                  }))}
                                  className="mr-3 rounded focus:ring-green-500"
                                />
                                <div>
                                  <span className="font-medium text-gray-800">
                                    {key.replace('can_', '').replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                  </span>
                                  <p className="text-xs text-gray-600">
                                    {key === 'can_manage_blog' && 'Create and edit blog posts'}
                                    {key === 'can_manage_materials' && 'Upload and manage student materials'}
                                    {key === 'can_assign_practice' && 'Create practice assignments for students'}
                                    {key === 'can_view_analytics' && 'View student practice analytics'}
                                    {key === 'can_manage_students' && 'Add and remove students'}
                                    {key === 'can_upload_videos' && 'Manage music videos'}
                                  </p>
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* Student Assignments */}
                        <div className="mb-6">
                          <h4 className="text-sm font-medium text-gray-700 mb-3">Assign Students</h4>
                          <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
                            {allStudents.map((student) => (
                              <label key={student.id} className="flex items-center p-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50">
                                <input
                                  type="checkbox"
                                  checked={teacherStudentAssignments.includes(student.id) || 
                                          selectedTeacherForEdit.assignedStudents?.some((s: any) => s.id === student.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setTeacherStudentAssignments(prev => [...prev, student.id]);
                                    } else {
                                      setTeacherStudentAssignments(prev => prev.filter(id => id !== student.id));
                                    }
                                  }}
                                  className="mr-3 rounded focus:ring-green-500"
                                />
                                <div>
                                  <span className="font-medium text-gray-800">{getStudentDisplayName(student)}</span>
                                  {student.assigned_teacher_id && student.assigned_teacher_id !== selectedTeacherForEdit.id && (
                                    <p className="text-xs text-orange-600">Currently assigned to another teacher</p>
                                  )}
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex space-x-3">
                          <button
                            onClick={() => updateTeacherPermissions(selectedTeacherForEdit.id)}
                            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                          >
                            Update Permissions
                          </button>
                          <button
                            onClick={() => updateStudentAssignments(selectedTeacherForEdit.id)}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                          >
                            Update Assignments
                          </button>
                          <button
                            onClick={() => setSelectedTeacherForEdit(null)}
                            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminAuth>
  );
};

const AdminDashboard = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AdminDashboardContent />
    </Suspense>
  );
};

export default AdminDashboard;

'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
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
  CheckIcon
} from '@heroicons/react/24/outline';
import AdminAuth from '@/components/admin/AdminAuth';
import Navigation from '@/components/Navigation';
import { supabase, BlogPost } from '@/lib/supabase';

const AdminDashboardContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Initialize activeTab from URL params, localStorage, or default to 'blog'
  const getInitialTab = () => {
    // First check URL params
    const urlTab = searchParams.get('tab');
    if (urlTab && ['blog', 'music', 'messages', 'students'].includes(urlTab)) {
      return urlTab;
    }
    
    // Then check localStorage
    if (typeof window !== 'undefined') {
      const savedTab = localStorage.getItem('admin-active-tab');
      if (savedTab && ['blog', 'music', 'messages', 'students'].includes(savedTab)) {
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

  // YouTube Videos State
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [addingMusicVideo, setAddingMusicVideo] = useState(false);
  const [videoList, setVideoList] = useState<any[]>([]);

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
    lastName: ''
  });

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

  useEffect(() => {
    loadPosts();
    loadStats();
    loadVideoList();
    loadMessages();
    loadStudents();
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
    if (urlTab && ['blog', 'music', 'messages', 'students'].includes(urlTab)) {
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

  const loadVideoList = () => {
    // Load from localStorage for now - in production this could be in Supabase
    const savedVideos = localStorage.getItem('musicVideos');
    if (savedVideos) {
      setVideoList(JSON.parse(savedVideos));
    }
  };

  const loadMessages = async () => {
    try {
      const response = await fetch('/api/contact');
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
        console.error('Failed to load messages');
        // Fallback to empty array
        setMessages([]);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      setMessages([]);
    }
  };

  const loadStudents = async () => {
    try {
      // Load all users from API route
      const response = await fetch('/api/admin/students');
      const data = await response.json();

      if (!response.ok) {
        console.error('Error loading students:', data.error);
      } else {
        console.log('Admin page: loaded students:', data.data?.length || 0);
        setStudents(data.data || []);
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
          lastName: newStudentForm.lastName
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
      loadStudents();
      
      alert(`Student ${newStudentForm.email} created successfully!`);
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
      lastName: student.user_metadata?.last_name || ''
    });
  };

  const cancelEditStudent = () => {
    setEditingStudent(null);
    setEditStudentForm({
      email: '',
      firstName: '',
      lastName: ''
    });
  };

  const updateStudent = async () => {
    if (!editingStudent || !editStudentForm.email) {
      alert('Please enter a valid email');
      return;
    }

    try {
      // Update user via API route
      const response = await fetch(`/api/admin/students/${editingStudent.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: editStudentForm.email,
          firstName: editStudentForm.firstName,
          lastName: editStudentForm.lastName
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update student');
      }

      // Reset form and reload
      cancelEditStudent();
      loadStudents();
      
      alert('Student updated successfully!');
    } catch (error: any) {
      console.error('Error updating student:', error);
      alert(`Error updating student: ${error.message}`);
    }
  };

  const deleteStudent = async (student: any) => {
    const studentName = student.email;
    if (!confirm(`Are you sure you want to delete student "${studentName}"? This will also delete all their materials and assignments.`)) {
      return;
    }

    try {
      // Delete user via API route
      const response = await fetch(`/api/admin/students/${student.id}`, {
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
      loadStudents();
      
      alert(`Student ${studentName} deleted successfully!`);
    } catch (error: any) {
      console.error('Error deleting student:', error);
      alert(`Error deleting student: ${error.message}`);
    }
  };

  const loadStudentMaterials = async (studentId: string) => {
    if (!studentId) return;
    
    try {
      // Get current user for API authentication
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user || user.email !== 'grantmatai@gmail.com') {
        console.error('Not authenticated as admin user');
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
      const userEmail = encodeURIComponent('grantmatai@gmail.com');
      const response = await fetch(`/api/admin/assignments?studentId=${studentId}&userEmail=${userEmail}`);
      
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
      const userEmail = encodeURIComponent('grantmatai@gmail.com');
      const response = await fetch(`/api/admin/videos?studentId=${studentId}&userEmail=${userEmail}`);
      
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
      
      if (!user || user.email !== 'grantmatai@gmail.com') {
        throw new Error(`Authentication issue: Expected grantmatai@gmail.com, got ${user?.email || 'no user'}. Please refresh the page and log in again.`);
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
      const userEmail = encodeURIComponent('grantmatai@gmail.com');
      const response = await fetch(`/api/admin/assignments?userEmail=${userEmail}`, {
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
      const userEmail = encodeURIComponent('grantmatai@gmail.com');
      const response = await fetch(`/api/admin/assignments?userEmail=${userEmail}`, {
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
      const userEmail = encodeURIComponent('grantmatai@gmail.com');
      const response = await fetch(`/api/admin/materials/${materialId}?userEmail=${userEmail}`, {
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
      const userEmail = encodeURIComponent('grantmatai@gmail.com');
      const response = await fetch(`/api/admin/assignments/${assignmentId}?userEmail=${userEmail}`, {
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
      const userEmail = encodeURIComponent('grantmatai@gmail.com');
      const response = await fetch(`/api/admin/videos?userEmail=${userEmail}`, {
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
      const userEmail = encodeURIComponent('grantmatai@gmail.com');
      const response = await fetch(`/api/admin/videos?userEmail=${userEmail}&videoId=${videoId}`, {
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

  const extractVideoId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    return match ? match[1] : null;
  };

  const addYouTubeVideo = async () => {
    if (!youtubeUrl) return;

    setAddingMusicVideo(true);
    const videoId = extractVideoId(youtubeUrl);
    
    if (!videoId) {
      alert('Please enter a valid YouTube URL');
      setAddingMusicVideo(false);
      return;
    }

    try {
      // Fetch video data from YouTube API
      const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
      const data = await response.json();

      const newVideo = {
        id: videoId,
        title: data.title || `Video ${videoId}`,
        author: data.author_name || 'Grant Matai Cross',
        thumbnail: data.thumbnail_url,
        addedDate: new Date().toISOString()
      };

      const updatedVideos = [...videoList, newVideo];
      setVideoList(updatedVideos);
      localStorage.setItem('musicVideos', JSON.stringify(updatedVideos));
      setYoutubeUrl('');
    } catch (error) {
      console.error('Error adding video:', error);
      alert('Error adding video. Please try again.');
    } finally {
      setAddingMusicVideo(false);
    }
  };

  const removeVideo = (videoId: string) => {
    const updatedVideos = videoList.filter(v => v.id !== videoId);
    setVideoList(updatedVideos);
    localStorage.setItem('musicVideos', JSON.stringify(updatedVideos));
  };

  const markMessageAsRead = async (messageId: string) => {
    try {
      const response = await fetch('/api/contact', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: messageId,
          status: 'read'
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
      const response = await fetch('/api/contact', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: messageId
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
    { id: 'students', name: 'Students', fullName: 'Students', icon: AcademicCapIcon }
  ];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <AdminAuth>
      {/* Main Navigation */}
      <Navigation />
      
      <div className="min-h-screen" style={{backgroundColor: '#87AA6A'}}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
            <p className="text-white text-opacity-80">Manage your blog, music, and messages</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6 mb-8">
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
            <div className="rounded-2xl p-4 md:p-6 col-span-2 md:col-span-1" style={{backgroundColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)'}}>
              <div className="text-white text-opacity-60 text-xs md:text-sm">Unread Messages</div>
              <div className="text-white text-xl md:text-2xl font-bold text-orange-300">{stats.unreadMessages}</div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="rounded-2xl p-1 mb-8" style={{backgroundColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)'}}>
            {/* Desktop Tab Navigation */}
            <nav className="hidden md:flex space-x-1">
              {tabs.map((tab) => {
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
                {tabs.map((tab) => {
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

                {/* Add Video Form */}
                <div className="mb-6 p-4 rounded-lg" style={{backgroundColor: 'rgba(255,255,255,0.9)'}}>
                  <h3 className="text-gray-800 font-medium mb-4">Add New YouTube Video</h3>
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
                    videoList.map((video) => (
                      <div
                        key={video.id}
                        className="flex items-center justify-between p-4 rounded-lg border border-gray-200"
                        style={{backgroundColor: 'rgba(255,255,255,0.9)'}}
                      >
                        <div className="flex items-center space-x-4">
                          <img
                            src={video.thumbnail || `https://img.youtube.com/vi/${video.id}/mqdefault.jpg`}
                            alt={video.title}
                            className="w-16 h-12 object-cover rounded"
                          />
                          <div>
                            <h3 className="text-gray-800 font-medium">{video.title}</h3>
                            <p className="text-gray-600 text-sm">{video.author}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <a
                            href={`https://youtube.com/watch?v=${video.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            <PlayIcon className="w-4 h-4" />
                          </a>
                          <button
                            onClick={() => removeVideo(video.id)}
                            className="p-2 text-red-600 hover:text-red-800 transition-colors"
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

                {/* Students List */}
                <div className="mb-6 p-4 rounded-lg" style={{backgroundColor: 'rgba(255,255,255,0.8)'}}>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <UserGroupIcon className="h-5 w-5 mr-2" />
                    All Students ({students.length})
                  </h3>
                  
                  {students.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No students yet. Create your first student above!</p>
                  ) : (
                    <div className="space-y-3">
                      {students.map((student) => (
                        <div
                          key={student.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                        >
                          <div className="flex-1">
                            <h4 className="text-gray-800 font-medium">{student.email}</h4>
                            <div className="text-sm text-gray-600">
                              {student.user_metadata?.first_name && student.user_metadata?.last_name ? (
                                <span>{student.user_metadata.first_name} {student.user_metadata.last_name}</span>
                              ) : (
                                <span className="text-gray-400 italic">No name provided</span>
                              )}
                              <span className="mx-2">•</span>
                              <span>Joined: {new Date(student.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => setSelectedStudent(student.id)}
                              className={`px-3 py-1 rounded text-sm font-medium ${
                                selectedStudent === student.id
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                              }`}
                            >
                              {selectedStudent === student.id ? 'Selected' : 'Manage'}
                            </button>
                            <button
                              onClick={() => startEditStudent(student)}
                              className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteStudent(student)}
                              className="p-2 text-red-600 hover:text-red-800 transition-colors"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
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
                        {student.email} {student.user_metadata?.first_name && student.user_metadata?.last_name && 
                          `(${student.user_metadata.first_name} ${student.user_metadata.last_name})`}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedStudent && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <select
                            value={newAssignment.day}
                            onChange={(e) => setNewAssignment({...newAssignment, day: e.target.value})}
                            className="p-2 border border-gray-300 rounded text-sm"
                          >
                            <option value="monday">Monday</option>
                            <option value="tuesday">Tuesday</option>
                            <option value="wednesday">Wednesday</option>
                            <option value="thursday">Thursday</option>
                            <option value="friday">Friday</option>
                            <option value="saturday">Saturday</option>
                            <option value="sunday">Sunday</option>
                          </select>
                          <input
                            type="text"
                            placeholder="Assignment title"
                            value={newAssignment.title}
                            onChange={(e) => setNewAssignment({...newAssignment, title: e.target.value})}
                            className="p-2 border border-gray-300 rounded text-sm"
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
                          ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => {
                            const dayAssignments = studentAssignments.filter(a => a.day === day);
                            if (dayAssignments.length === 0) return null;
                            
                            return (
                              <div key={day} className="mb-3">
                                <h4 className="text-sm font-medium text-gray-700 capitalize mb-1">{day}</h4>
                                {dayAssignments.map((assignment) => (
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
                                ))}
                              </div>
                            );
                          })
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

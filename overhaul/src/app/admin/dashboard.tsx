'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
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
  XMarkIcon
} from '@heroicons/react/24/outline';
import AdminAuth from '@/components/admin/AdminAuth';
import { supabase, BlogPost } from '@/lib/supabase';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('blog');
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPosts: 0,
    publishedPosts: 0,
    draftPosts: 0,
    subscribers: 0
  });

  // YouTube Videos State
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [addingVideo, setAddingVideo] = useState(false);
  const [videoList, setVideoList] = useState<any[]>([]);

  // Messages State
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    loadPosts();
    loadStats();
    loadVideoList();
    loadMessages();
  }, []);

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

        setStats({
          totalPosts,
          publishedPosts,
          draftPosts,
          subscribers: subscribersData?.length || 0
        });
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

  const loadMessages = () => {
    // Mock messages for now - in production these would come from contact forms and comments
    const mockMessages = [
      {
        id: 1,
        type: 'contact',
        from: 'john.doe@email.com',
        subject: 'Lesson Inquiry',
        message: 'Hi, I\'m interested in beginner guitar lessons. What are your rates?',
        date: '2024-08-28',
        read: false
      },
      {
        id: 2,
        type: 'comment',
        from: 'sarah.music@email.com',
        subject: 'Comment on "Fingerpicking Guide"',
        message: 'Great tutorial! The step-by-step approach really helped me understand.',
        date: '2024-08-27',
        read: true
      }
    ];
    setMessages(mockMessages);
  };

  const extractVideoId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    return match ? match[1] : null;
  };

  const addYouTubeVideo = async () => {
    if (!youtubeUrl) return;

    setAddingVideo(true);
    const videoId = extractVideoId(youtubeUrl);
    
    if (!videoId) {
      alert('Please enter a valid YouTube URL');
      setAddingVideo(false);
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
      setAddingVideo(false);
    }
  };

  const removeVideo = (videoId: string) => {
    const updatedVideos = videoList.filter(v => v.id !== videoId);
    setVideoList(updatedVideos);
    localStorage.setItem('musicVideos', JSON.stringify(updatedVideos));
  };

  const markMessageAsRead = (messageId: number) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, read: true } : msg
    ));
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

  const tabs = [
    { id: 'blog', name: 'Blog Posts', icon: DocumentTextIcon },
    { id: 'music', name: 'Music Videos', icon: MusicalNoteIcon },
    { id: 'messages', name: 'Messages', icon: ChatBubbleLeftRightIcon }
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
      <div className="min-h-screen" style={{backgroundColor: '#87AA6A'}}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
            <p className="text-white text-opacity-80">Manage your blog, music, and messages</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="rounded-2xl p-6" style={{backgroundColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)'}}>
              <div className="text-white text-opacity-60 text-sm">Total Posts</div>
              <div className="text-white text-2xl font-bold">{stats.totalPosts}</div>
            </div>
            <div className="rounded-2xl p-6" style={{backgroundColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)'}}>
              <div className="text-white text-opacity-60 text-sm">Published</div>
              <div className="text-white text-2xl font-bold">{stats.publishedPosts}</div>
            </div>
            <div className="rounded-2xl p-6" style={{backgroundColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)'}}>
              <div className="text-white text-opacity-60 text-sm">Drafts</div>
              <div className="text-white text-2xl font-bold">{stats.draftPosts}</div>
            </div>
            <div className="rounded-2xl p-6" style={{backgroundColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)'}}>
              <div className="text-white text-opacity-60 text-sm">Subscribers</div>
              <div className="text-white text-2xl font-bold">{stats.subscribers}</div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="rounded-2xl p-1 mb-8" style={{backgroundColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)'}}>
            <nav className="flex space-x-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center px-6 py-3 rounded-xl text-sm font-medium transition-all ${
                      activeTab === tab.id
                        ? 'bg-white bg-opacity-20 text-white'
                        : 'text-white text-opacity-60 hover:text-white hover:bg-white hover:bg-opacity-10'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="rounded-2xl p-6" style={{backgroundColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)'}}>
            {activeTab === 'blog' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-white">Blog Posts</h2>
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
                  <div className="text-white text-center py-8">Loading posts...</div>
                ) : posts.length === 0 ? (
                  <div className="text-white text-opacity-60 text-center py-8">
                    No posts yet. Create your first post!
                  </div>
                ) : (
                  <div className="space-y-4">
                    {posts.map((post) => (
                      <div
                        key={post.id}
                        className="flex items-center justify-between p-4 rounded-lg bg-white bg-opacity-10"
                      >
                        <div className="flex-1">
                          <h3 className="text-white font-medium">{post.title}</h3>
                          <div className="flex items-center space-x-4 mt-1">
                            <span className={`px-2 py-1 rounded text-xs ${
                              post.published 
                                ? 'bg-green-500 bg-opacity-20 text-green-300' 
                                : 'bg-yellow-500 bg-opacity-20 text-yellow-300'
                            }`}>
                              {post.published ? 'Published' : 'Draft'}
                            </span>
                            <span className="text-white text-opacity-60 text-sm">
                              {formatDate(post.created_at)}
                            </span>
                            {post.featured && (
                              <span className="px-2 py-1 rounded text-xs bg-orange-500 bg-opacity-20 text-orange-300">
                                Featured
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button className="p-2 text-white text-opacity-60 hover:text-white transition-colors">
                            <EyeIcon className="w-4 h-4" />
                          </button>
                          <button className="p-2 text-white text-opacity-60 hover:text-white transition-colors">
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

            {activeTab === 'music' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-white">Music Videos</h2>
                </div>

                {/* Add Video Form */}
                <div className="mb-6 p-4 rounded-lg bg-white bg-opacity-10">
                  <h3 className="text-white font-medium mb-4">Add New YouTube Video</h3>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={youtubeUrl}
                      onChange={(e) => setYoutubeUrl(e.target.value)}
                      placeholder="Paste YouTube URL here..."
                      className="flex-1 px-4 py-2 rounded-lg bg-white bg-opacity-20 border border-white border-opacity-30 text-white placeholder-white placeholder-opacity-60 focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                    <button
                      onClick={addYouTubeVideo}
                      disabled={addingVideo}
                      className="px-4 py-2 rounded-lg font-medium text-white transition-all hover-lift disabled:opacity-50"
                      style={{backgroundColor: '#BC6A1B'}}
                    >
                      {addingVideo ? 'Adding...' : 'Add Video'}
                    </button>
                  </div>
                </div>

                {/* Video List */}
                <div className="space-y-4">
                  {videoList.length === 0 ? (
                    <div className="text-white text-opacity-60 text-center py-8">
                      No videos added yet. Add a YouTube URL above to get started!
                    </div>
                  ) : (
                    videoList.map((video) => (
                      <div
                        key={video.id}
                        className="flex items-center justify-between p-4 rounded-lg bg-white bg-opacity-10"
                      >
                        <div className="flex items-center space-x-4">
                          <img
                            src={video.thumbnail || `https://img.youtube.com/vi/${video.id}/mqdefault.jpg`}
                            alt={video.title}
                            className="w-16 h-12 object-cover rounded"
                          />
                          <div>
                            <h3 className="text-white font-medium">{video.title}</h3>
                            <p className="text-white text-opacity-60 text-sm">{video.author}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <a
                            href={`https://youtube.com/watch?v=${video.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-white text-opacity-60 hover:text-white transition-colors"
                          >
                            <PlayIcon className="w-4 h-4" />
                          </a>
                          <button
                            onClick={() => removeVideo(video.id)}
                            className="p-2 text-red-300 hover:text-red-200 transition-colors"
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
                  <h2 className="text-xl font-bold text-white">Messages & Comments</h2>
                </div>

                <div className="space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-white text-opacity-60 text-center py-8">
                      No messages yet.
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`p-4 rounded-lg ${
                          message.read 
                            ? 'bg-white bg-opacity-10' 
                            : 'bg-white bg-opacity-20 border border-orange-400 border-opacity-50'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="text-white font-medium">{message.subject}</h3>
                            <p className="text-white text-opacity-60 text-sm">
                              From: {message.from} • {formatDate(message.date)}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded text-xs ${
                              message.type === 'contact' 
                                ? 'bg-blue-500 bg-opacity-20 text-blue-300' 
                                : 'bg-green-500 bg-opacity-20 text-green-300'
                            }`}>
                              {message.type === 'contact' ? 'Contact' : 'Comment'}
                            </span>
                            {!message.read && (
                              <button
                                onClick={() => markMessageAsRead(message.id)}
                                className="text-white text-opacity-60 hover:text-white text-xs"
                              >
                                Mark as read
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-white text-opacity-80">{message.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminAuth>
  );
};

export default AdminDashboard;

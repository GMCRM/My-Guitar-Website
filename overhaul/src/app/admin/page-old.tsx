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
  TagIcon
} from '@heroicons/react/24/outline';
import AdminAuth from '@/components/admin/AdminAuth';
import { supabase, BlogPost } from '@/lib/supabase';

const AdminDashboard = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPosts: 0,
    publishedPosts: 0,
    draftPosts: 0,
    subscribers: 0
  });

  useEffect(() => {
    loadPosts();
    loadStats();
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
      // Get posts stats
      const { data: allPosts } = await supabase
        .from('blog_posts')
        .select('published');

      const totalPosts = allPosts?.length || 0;
      const publishedPosts = allPosts?.filter(p => p.published).length || 0;
      const draftPosts = totalPosts - publishedPosts;

      // Get subscribers count
      const { count: subscribersCount } = await supabase
        .from('subscribers')
        .select('*', { count: 'exact', head: true })
        .eq('active', true);

      setStats({
        totalPosts,
        publishedPosts,
        draftPosts,
        subscribers: subscribersCount || 0
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const deletePost = async (id: string) => {
    if (!confirm('Are you sure you want to delete this post?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting post:', error);
        alert('Failed to delete post');
      } else {
        setPosts(posts.filter(p => p.id !== id));
        loadStats(); // Refresh stats
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post');
    }
  };

  const togglePublished = async (post: BlogPost) => {
    try {
      const { error } = await supabase
        .from('blog_posts')
        .update({ 
          published: !post.published,
          published_at: !post.published ? new Date().toISOString() : null
        })
        .eq('id', post.id);

      if (error) {
        console.error('Error updating post:', error);
        alert('Failed to update post');
      } else {
        setPosts(posts.map(p => 
          p.id === post.id 
            ? { ...p, published: !p.published, published_at: !p.published ? new Date().toISOString() : p.published_at }
            : p
        ));
        loadStats(); // Refresh stats
      }
    } catch (error) {
      console.error('Error updating post:', error);
      alert('Failed to update post');
    }
  };

  if (loading) {
    return (
      <AdminAuth>
        <div className="min-h-screen flex items-center justify-center" style={{backgroundColor: '#87AA6A'}}>
          <div className="text-white text-lg">Loading dashboard...</div>
        </div>
      </AdminAuth>
    );
  }

  return (
    <AdminAuth>
      <div className="min-h-screen" style={{backgroundColor: '#87AA6A'}}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
          {/* Dashboard Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white font-serif">Blog Dashboard</h1>
              <p className="text-white text-opacity-70 mt-2">Manage your guitar blog content</p>
            </div>
            <Link
              href="/admin/posts/new"
              className="inline-flex items-center px-6 py-3 text-white font-semibold rounded-lg transition-all hover-lift"
              style={{backgroundColor: '#BC6A1B'}}
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              New Post
            </Link>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="rounded-2xl p-6 text-center"
              style={{backgroundColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)'}}
            >
              <div className="text-3xl font-bold text-white mb-2">{stats.totalPosts}</div>
              <div className="text-white text-opacity-70">Total Posts</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="rounded-2xl p-6 text-center"
              style={{backgroundColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)'}}
            >
              <div className="text-3xl font-bold text-green-400 mb-2">{stats.publishedPosts}</div>
              <div className="text-white text-opacity-70">Published</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="rounded-2xl p-6 text-center"
              style={{backgroundColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)'}}
            >
              <div className="text-3xl font-bold text-yellow-400 mb-2">{stats.draftPosts}</div>
              <div className="text-white text-opacity-70">Drafts</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="rounded-2xl p-6 text-center"
              style={{backgroundColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)'}}
            >
              <div className="text-3xl font-bold text-blue-400 mb-2">{stats.subscribers}</div>
              <div className="text-white text-opacity-70">Subscribers</div>
            </motion.div>
          </div>

          {/* Posts Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="rounded-2xl overflow-hidden"
            style={{backgroundColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)'}}
          >
            <div className="p-6">
              <h2 className="text-xl font-bold text-white mb-6">Recent Posts</h2>
              
              {posts.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📝</div>
                  <div className="text-white text-opacity-70 text-lg mb-4">No blog posts yet</div>
                  <Link
                    href="/admin/posts/new"
                    className="inline-flex items-center px-6 py-3 text-white font-semibold rounded-lg transition-all hover-lift"
                    style={{backgroundColor: '#BC6A1B'}}
                  >
                    Create Your First Post
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {posts.map((post) => (
                    <div
                      key={post.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-white border-opacity-10 hover:bg-white hover:bg-opacity-5 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-white font-semibold">{post.title}</h3>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            post.published 
                              ? 'bg-green-500 bg-opacity-20 text-green-300' 
                              : 'bg-yellow-500 bg-opacity-20 text-yellow-300'
                          }`}>
                            {post.published ? 'Published' : 'Draft'}
                          </span>
                          {post.featured && (
                            <span className="px-2 py-1 rounded text-xs font-medium bg-orange-500 bg-opacity-20 text-orange-300">
                              Featured
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-white text-opacity-60">
                          <span className="flex items-center">
                            <CalendarDaysIcon className="w-4 h-4 mr-1" />
                            {new Date(post.created_at).toLocaleDateString()}
                          </span>
                          {post.tags && post.tags.length > 0 && (
                            <span className="flex items-center">
                              <TagIcon className="w-4 h-4 mr-1" />
                              {post.tags.slice(0, 2).join(', ')}
                              {post.tags.length > 2 && ` +${post.tags.length - 2}`}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {post.published && (
                          <Link
                            href={`/blog/${post.id}`}
                            target="_blank"
                            className="p-2 text-white text-opacity-60 hover:text-white hover:bg-white hover:bg-opacity-10 rounded transition-colors"
                          >
                            <EyeIcon className="w-4 h-4" />
                          </Link>
                        )}
                        
                        <Link
                          href={`/admin/posts/${post.id}`}
                          className="p-2 text-white text-opacity-60 hover:text-white hover:bg-white hover:bg-opacity-10 rounded transition-colors"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </Link>

                        <button
                          onClick={() => togglePublished(post)}
                          className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                            post.published
                              ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                              : 'bg-green-600 hover:bg-green-700 text-white'
                          }`}
                        >
                          {post.published ? 'Unpublish' : 'Publish'}
                        </button>

                        <button
                          onClick={() => deletePost(post.id)}
                          className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500 hover:bg-opacity-10 rounded transition-colors"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <Link
              href="/admin/subscribers"
              className="block p-6 rounded-2xl text-center hover-lift transition-all"
              style={{backgroundColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)'}}
            >
              <div className="text-4xl mb-3">📧</div>
              <div className="text-white font-semibold mb-2">Manage Subscribers</div>
              <div className="text-white text-opacity-70 text-sm">View and manage your email subscribers</div>
            </Link>

            <Link
              href="/blog"
              target="_blank"
              className="block p-6 rounded-2xl text-center hover-lift transition-all"
              style={{backgroundColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)'}}
            >
              <div className="text-4xl mb-3">👁️</div>
              <div className="text-white font-semibold mb-2">View Public Blog</div>
              <div className="text-white text-opacity-70 text-sm">See how your blog looks to visitors</div>
            </Link>
          </div>
        </div>
      </div>
    </AdminAuth>
  );
};

export default AdminDashboard;

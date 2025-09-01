'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { MagnifyingGlassIcon, CalendarIcon, UserIcon, TagIcon, HeartIcon, ShareIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { supabase } from '@/lib/supabase';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  image_url: string | null;
  author: string;
  created_at: string;
  tags: string[];
}

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<BlogPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [shareStatus, setShareStatus] = useState<string | null>(null);

  const handlePostClick = (post: BlogPost) => {
    setSelectedPost(post);
    // Scroll to top to show the featured post
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLike = (postId: string) => {
    setLikedPosts(prev => {
      const newLiked = new Set(prev);
      if (newLiked.has(postId)) {
        newLiked.delete(postId);
      } else {
        newLiked.add(postId);
      }
      return newLiked;
    });
  };

  const handleShare = async (post: BlogPost) => {
    const shareData = {
      title: post.title,
      text: post.excerpt,
      url: window.location.href
    };

    try {
      // Try using the Web Share API if available (mobile devices)
      if (navigator.share) {
        await navigator.share(shareData);
        setShareStatus('Shared successfully!');
      } else {
        // Fallback: copy to clipboard
        const shareText = `Check out this blog post: "${post.title}" - ${post.excerpt}\n\n${window.location.href}`;
        await navigator.clipboard.writeText(shareText);
        setShareStatus('Link copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      setShareStatus('Unable to share');
    }

    // Clear status message after 3 seconds
    setTimeout(() => setShareStatus(null), 3000);
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setPosts(data || []);
      setFilteredPosts(data || []);
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError('Failed to load blog posts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = posts;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(post =>
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(post =>
        post.tags && post.tags.includes(selectedCategory)
      );
    }

    setFilteredPosts(filtered);
  }, [searchTerm, selectedCategory, posts]);

  const categories = ['All', 'Music', 'Teaching', 'Performance', 'Inspiration'];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen" style={{backgroundColor: '#87AA6A'}}>
        <Navigation />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-white text-xl">Loading blog posts...</div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen" style={{backgroundColor: '#87AA6A'}}>
        <Navigation />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-white text-xl">{error}</div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{backgroundColor: '#87AA6A'}}>
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative py-24 sm:py-32" style={{backgroundColor: '#66732C'}}>
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-4xl font-bold tracking-tight text-white sm:text-6xl font-serif"
            >
              Musical{' '}
              <span className="relative" style={{color: '#BC6A1B'}}>
                Journey
                <div className="absolute -bottom-2 left-0 right-0 h-1 rounded-full opacity-30" style={{backgroundColor: '#602718'}}></div>
              </span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mt-6 text-lg leading-8 text-white"
            >
              {selectedPost 
                ? `Reading: ${selectedPost.title}` 
                : "Stories, insights, and inspiration from my musical journey. Discover the beauty of guitar music and the joy of teaching."
              }
            </motion.p>
          </div>
        </div>
      </section>

      {/* Featured Post Section */}
      {selectedPost && (
        <section className="py-16" style={{backgroundColor: '#87AA6A'}}>
          <div className="mx-auto max-w-4xl px-6 lg:px-8">
            {/* Back to posts button */}
            <button 
              onClick={() => setSelectedPost(null)}
              className="inline-flex items-center text-white hover:text-orange-200 transition-colors mb-8"
            >
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Back to All Posts
            </button>

            {/* Main Article Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="bg-white/10 backdrop-blur-sm rounded-2xl overflow-hidden shadow-xl"
            >
              {/* Card Header */}
              <div className="p-8 pb-0">
                {/* Article Meta */}
                <div className="flex items-center space-x-4 text-sm text-white text-opacity-70 mb-6">
                  <span className="flex items-center">
                    <CalendarIcon className="w-4 h-4 mr-1" />
                    {new Date(selectedPost.created_at).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </span>
                  <span className="flex items-center">
                    <span>5 min read</span>
                  </span>
                  <span>By {selectedPost.author}</span>
                </div>

                {/* Title */}
                <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6 font-serif">
                  {selectedPost.title}
                </h1>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-8">
                  {selectedPost.tags.map((tag: string) => (
                    <span 
                      key={tag}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white"
                      style={{backgroundColor: '#BC6A1B'}}
                    >
                      <TagIcon className="w-3 h-3 mr-1" />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Featured Image */}
              {selectedPost.image_url ? (
                <div className="aspect-[2/1] overflow-hidden">
                  <img 
                    src={selectedPost.image_url} 
                    alt={selectedPost.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="aspect-[2/1] flex items-center justify-center text-8xl" style={{backgroundColor: 'rgba(188, 106, 27, 0.3)'}}>
                  🎸
                </div>
              )}

              {/* Article Content */}
              <div className="p-8">
                <div
                  className="prose prose-lg prose-invert max-w-none"
                  style={{
                    '--tw-prose-body': 'rgb(255 255 255 / 0.95)',
                    '--tw-prose-headings': 'rgb(255 255 255)',
                    '--tw-prose-links': 'rgb(251 146 60)',
                    '--tw-prose-bold': 'rgb(255 255 255)',
                    '--tw-prose-quotes': 'rgb(255 255 255 / 0.9)',
                    '--tw-prose-quote-borders': 'rgb(188 106 27)',
                    '--tw-prose-code': 'rgb(255 255 255)',
                  } as React.CSSProperties}
                >
                  <div 
                    dangerouslySetInnerHTML={{ __html: selectedPost.content.replace(/\n/g, '<br />') }}
                    className="whitespace-pre-line"
                  />
                </div>
              </div>

              {/* Article Footer */}
              <div className="px-8 pb-8">
                <div className="flex items-center justify-between border-t border-white/20 pt-6">
                  <div className="flex items-center space-x-4">
                    <button 
                      onClick={() => handleLike(selectedPost.id)}
                      className={`flex items-center space-x-2 transition-colors ${
                        likedPosts.has(selectedPost.id) 
                          ? 'text-red-400 hover:text-red-300' 
                          : 'text-white hover:text-orange-200'
                      }`}
                    >
                      <HeartIcon className={`w-5 h-5 ${likedPosts.has(selectedPost.id) ? 'fill-current' : ''}`} />
                      <span>{likedPosts.has(selectedPost.id) ? 'Liked!' : 'Like this article'}</span>
                    </button>
                    <button 
                      onClick={() => handleShare(selectedPost)}
                      className="flex items-center space-x-2 text-white hover:text-orange-200 transition-colors"
                    >
                      <ShareIcon className="w-5 h-5" />
                      <span>Share</span>
                    </button>
                    {shareStatus && (
                      <span className="text-green-300 text-sm ml-2">
                        {shareStatus}
                      </span>
                    )}
                  </div>
                  
                  <div className="text-white text-opacity-70 text-sm">
                    Published by {selectedPost.author}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* Search and Filter Section */}
      <section className="py-12" style={{backgroundColor: selectedPost ? '#66732C' : '#535925'}}>
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl">
            {/* Search Bar */}
            <div className="relative mb-8">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-white" />
              </div>
              <input
                type="text"
                placeholder="Search posts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 text-white placeholder-white/70 bg-white/10 rounded-lg border border-white/20 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent backdrop-blur-sm"
              />
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2 justify-center">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedCategory === category
                      ? 'text-white shadow-lg'
                      : 'text-white hover:bg-white/10'
                  }`}
                  style={{
                    backgroundColor: selectedCategory === category ? '#BC6A1B' : 'transparent',
                    border: `2px solid ${selectedCategory === category ? '#BC6A1B' : 'rgba(255,255,255,0.3)'}`
                  }}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="py-16 sm:py-24" style={{backgroundColor: '#87AA6A'}}>
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          {filteredPosts.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-2xl font-semibold text-white mb-4">
                {searchTerm || selectedCategory !== 'All' ? 'No posts found' : 'No blog posts yet'}
              </h3>
              <p className="text-white/80">
                {searchTerm || selectedCategory !== 'All' 
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Check back soon for new content!'}
              </p>
            </div>
          ) : (
            <div className="grid gap-8 lg:grid-cols-2 xl:grid-cols-3">
              {filteredPosts.map((post, index) => (
                <motion.article
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  onClick={() => handlePostClick(post)}
                  className="group relative flex flex-col overflow-hidden rounded-2xl shadow-soft hover:shadow-warm transition-all duration-300 hover-lift cursor-pointer"
                  style={{backgroundColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)'}}
                >
                  {/* Featured Image */}
                  {post.image_url && (
                    <div className="aspect-video overflow-hidden">
                      <img
                        src={post.image_url}
                        alt={post.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                  )}
                  
                  {/* Content */}
                  <div className="flex flex-1 flex-col p-6">
                    <div className="flex-1">
                      {/* Tags */}
                      {post.tags && post.tags.length > 0 && (
                        <div className="mb-3 flex flex-wrap gap-2">
                          {post.tags.map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
                              style={{backgroundColor: '#BC6A1B'}}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      {/* Title */}
                      <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-orange-200 transition-colors">
                        {post.title}
                      </h3>
                      
                      {/* Excerpt */}
                      <p className="text-white/80 text-sm leading-6 mb-4">
                        {post.excerpt}
                      </p>
                    </div>
                    
                    {/* Meta Information */}
                    <div className="flex items-center text-xs text-white/60 space-x-4">
                      <div className="flex items-center">
                        <UserIcon className="h-4 w-4 mr-1" />
                        {post.author}
                      </div>
                      <div className="flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-1" />
                        {formatDate(post.created_at)}
                      </div>
                    </div>
                  </div>
                  </motion.article>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}

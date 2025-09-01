'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  CalendarDaysIcon,
  ClockIcon,
  TagIcon,
  ArrowLeftIcon,
  ShareIcon,
  HeartIcon
} from '@heroicons/react/24/outline';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { supabase } from '@/lib/supabase';

interface BlogPostPageProps {
  params: {
    id: string;
  };
}

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  created_at: string;
  tags: string[];
  image_url?: string;
}

const BlogPostPage = ({ params }: BlogPostPageProps) => {
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPost();
  }, [params.id]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('id', params.id)
        .single();

      if (error) {
        throw error;
      }

      setPost(data);
    } catch (err) {
      console.error('Error fetching post:', err);
      setError('Failed to load blog post');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{backgroundColor: '#87AA6A'}}>
        <div className="text-white text-lg">Loading article...</div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen" style={{backgroundColor: '#87AA6A'}}>
        <Navigation />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-4">
              {error ? 'Error Loading Article' : 'Article Not Found'}
            </h1>
            <p className="text-white/80 mb-6">
              {error || 'The blog post you\'re looking for doesn\'t exist.'}
            </p>
            <Link 
              href="/blog" 
              className="text-orange-200 hover:text-white transition-colors"
            >
              ← Back to Blog
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{backgroundColor: '#87AA6A'}}>
      <Navigation />
      
      {/* Article Card */}
      <article className="py-16" style={{backgroundColor: '#87AA6A'}}>
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          {/* Back Link - Outside card */}
          <Link 
            href="/blog"
            className="inline-flex items-center text-white hover:text-orange-200 transition-colors mb-8"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back to Blog
          </Link>

          {/* Main Article Card */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl overflow-hidden shadow-xl">
            {/* Card Header */}
            <div className="p-8 pb-0">
              {/* Article Meta */}
              <div className="flex items-center space-x-4 text-sm text-white text-opacity-70 mb-6">
                <span className="flex items-center">
                  <CalendarDaysIcon className="w-4 h-4 mr-1" />
                  {new Date(post.created_at).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </span>
                <span className="flex items-center">
                  <ClockIcon className="w-4 h-4 mr-1" />
                  5 min read
                </span>
                <span>By {post.author}</span>
              </div>

              {/* Title */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="text-4xl sm:text-5xl font-bold text-white mb-6 font-serif"
              >
                {post.title}
              </motion.h1>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-8">
                {post.tags.map((tag: string) => (
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
            {post.image_url ? (
              <div className="aspect-[2/1] overflow-hidden">
                <img 
                  src={post.image_url} 
                  alt={post.title}
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
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
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
                  dangerouslySetInnerHTML={{ __html: post.content.replace(/\n/g, '<br />') }}
                  className="whitespace-pre-line"
                />
              </motion.div>
            </div>

            {/* Article Footer */}
            <div className="px-8 pb-8">
              <div className="flex items-center justify-between border-t border-white/20 pt-6">
                <div className="flex items-center space-x-4">
                  <button className="flex items-center space-x-2 text-white hover:text-orange-200 transition-colors">
                    <HeartIcon className="w-5 h-5" />
                    <span>Like this article</span>
                  </button>
                  <button className="flex items-center space-x-2 text-white hover:text-orange-200 transition-colors">
                    <ShareIcon className="w-5 h-5" />
                    <span>Share</span>
                  </button>
                </div>
                
                <div className="text-white text-opacity-70 text-sm">
                  Published by {post.author}
                </div>
              </div>
            </div>
          </div>
        </div>
      </article>

      {/* Newsletter Signup */}
      <section className="py-16" style={{backgroundColor: '#66732C'}}>
        <div className="mx-auto max-w-4xl px-6 lg:px-8 text-center">
          <h3 className="text-2xl font-bold text-white mb-4">
            Enjoyed this article?
          </h3>
          <p className="text-white text-opacity-80 mb-8">
            Subscribe to get notified when I publish new insights about guitar technique and musical expression.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-lg bg-white bg-opacity-10 border border-white border-opacity-20 text-white placeholder-white placeholder-opacity-60 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
            />
            <button
              className="px-6 py-3 text-sm font-semibold text-white rounded-lg transition-all hover-lift"
              style={{backgroundColor: '#BC6A1B'}}
            >
              Subscribe
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default BlogPostPage;

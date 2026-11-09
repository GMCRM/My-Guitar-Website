'use client';

import { apiFetch } from '@/lib/apiFetch';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeftIcon, PhotoIcon, EyeIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Navigation from '@/components/Navigation';
import AdminAuth from '@/components/admin/AdminAuth';
import { supabase } from '@/lib/supabase';
import { fitImageForUpload } from '@/lib/fitImageForUpload';

interface PostData {
  title: string;
  content: string;
  excerpt: string;
  featured: boolean;
  published: boolean;
  tags: string[];
  image_url?: string;
}

export default function NewBlogPost() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [postData, setPostData] = useState<PostData>({
    title: '',
    content: '',
    excerpt: '',
    featured: false,
    published: false,
    tags: [],
    image_url: ''
  });
  const [tagInput, setTagInput] = useState('');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

    const uploadImage = async (): Promise<string | null> => {
    if (!selectedFile) return null;

    setIsUploading(true);
    try {
      // Convert HEIC to JPG if needed
      if (selectedFile.type === 'image/heic' || selectedFile.name.toLowerCase().endsWith('.heic')) {
        // For HEIC files, we'll need to handle conversion or ask user to convert
        alert('Please convert HEIC files to JPG format before uploading.');
        return null;
      }

      console.log('Uploading file:', selectedFile.name, 'Size:', selectedFile.size, 'Type:', selectedFile.type);

      // Get current user for admin verification
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('You must be signed in to upload images.');
        return null;
      }

      // Create form data for the API endpoint
      const formData = new FormData();
      formData.append('file', await fitImageForUpload(selectedFile));
      formData.append('userEmail', user.email || '');

      // Upload via admin API endpoint
      const response = await apiFetch('/api/admin/blog-images', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: response.status === 413 ? 'That image is too large to upload.' : 'Upload failed'
        }));
        console.error('API upload error:', errorData);
        alert(errorData.error || 'Upload failed');
        return null;
      }

      const result = await response.json();
      console.log('Image uploaded successfully:', result.data.publicUrl);
      return result.data.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error uploading image: ' + (error as Error).message);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Upload image first if one is selected
      let imageUrl = postData.image_url || '';
      if (selectedFile) {
        console.log('Starting image upload...');
        const uploadedUrl = await uploadImage();
        if (!uploadedUrl) {
          console.log('Image upload failed, aborting post creation');
          setIsLoading(false);
          return;
        }
        imageUrl = uploadedUrl;
        console.log('Image upload completed:', imageUrl);
      }

      console.log('Creating blog post with data:', {
        title: postData.title,
        hasImage: !!imageUrl,
        published: postData.published
      });

      const { data, error } = await supabase
        .from('blog_posts')
        .insert([
          {
            title: postData.title,
            content: postData.content,
            excerpt: postData.excerpt,
            image_url: imageUrl || null,
            featured: postData.featured,
            published: postData.published,
            tags: postData.tags,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        .select();

      if (error) {
        console.error('Error creating post:', error);
        let errorMessage = 'Error creating post. Please try again.';
        
        if (error.message?.includes('blog_posts')) {
          errorMessage = 'Blog posts table not found. Please set up the database first.';
        } else if (error.message?.includes('image_url')) {
          errorMessage = 'Database schema error. The image_url column may not exist.';
        } else {
          errorMessage = `Database error: ${error.message}`;
        }
        
        alert(errorMessage);
      } else {
        console.log('Post created successfully:', data);
        alert('Blog post created successfully!');
        router.push('/admin');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error creating post: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !postData.tags.includes(tagInput.trim())) {
      setPostData({
        ...postData,
        tags: [...postData.tags, tagInput.trim()]
      });
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setPostData({
      ...postData,
      tags: postData.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <AdminAuth>
      <Navigation />
      
      <div className="admin-shell">
        <div className="max-w-3xl mx-auto px-4 lg:px-8 py-8">
          {/* Header */}
          <div className="admin-hero">
            <Link 
              href="/admin"
              className="inline-flex items-center text-sm text-gray-900 hover:underline mb-3"
            >
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Link>
            <h1>Create New Blog Post</h1>
            <p>Write and publish a new blog post</p>
          </div>

          {/* Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="admin-card"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Post Title
                </label>
                <input
                  type="text"
                  id="title"
                  value={postData.title}
                  onChange={(e) => setPostData({...postData, title: e.target.value})}
                  className="admin-input w-full"
                  placeholder="Enter your blog post title..."
                  required
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Post Image (Optional)
                </label>
                <div className="mt-2">
                  {previewUrl ? (
                    <div className="relative">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-full h-64 object-cover rounded-lg border-2 border-gray-300"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewUrl(null);
                          setSelectedFile(null);
                        }}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-gray-400 transition-colors">
                      <div className="space-y-1 text-center">
                        <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="flex text-sm text-gray-600">
                          <label
                            htmlFor="image-upload"
                            className="relative cursor-pointer bg-white rounded-md font-medium text-gray-900 underline focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-orange-500"
                          >
                            <span>Upload an image</span>
                            <input
                              id="image-upload"
                              name="image-upload"
                              type="file"
                              className="sr-only"
                              accept="image/*"
                              onChange={handleFileSelect}
                            />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500">PNG, JPG or GIF. Large photos are resized automatically.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Excerpt */}
              <div>
                <label htmlFor="excerpt" className="block text-sm font-medium text-gray-700 mb-2">
                  Excerpt
                </label>
                <textarea
                  id="excerpt"
                  value={postData.excerpt}
                  onChange={(e) => setPostData({...postData, excerpt: e.target.value})}
                  rows={3}
                  className="admin-input w-full"
                  placeholder="Brief description of your post..."
                  required
                />
              </div>

              {/* Content */}
              <div>
                <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                  Content
                </label>
                <textarea
                  id="content"
                  value={postData.content}
                  onChange={(e) => setPostData({...postData, content: e.target.value})}
                  rows={12}
                  className="admin-input w-full"
                  placeholder="Write your blog post content here..."
                  required
                />
              </div>

              {/* Tags */}
              <div>
                <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="admin-input flex-1"
                    placeholder="Add a tag..."
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="admin-btn admin-btn-secondary"
                  >
                    Add
                  </button>
                </div>
                {postData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {postData.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="admin-badge admin-badge-neutral"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-1 text-gray-500 hover:text-gray-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="featured"
                    checked={postData.featured}
                    onChange={(e) => setPostData({...postData, featured: e.target.checked})}
                    className="h-4 w-4 border-gray-300 rounded"
                  />
                  <label htmlFor="featured" className="ml-2 block text-sm text-gray-700">
                    Featured Post
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="published"
                    checked={postData.published}
                    onChange={(e) => setPostData({...postData, published: e.target.checked})}
                    className="h-4 w-4 border-gray-300 rounded"
                  />
                  <label htmlFor="published" className="ml-2 block text-sm text-gray-700">
                    Publish Immediately
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap justify-between gap-3 pt-6">
                <Link
                  href="/admin"
                  className="admin-btn admin-btn-secondary"
                >
                  Cancel
                </Link>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={isLoading || isUploading}
                    onClick={() => setPostData({...postData, published: false})}
                    className="admin-btn admin-btn-secondary"
                  >
                    {isLoading ? (isUploading ? 'Uploading...' : 'Saving...') : 'Save as Draft'}
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading || isUploading}
                    onClick={() => setPostData({...postData, published: true})}
                    className="admin-btn admin-btn-primary"
                  >
                    {isLoading ? (isUploading ? 'Uploading...' : 'Publishing...') : 'Publish Post'}
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </AdminAuth>
  );
}

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Calendar, ArrowLeft, Share2, 
  Globe, Sparkles, Clock as ClockIcon 
} from 'lucide-react';
import axios from 'axios';

interface Blog {
  id: number;
  title: string;
  slug: string;
  short_description: string;
  full_description: string;
  featured_image: string;
  published_date: string;
}

export default function BlogView() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  const BASE_URL = API_URL.replace('/api', '');

  const getImageUrl = (imagePath: string | null) => {
    if (!imagePath) return 'https://placehold.co/800x400/2a2a2a/ffffff?text=No+Image';
    if (imagePath.startsWith('http')) return imagePath;
    if (imagePath.startsWith('/uploads')) return `${BASE_URL}${imagePath}`;
    return `${BASE_URL}${imagePath}`;
  };

  useEffect(() => {
    fetchBlog();
  }, [slug]);

  const fetchBlog = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/blogs/${slug}`);
      if (response.data.success) {
        setBlog(response.data.blog);
      }
    } catch (error) {
      console.error('Error fetching blog:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading blog...</p>
        </div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Blog not found</h1>
          <p className="text-gray-400 mb-4">The blog you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/dashboard/blogs')}
            className="px-6 py-3 bg-brand text-white rounded-xl font-bold"
          >
            Back to Blogs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-24 md:pt-32 pb-16 md:pb-24 space-y-6 md:space-y-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/dashboard/blogs')}
          className="flex items-center space-x-2 text-gray-400 hover:text-brand transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-bold">Back to Blogs</span>
        </button>

        {/* Blog Header */}
        <div className="relative overflow-hidden glass border border-white/10 p-6 md:p-10 rounded-[2rem] md:rounded-[2.5rem] bg-gradient-to-br from-brand/20 to-transparent">
          <div className="absolute top-0 right-0 w-96 h-96 bg-brand/5 rounded-full blur-[120px] -mr-40 -mt-40" />
          
          <div className="relative z-10">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className="px-3 py-1 rounded-full bg-brand/20 text-brand text-[10px] font-black uppercase tracking-widest">
                Blog Post
              </span>
              <span className="text-[10px] text-gray-500 font-medium flex items-center">
                <Calendar className="w-3 h-3 mr-1" />
                {blog.published_date}
              </span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tighter leading-tight mb-6 break-words">
              {blog.title}
            </h1>
          </div>
        </div>

        {/* Featured Image - Inside glass box with content */}
        <div className="glass p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-white/10 space-y-6">
          <img
            src={getImageUrl(blog.featured_image)}
            alt={blog.title}
            className="w-full h-auto max-h-[300px] md:max-h-[400px] object-cover rounded-xl md:rounded-2xl"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = 'https://placehold.co/800x400/2a2a2a/ffffff?text=Image+Not+Found';
            }}
          />

          {/* Blog Content */}
          <div 
            className="prose prose-invert max-w-none text-gray-300 text-sm md:text-base leading-relaxed"
            dangerouslySetInnerHTML={{ __html: blog.full_description }}
          />

          {/* Share Section - Inside same box */}
          <div className="pt-6 mt-6 border-t border-white/10">
            <h3 className="text-base md:text-lg font-black mb-4 flex items-center gap-2">
              <Share2 className="w-4 h-4 md:w-5 md:h-5 text-brand" />
              Share this article
            </h3>
            
            <div className="flex flex-wrap gap-2 md:gap-3">
              {['Twitter', 'Facebook', 'LinkedIn', 'WhatsApp'].map((platform) => (
                <button
                  key={platform}
                  onClick={() => {
                    const url = window.location.href;
                    const text = encodeURIComponent(blog.title);
                    let shareUrl = '';
                    
                    if (platform === 'Twitter') {
                      shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
                    } else if (platform === 'Facebook') {
                      shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
                    } else if (platform === 'LinkedIn') {
                      shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
                    } else if (platform === 'WhatsApp') {
                      shareUrl = `https://wa.me/?text=${text}%20${url}`;
                    }
                    
                    window.open(shareUrl, '_blank');
                  }}
                  className="px-3 py-1.5 md:px-4 md:py-2 rounded-xl glass border border-white/10 hover:border-brand/30 transition-all text-xs md:text-sm font-bold"
                >
                  {platform}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2 md:gap-4 pt-6 md:pt-8">
          <div className="flex items-center gap-1 md:gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-white/5 border border-white/10">
            <Globe className="w-3 h-3 md:w-4 md:h-4 text-brand" />
            <span className="text-[8px] md:text-xs font-bold whitespace-nowrap">Best & Trusted SMM Service Provider</span>
          </div>
          <div className="flex items-center gap-1 md:gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-white/5 border border-white/10">
            <Sparkles className="w-3 h-3 md:w-4 md:h-4 text-brand" />
            <span className="text-[8px] md:text-xs font-bold whitespace-nowrap">#1 Sri Lanka</span>
          </div>
          <div className="flex items-center gap-1 md:gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-white/5 border border-white/10">
            <ClockIcon className="w-3 h-3 md:w-4 md:h-4 text-brand" />
            <span className="text-[8px] md:text-xs font-bold whitespace-nowrap">24/7 Support</span>
          </div>
        </div>
      </div>
    </div>
  );
}

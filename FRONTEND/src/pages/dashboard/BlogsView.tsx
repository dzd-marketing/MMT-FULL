import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, Clock, Eye, ChevronRight, Search, 
  Filter, ArrowLeft, ArrowRight, BookOpen, 
  Globe, Sparkles, Clock as ClockIcon, User,
  Tag, Share2, Bookmark, Heart, MessageCircle,
  ExternalLink
} from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface Blog {
  id: number;
  title: string;
  slug: string;
  short_description: string;
  full_description: string;
  featured_image: string;
  published_date: string;
}

export default function BlogsView() {
  const navigate = useNavigate();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const blogsPerPage = 6;

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  const BASE_URL = API_URL.replace('/api', '');

  // Helper function for image URLs
  const getImageUrl = (imagePath: string | null) => {
    if (!imagePath) return 'https://placehold.co/800x400/2a2a2a/ffffff?text=No+Image';
    if (imagePath.startsWith('http')) return imagePath;
    if (imagePath.startsWith('/uploads')) return `${BASE_URL}${imagePath}`;
    return `${BASE_URL}${imagePath}`;
  };

  useEffect(() => {
    fetchBlogs();
  }, [currentPage]);

  const fetchBlogs = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/blogs/all`);
      if (response.data.success) {
        setBlogs(response.data.blogs);
        setTotalPages(Math.ceil(response.data.blogs.length / blogsPerPage));
      }
    } catch (error) {
      console.error('Error fetching blogs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBlogClick = (blog: Blog) => {
    // Navigate to blog page using slug (opens in same tab)
    navigate(`/blogs/${blog.slug}`);
  };

  const handleOpenInNewTab = (e: React.MouseEvent, blog: Blog) => {
    e.stopPropagation(); // Prevent triggering the parent onClick
    window.open(`/blogs/${blog.slug}`, '_blank');
  };

  // Filter blogs based on search
  const filteredBlogs = blogs.filter(blog =>
    blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    blog.short_description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination
  const indexOfLastBlog = currentPage * blogsPerPage;
  const indexOfFirstBlog = indexOfLastBlog - blogsPerPage;
  const currentBlogs = filteredBlogs.slice(indexOfFirstBlog, indexOfLastBlog);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6 md:space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden glass border border-white/10 p-6 md:p-10 rounded-[2rem] md:rounded-[2.5rem] bg-gradient-to-br from-brand/20 to-transparent">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand/5 rounded-full blur-[120px] -mr-40 -mt-40" />
        
        <div className="relative z-10 flex flex-col space-y-4 md:space-y-0 md:flex-row md:items-center md:justify-between gap-4 md:gap-6">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-brand/20 flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-6 h-6 md:w-8 md:h-8 text-brand" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black uppercase tracking-tighter mb-1 md:mb-2 break-words">
                Blogs & Articles
              </h1>
              <p className="text-xs md:text-sm text-gray-400 max-w-md font-medium break-words">
                Latest insights, tips, and news from the SMM world
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-auto md:min-w-[300px]">
            <input
              type="text"
              placeholder="Search blogs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pl-10 outline-none focus:border-brand transition-all text-sm md:text-base"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          </div>
        </div>
      </div>

      {/* Blogs Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="glass p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border border-white/10 animate-pulse">
              <div className="w-full h-36 sm:h-40 md:h-48 bg-white/5 rounded-xl mb-3 md:mb-4" />
              <div className="h-5 md:h-6 bg-white/5 rounded w-3/4 mb-2 md:mb-3" />
              <div className="h-3 md:h-4 bg-white/5 rounded w-full mb-1 md:mb-2" />
              <div className="h-3 md:h-4 bg-white/5 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {currentBlogs.map((blog) => (
              <motion.div
                key={blog.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -4 }}
                onClick={() => handleBlogClick(blog)}
                className="glass p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border border-white/10 hover:border-brand/30 transition-all cursor-pointer group relative"
              >
                {/* External Link Indicator - Click to open in new tab */}
                <button
                  onClick={(e) => handleOpenInNewTab(e, blog)}
                  className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-brand/90 text-white p-2 rounded-full shadow-lg hover:bg-brand"
                  title="Open in new tab"
                >
                  <ExternalLink className="w-3 h-3" />
                </button>

                {/* Blog Image */}
                <div className="relative w-full h-36 sm:h-40 md:h-48 mb-3 md:mb-4 rounded-xl overflow-hidden">
                  <img
                    src={getImageUrl(blog.featured_image)}
                    alt={blog.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://placehold.co/800x400/2a2a2a/ffffff?text=No+Image';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                {/* Blog Date */}
                <div className="flex items-center space-x-2 text-[8px] md:text-[10px] text-gray-500 mb-2 md:mb-3">
                  <Calendar className="w-2.5 h-2.5 md:w-3 md:h-3" />
                  <span>{blog.published_date}</span>
                </div>

                {/* Blog Title */}
                <h3 className="text-base md:text-lg lg:text-xl font-black mb-2 md:mb-3 group-hover:text-brand transition-colors line-clamp-2 break-words pr-8">
                  {blog.title}
                </h3>

                {/* Blog Description */}
                <p className="text-xs md:text-sm text-gray-400 mb-3 md:mb-4 line-clamp-3 break-words">
                  {blog.short_description}
                </p>

                {/* Read More Button */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] md:text-xs font-bold text-brand">Read More</span>
                  <ChevronRight className="w-3 h-3 md:w-4 md:h-4 text-gray-500 group-hover:text-brand group-hover:translate-x-1 transition-all" />
                </div>
              </motion.div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-3 md:space-x-4 pt-6 md:pt-8">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-1.5 md:p-2 rounded-xl glass border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed hover:border-brand/30 transition-all"
              >
                <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
              </button>
              
              <span className="text-xs md:text-sm font-bold">
                Page {currentPage} of {totalPages}
              </span>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-1.5 md:p-2 rounded-xl glass border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed hover:border-brand/30 transition-all"
              >
                <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>
          )}
        </>
      )}

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
  );
}

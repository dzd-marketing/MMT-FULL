import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Search, Edit, Trash2, Eye, X, Loader, 
  Menu, Bell, ChevronLeft, ChevronRight, Calendar,
  Image as ImageIcon, Save, CheckCircle,
  Clock, Globe, Sparkles, BookOpen
} from 'lucide-react';
import axios from 'axios';
import { format } from 'date-fns';
import Sidebar from './Sidebar';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import AdminHeader from './AdminHeader';

interface Blog {
  id: number;
  title: string;
  slug: string;
  short_description: string;
  full_description: string;
  featured_image: string | null;
  published_at: string;
  created_at: string;
  updated_at: string;
}

const AdminBlogsPage: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    short_description: '',
    full_description: '',
    featured_image: null as File | null
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const blogsPerPage = 10;

  const API_URL = import.meta.env.VITE_API_URL;
  const BASE_URL = API_URL.replace('/api', '');

  // Helper function for image URLs
  const getImageUrl = (imagePath: string | null) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    if (imagePath.startsWith('/uploads')) return `${BASE_URL}${imagePath}`;
    return `${BASE_URL}${imagePath}`;
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/admin/blogs/all`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      });

      if (response.data.success) {
        setBlogs(response.data.blogs);
      }
    } catch (error) {
      console.error('Error fetching blogs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, featured_image: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      short_description: '',
      full_description: '',
      featured_image: null
    });
    setImagePreview(null);
    setEditingBlog(null);
  };

  const handleEdit = (blog: Blog) => {
    setEditingBlog(blog);
    setFormData({
      title: blog.title,
      short_description: blog.short_description,
      full_description: blog.full_description,
      featured_image: null
    });
    setImagePreview(getImageUrl(blog.featured_image));
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.title || !formData.short_description || !formData.full_description) {
      alert('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('short_description', formData.short_description);
      formDataToSend.append('full_description', formData.full_description);
      if (formData.featured_image) {
        formDataToSend.append('featured_image', formData.featured_image);
      }

      let response;
      if (editingBlog) {
        response = await axios.put(`${API_URL}/admin/blogs/${editingBlog.id}`, formDataToSend, {
          headers: { 
            Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
            'Content-Type': 'multipart/form-data'
          }
        });
      } else {
        response = await axios.post(`${API_URL}/admin/blogs/create`, formDataToSend, {
          headers: { 
            Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
            'Content-Type': 'multipart/form-data'
          }
        });
      }

      if (response.data.success) {
        fetchBlogs();
        setShowModal(false);
        resetForm();
      }
    } catch (error) {
      console.error('Error saving blog:', error);
      alert('Failed to save blog');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await axios.delete(`${API_URL}/admin/blogs/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      });

      if (response.data.success) {
        fetchBlogs();
        setDeleteConfirm(null);
      }
    } catch (error) {
      console.error('Error deleting blog:', error);
      alert('Failed to delete blog');
    }
  };

  // Filter blogs based on search
  const filteredBlogs = blogs.filter(blog =>
    blog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    blog.short_description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination
  const indexOfLastBlog = currentPage * blogsPerPage;
  const indexOfFirstBlog = indexOfLastBlog - blogsPerPage;
  const currentBlogs = filteredBlogs.slice(indexOfFirstBlog, indexOfLastBlog);
  const totalPages = Math.ceil(filteredBlogs.length / blogsPerPage);

  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'color': [] }, { 'background': [] }],
      ['link', 'image', 'video'],
      ['clean']
    ],
  };

  const quillFormats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'color', 'background',
    'link', 'image', 'video'
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <Sidebar 
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        isMobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
        activeTickets={0}
      />

      <div className={`transition-all duration-300 ${sidebarOpen ? 'md:ml-80' : 'md:ml-0'} ml-0 min-h-screen flex flex-col`}>
<AdminHeader
  title="Blogs Management"
  onMenuClick={() => setSidebarOpen(!sidebarOpen)}
  onMobileMenuClick={() => setMobileSidebarOpen(true)}
  activeTickets={0} 
/>

        <div className="flex-1 p-4 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search blogs..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-brand focus:border-transparent outline-none"
              />
            </div>
            
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-brand hover:bg-brand/90 text-white rounded-xl transition-colors text-sm font-bold"
            >
              <Plus className="w-4 h-4" />
              Create New Blog
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader className="w-8 h-8 text-brand animate-spin" />
            </div>
          ) : blogs.length === 0 ? (
            <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10">
              <BookOpen className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">No blogs found</p>
              <button
                onClick={() => {
                  resetForm();
                  setShowModal(true);
                }}
                className="mt-4 px-4 py-2 bg-brand/20 hover:bg-brand/30 text-brand rounded-lg text-sm font-bold transition-colors"
              >
                Create Your First Blog
              </button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 px-2 text-xs font-bold text-gray-400">Image</th>
                      <th className="text-left py-3 px-2 text-xs font-bold text-gray-400">Title</th>
                      <th className="text-left py-3 px-2 text-xs font-bold text-gray-400 hidden md:table-cell">Published</th>
                      <th className="text-left py-3 px-2 text-xs font-bold text-gray-400 hidden lg:table-cell">Slug</th>
                      <th className="text-right py-3 px-2 text-xs font-bold text-gray-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentBlogs.map((blog) => (
                      <motion.tr
                        key={blog.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="border-b border-white/5 hover:bg-white/5 transition-colors"
                      >
                        <td className="py-3 px-2">
                          <div className="w-10 h-10 rounded-lg bg-white/5 overflow-hidden">
                            {blog.featured_image ? (
                              <img 
                                src={getImageUrl(blog.featured_image) || ''}
                                alt={blog.title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = 'https://placehold.co/40x40/2a2a2a/ffffff?text=img';
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <ImageIcon className="w-4 h-4 text-gray-600" />
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <div>
                            <p className="text-sm font-medium text-white line-clamp-1">{blog.title}</p>
                            <p className="text-xs text-gray-400 line-clamp-1 md:hidden">
                              {format(new Date(blog.published_at), 'MMM dd, yyyy')}
                            </p>
                          </div>
                        </td>
                        <td className="py-3 px-2 hidden md:table-cell">
                          <div className="flex items-center gap-1 text-xs text-gray-400">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(blog.published_at), 'MMM dd, yyyy')}
                          </div>
                        </td>
                        <td className="py-3 px-2 hidden lg:table-cell">
                          <code className="text-xs text-gray-500">{blog.slug}</code>
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => window.open(`/blogs/${blog.slug}`, '_blank')}
                              className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-brand"
                              title="View"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleEdit(blog)}
                              className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-blue-400"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            {deleteConfirm === blog.id ? (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleDelete(blog.id)}
                                  className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                                  title="Confirm Delete"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setDeleteConfirm(null)}
                                  className="p-2 bg-white/10 hover:bg-white/20 text-gray-400 rounded-lg transition-colors"
                                  title="Cancel"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setDeleteConfirm(blog.id)}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-red-400"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 mt-4 border-t border-white/10">
                  <p className="text-xs sm:text-sm text-gray-400 order-2 sm:order-1">
                    Showing {indexOfFirstBlog + 1} to {Math.min(indexOfLastBlog, filteredBlogs.length)} of {filteredBlogs.length} blogs
                  </p>
                  <div className="flex items-center gap-2 order-1 sm:order-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="p-2 bg-white/5 border border-white/10 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="px-3 py-1 bg-brand/20 text-brand rounded-lg text-xs sm:text-sm">
                      {currentPage} / {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="p-2 bg-white/5 border border-white/10 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95%] max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-b from-[#1F1F1F] to-[#141414] border border-white/10 rounded-2xl shadow-2xl z-[51]"
            >
              <div className="sticky top-0 bg-gradient-to-b from-[#1F1F1F] to-[#141414] border-b border-white/10 p-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">
                  {editingBlog ? 'Edit Blog' : 'Create New Blog'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Title *</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-sm text-white focus:ring-2 focus:ring-brand focus:border-transparent outline-none"
                    placeholder="Enter blog title"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1">Short Description *</label>
                  <textarea
                    name="short_description"
                    value={formData.short_description}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-sm text-white focus:ring-2 focus:ring-brand focus:border-transparent outline-none"
                    placeholder="Enter short description"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1">Featured Image</label>
                  <div className="flex items-center gap-4">
                    <div className="w-24 h-24 rounded-lg bg-black/30 border border-white/10 overflow-hidden">
                      {imagePreview ? (
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="w-8 h-8 text-gray-600" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                        id="image-upload"
                      />
                      <label
                        htmlFor="image-upload"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-white cursor-pointer transition-colors"
                      >
                        <ImageIcon className="w-4 h-4" />
                        Choose Image
                      </label>
                      <p className="text-xs text-gray-500 mt-1">Max size: 5MB</p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1">Full Description *</label>
                  <div className="bg-black/30 border border-white/10 rounded-lg overflow-hidden">
                    <ReactQuill
                      theme="snow"
                      value={formData.full_description}
                      onChange={(value) => setFormData(prev => ({ ...prev, full_description: value }))}
                      modules={quillModules}
                      formats={quillFormats}
                      className="text-white"
                      placeholder="Write your blog content here..."
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 px-4 py-3 bg-brand hover:bg-brand/90 text-white rounded-xl font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <Loader className="w-4 h-4 animate-spin mx-auto" />
                    ) : (
                      editingBlog ? 'Update Blog' : 'Create Blog'
                    )}
                  </button>
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-4 py-3 bg-white/5 hover:bg-white/10 text-gray-400 rounded-xl font-bold text-sm transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 flex flex-wrap items-center justify-center gap-2 px-4 py-2 bg-black/50 backdrop-blur-xl border border-white/10 rounded-full">
        <div className="flex items-center gap-1">
          <Globe className="w-3 h-3 text-brand" />
          <span className="text-[8px] font-bold whitespace-nowrap">Best & Trusted SMM</span>
        </div>
        <div className="flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-brand" />
          <span className="text-[8px] font-bold whitespace-nowrap">#1 Sri Lanka</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3 text-brand" />
          <span className="text-[8px] font-bold whitespace-nowrap">24/7 Support</span>
        </div>
      </div>
    </div>
  );
};


export default AdminBlogsPage;

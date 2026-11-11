"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { postsApi, Post, PaginationMeta } from "@/lib/api";
import { CreatePostModal } from "@/components/CreatePostModal";
import { Pagination } from "@/components/Pagination";
import {
  Bookmark,
  Plus,
  Search,
  Globe,
  Lock,
  Trash2,
  Edit3,
  Calendar,
  Loader2,
  AlertCircle,
} from "lucide-react";

export default function MyPostsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | undefined>();
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchMyPosts = useCallback(async (targetPage = 1) => {
    setLoading(true);
    setActionError(null);
    try {
      const res = await postsApi.getMyPosts(targetPage, 9);
      if (res.data) {
        setPosts(res.data);
        setMeta(res.meta);
      }
    } catch (err: unknown) {
      if (err instanceof Error) setActionError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    } else if (user) {
      fetchMyPosts(page);
    }
  }, [user, authLoading, router, fetchMyPosts, page]);

  useEffect(() => {
    const handleRefresh = () => fetchMyPosts(page);
    window.addEventListener("refresh_posts", handleRefresh);
    return () => window.removeEventListener("refresh_posts", handleRefresh);
  }, [fetchMyPosts, page]);

  const handleDelete = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    try {
      setPosts((prev) => prev.filter((p) => p._id !== postId));
      await postsApi.deleteMyPost(postId);
      fetchMyPosts(page);
    } catch (err: unknown) {
      fetchMyPosts(page);
      if (err instanceof Error) setActionError(err.message);
    }
  };

  const filteredPosts = posts.filter(
    (p) =>
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (authLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-violet-50 text-violet-600 rounded-xl">
              <Bookmark className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
              My Created Posts
            </h1>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Manage your published articles and drafts
          </p>
        </div>

        <button
          onClick={() => {
            setEditingPost(null);
            setModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold shadow-md shadow-violet-600/20 transition"
        >
          <Plus className="w-4 h-4" />
          Create Post
        </button>
      </div>

      {actionError && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {actionError}
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between gap-4 mb-8">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search my posts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>

        <p className="text-xs text-gray-500 hidden sm:block">
          Total: <span className="font-semibold text-gray-900">{meta?.total ?? posts.length}</span> posts
        </p>
      </div>

      {/* Posts Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
          <Loader2 className="w-8 h-8 animate-spin text-violet-600 mb-3" />
          <p className="text-sm font-medium">Loading your posts...</p>
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-300 p-8">
          <div className="w-12 h-12 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center mx-auto mb-3">
            <Bookmark className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-gray-900 mb-1">No posts found</h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto mb-5">
            {searchTerm
              ? "No posts matched your search criteria."
              : "Share insights, tutorials, or updates with the public community."}
          </p>
          <button
            onClick={() => {
              setEditingPost(null);
              setModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition"
          >
            <Plus className="w-4 h-4" />
            Create Your First Post
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map((post) => (
            <div
              key={post._id}
              className="bg-white rounded-2xl border border-gray-200 hover:border-violet-300 p-6 flex flex-col justify-between transition-all duration-200 hover:shadow-md"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      post.isPublic
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {post.isPublic ? (
                      <>
                        <Globe className="w-3 h-3" />
                        Public
                      </>
                    ) : (
                      <>
                        <Lock className="w-3 h-3" />
                        Private
                      </>
                    )}
                  </span>

                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(post.createdAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>

                <h3 className="font-bold text-lg text-gray-900 mb-2">{post.title}</h3>

                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line mb-4 line-clamp-4">
                  {post.content || <span className="italic text-gray-400">No content</span>}
                </p>
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-end space-x-2">
                <button
                  onClick={() => {
                    setEditingPost(post);
                    setModalOpen(true);
                  }}
                  className="p-1.5 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition"
                  title="Edit Post"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(post._id)}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                  title="Delete Post"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      <Pagination
        meta={meta}
        currentPage={page}
        onPageChange={(p) => setPage(p)}
        isLoading={loading}
      />

      {/* Create / Edit Post Modal */}
      <CreatePostModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingPost(null);
        }}
        initialData={editingPost}
        onSuccess={() => {
          fetchMyPosts(page);
        }}
      />
    </div>
  );
}


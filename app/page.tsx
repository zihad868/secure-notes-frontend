"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { postsApi, Post, PaginationMeta } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Pagination } from "@/components/Pagination";
import { CreatePostModal } from "@/components/CreatePostModal";
import {
  Globe,
  Lock,
  FileText,
  User as UserIcon,
  Calendar,
  Plus,
  Search,
  ArrowRight,
  ShieldCheck,
  Zap,
  Sparkles,
  Loader2,
} from "lucide-react";

export default function HomePage() {
  const { user, isAdmin } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | undefined>();
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [createPostOpen, setCreatePostOpen] = useState(false);

  const fetchPosts = useCallback(async (targetPage = 1) => {
    setLoading(true);
    try {
      const res = await postsApi.getPublicPosts(targetPage, 9);
      if (res.data) {
        setPosts(res.data);
        setMeta(res.meta);
      }
    } catch (err) {
      console.error("Failed to load public posts:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts(page);
  }, [fetchPosts, page]);

  // Listen to refresh events from navbar modal
  useEffect(() => {
    const handleRefresh = () => fetchPosts(page);
    window.addEventListener("refresh_posts", handleRefresh);
    return () => window.removeEventListener("refresh_posts", handleRefresh);
  }, [fetchPosts, page]);

  const filteredPosts = posts.filter(
    (p) =>
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 text-white p-8 sm:p-12 mb-12 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-violet-500/10 blur-3xl" />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-indigo-200 text-xs font-semibold mb-6 border border-white/10">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            JWT Role-Based Access Control & MongoDB Aggregations
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight mb-4">
            Private Notes,{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-violet-200 to-pink-300">
              Public Knowledge.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-indigo-100/90 mb-8 leading-relaxed max-w-2xl">
            Store private encrypted-ready personal notes, share insights with the community
            through public posts, and manage roles seamlessly with the secure administrative dashboard.
          </p>

          <div className="flex flex-wrap gap-3.5">
            {user ? (
              <>
                <Link
                  href="/notes"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-indigo-900 font-bold hover:bg-indigo-50 shadow-lg shadow-indigo-950/20 transition"
                >
                  <FileText className="w-4 h-4" />
                  My Private Notes
                </Link>
                <button
                  onClick={() => setCreatePostOpen(true)}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-600/80 hover:bg-indigo-600 text-white font-semibold backdrop-blur-sm border border-indigo-400/30 transition"
                >
                  <Plus className="w-4 h-4" />
                  Share Public Post
                </button>
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold transition shadow-md"
                  >
                    Admin Dashboard
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
              </>
            ) : (
              <>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-950/30 transition"
                >
                  Get Started Free
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium border border-white/10 backdrop-blur-md transition"
                >
                  Log In
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Public Posts Feed Section */}
      <section>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-indigo-600" />
              <h2 className="text-2xl font-bold text-gray-900">Public Community Posts</h2>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Live thoughts and technical insights published by registered community members
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search posts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {user && (
              <button
                onClick={() => setCreatePostOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                Post
              </button>
            )}
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-3" />
            <p className="text-sm font-medium">Fetching public posts from server...</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
              <Globe className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-1">No public posts found</h3>
            <p className="text-sm text-gray-500 max-w-sm mx-auto mb-5">
              {searchTerm
                ? "Try adjusting your search query."
                : "Be the first to share an article or insight with the community!"}
            </p>
            {user ? (
              <button
                onClick={() => setCreatePostOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition"
              >
                <Plus className="w-4 h-4" />
                Write First Post
              </button>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition"
              >
                Sign In to Post
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts.map((post) => {
              const author = typeof post.owner === "object" ? post.owner : null;
              const authorName = author?.name || (author?.email ? author.email.split("@")[0] : "Anonymous");
              const authorEmail = author?.email || "";

              return (
                <article
                  key={post._id}
                  className="bg-white rounded-2xl border border-gray-200/90 hover:border-indigo-300 p-6 flex flex-col justify-between transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 group"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <Globe className="w-3 h-3" />
                        Public
                      </span>
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(post.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition">
                      {post.title}
                    </h3>

                    <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line line-clamp-4 mb-4">
                      {post.content || <span className="italic text-gray-400">No content provided</span>}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-600 text-white flex items-center justify-center font-bold text-xs">
                        {authorName[0]?.toUpperCase() || "U"}
                      </div>
                      <div className="text-xs">
                        <p className="font-semibold text-gray-900">{authorName}</p>
                        {authorEmail && (
                          <p className="text-[11px] text-gray-400">{authorEmail}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        <Pagination
          meta={meta}
          currentPage={page}
          onPageChange={(p) => setPage(p)}
          isLoading={loading}
        />
      </section>

      {/* Modal for creating post */}
      <CreatePostModal
        isOpen={createPostOpen}
        onClose={() => setCreatePostOpen(false)}
        onSuccess={() => {
          fetchPosts(1);
          setPage(1);
        }}
      />
    </div>
  );
}

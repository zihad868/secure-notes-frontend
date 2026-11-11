"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "./Modal";
import { postsApi, Post } from "@/lib/api";
import { Loader2, Globe, Lock } from "lucide-react";

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (post: Post) => void;
  initialData?: Post | null;
  adminMode?: boolean;
}

export function CreatePostModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
  adminMode = false,
}: CreatePostModalProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setContent(initialData.content || "");
      setIsPublic(initialData.isPublic !== undefined ? initialData.isPublic : true);
    } else {
      setTitle("");
      setContent("");
      setIsPublic(true);
    }
    setError(null);
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Post title is required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (initialData?._id) {
        const update = adminMode ? postsApi.adminUpdatePost : postsApi.updatePost;
        const res = await update(initialData._id, {
          title: title.trim(),
          content: content.trim(),
          isPublic,
        });
        if (res.data) onSuccess(res.data);
      } else {
        const res = await postsApi.createPost({
          title: title.trim(),
          content: content.trim(),
          isPublic,
        });
        if (res.data) onSuccess(res.data);
      }
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError("Failed to save post");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? (adminMode ? "Admin Edit Post" : "Edit Post") : "Create New Post"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-sm rounded-lg bg-red-50 text-red-700 border border-red-200">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
            Post Title *
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Understanding Indexing & Aggregations in MongoDB"
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
            Post Content
          </label>
          <textarea
            rows={5}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share your thoughts, discoveries, or technical tutorials..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-sm"
          />
        </div>

        <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-200">
          <div className="flex items-center space-x-2.5">
            {isPublic ? (
              <Globe className="w-5 h-5 text-emerald-600" />
            ) : (
              <Lock className="w-5 h-5 text-gray-500" />
            )}
            <div>
              <p className="text-xs font-bold text-gray-900">
                {isPublic ? "Public Post (Visible to Everyone)" : "Private Post (Only You)"}
              </p>
              <p className="text-[11px] text-gray-500">
                {isPublic
                  ? "This will appear on the public feed and in your profile."
                  : "Only visible in your personal post dashboard."}
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-end space-x-3 pt-3 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-xl shadow-sm transition disabled:opacity-50"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {initialData ? "Save Changes" : "Publish Post"}
          </button>
        </div>
      </form>
    </Modal>
  );
}


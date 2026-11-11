"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { notesApi, Note, PaginationMeta } from "@/lib/api";
import { CreateNoteModal } from "@/components/CreateNoteModal";
import { Pagination } from "@/components/Pagination";
import {
  FileText,
  Plus,
  Search,
  CheckCircle2,
  Circle,
  Trash2,
  Edit3,
  Calendar,
  Lock,
  Loader2,
  AlertCircle,
} from "lucide-react";

export default function NotesPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | undefined>();
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchNotes = useCallback(async (targetPage = 1) => {
    setLoading(true);
    setActionError(null);
    try {
      const res = await notesApi.getUserNotes(targetPage, 9);
      if (res.data) {
        setNotes(res.data);
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
      fetchNotes(page);
    }
  }, [user, authLoading, router, fetchNotes, page]);

  useEffect(() => {
    const handleRefresh = () => fetchNotes(page);
    window.addEventListener("refresh_notes", handleRefresh);
    return () => window.removeEventListener("refresh_notes", handleRefresh);
  }, [fetchNotes, page]);

  const handleToggleComplete = async (note: Note) => {
    try {
      const updatedStatus = !note.isCompleted;
      setNotes((prev) =>
        prev.map((n) => (n._id === note._id ? { ...n, isCompleted: updatedStatus } : n))
      );
      await notesApi.updateNote(note._id, { isCompleted: updatedStatus });
    } catch (err: unknown) {
      fetchNotes(page);
      if (err instanceof Error) setActionError(err.message);
    }
  };

  const handleDelete = async (noteId: string) => {
    if (!confirm("Are you sure you want to delete this note?")) return;
    try {
      setNotes((prev) => prev.filter((n) => n._id !== noteId));
      await notesApi.deleteNote(noteId);
      fetchNotes(page);
    } catch (err: unknown) {
      fetchNotes(page);
      if (err instanceof Error) setActionError(err.message);
    }
  };

  const filteredNotes = notes
    .filter((n) => {
      if (filter === "active") return !n.isCompleted;
      if (filter === "completed") return n.isCompleted;
      return true;
    })
    .filter(
      (n) =>
        n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.content.toLowerCase().includes(searchTerm.toLowerCase())
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
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
              My Secure Notes
            </h1>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Private, protected notes accessible only by you
          </p>
        </div>

        <button
          onClick={() => {
            setEditingNote(null);
            setModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-md shadow-indigo-600/20 transition"
        >
          <Plus className="w-4 h-4" />
          Create Note
        </button>
      </div>

      {actionError && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {actionError}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
        <div className="flex items-center bg-gray-100 p-1 rounded-xl w-full sm:w-auto">
          {(["all", "active", "completed"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition ${
                filter === tab
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Notes Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-3" />
          <p className="text-sm font-medium">Loading your notes...</p>
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-300 p-8">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-gray-900 mb-1">No notes found</h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto mb-5">
            {searchTerm
              ? "No notes matched your search query."
              : "Keep passwords, server configs, or personal ideas organized and safe."}
          </p>
          <button
            onClick={() => {
              setEditingNote(null);
              setModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition"
          >
            <Plus className="w-4 h-4" />
            Create Your First Note
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNotes.map((note) => (
            <div
              key={note._id}
              className={`bg-white rounded-2xl border p-6 flex flex-col justify-between transition-all duration-200 hover:shadow-md ${
                note.isCompleted
                  ? "border-emerald-200 bg-emerald-50/20"
                  : "border-gray-200 hover:border-indigo-300"
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <button
                    onClick={() => handleToggleComplete(note)}
                    title={note.isCompleted ? "Mark incomplete" : "Mark completed"}
                    className="flex-shrink-0 mt-0.5 text-gray-400 hover:text-emerald-600 transition"
                  >
                    {note.isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-50" />
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                  </button>

                  <h3
                    className={`font-bold text-base flex-1 ${
                      note.isCompleted
                        ? "line-through text-gray-400"
                        : "text-gray-900"
                    }`}
                  >
                    {note.title}
                  </h3>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      note.isCompleted
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-indigo-100 text-indigo-700"
                    }`}
                  >
                    {note.isCompleted ? "Done" : "Active"}
                  </span>
                </div>

                <p
                  className={`text-sm leading-relaxed whitespace-pre-line mb-4 ${
                    note.isCompleted ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  {note.content || <span className="italic text-gray-400">No content</span>}
                </p>
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(note.createdAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => {
                      setEditingNote(note);
                      setModalOpen(true);
                    }}
                    className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                    title="Edit Note"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(note._id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="Delete Note"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
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

      {/* Create / Edit Note Modal */}
      <CreateNoteModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingNote(null);
        }}
        initialData={editingNote}
        onSuccess={() => {
          fetchNotes(page);
        }}
      />
    </div>
  );
}


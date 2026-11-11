"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  usersApi,
  postsApi,
  notesApi,
  User,
  Post,
  Note,
  UserGroupedByInterest,
  UserWithPosts,
  PaginationMeta,
} from "@/lib/api";
import { Modal } from "@/components/Modal";
import { CreatePostModal } from "@/components/CreatePostModal";
import { Pagination } from "@/components/Pagination";
import {
  Shield,
  Users,
  FileText,
  Bookmark,
  Layers,
  Plus,
  Trash2,
  Edit,
  Eye,
  CheckCircle2,
  Circle,
  Globe,
  Lock,
  Tag,
  Search,
  Loader2,
  AlertTriangle,
  RefreshCw,
  X,
  ExternalLink,
} from "lucide-react";

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, isAdmin, isLoading: authLoading } = useAuth();

  // Active Tab
  const [activeTab, setActiveTab] = useState<"users" | "posts" | "notes" | "interests">("users");

  // Users State
  const [users, setUsers] = useState<User[]>([]);
  const [usersMeta, setUsersMeta] = useState<PaginationMeta | undefined>();
  const [usersPage, setUsersPage] = useState(1);
  const [usersLoading, setUsersLoading] = useState(false);

  // Posts State
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsMeta, setPostsMeta] = useState<PaginationMeta | undefined>();
  const [postsPage, setPostsPage] = useState(1);
  const [postsLoading, setPostsLoading] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);

  // Notes State
  const [notes, setNotes] = useState<Note[]>([]);
  const [notesMeta, setNotesMeta] = useState<PaginationMeta | undefined>();
  const [notesPage, setNotesPage] = useState(1);
  const [notesLoading, setNotesLoading] = useState(false);

  // Aggregation: Interests State
  const [interestsGroups, setInterestsGroups] = useState<UserGroupedByInterest[]>([]);
  const [interestsLoading, setInterestsLoading] = useState(false);

  // User Post Lookup ($lookup aggregation) State
  const [selectedUserPosts, setSelectedUserPosts] = useState<UserWithPosts | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [userPostsModalOpen, setUserPostsModalOpen] = useState(false);

  // User CRUD Modals
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userFormData, setUserFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "USER" as "USER" | "ADMIN",
    interests: [] as string[],
  });
  const [newInterestInput, setNewInterestInput] = useState("");
  const [userFormSubmitting, setUserFormSubmitting] = useState(false);
  const [userFormError, setUserFormError] = useState<string | null>(null);

  // Global Dashboard Error
  const [dashboardError, setDashboardError] = useState<string | null>(null);

  // Fetch Users
  const fetchUsers = useCallback(async (targetPage = 1) => {
    setUsersLoading(true);
    setDashboardError(null);
    try {
      const res = await usersApi.getAllUsers(targetPage, 10);
      if (res.data) {
        setUsers(res.data);
        setUsersMeta(res.meta);
      }
    } catch (err: unknown) {
      if (err instanceof Error) setDashboardError(err.message);
    } finally {
      setUsersLoading(false);
    }
  }, []);

  // Fetch Admin Posts
  const fetchAdminPosts = useCallback(async (targetPage = 1) => {
    setPostsLoading(true);
    setDashboardError(null);
    try {
      const res = await postsApi.getAdminPosts(targetPage, 10);
      if (res.data) {
        setPosts(res.data);
        setPostsMeta(res.meta);
      }
    } catch (err: unknown) {
      if (err instanceof Error) setDashboardError(err.message);
    } finally {
      setPostsLoading(false);
    }
  }, []);

  // Fetch Admin Notes
  const fetchAdminNotes = useCallback(async (targetPage = 1) => {
    setNotesLoading(true);
    setDashboardError(null);
    try {
      const res = await notesApi.getAllNotes(targetPage, 10);
      if (res.data) {
        setNotes(res.data);
        setNotesMeta(res.meta);
      }
    } catch (err: unknown) {
      if (err instanceof Error) setDashboardError(err.message);
    } finally {
      setNotesLoading(false);
    }
  }, []);

  // Fetch Interests Aggregation (Scenario 1)
  const fetchInterestsAggregation = useCallback(async () => {
    setInterestsLoading(true);
    setDashboardError(null);
    try {
      const res = await usersApi.getGroupedByInterests(1, 50);
      if (res.data) {
        setInterestsGroups(res.data);
      }
    } catch (err: unknown) {
      if (err instanceof Error) setDashboardError(err.message);
    } finally {
      setInterestsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login");
      } else if (isAdmin) {
        if (activeTab === "users") fetchUsers(usersPage);
        else if (activeTab === "posts") fetchAdminPosts(postsPage);
        else if (activeTab === "notes") fetchAdminNotes(notesPage);
        else if (activeTab === "interests") fetchInterestsAggregation();
      }
    }
  }, [
    authLoading,
    user,
    isAdmin,
    router,
    activeTab,
    usersPage,
    postsPage,
    notesPage,
    fetchUsers,
    fetchAdminPosts,
    fetchAdminNotes,
    fetchInterestsAggregation,
  ]);

  // Handle Tab Switch
  const handleTabSwitch = (tab: "users" | "posts" | "notes" | "interests") => {
    setActiveTab(tab);
    if (tab === "users") fetchUsers(usersPage);
    if (tab === "posts") fetchAdminPosts(postsPage);
    if (tab === "notes") fetchAdminNotes(notesPage);
    if (tab === "interests") fetchInterestsAggregation();
  };

  // Open User Modal for Add / Edit
  const handleOpenUserModal = (targetUser?: User) => {
    if (targetUser) {
      setEditingUser(targetUser);
      setUserFormData({
        name: targetUser.name || "",
        email: targetUser.email,
        password: "",
        role: targetUser.role,
        interests: targetUser.interests || [],
      });
    } else {
      setEditingUser(null);
      setUserFormData({
        name: "",
        email: "",
        password: "",
        role: "USER",
        interests: [],
      });
    }
    setUserFormError(null);
    setUserModalOpen(true);
  };

  // Handle User Modal Submit
  const handleUserFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserFormSubmitting(true);
    setUserFormError(null);

    try {
      if (editingUser?._id) {
        const payload: {
          name?: string;
          email?: string;
          password?: string;
          role?: "USER" | "ADMIN";
          interests?: string[];
        } = {
          name: userFormData.name.trim() || undefined,
          email: userFormData.email.trim().toLowerCase(),
          role: userFormData.role,
          interests: userFormData.interests,
        };
        if (userFormData.password) {
          payload.password = userFormData.password;
        }

        await usersApi.updateUser(editingUser._id, payload);
      } else {
        if (!userFormData.password || userFormData.password.length < 8) {
          throw new Error("Password must be at least 8 characters");
        }
        await usersApi.createUser({
          name: userFormData.name.trim() || undefined,
          email: userFormData.email.trim().toLowerCase(),
          password: userFormData.password,
          role: userFormData.role,
          interests: userFormData.interests,
        });
      }

      setUserModalOpen(false);
      fetchUsers(usersPage);
    } catch (err: unknown) {
      if (err instanceof Error) setUserFormError(err.message);
      else setUserFormError("Failed to save user");
    } finally {
      setUserFormSubmitting(false);
    }
  };

  // Delete User
  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user? This cannot be undone."))
      return;
    try {
      await usersApi.deleteUser(userId);
      fetchUsers(usersPage);
    } catch (err: unknown) {
      if (err instanceof Error) alert(err.message);
    }
  };

  // View User Posts Aggregation ($lookup)
  const handleViewUserPosts = async (userId: string) => {
    setLookupLoading(true);
    setUserPostsModalOpen(true);
    try {
      const res = await usersApi.getUserWithPosts(userId);
      if (res.data) {
        setSelectedUserPosts(res.data);
      }
    } catch (err: unknown) {
      if (err instanceof Error) alert(err.message);
    } finally {
      setLookupLoading(false);
    }
  };

  // Admin Delete Post
  const handleAdminDeletePost = async (postId: string) => {
    if (!confirm("Admin: Permanently delete/soft-delete this post?")) return;
    try {
      await postsApi.adminDeletePost(postId);
      fetchAdminPosts(postsPage);
    } catch (err: unknown) {
      if (err instanceof Error) alert(err.message);
    }
  };

  const handleAdminEditPost = (post: Post) => {
    setEditingPost(post);
  };

  if (authLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  // Non-admin guard
  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-3xl shadow-xl border border-red-100 text-center">
        <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-sm text-gray-600 mb-6">
          This dashboard is strictly reserved for administrative users. Your account does
          not possess administrator privileges.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition"
        >
          Return to Public Feed
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-amber-500 text-white rounded-xl shadow-md shadow-amber-500/20">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
                Admin Control Center
              </h1>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (activeTab === "users") fetchUsers(usersPage);
              if (activeTab === "posts") fetchAdminPosts(postsPage);
              if (activeTab === "notes") fetchAdminNotes(notesPage);
              if (activeTab === "interests") fetchInterestsAggregation();
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>
      </div>

      {dashboardError && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {dashboardError}
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 pb-4 mb-6">
        <button
          onClick={() => handleTabSwitch("users")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition ${
            activeTab === "users"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
              : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
          }`}
        >
          <Users className="w-4 h-4" />
          User Control ({usersMeta?.total ?? users.length})
        </button>

        <button
          onClick={() => handleTabSwitch("posts")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition ${
            activeTab === "posts"
              ? "bg-violet-600 text-white shadow-md shadow-violet-600/20"
              : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
          }`}
        >
          <Bookmark className="w-4 h-4" />
          Posts Control ({postsMeta?.total ?? posts.length})
        </button>

        <button
          onClick={() => handleTabSwitch("notes")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition ${
            activeTab === "notes"
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
              : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
          }`}
        >
          <FileText className="w-4 h-4" />
          All Users' Notes ({notesMeta?.total ?? notes.length})
        </button>

        <button
          onClick={() => handleTabSwitch("interests")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition ${
            activeTab === "interests"
              ? "bg-amber-600 text-white shadow-md shadow-amber-600/20"
              : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
          }`}
        >
          <Layers className="w-4 h-4" />
          Interests Aggregation ({interestsGroups.length})
        </button>
      </div>

      {/* ── TAB 1: USERS CONTROL ───────────────────────────────────────── */}
      {activeTab === "users" && (
        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">User Management Model</h2>
            </div>
            <button
              onClick={() => handleOpenUserModal()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              Add User
            </button>
          </div>

          {usersLoading ? (
            <div className="py-20 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
                <thead className="bg-gray-50 text-gray-600 text-xs uppercase font-semibold">
                  <tr>
                    <th className="px-6 py-3.5">User</th>
                    <th className="px-6 py-3.5">Role</th>
                    <th className="px-6 py-3.5">Interests</th>
                    <th className="px-6 py-3.5">Created</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map((u) => {
                    const uId = u._id || u.id || "";
                    return (
                      <tr key={uId} className="hover:bg-gray-50/70 transition">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-xs">
                              {u.name ? u.name[0].toUpperCase() : u.email[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{u.name || "—"}</p>
                              <p className="text-xs text-gray-500">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                              u.role === "ADMIN"
                                ? "bg-amber-100 text-amber-800 border border-amber-300"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {u.interests && u.interests.length > 0 ? (
                              u.interests.map((tag) => (
                                <span
                                  key={tag}
                                  className="px-2 py-0.5 rounded text-[11px] bg-slate-100 text-slate-700"
                                >
                                  #{tag}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-gray-400 italic">None</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-500">
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="inline-flex items-center space-x-2">
                            {/* Aggregation lookup button */}
                            <button
                              onClick={() => handleViewUserPosts(uId)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-violet-50 text-violet-700 hover:bg-violet-100 border border-violet-200 transition"
                              title="Fetch posts via MongoDB $lookup aggregation"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              $lookup Posts
                            </button>

                            <button
                              onClick={() => handleOpenUserModal(u)}
                              className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                              title="Edit User"
                            >
                              <Edit className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleDeleteUser(uId)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                              title="Delete User"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="p-4 border-t border-gray-100">
            <Pagination
              meta={usersMeta}
              currentPage={usersPage}
              onPageChange={(p) => setUsersPage(p)}
              isLoading={usersLoading}
            />
          </div>
        </section>
      )}

      {/* ── TAB 2: POSTS CONTROL ───────────────────────────────────────── */}
      {activeTab === "posts" && (
        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900">Admin Posts Control</h2>
            <p className="text-xs text-gray-500">
              Audit and moderate all community and private posts across all accounts
            </p>
          </div>

          {postsLoading ? (
            <div className="py-20 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
            </div>
          ) : posts.length === 0 ? (
            <div className="p-12 text-center text-gray-500 text-sm">No posts found in database.</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {posts.map((post) => {
                const owner = typeof post.owner === "object" ? post.owner : null;
                const authorName = owner?.name || (owner?.email ? owner.email.split("@")[0] : "Unknown");
                return (
                  <div key={post._id} className="p-6 hover:bg-gray-50/70 transition flex flex-col sm:flex-row items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            post.isPublic
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {post.isPublic ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                          {post.isPublic ? "Public" : "Private"}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(post.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-gray-900 mb-1">{post.title}</h3>
                      <p className="text-sm text-gray-600 whitespace-pre-line mb-3">
                        {post.content || <span className="italic text-gray-400">Empty</span>}
                      </p>

                      <div className="text-xs text-gray-500 flex items-center gap-2">
                        <span>
                          Author: <strong className="text-gray-800">{authorName}</strong> ({owner?.email || "N/A"})
                        </span>
                        {owner?.role && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] uppercase font-bold bg-gray-100">
                            {owner.role}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleAdminEditPost(post)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        Edit Post
                      </button>
                      <button
                        onClick={() => handleAdminDeletePost(post._id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete Post
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="p-4 border-t border-gray-100">
            <Pagination
              meta={postsMeta}
              currentPage={postsPage}
              onPageChange={(p) => setPostsPage(p)}
              isLoading={postsLoading}
            />
          </div>
        </section>
      )}

      {/* ── TAB 3: NOTES OVERVIEW ──────────────────────────────────────── */}
      {activeTab === "notes" && (
        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900">All System Notes (Admin View)</h2>
            <p className="text-xs text-gray-500">
              Admin privilege requirement: Can view everyone&apos;s notes across the entire platform
            </p>
          </div>

          {notesLoading ? (
            <div className="py-20 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            </div>
          ) : notes.length === 0 ? (
            <div className="p-12 text-center text-gray-500 text-sm">No notes found.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
              {notes.map((note) => {
                const ownerId = typeof note.owner === "object" ? note.owner._id : String(note.owner);
                return (
                  <div
                    key={note._id}
                    className="p-5 rounded-2xl border border-gray-200 bg-gray-50/40 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            note.isCompleted
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-indigo-100 text-indigo-700"
                          }`}
                        >
                          {note.isCompleted ? "Completed" : "Active"}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(note.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <h3 className="font-bold text-gray-900 text-sm mb-1">{note.title}</h3>
                      <p className="text-xs text-gray-600 whitespace-pre-line line-clamp-4 mb-4">
                        {note.content || <span className="italic text-gray-400">No content</span>}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-gray-200/60 text-[11px] text-gray-500 flex items-center justify-between">
                      <span className="truncate max-w-[150px]">Owner ID: {ownerId}</span>
                      <span className="font-mono text-[10px] bg-white px-1.5 py-0.5 rounded border border-gray-200">
                        {note._id.slice(-6)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="p-4 border-t border-gray-100">
            <Pagination
              meta={notesMeta}
              currentPage={notesPage}
              onPageChange={(p) => setNotesPage(p)}
              isLoading={notesLoading}
            />
          </div>
        </section>
      )}

      {/* ── TAB 4: INTERESTS AGGREGATION (Scenario 1) ───────────────────── */}
      {activeTab === "interests" && (
        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden p-6">
          <div className="mb-6">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-gray-900">
                Users Grouped by Interests
              </h2>
            </div>
          </div>

          {interestsLoading ? (
            <div className="py-20 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
            </div>
          ) : interestsGroups.length === 0 ? (
            <div className="p-12 text-center text-gray-500 text-sm">
              No interests recorded yet. Register users with interests to see them grouped here!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {interestsGroups.map((group) => (
                <div
                  key={group.interest}
                  className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:border-amber-300 transition"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-sm font-bold bg-amber-50 text-amber-800 border border-amber-200">
                      <Tag className="w-3.5 h-3.5" />
                      #{group.interest}
                    </span>
                    <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                      {group.totalUsers} {group.totalUsers === 1 ? "user" : "users"}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {group.users.map((u) => (
                      <div
                        key={u._id}
                        className="flex items-center justify-between p-2 rounded-xl bg-gray-50 text-xs"
                      >
                        <div className="truncate max-w-[160px]">
                          <p className="font-semibold text-gray-900 truncate">
                            {u.name || "User"}
                          </p>
                          <p className="text-[11px] text-gray-500 truncate">{u.email}</p>
                        </div>
                        <button
                          onClick={() => handleViewUserPosts(u._id)}
                          className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 transition"
                        >
                          Posts <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── USER CREATE / EDIT MODAL ────────────────────────────────────── */}
      <Modal
        isOpen={userModalOpen}
        onClose={() => setUserModalOpen(false)}
        title={editingUser ? "Edit User Account" : "Create New User Account"}
      >
        <form onSubmit={handleUserFormSubmit} className="space-y-4">
          {userFormError && (
            <div className="p-3 text-sm rounded-lg bg-red-50 text-red-700 border border-red-200">
              {userFormError}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={userFormData.name}
              onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
              placeholder="e.g. John Doe"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
              Email Address *
            </label>
            <input
              type="email"
              required
              value={userFormData.email}
              onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
              placeholder="john@example.com"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
              Password {editingUser ? "(Leave blank to keep unchanged)" : "* (min 8 chars)"}
            </label>
            <input
              type="password"
              minLength={editingUser ? 0 : 8}
              required={!editingUser}
              value={userFormData.password}
              onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
              Role
            </label>
            <select
              value={userFormData.role}
              onChange={(e) =>
                setUserFormData({ ...userFormData, role: e.target.value as "USER" | "ADMIN" })
              }
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="USER">User</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          {/* Interests */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
              Interests (Tags)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newInterestInput}
                onChange={(e) => setNewInterestInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const trimmed = newInterestInput.trim().toLowerCase();
                    if (trimmed && !userFormData.interests.includes(trimmed)) {
                      setUserFormData({
                        ...userFormData,
                        interests: [...userFormData.interests, trimmed],
                      });
                      setNewInterestInput("");
                    }
                  }
                }}
                placeholder="Type and press Enter"
                className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={() => {
                  const trimmed = newInterestInput.trim().toLowerCase();
                  if (trimmed && !userFormData.interests.includes(trimmed)) {
                    setUserFormData({
                      ...userFormData,
                      interests: [...userFormData.interests, trimmed],
                    });
                    setNewInterestInput("");
                  }
                }}
                className="px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-bold"
              >
                Add
              </button>
            </div>

            {userFormData.interests.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {userFormData.interests.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs bg-indigo-50 text-indigo-700 border border-indigo-200"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() =>
                        setUserFormData({
                          ...userFormData,
                          interests: userFormData.interests.filter((i) => i !== tag),
                        })
                      }
                      className="hover:text-red-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setUserModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={userFormSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition disabled:opacity-50"
            >
              {userFormSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {editingUser ? "Save Changes" : "Create User"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── USER POSTS AGGREGATION MODAL ($lookup - Scenario 2) ────────── */}
      <Modal
        isOpen={userPostsModalOpen}
        onClose={() => {
          setUserPostsModalOpen(false);
          setSelectedUserPosts(null);
        }}
        title="User Posts Pipeline ($lookup Aggregation)"
        maxWidth="xl"
      >
        {lookupLoading ? (
          <div className="py-16 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
            <p className="text-xs text-gray-500">Executing MongoDB $lookup aggregation pipeline...</p>
          </div>
        ) : selectedUserPosts ? (
          <div className="space-y-4">
            {/* User Details Header */}
            <div className="p-4 bg-violet-50 rounded-2xl border border-violet-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900 text-sm">
                  {selectedUserPosts.name || "User"}
                </h3>
                <p className="text-xs text-gray-600">{selectedUserPosts.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-violet-200 text-violet-800">
                    {selectedUserPosts.role}
                  </span>
                  <span className="text-xs text-violet-700 font-semibold">
                    {selectedUserPosts.posts?.length || 0} aggregated posts
                  </span>
                </div>
              </div>
            </div>

            {/* List of aggregated posts */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {!selectedUserPosts.posts || selectedUserPosts.posts.length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-xs italic bg-gray-50 rounded-xl">
                  This user has not published any posts yet.
                </div>
              ) : (
                selectedUserPosts.posts.map((post) => (
                  <div
                    key={post._id}
                    className="p-4 rounded-xl border border-gray-200 bg-white hover:border-violet-300 transition"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                          post.isPublic
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {post.isPublic ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                        {post.isPublic ? "Public" : "Private"}
                      </span>
                      <span className="text-[11px] text-gray-400">
                        {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : ""}
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-gray-900 mb-1">{post.title}</h4>
                    <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line line-clamp-3">
                      {post.content || <span className="italic text-gray-400">No content</span>}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500 text-sm">No data available</div>
        )}
      </Modal>

      <CreatePostModal
        isOpen={Boolean(editingPost)}
        onClose={() => setEditingPost(null)}
        initialData={editingPost}
        adminMode
        onSuccess={() => {
          setEditingPost(null);
          fetchAdminPosts(postsPage);
        }}
      />
    </div>
  );
}


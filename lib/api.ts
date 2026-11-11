// Frontend API client helper

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

export interface PaginationMeta {
  page: number;
  limit: number;
  total?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  meta?: PaginationMeta;
  errors?: Record<string, string[]>;
}

export interface User {
  _id?: string;
  id?: string;
  name?: string;
  email: string;
  role: "USER" | "ADMIN";
  interests?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Note {
  _id: string;
  title: string;
  content: string;
  owner: string | { _id: string; name?: string; email?: string };
  isCompleted: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Post {
  _id: string;
  title: string;
  content: string;
  owner: {
    _id: string;
    name?: string;
    email?: string;
    role?: string;
  } | string;
  isDeleted: boolean;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserGroupedByInterest {
  interest: string;
  totalUsers: number;
  users: Array<{
    _id: string;
    name?: string;
    email: string;
  }>;
}

export interface UserWithPosts extends User {
  posts: Post[];
}

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("secure_notes_token");
}

export function getStoredRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("secure_notes_refresh_token");
}

export function setStoredToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("secure_notes_token", token);
}

export function setStoredRefreshToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("secure_notes_refresh_token", token);
}

export function removeStoredToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("secure_notes_token");
}

export function removeStoredRefreshToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("secure_notes_refresh_token");
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getStoredRefreshToken();
  if (!refreshToken) return null;

  const response = await fetch(`${API_BASE}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.success || !data.data?.accessToken) {
    removeStoredToken();
    removeStoredRefreshToken();
    return null;
  }

  setStoredToken(data.data.accessToken);
  return data.data.accessToken;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  hasRetried = false,
): Promise<ApiResponse<T>> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const url = `${API_BASE}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    const data = await res.json().catch(() => ({}));

    if (res.status === 401 && !hasRetried && !endpoint.startsWith("/auth/")) {
      const newAccessToken = await refreshAccessToken();
      if (newAccessToken) {
        return request<T>(endpoint, { ...options, headers: { ...Object.fromEntries(headers.entries()), Authorization: `Bearer ${newAccessToken}` } }, true);
      }
    }

    if (!res.ok) {
      const errorMsg =
        data.message ||
        (data.errors ? Object.values(data.errors).flat().join(", ") : "Request failed");
      throw new Error(errorMsg);
    }

    return data as ApiResponse<T>;
  } catch (err: unknown) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error("An unexpected error occurred");
  }
}

// ── Auth APIs ─────────────────────────────────────────────────────────────
export const authApi = {
  login: async (body: { email: string; password: string }) => {
    return request<{ accessToken: string; refreshToken: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  refresh: async () => {
    const refreshToken = getStoredRefreshToken();
    if (!refreshToken) throw new Error("Refresh token not found");
    return request<{ accessToken: string }>("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    });
  },

  register: async (body: {
    name?: string;
    email: string;
    password: string;
    interests?: string[];
  }) => {
    return request<User>("/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  getProfile: async () => {
    return request<User>("/auth/profile", {
      method: "GET",
    });
  },
};

// ── Notes APIs ────────────────────────────────────────────────────────────
export const notesApi = {
  getUserNotes: async (page = 1, limit = 10) => {
    return request<Note[]>(`/notes?page=${page}&limit=${limit}`, {
      method: "GET",
    });
  },

  getAllNotes: async (page = 1, limit = 10) => {
    return request<Note[]>(`/notes/admin/all?page=${page}&limit=${limit}`, {
      method: "GET",
    });
  },

  getSingleNote: async (id: string) => {
    return request<Note>(`/notes/${id}`, {
      method: "GET",
    });
  },

  createNote: async (body: { title: string; content?: string; isCompleted?: boolean }) => {
    return request<Note>("/notes", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  updateNote: async (
    id: string,
    body: { title?: string; content?: string; isCompleted?: boolean }
  ) => {
    return request<Note>(`/notes/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  },

  deleteNote: async (id: string) => {
    return request<Note>(`/notes/${id}`, {
      method: "DELETE",
    });
  },
};

// ── Posts APIs ────────────────────────────────────────────────────────────
export const postsApi = {
  getPublicPosts: async (page = 1, limit = 10) => {
    return request<Post[]>(`/posts?page=${page}&limit=${limit}`, {
      method: "GET",
    });
  },

  getMyPosts: async (page = 1, limit = 10) => {
    return request<Post[]>(`/posts/my-posts?page=${page}&limit=${limit}`, {
      method: "GET",
    });
  },

  getAdminPosts: async (page = 1, limit = 10) => {
    return request<Post[]>(`/posts/admin/all-posts?page=${page}&limit=${limit}`, {
      method: "GET",
    });
  },

  getSinglePost: async (id: string) => {
    return request<Post>(`/posts/${id}`, {
      method: "GET",
    });
  },

  createPost: async (body: { title: string; content?: string; isPublic?: boolean }) => {
    return request<Post>("/posts", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  updatePost: async (
    id: string,
    body: { title?: string; content?: string; isPublic?: boolean }
  ) => {
    return request<Post>(`/posts/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  },

  deleteMyPost: async (id: string) => {
    return request<Post>(`/posts/${id}`, {
      method: "DELETE",
    });
  },

  adminDeletePost: async (id: string) => {
    return request<Post>(`/posts/admin/${id}`, {
      method: "DELETE",
    });
  },
};

// ── User Management APIs (Admin Control) ──────────────────────────────────
export const usersApi = {
  getAllUsers: async (page = 1, limit = 10) => {
    return request<User[]>(`/users?page=${page}&limit=${limit}`, {
      method: "GET",
    });
  },

  createUser: async (body: {
    name?: string;
    email: string;
    password: string;
    role?: "USER" | "ADMIN";
    interests?: string[];
  }) => {
    return request<User>("/users", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  updateUser: async (
    id: string,
    body: {
      name?: string;
      email?: string;
      password?: string;
      role?: "USER" | "ADMIN";
      interests?: string[];
    }
  ) => {
    return request<User>(`/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  },

  deleteUser: async (id: string) => {
    return request<User>(`/users/${id}`, {
      method: "DELETE",
    });
  },

  // Scenario 2: Aggregated posts using $lookup
  getUserWithPosts: async (id: string, page = 1, limit = 10) => {
    return request<UserWithPosts>(`/users/${id}/posts?page=${page}&limit=${limit}`, {
      method: "GET",
    });
  },

  // Scenario 1: Grouped users by interests aggregation
  getGroupedByInterests: async (page = 1, limit = 50) => {
    return request<UserGroupedByInterest[]>(
      `/users/grouped-by-interests?page=${page}&limit=${limit}`,
      {
        method: "GET",
      }
    );
  },
};


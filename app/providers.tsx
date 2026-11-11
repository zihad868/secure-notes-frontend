"use client";

import React, { useState } from "react";
import { AuthProvider } from "@/context/AuthContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CreateNoteModal } from "@/components/CreateNoteModal";
import { CreatePostModal } from "@/components/CreatePostModal";

export function Providers({ children }: { children: React.ReactNode }) {
  const [createNoteOpen, setCreateNoteOpen] = useState(false);
  const [createPostOpen, setCreatePostOpen] = useState(false);

  return (
    <AuthProvider>
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
        <Navbar
          onOpenCreateNote={() => setCreateNoteOpen(true)}
          onOpenCreatePost={() => setCreatePostOpen(true)}
        />
        <main className="flex-1">{children}</main>
        <Footer />

        {/* Global Modals triggered from Navbar quick-action buttons */}
        <CreateNoteModal
          isOpen={createNoteOpen}
          onClose={() => setCreateNoteOpen(false)}
          onSuccess={() => {
            // refresh page or emit event
            if (typeof window !== "undefined") {
              window.dispatchEvent(new CustomEvent("refresh_notes"));
            }
          }}
        />
        <CreatePostModal
          isOpen={createPostOpen}
          onClose={() => setCreatePostOpen(false)}
          onSuccess={() => {
            if (typeof window !== "undefined") {
              window.dispatchEvent(new CustomEvent("refresh_posts"));
            }
          }}
        />
      </div>
    </AuthProvider>
  );
}


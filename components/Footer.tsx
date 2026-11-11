import React from "react";
import Link from "next/link";
import { Shield, Lock } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-gray-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <Lock className="w-4 h-4" />
            </div>
            <span className="font-semibold text-gray-900 text-sm">
              SecureNotes Platform
            </span>
          </div>

          <div className="flex items-center space-x-6 text-xs text-gray-500">
            <Link href="/" className="hover:text-indigo-600 transition">
              Public Feed
            </Link>
            <Link href="/notes" className="hover:text-indigo-600 transition">
              My Notes
            </Link>
            <Link href="/my-posts" className="hover:text-indigo-600 transition">
              My Posts
            </Link>
            <Link href="/admin" className="hover:text-indigo-600 transition flex items-center gap-1">
              <Shield className="w-3 h-3 text-amber-500" />
              Admin
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}


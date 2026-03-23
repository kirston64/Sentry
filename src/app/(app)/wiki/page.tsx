"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  BookOpen,
  Plus,
  Pin,
  Search,
  FolderOpen,
  Clock,
  User,
} from "lucide-react";
import { clsx } from "clsx";
import { useProfile } from "@/components/auth/profile-context";

interface WikiArticle {
  id: string;
  title: string;
  slug: string;
  content: string;
  category: string;
  pinned: boolean;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  author: { id: string; username: string; fullName: string };
}

const CATEGORIES: Record<string, { label: string; color: string }> = {
  general: { label: "General", color: "bg-blue-500/20 text-blue-400" },
  guides: { label: "Guides", color: "bg-green-500/20 text-green-400" },
  changelog: { label: "Changelog", color: "bg-purple-500/20 text-purple-400" },
  architecture: { label: "Architecture", color: "bg-orange-500/20 text-orange-400" },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} мин. назад`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} ч. назад`;
  return `${Math.floor(hours / 24)} дн. назад`;
}

export default function WikiPage() {
  const profile = useProfile();
  const [articles, setArticles] = useState<WikiArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  useEffect(() => {
    fetch("/api/wiki")
      .then((r) => r.json())
      .then(setArticles)
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return articles.filter((a) => {
      if (categoryFilter !== "all" && a.category !== categoryFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          a.title.toLowerCase().includes(q) ||
          a.content.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [articles, search, categoryFilter]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-surface" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-lg bg-surface" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold text-text-primary">Wiki</h1>
          <span className="ml-2 text-xs text-text-muted">{articles.length} articles</span>
        </div>
        <Link
          href="/wiki/new"
          className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary-hover"
        >
          <Plus className="h-3.5 w-3.5" />
          New Article
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search articles..."
            className="w-full rounded border border-border bg-surface py-1.5 pl-8 pr-3 text-xs text-text-primary outline-none focus:border-primary"
          />
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={() => setCategoryFilter("all")}
            className={clsx(
              "rounded px-2.5 py-1 text-[10px] font-medium transition-colors",
              categoryFilter === "all"
                ? "bg-primary/20 text-primary"
                : "text-text-muted hover:bg-surface-hover"
            )}
          >
            All
          </button>
          {Object.entries(CATEGORIES).map(([key, { label, color }]) => (
            <button
              key={key}
              onClick={() => setCategoryFilter(key)}
              className={clsx(
                "rounded px-2.5 py-1 text-[10px] font-medium transition-colors",
                categoryFilter === key ? color : "text-text-muted hover:bg-surface-hover"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Articles */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center py-12">
          <FolderOpen className="mb-3 h-8 w-8 text-text-muted" />
          <p className="text-sm text-text-muted">
            {articles.length === 0 ? "No articles yet. Create the first one!" : "No articles match your search."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((article) => {
            const cat = CATEGORIES[article.category] ?? CATEGORIES.general;
            return (
              <Link
                key={article.id}
                href={`/wiki/${article.slug}`}
                className="block rounded-lg border border-border bg-surface p-4 transition-colors hover:border-primary/30 hover:bg-surface-hover"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {article.pinned && <Pin className="h-3 w-3 text-warning" />}
                      <h3 className="text-sm font-medium text-text-primary truncate">
                        {article.title}
                      </h3>
                      <span className={clsx("rounded px-1.5 py-0.5 text-[10px] font-medium", cat.color)}>
                        {cat.label}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-text-muted line-clamp-2">
                      {article.content.replace(/[#*`\[\]]/g, "").slice(0, 150)}...
                    </p>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-4 text-[10px] text-text-muted">
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {article.author.fullName}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {timeAgo(article.updatedAt)}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

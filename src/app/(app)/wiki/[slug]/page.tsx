"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Edit3,
  Trash2,
  Pin,
  PinOff,
  Clock,
  User,
  Save,
  X,
} from "lucide-react";
import { useProfile } from "@/components/auth/profile-context";
import { hasRole } from "@/lib/rbac";

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

function renderMarkdown(content: string): string {
  return content
    .replace(/^### (.+)$/gm, '<h3 class="text-base font-bold text-text-primary mt-4 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-lg font-bold text-text-primary mt-5 mb-2">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold text-text-primary mt-6 mb-3">$1</h1>')
    .replace(/`([^`]+)`/g, '<code class="rounded bg-surface-hover px-1.5 py-0.5 text-xs text-accent font-mono">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-text-primary">$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 text-xs text-text-secondary list-disc">$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 text-xs text-text-secondary list-decimal">$2</li>')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>');
}

export default function WikiArticlePage() {
  const router = useRouter();
  const params = useParams();
  const profile = useProfile();
  const slug = params.slug as string;

  const [article, setArticle] = useState<WikiArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editCategory, setEditCategory] = useState("general");

  useEffect(() => {
    fetch(`/api/wiki/${slug}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then((data) => {
        setArticle(data);
        setEditTitle(data.title);
        setEditContent(data.content);
        setEditCategory(data.category);
      })
      .catch(() => router.push("/wiki"))
      .finally(() => setLoading(false));
  }, [slug, router]);

  const canEdit =
    article &&
    (article.authorId === profile.id || hasRole(profile.role, "admin"));

  const handleSave = async () => {
    if (!article) return;
    const res = await fetch(`/api/wiki/${slug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: editTitle,
        content: editContent,
        category: editCategory,
      }),
    });
    if (res.ok) {
      const updated = await res.json();
      setArticle(updated);
      setEditing(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this article?")) return;
    const res = await fetch(`/api/wiki/${slug}`, { method: "DELETE" });
    if (res.ok) router.push("/wiki");
  };

  const handlePin = async () => {
    if (!article) return;
    const res = await fetch(`/api/wiki/${slug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pinned: !article.pinned }),
    });
    if (res.ok) {
      const updated = await res.json();
      setArticle(updated);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-6 w-32 animate-pulse rounded bg-surface" />
        <div className="h-8 w-64 animate-pulse rounded bg-surface" />
        <div className="h-48 animate-pulse rounded bg-surface" />
      </div>
    );
  }

  if (!article) return null;

  const cat = CATEGORIES[article.category] ?? CATEGORIES.general;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Back */}
      <Link
        href="/wiki"
        className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Wiki
      </Link>

      {editing ? (
        /* Edit mode */
        <div className="space-y-4">
          <input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="w-full rounded border border-border bg-surface px-3 py-2 text-lg font-bold text-text-primary outline-none focus:border-primary"
          />
          <select
            value={editCategory}
            onChange={(e) => setEditCategory(e.target.value)}
            className="rounded border border-border bg-surface px-2 py-1 text-xs text-text-primary outline-none focus:border-primary"
          >
            {Object.entries(CATEGORIES).map(([key, { label }]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={20}
            className="w-full rounded border border-border bg-surface px-3 py-2 font-mono text-xs text-text-primary outline-none focus:border-primary"
          />
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 rounded bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-hover"
            >
              <Save className="h-3.5 w-3.5" />
              Save
            </button>
            <button
              onClick={() => setEditing(false)}
              className="flex items-center gap-1.5 rounded bg-surface-hover px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary"
            >
              <X className="h-3.5 w-3.5" />
              Cancel
            </button>
          </div>
        </div>
      ) : (
        /* View mode */
        <>
          <div>
            <div className="flex items-center gap-2 mb-2">
              {article.pinned && <Pin className="h-4 w-4 text-warning" />}
              <h1 className="text-xl font-bold text-text-primary">{article.title}</h1>
              <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${cat.color}`}>
                {cat.label}
              </span>
            </div>
            <div className="flex items-center gap-4 text-[10px] text-text-muted">
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {article.author.fullName}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {new Date(article.updatedAt).toLocaleString("ru-RU")}
              </span>
            </div>
          </div>

          {/* Actions */}
          {canEdit && (
            <div className="flex gap-2">
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-1.5 rounded bg-surface-hover px-2.5 py-1 text-[10px] text-text-secondary hover:text-text-primary"
              >
                <Edit3 className="h-3 w-3" />
                Edit
              </button>
              {hasRole(profile.role, "admin") && (
                <button
                  onClick={handlePin}
                  className="flex items-center gap-1.5 rounded bg-surface-hover px-2.5 py-1 text-[10px] text-text-secondary hover:text-text-primary"
                >
                  {article.pinned ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3" />}
                  {article.pinned ? "Unpin" : "Pin"}
                </button>
              )}
              <button
                onClick={handleDelete}
                className="flex items-center gap-1.5 rounded bg-surface-hover px-2.5 py-1 text-[10px] text-error hover:bg-error/10"
              >
                <Trash2 className="h-3 w-3" />
                Delete
              </button>
            </div>
          )}

          {/* Content */}
          <div
            className="prose prose-sm max-w-none text-xs leading-relaxed text-text-secondary"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(article.content) }}
          />
        </>
      )}
    </div>
  );
}

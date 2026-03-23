"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";

const CATEGORIES = [
  { key: "general", label: "General" },
  { key: "guides", label: "Guides" },
  { key: "changelog", label: "Changelog" },
  { key: "architecture", label: "Architecture" },
];

export default function NewWikiArticlePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("general");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      setError("Title and content are required");
      return;
    }
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/wiki", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, category }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create");
      }
      const article = await res.json();
      router.push(`/wiki/${article.slug}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create article");
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/wiki"
        className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Wiki
      </Link>

      <h1 className="text-xl font-bold text-text-primary">New Article</h1>

      {error && (
        <div className="rounded border border-error/20 bg-error/10 px-3 py-2 text-xs text-error">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-text-muted">
            Title
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Article title..."
            className="w-full rounded border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-primary"
          />
        </div>

        <div>
          <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-text-muted">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded border border-border bg-surface px-2 py-1.5 text-xs text-text-primary outline-none focus:border-primary"
          >
            {CATEGORIES.map(({ key, label }) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-text-muted">
            Content (Markdown)
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={20}
            placeholder="Write your article in Markdown..."
            className="w-full rounded border border-border bg-surface px-3 py-2 font-mono text-xs text-text-primary outline-none focus:border-primary"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={saving}
          className="flex items-center gap-1.5 rounded bg-primary px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
        >
          <Save className="h-3.5 w-3.5" />
          {saving ? "Saving..." : "Create Article"}
        </button>
      </div>
    </div>
  );
}

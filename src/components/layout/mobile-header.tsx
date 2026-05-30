"use client";

import { useState } from "react";
import { Menu, X, Shield } from "lucide-react";
import { Sidebar } from "./sidebar";
import type { Profile } from "@/types/database";

export function MobileHeader({ profile }: { profile: Profile }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-border bg-surface px-4 py-3">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <span className="text-sm font-bold text-text-primary">Forge</span>
        </div>
        <button
          onClick={() => setOpen(!open)}
          className="rounded-md p-1.5 text-text-secondary hover:bg-surface-hover"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Overlay + sidebar */}
      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setOpen(false)} />
          <div className="fixed left-0 top-0 z-50 h-full animate-slide-in" onClick={() => setOpen(false)}>
            <Sidebar profile={profile} />
          </div>
        </>
      )}
    </div>
  );
}

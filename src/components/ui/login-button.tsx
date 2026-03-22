"use client";

import { createClient } from "@/lib/supabase/client";
import { Github } from "lucide-react";

export function LoginButton() {
  const handleLogin = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <button
      onClick={handleLogin}
      className="flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
    >
      <Github className="h-5 w-5" />
      Войти через GitHub
    </button>
  );
}

"use client";

import { useEffect } from "react";

// Pings the server every 60s to mark the user as active.
// Also pings immediately on mount and on tab focus.
export function usePresence() {
  const ping = () => {
    fetch("/api/ping", { method: "POST" }).catch(() => {});
  };

  useEffect(() => {
    ping();
    const interval = setInterval(ping, 60_000);
    const onFocus = () => ping();
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, []);
}

import { createClient } from "@/lib/supabase/server";

export async function logAudit(
  action: string,
  target?: string,
  metadata?: Record<string, unknown>
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  await supabase.from("audit_logs").insert({
    user_id: user.id,
    action,
    target: target ?? null,
    metadata: metadata ?? {},
  });
}

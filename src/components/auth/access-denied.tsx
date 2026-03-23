import { Lock } from "lucide-react";
import Link from "next/link";

export function AccessDenied({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-error/10 mb-4">
        <Lock className="h-8 w-8 text-error" />
      </div>
      <h2 className="text-lg font-bold text-text-primary">Нет доступа</h2>
      <p className="mt-2 text-sm text-text-muted max-w-xs">
        {message ?? "У вашей роли недостаточно прав для доступа к этому разделу."}
      </p>
      <Link href="/dashboard" className="mt-4 text-xs text-primary hover:underline">
        Вернуться на Dashboard
      </Link>
    </div>
  );
}

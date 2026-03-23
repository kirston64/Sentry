import Link from "next/link";
import { Shield, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg text-text-primary">
      <Shield className="mb-4 h-12 w-12 text-primary/50" />
      <h1 className="text-6xl font-bold text-primary">404</h1>
      <p className="mt-2 text-sm text-text-muted">Страница не найдена</p>
      <Link
        href="/dashboard"
        className="mt-6 flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
      >
        <ArrowLeft className="h-4 w-4" />
        На главную
      </Link>
    </div>
  );
}

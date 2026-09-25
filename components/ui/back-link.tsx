import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function BackLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="-ml-1 inline-flex min-h-11 items-center gap-1.5 rounded-md px-1 text-sm text-ink-soft transition-colors hover:text-ink"
    >
      <ArrowLeft className="h-4 w-4" strokeWidth={1.75} aria-hidden />
      {children}
    </Link>
  );
}

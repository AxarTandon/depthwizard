import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { USE_BACKEND } from "@/lib/config";

export function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden border-r border-line bg-fine-grid p-10 lg:flex">
        <Link href="/" className="focus-ring w-fit rounded-sm">
          <Logo />
        </Link>

        <div className="max-w-sm">
          <p className="font-display text-2xl leading-snug text-ink">
            From imagery to insight — the surface a single image was already
            describing.
          </p>
          <p className="mt-4 text-[13.5px] text-ink-muted">
            {USE_BACKEND
              ? "Accounts are authenticated against the live DepthWizard API."
              : "Every login here runs in demo mode: accounts are stored locally in your browser, so you can explore the full workspace without waiting on a real backend."}
          </p>
        </div>

        <div className="font-mono text-[11px] text-ink-faint">
          Smart India Hackathon 2026 · Geospatial Track
        </div>
      </div>

      <div className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Link href="/" className="focus-ring w-fit rounded-sm">
              <Logo />
            </Link>
          </div>
          <h1 className="font-display text-2xl font-semibold text-ink">{title}</h1>
          <p className="mt-1.5 text-[13.5px] text-ink-muted">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}

import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { USE_BACKEND } from "@/lib/config";

export function CTA() {
  return (
    <section className="border-b border-line bg-fine-grid py-20">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <h2 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Upload an image. See the surface it describes.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-[15px] text-ink-muted">
          {USE_BACKEND
            ? "Images are processed by the live DepthWizard reconstruction service — real height estimation, real 3D output."
            : "The workspace runs entirely in demo mode — no backend, no account approval, no waiting on a real reconstruction service."}
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/auth/signup">
            <Button size="lg">Create a free account</Button>
          </Link>
          <Link href="/auth/login">
            <Button variant="secondary" size="lg">
              Log in
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

const FOOTER_COLUMNS = [
  {
    title: "Product",
    links: [
      { label: "Workspace", href: "/workspace" },
      { label: "3D viewer", href: "#viewer" },
      { label: "Analysis", href: "#platform" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Log in", href: "/auth/login" },
      { label: "Sign up", href: "/auth/signup" },
      { label: "Reset password", href: "/auth/forgot-password" },
    ],
  },
  {
    title: "About",
    links: [
      { label: "About DepthWizard", href: "/about" },
      { label: "Settings", href: "/settings" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="py-16">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <Logo />
            <p className="mt-3 max-w-[220px] text-[12.5px] leading-relaxed text-ink-faint">
              From imagery to insight. Built for Smart India Hackathon 2026.
            </p>
          </div>
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="mb-3 text-[12.5px] font-medium text-ink">{col.title}</p>
              <ul className="flex flex-col gap-2">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="focus-ring rounded-sm text-[13px] text-ink-muted hover:text-ink"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-line pt-6 text-[12px] text-ink-faint sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 DepthWizard. Built for Smart India Hackathon.</p>
          <p className="font-mono">
            {USE_BACKEND ? "Live backend connected" : "Demo mode — no live backend connected"}
          </p>
        </div>
      </div>
    </footer>
  );
}

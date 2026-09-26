"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { login } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await login({ email, password });
    setLoading(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    router.push("/workspace");
  }

  return (
    <AuthLayout
      title="Log in to DepthWizard"
      subtitle="Enter your demo account credentials to reach the workspace."
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        {error && (
          <div className="flex items-center gap-2 border border-signal-red/40 bg-signal-red/10 px-3 py-2 text-[13px] text-signal-red">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <Field
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Field
          label="Password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <div className="flex justify-end">
          <Link
            href="/auth/forgot-password"
            className="focus-ring rounded-sm text-[12.5px] text-signal-cyan hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        <Button type="submit" size="lg" disabled={loading} className="mt-2 w-full">
          {loading ? "Logging in…" : "Log in"}
        </Button>
      </form>

      <p className="mt-6 text-center text-[13px] text-ink-muted">
        Don&apos;t have an account?{" "}
        <Link href="/auth/signup" className="focus-ring rounded-sm text-signal-cyan hover:underline">
          Sign up
        </Link>
      </p>
    </AuthLayout>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { requestPasswordReset } from "@/lib/auth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await requestPasswordReset(email);
    setLoading(false);
    setSubmitted(true);
  }

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter your account email and we'll simulate sending a reset link."
    >
      {submitted ? (
        <div className="flex flex-col items-start gap-3 border border-signal-green/30 bg-signal-green/10 px-4 py-4 text-[13.5px] text-ink">
          <CheckCircle2 className="h-5 w-5 text-signal-green" />
          <p>
            If an account exists for <span className="text-ink">{email}</span>, a reset
            link would be sent. This is a demo flow — no email is actually
            delivered.
          </p>
          <Link href="/auth/login" className="focus-ring rounded-sm text-signal-cyan hover:underline">
            Back to log in
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <Field
            label="Email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button type="submit" size="lg" disabled={loading} className="mt-2 w-full">
            {loading ? "Sending…" : "Send reset link"}
          </Button>
        </form>
      )}

      <p className="mt-6 text-center text-[13px] text-ink-muted">
        Remembered it?{" "}
        <Link href="/auth/login" className="focus-ring rounded-sm text-signal-cyan hover:underline">
          Log in
        </Link>
      </p>
    </AuthLayout>
  );
}

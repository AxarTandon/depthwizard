"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { WorkspaceShell } from "@/components/layout/WorkspaceShell";
import { Panel, PanelHeader } from "@/components/ui/Panel";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { getSession, logout, setSession } from "@/lib/auth";
import { AuthUser } from "@/types";
import { API_BASE_URL, USE_BACKEND } from "@/lib/config";

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [name, setName] = useState("");
  const [organization, setOrganization] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const session = getSession();
    setUser(session);
    if (session) {
      setName(session.name);
      setOrganization(session.organization ?? "");
    }
  }, []);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    const updated: AuthUser = { ...user, name, organization: organization || undefined };
    setSession(updated);
    setUser(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function handleLogout() {
    logout();
    router.replace("/auth/login");
  }

  return (
    <WorkspaceShell title="Settings">
      <div className="mx-auto max-w-2xl px-6 py-8">
        <h2 className="font-display text-xl font-semibold text-ink">Account settings</h2>
        <p className="mt-1 text-[13.5px] text-ink-muted">
          Demo account details are stored in your browser&apos;s local storage.
        </p>

        <Panel className="mt-6">
          <PanelHeader>
            <h3 className="text-[14px] font-medium text-ink">Profile</h3>
          </PanelHeader>

          <form onSubmit={handleSave} className="flex flex-col gap-4 p-5">
            <Field label="Full name" value={name} onChange={(e) => setName(e.target.value)} />
            <Field label="Email" value={user?.email ?? ""} disabled />
            <Field
              label="Organization"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
            />

            <div className="mt-2 flex items-center gap-3">
              <Button type="submit">Save changes</Button>
              {saved && (
                <span className="flex items-center gap-1.5 text-[13px] text-signal-green">
                  <CheckCircle2 className="h-4 w-4" /> Saved
                </span>
              )}
            </div>
          </form>
        </Panel>

        <Panel className="mt-6">
          <PanelHeader>
            <h3 className="text-[14px] font-medium text-ink">Session</h3>
          </PanelHeader>
          <div className="flex items-center justify-between p-5">
            <p className="text-[13.5px] text-ink-muted">
              Log out of DepthWizard on this device.
            </p>
            <Button variant="danger" onClick={handleLogout}>
              <LogOut className="h-4 w-4" /> Logout
            </Button>
          </div>
        </Panel>

        <Panel className="mt-6">
          <PanelHeader>
            <h3 className="text-[14px] font-medium text-ink">Backend connection</h3>
            <span className={`font-mono text-[11px] font-medium ${USE_BACKEND ? "text-signal-green" : "text-signal-amber"}`}>
              {USE_BACKEND ? "CONNECTED" : "DEMO MODE"}
            </span>
          </PanelHeader>
          <div className="p-5 text-[13.5px] leading-relaxed text-ink-muted">
            {USE_BACKEND ? (
              <p>
                Connected to FastAPI backend at{" "}
                <code className="rounded-sm bg-surface px-1.5 py-0.5 font-mono text-[12px] text-signal-cyan">
                  {API_BASE_URL || "(default host)"}
                </code>
                . Live height estimation, calibration, and analysis modules are active.
              </p>
            ) : (
              <p>
                Running in local demo mode. All processing, terrain data, and
                validation metrics shown in this workspace are generated locally
                for demonstration. Set{" "}
                <code className="rounded-sm bg-surface px-1.5 py-0.5 font-mono text-[12px] text-signal-cyan">
                  NEXT_PUBLIC_USE_BACKEND=true
                </code>{" "}
                in your environment to connect the FastAPI backend.
              </p>
            )}
          </div>
        </Panel>
      </div>
    </WorkspaceShell>
  );
}

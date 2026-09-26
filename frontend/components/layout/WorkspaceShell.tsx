import { Suspense } from "react";
import { AuthGuard } from "./AuthGuard";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { ChatbotWidget } from "@/components/workspace/ChatbotWidget";

export function WorkspaceShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      {(user) => (
        <div className="flex h-screen bg-void">
          <Sidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <Topbar user={user} title={title} />
            <main className="flex-1 overflow-y-auto">{children}</main>
          </div>
          <Suspense fallback={null}>
            <ChatbotWidget />
          </Suspense>
        </div>
      )}
    </AuthGuard>
  );
}

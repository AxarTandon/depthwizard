"use client";

import { useEffect, useState } from "react";
import { BellRing } from "lucide-react";
import { Panel, PanelHeader, Badge } from "@/components/ui/Panel";
import { getAlertHistory, toggleAlerts } from "@/lib/api";
import { AlertEvent } from "@/types";
import { formatDate } from "@/lib/utils";

const SENT_TONE: Record<AlertEvent["sent"], "green" | "amber" | "red"> = {
  sent: "green",
  pending: "amber",
  failed: "red",
};

export function AlertsPanel({ projectId }: { projectId: string }) {
  const [enabled, setEnabled] = useState(false);
  const [history, setHistory] = useState<AlertEvent[] | null>(null);

  useEffect(() => {
    getAlertHistory(projectId).then(setHistory);
  }, [projectId]);

  async function handleToggle() {
    const next = !enabled;
    setEnabled(next);
    await toggleAlerts(projectId, next);
  }

  return (
    <Panel>
      <PanelHeader>
        <div className="flex items-center gap-2">
          <BellRing className="h-4 w-4 text-signal-red" strokeWidth={1.75} />
          <h3 className="text-[14px] font-medium text-ink">Auto-alert authorities</h3>
        </div>
        <button
          onClick={handleToggle}
          className={`focus-ring flex h-6 w-11 items-center rounded-full border transition-colors ${
            enabled ? "border-signal-red/40 bg-signal-red/20" : "border-line-bright bg-surface-raised"
          }`}
          aria-pressed={enabled}
        >
          <span
            className={`h-4 w-4 rounded-full bg-ink transition-transform ${
              enabled ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </PanelHeader>

      <p className="px-4 pt-3 text-[12.5px] text-ink-muted">
        When enabled, a notification is sent to the configured authority contact whenever flood,
        building-collapse, or crater thresholds are exceeded for this project.
      </p>

      <div className="divide-y divide-line">
        {history === null && <div className="h-12 animate-pulseSoft bg-surface-raised/40" />}
        {history?.length === 0 && (
          <p className="px-4 py-4 text-[12.5px] text-ink-faint">No alerts triggered yet.</p>
        )}
        {history?.map((event) => (
          <div key={event.id} className="flex items-start justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <p className="text-[12.5px] text-ink">{event.message}</p>
              <p className="mt-0.5 text-[11px] text-ink-faint">{formatDate(event.created_at)}</p>
            </div>
            <Badge tone={SENT_TONE[event.sent]}>{event.sent}</Badge>
          </div>
        ))}
      </div>
    </Panel>
  );
}

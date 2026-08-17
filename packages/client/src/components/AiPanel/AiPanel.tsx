import React from "react";
import type { UseAiAccessResult } from "@/hooks/useAiAccess";
import AiPanelFeature from "@/components/AiPanel/AiPanelFeature";
import AiPanelKey from "@/components/AiPanel/AiPanelKey";

interface AiPanelProps {
  access: UseAiAccessResult;
  children?: React.ReactNode;
}

const AiPanel: React.FC<AiPanelProps> = ({ access, children }) => {
  if (!access.serverReachable) {
    return null;
  }

  const badge = access.ready
    ? { label: "On", className: "border-action bg-action text-action-ink" }
    : access.configured && access.locked
      ? { label: "Locked", className: "border-panel-outline bg-panel-raised text-ink-dim" }
      : { label: "Off", className: "border-panel-outline bg-panel-sunk text-ink-faint" };

  return (
    <div className="lg-panel p-4">
      <div className="flex flex-row items-center justify-between gap-3">
        <h3 className="lg-label">AI features</h3>
        <span
          className={`rounded-sm border-2 px-2 py-1 font-display text-[0.625rem] font-bold uppercase tracking-widest ${badge.className}`}
        >
          {badge.label}
        </span>
      </div>

      <div className="mt-3 flex flex-col gap-2">
        <AiPanelFeature
          name="Themed rounds"
          description="Name a theme and the model builds the round from it — a letter pool drawn from words on the subject, with speed, lives and match size tuned to its mood."
          live={access.ready}
        />
        <AiPanelFeature
          name="The rival"
          description="A dry, competitive voice watches you play and speaks only when something worth mentioning happens. Mutable from the header."
          live={access.ready}
        />
      </div>

      {access.ready ? (
        <div className="mt-3 flex flex-col gap-2">
          {children}
          {access.locked ? (
            <button
              type="button"
              className="lg-btn-panel self-start"
              onClick={access.forget}
            >
              Forget key
            </button>
          ) : null}
        </div>
      ) : null}

      {access.configured && !access.ready ? (
        <AiPanelKey
          status={access.status}
          error={access.error}
          onUnlock={access.unlock}
        />
      ) : null}

      {!access.configured ? (
        <p className="mt-3 text-xs leading-relaxed text-ink-faint">
          This build has no Anthropic key configured, so both features are off.
          Set ANTHROPIC_API_KEY on the server to turn them on.
        </p>
      ) : null}
    </div>
  );
};

export default AiPanel;

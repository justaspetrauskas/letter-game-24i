import React, { useState } from "react";
import { MAX_ACCESS_KEY_LENGTH } from "@letter-game/protocol";
import type { AccessStatus } from "@/hooks/useAiAccess";

interface AiPanelKeyProps {
  status: AccessStatus;
  error: string | null;
  onUnlock: (key: string) => void;
}

const AiPanelKey: React.FC<AiPanelKeyProps> = ({
  status,
  error,
  onUnlock,
}) => {
  const [key, setKey] = useState("");

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      onUnlock(key);
    }
  };

  return (
    <div className="mt-3 flex flex-col gap-2">
      <p className="text-xs leading-relaxed text-ink-dim">
        Both of these call the Anthropic API on my account, so they are key-only
        on the public build. Ask me for a key and paste it here — it stays in
        this browser.
      </p>

      <div className="flex flex-row gap-2">
        <input
          className="lg-field min-w-0 flex-1"
          placeholder="Access key"
          aria-label="Access key"
          value={key}
          maxLength={MAX_ACCESS_KEY_LENGTH}
          disabled={status === "checking"}
          onChange={(event) => setKey(event.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          type="button"
          className="lg-btn-action shrink-0"
          disabled={status === "checking"}
          onClick={() => onUnlock(key)}
        >
          {status === "checking" ? "Checking..." : "Unlock"}
        </button>
      </div>

      {error !== null ? (
        <p className="text-xs leading-relaxed text-danger">{error}</p>
      ) : null}
    </div>
  );
};

export default AiPanelKey;

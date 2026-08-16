export interface ModelProfile {
  supportsEffort: boolean;
  supportsAdaptiveThinking: boolean;
  supportsFallbacks: boolean;
}

const ADAPTIVE_AND_EFFORT_MODELS = [
  "claude-fable-5",
  "claude-mythos-5",
  "claude-opus-5",
  "claude-opus-4-8",
  "claude-opus-4-7",
  "claude-opus-4-6",
  "claude-sonnet-5",
  "claude-sonnet-4-6",
];

const FALLBACK_MODELS = ["claude-fable-5", "claude-mythos-5", "claude-opus-5"];

function matches(model: string, known: string[]): boolean {
  const id = model.trim().toLowerCase().replace(/^anthropic\./, "");
  return known.some((entry) => id === entry || id.startsWith(`${entry}-`));
}

export function modelProfile(model: string): ModelProfile {
  const modern = matches(model, ADAPTIVE_AND_EFFORT_MODELS);

  return {
    supportsEffort: modern,
    supportsAdaptiveThinking: modern,
    supportsFallbacks: matches(model, FALLBACK_MODELS),
  };
}

import { useEffect, useState } from "react";

const TOKEN_VARS = {
  skyTop: "--lg-sky-top",
  skyHigh: "--lg-sky-high",
  skyMid: "--lg-sky-mid",
  skyLow: "--lg-sky-low",
  skyHorizon: "--lg-sky-horizon",
  skyGlow: "--lg-sky-glow",
  cloud: "--lg-cloud",
  cloudLit: "--lg-cloud-lit",
  cloudShade: "--lg-cloud-shade",
  crate: "--lg-crate",
  crateLit: "--lg-crate-lit",
  cratePlank: "--lg-crate-plank",
  crateShade: "--lg-crate-shade",
  crateOutline: "--lg-crate-outline",
  crateFace: "--lg-crate-face",
  dyn: "--lg-dyn",
  dynLit: "--lg-dyn-lit",
  dynPlank: "--lg-dyn-plank",
  dynOutline: "--lg-dyn-outline",
  dynLight: "--lg-dyn-light",
  fuse: "--lg-fuse",
  fuseSpark: "--lg-fuse-spark",
  fuseGlow: "--lg-fuse-glow",
  fireCore: "--lg-fire-core",
  fire1: "--lg-fire-1",
  fire2: "--lg-fire-2",
  fire3: "--lg-fire-3",
  fire4: "--lg-fire-4",
  smoke: "--lg-smoke",
  danger: "--lg-danger",
  ink: "--lg-ink",
  scrim: "--lg-scrim",
} as const;

export type ThemeTokenName = keyof typeof TOKEN_VARS;

export type ThemeTokens = Record<ThemeTokenName, string>;

const FALLBACK_CHANNELS = "128 128 128";

const TOKEN_NAMES = Object.keys(TOKEN_VARS) as ThemeTokenName[];

function readChannels(styles: CSSStyleDeclaration, variable: string): string {
  const raw = styles.getPropertyValue(variable).trim();
  return raw === "" ? FALLBACK_CHANNELS : raw;
}

function readTokens(): ThemeTokens {
  const tokens = {} as ThemeTokens;

  if (typeof window === "undefined") {
    TOKEN_NAMES.forEach((name) => {
      tokens[name] = `rgb(${FALLBACK_CHANNELS})`;
    });
    return tokens;
  }

  const styles = window.getComputedStyle(document.documentElement);
  TOKEN_NAMES.forEach((name) => {
    tokens[name] = `rgb(${readChannels(styles, TOKEN_VARS[name])})`;
  });
  return tokens;
}

export function withAlpha(token: string, alpha: number): string {
  return token.replace(/^rgb\(/, "rgba(").replace(/\)$/, ` / ${alpha})`);
}

export function useThemeTokens(): ThemeTokens {
  const [tokens, setTokens] = useState<ThemeTokens>(readTokens);

  useEffect(() => {
    const fresh = readTokens();
    setTokens((current) =>
      TOKEN_NAMES.every((name) => current[name] === fresh[name])
        ? current
        : fresh
    );
  }, []);

  return tokens;
}

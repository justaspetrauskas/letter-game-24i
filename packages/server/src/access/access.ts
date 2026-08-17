import { accessKeysMatch, sanitiseAccessKey } from "@letter-game/protocol";

export interface AccessGate {
  required: boolean;
  allows: (offered: unknown) => boolean;
}

export function readAccessKeys(raw: string | undefined): string[] {
  if (typeof raw !== "string") {
    return [];
  }
  return raw
    .split(",")
    .map((key) => sanitiseAccessKey(key))
    .filter((key) => key.length > 0);
}

export function createAccessGate(keys: string[]): AccessGate {
  const issued = keys.filter((key) => sanitiseAccessKey(key).length > 0);

  return {
    required: issued.length > 0,

    allows(offered) {
      if (issued.length === 0) {
        return true;
      }
      return issued.some((key) => accessKeysMatch(offered, key));
    },
  };
}

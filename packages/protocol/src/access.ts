export const ACCESS_KEY_HEADER = "x-access-key";

export const MAX_ACCESS_KEY_LENGTH = 64;

export function sanitiseAccessKey(raw: unknown): string {
  if (typeof raw !== "string") {
    return "";
  }
  return raw.trim().slice(0, MAX_ACCESS_KEY_LENGTH);
}

export function accessKeysMatch(offered: unknown, expected: unknown): boolean {
  const left = sanitiseAccessKey(offered).toLowerCase();
  const right = sanitiseAccessKey(expected).toLowerCase();
  return left.length > 0 && left === right;
}

export function requireLocalPath(value, label = "path") {
  if (!value || typeof value !== "string") throw new Error(`${label} is required`);
  if (/^https?:\/\//i.test(value)) throw new Error(`${label} must be local; network inputs are out of scope`);
  return value;
}

export function markDryRun(action) {
  return { ...action, mode: "dry-run", safeToApply: false };
}

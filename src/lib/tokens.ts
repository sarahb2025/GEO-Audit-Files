import { randomBytes } from "crypto";

/** Generate a URL-safe random token for intake links (8 chars). */
export function generateIntakeToken(): string {
  return randomBytes(6).toString("base64url");
}

/** Generate a URL-friendly slug from client name + random suffix. */
export function generateReportSlug(clientName: string): string {
  const base = clientName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  const suffix = randomBytes(3).toString("hex");
  return `${base}-${suffix}`;
}

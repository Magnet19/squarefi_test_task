/**
 * Parses the `exp` claim from a JWT payload without signature verification.
 * Returns the remaining TTL in seconds (suitable for cookie maxAge),
 * or null if the token is malformed / already expired.
 */
export function getJwtMaxAge(token: string): number | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;

    const payload = parts[1];
    const decoded = JSON.parse(
      Buffer.from(
        payload.replace(/-/g, "+").replace(/_/g, "/"),
        "base64",
      ).toString("utf-8"),
    ) as Record<string, unknown>;

    if (typeof decoded.exp !== "number") return null;

    const ttl = decoded.exp - Math.floor(Date.now() / 1000);
    return ttl > 0 ? ttl : null;
  } catch {
    return null;
  }
}

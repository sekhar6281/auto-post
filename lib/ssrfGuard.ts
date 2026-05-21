/**
 * SSRF Guard — blocks server-side fetches to private / internal networks.
 *
 * Called before any user-supplied URL is fetched by the server so an
 * authenticated user cannot probe internal cloud metadata endpoints
 * (AWS IMDS 169.254.169.254, GCP metadata, internal services, etc.).
 */

/**
 * Returns true when the URL is safe for the server to fetch.
 * Rejects anything that is not HTTPS or resolves to a private address.
 */
export function isSafeUrl(rawUrl: string): { safe: boolean; reason?: string } {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return { safe: false, reason: "Invalid URL format" };
  }

  // ── Protocol ───────────────────────────────────────────────
  // Only allow HTTPS — no http://, file://, javascript:, data:, ftp:, etc.
  if (url.protocol !== "https:") {
    return { safe: false, reason: "Only HTTPS URLs are allowed" };
  }

  const host = url.hostname.toLowerCase();

  // ── Loopback / localhost ────────────────────────────────────
  if (
    host === "localhost"         ||
    host === "127.0.0.1"        ||
    host === "::1"               ||
    host.endsWith(".localhost")
  ) {
    return { safe: false, reason: "Loopback addresses are not allowed" };
  }

  // ── AWS / GCP / Azure cloud metadata endpoints ─────────────
  if (
    host === "169.254.169.254"          || // AWS IMDS v1/v2
    host === "fd00:ec2::254"            || // AWS IMDS IPv6
    host === "metadata.google.internal" || // GCP metadata
    host === "169.254.170.2"               // ECS metadata
  ) {
    return { safe: false, reason: "Cloud metadata endpoints are not allowed" };
  }

  // ── Private / internal domain suffixes ─────────────────────
  if (
    host.endsWith(".internal") ||
    host.endsWith(".local")    ||
    host.endsWith(".corp")     ||
    host.endsWith(".intranet")
  ) {
    return { safe: false, reason: "Internal hostnames are not allowed" };
  }

  // ── Private IPv4 ranges ─────────────────────────────────────
  const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4) {
    const [a, b] = [Number(ipv4[1]), Number(ipv4[2])];

    if (a === 0)                             return { safe: false, reason: "Reserved IP range" };       // 0.0.0.0/8
    if (a === 10)                            return { safe: false, reason: "Private IP range (10.x)" };  // 10.0.0.0/8
    if (a === 127)                           return { safe: false, reason: "Loopback IP range" };         // 127.0.0.0/8
    if (a === 169 && b === 254)              return { safe: false, reason: "Link-local / IMDS IP" };      // 169.254.0.0/16
    if (a === 172 && b >= 16 && b <= 31)    return { safe: false, reason: "Private IP range (172.x)" };  // 172.16-31.0.0/12
    if (a === 192 && b === 168)              return { safe: false, reason: "Private IP range (192.168)" }; // 192.168.0.0/16
    if (a === 100 && b >= 64 && b <= 127)   return { safe: false, reason: "CGNAT address space" };       // 100.64-127.0.0/10
    if (a === 198 && (b === 18 || b === 19)) return { safe: false, reason: "Benchmark IP range" };       // 198.18-19.x
    if (a >= 224)                            return { safe: false, reason: "Multicast / reserved IP" };  // 224.0.0.0+
  }

  return { safe: true };
}

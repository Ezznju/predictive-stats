export function ldJson(obj: unknown): string {
  // Escape '<' so a crafted string can never terminate the script tag early
  // (defense-in-depth: JSON-LD payloads include admin-authored text).
  return JSON.stringify(obj).replace(/</g, '\\u003c');
}

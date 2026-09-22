export type R2Config = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  publicUrl?: string;
};

export function getR2Config(): R2Config {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET;

  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
    throw new Error("R2 is not configured. Add R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_BUCKET.");
  }

  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucket,
    publicUrl: process.env.R2_PUBLIC_URL?.replace(/\/+$/, ""),
  };
}

export function publicMediaUrl(key: string, config: R2Config) {
  if (config.publicUrl) return `${config.publicUrl}/${key}`;
  return `/api/media/${key}`;
}

export function r2ObjectUrl(key: string, config: R2Config) {
  return `https://${config.accountId}.r2.cloudflarestorage.com/${config.bucket}/${key
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;
}

/* ── Web Crypto helpers (Edge-compatible: no node:crypto) ────────────── */
const enc = new TextEncoder();

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function sha256Hex(value: Uint8Array | string): Promise<string> {
  const data = (typeof value === "string" ? enc.encode(value) : value) as unknown as BufferSource;
  return toHex(await crypto.subtle.digest("SHA-256", data));
}

async function hmac(key: Uint8Array | ArrayBuffer, value: string): Promise<ArrayBuffer> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key as unknown as BufferSource,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  return crypto.subtle.sign("HMAC", cryptoKey, enc.encode(value) as unknown as BufferSource);
}

async function signingKey(secretAccessKey: string, date: string): Promise<ArrayBuffer> {
  const kDate = await hmac(enc.encode(`AWS4${secretAccessKey}`), date);
  const kRegion = await hmac(kDate, "auto");
  const kService = await hmac(kRegion, "s3");
  return hmac(kService, "aws4_request");
}

export async function signedR2Headers(
  method: "GET" | "PUT",
  url: string,
  body: Uint8Array | string,
  config: R2Config,
  extraHeaders: Record<string, string> = {},
) {
  const parsed = new URL(url);
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const payloadHash = await sha256Hex(body);
  const rawHeaders: Record<string, string> = {
    host: parsed.host,
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": amzDate,
    ...extraHeaders,
  };
  const headers = Object.fromEntries(Object.entries(rawHeaders).map(([key, value]) => [key.toLowerCase(), value]));

  const sortedHeaderNames = Object.keys(headers).sort();
  const canonicalHeaders = sortedHeaderNames.map((name) => `${name}:${headers[name]}\n`).join("");
  const signedHeaders = sortedHeaderNames.join(";");
  const canonicalRequest = [
    method,
    parsed.pathname,
    parsed.searchParams.toString(),
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");
  const credentialScope = `${dateStamp}/auto/s3/aws4_request`;
  const stringToSign = ["AWS4-HMAC-SHA256", amzDate, credentialScope, await sha256Hex(canonicalRequest)].join("\n");
  const signature = toHex(await hmac(await signingKey(config.secretAccessKey, dateStamp), stringToSign));

  return {
    ...headers,
    authorization: `AWS4-HMAC-SHA256 Credential=${config.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
  };
}

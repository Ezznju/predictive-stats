const INDEXNOW_KEY = 'ed162f3f7a834b8da2a10c5d716176b8';
const HOST = 'predictionsmarketfans.com';
const ENDPOINT = 'https://api.indexnow.org/indexnow';

export async function submitIndexNow(urls: string[]): Promise<{ ok: boolean; status?: number }> {
  if (!urls.length) return { ok: false };

  const payload = {
    host: HOST,
    key: INDEXNOW_KEY,
    keyLocation: `https://${HOST}/${INDEXNOW_KEY}.txt`,
    urlList: urls,
  };

  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(payload),
    });
    return { ok: res.ok, status: res.status };
  } catch {
    return { ok: false };
  }
}

// Lightweight fetch helper with timeout and retries for Supabase Edge Functions
export async function fetchWithRetry(input: RequestInfo | URL, init?: RequestInit, attempts = 3, timeout = 10000) {
  const baseDelay = 1000;
  let lastErr: any = null;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    try {
      const mergedInit = { ...(init || {}), signal: controller.signal } as RequestInit;
      const resp = await fetch(input, mergedInit);
      clearTimeout(timeoutId);

      if (!resp.ok && (resp.status === 429 || resp.status >= 500)) {
        lastErr = new Error(`HTTP ${resp.status}`);
        const delay = baseDelay * Math.pow(2, attempt - 1);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }

      return resp;
    } catch (err) {
      clearTimeout(timeoutId);
      lastErr = err;
      const delay = baseDelay * Math.pow(2, attempt - 1);
      // Brief backoff before retrying
      await new Promise((r) => setTimeout(r, delay));
      continue;
    }
  }

  throw lastErr;
}

export async function fetchJsonWithRetry(input: RequestInfo | URL, init?: RequestInit, attempts = 3, timeout = 10000) {
  const resp = await fetchWithRetry(input, init, attempts, timeout);
  return resp.json();
}

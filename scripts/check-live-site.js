const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_RETRIES = 20;
const DEFAULT_DELAY_MS = 15_000;

function getTargetUrl() {
  if (process.env.LIVE_URL) {
    return process.env.LIVE_URL.endsWith("/") ? process.env.LIVE_URL : `${process.env.LIVE_URL}/`;
  }

  const owner = process.env.GITHUB_REPOSITORY_OWNER || process.env.REPO_OWNER;
  const repo = process.env.GITHUB_REPOSITORY ? process.env.GITHUB_REPOSITORY.split("/")[1] : process.env.REPO_NAME;

  if (!owner || !repo) {
    throw new Error("LIVE_URL is not set and repository owner/name could not be inferred.");
  }

  return `https://${owner}.github.io/${repo}/`;
}

async function wait(delayMs) {
  return new Promise((resolve) => {
    setTimeout(resolve, delayMs);
  });
}

async function fetchWithTimeout(url, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function assertPageContent(url, html) {
  const requiredMarkers = ["id=\"modelsGrid\"", "id=\"statusMessage\"", "Discover Free Models"];
  for (const marker of requiredMarkers) {
    if (!html.includes(marker)) {
      throw new Error(`Live page ${url} is missing required marker: ${marker}`);
    }
  }
}

async function checkLiveSite() {
  const targetUrl = getTargetUrl();
  const timeoutMs = Number(process.env.LIVE_TIMEOUT_MS || DEFAULT_TIMEOUT_MS);
  const retries = Number(process.env.LIVE_RETRIES || DEFAULT_RETRIES);
  const delayMs = Number(process.env.LIVE_DELAY_MS || DEFAULT_DELAY_MS);

  let lastError;

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      const response = await fetchWithTimeout(targetUrl, timeoutMs);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const html = await response.text();
      assertPageContent(targetUrl, html);

      console.log(`Live smoke check passed on attempt ${attempt}: ${targetUrl}`);
      return;
    } catch (error) {
      lastError = error;
      console.log(`Attempt ${attempt}/${retries} failed for ${targetUrl}: ${error.message}`);
      if (attempt < retries) {
        await wait(delayMs);
      }
    }
  }

  throw new Error(`Live smoke check failed for ${targetUrl}: ${lastError ? lastError.message : "unknown error"}`);
}

checkLiveSite().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});

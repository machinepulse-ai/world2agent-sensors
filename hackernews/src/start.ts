import { ensureStore } from "@world2agent/sdk/sensor";
import type {
  SensorContext,
  CleanupFn,
  SensorSpec,
  SensorStore,
} from "@world2agent/sdk";
import type { HackernewsConfig, HNStory } from "./types.js";
import { transformStory } from "./transform.js";

const HN_API = "https://hacker-news.firebaseio.com/v0";
const TTL_MS = 24 * 60 * 60 * 1000;
const SEEN_KEY = "seen_ids";

/**
 * Single poll cycle — fetch HN top stories, emit new ones.
 *
 * Exported so external runners (a Durable Object alarm, a cron worker,
 * tests) can drive polling explicitly. The caller supplies the store so
 * dedup can survive restarts when a persistent backend is passed.
 */
export async function poll(
  spec: SensorSpec<HackernewsConfig>,
  ctx: SensorContext<HackernewsConfig>,
  store: SensorStore,
): Promise<void> {
  const { top_n, min_score, min_comments } = ctx.config;

  try {
    const res = await fetch(`${HN_API}/topstories.json`, {
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      ctx.reportHealth("degraded", `HN API returned ${res.status}`);
      return;
    }

    const allIds: number[] = (await res.json()) as number[];
    const topIds = allIds.slice(0, top_n);

    const seen = await loadSeen(store);
    const now = Date.now();
    for (const [id, ts] of seen) {
      if (now - ts > TTL_MS) seen.delete(id);
    }

    const newIds = topIds.filter((id) => !seen.has(id));
    if (newIds.length === 0) {
      ctx.logger.debug(`No new stories in top ${top_n}`);
      return;
    }

    const chunks = chunkArray(newIds, 10);
    for (const chunk of chunks) {
      const stories = await Promise.all(chunk.map((id) => fetchStory(id)));

      for (const story of stories) {
        if (!story) continue;

        // Quantitative filters only — semantic filtering (topic, kind, etc.)
        // is the handler skill's responsibility.
        if (story.score < min_score) continue;
        if (story.descendants < min_comments) continue;

        const rank = topIds.indexOf(story.id) + 1;
        seen.set(story.id, now);

        await ctx.emit(transformStory(spec, story, rank));
        ctx.logger.info(`New: #${rank} "${story.title}" (${story.score}pts)`);
      }
    }

    await saveSeen(store, seen);
    ctx.reportHealth("ok");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    ctx.logger.error(`Poll failed: ${msg}`);
    ctx.reportHealth("degraded", msg);
  }
}

/**
 * Start the sensor in daemon mode (setInterval). Use `poll()` directly
 * if you have your own scheduler (cron, Durable Object alarm, etc.).
 */
export async function start(
  spec: SensorSpec<HackernewsConfig>,
  ctx: SensorContext<HackernewsConfig>,
): Promise<CleanupFn> {
  const { interval_seconds: intervalSec, top_n, min_score } = ctx.config;
  const store = ensureStore(ctx);

  void poll(spec, ctx, store);
  const timer = setInterval(() => void poll(spec, ctx, store), intervalSec * 1000);

  ctx.logger.info(
    `Watching HN top ${top_n} stories every ${intervalSec}s (min score: ${min_score})`,
  );
  ctx.reportHealth("ok");

  return async () => {
    clearInterval(timer);
    ctx.logger.info("HackerNews sensor stopped");
  };
}

// ─── helpers ───

async function loadSeen(store: SensorStore): Promise<Map<number, number>> {
  const raw = await store.get(SEEN_KEY);
  if (!raw) return new Map();
  try {
    return new Map(JSON.parse(raw) as [number, number][]);
  } catch {
    return new Map();
  }
}

async function saveSeen(
  store: SensorStore,
  seen: Map<number, number>,
): Promise<void> {
  await store.set(SEEN_KEY, JSON.stringify([...seen]));
}

async function fetchStory(id: number): Promise<HNStory | null> {
  try {
    const res = await fetch(`${HN_API}/item/${id}.json`, {
      signal: AbortSignal.timeout(5_000),
    });
    if (!res.ok) return null;
    const item = (await res.json()) as Record<string, unknown>;
    if (!item || item["type"] !== "story" || item["dead"] || item["deleted"]) return null;
    return {
      id: item["id"] as number,
      title: item["title"] as string,
      url: item["url"] as string | undefined,
      text: item["text"] as string | undefined,
      by: item["by"] as string,
      score: (item["score"] as number) ?? 0,
      descendants: (item["descendants"] as number) ?? 0,
      time: (item["time"] as number) ?? 0,
    };
  } catch {
    return null;
  }
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

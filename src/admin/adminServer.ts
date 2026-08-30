import http from "http";
import { KeyValueStore } from "../store/store";
import { Stats } from "../stats/stats";

/**
 * Minimal read-only HTTP admin API for a monitoring UI to poll. Kept
 * separate from the RESP TCP port (6379) since JSON-over-HTTP is what a
 * browser-based dashboard speaks natively — no RESP client needed on the
 * frontend.
 *
 * CORS is wide open (`Access-Control-Allow-Origin: *`) since this is meant
 * to be polled directly from a local dev dashboard on a different port. If
 * this were ever exposed beyond localhost, it should be put behind auth and
 * a locked-down origin allowlist first — it has no access control today.
 */
export function createAdminServer(store: KeyValueStore, stats: Stats): http.Server {
  return http.createServer((req, res) => {
    if (req.method === "GET" && req.url === "/stats") {
      const body = JSON.stringify(buildStatsPayload(store, stats), null, 2);
      res.writeHead(200, {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      });
      res.end(body);
      return;
    }

    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "not found" }));
  });
}

function buildStatsPayload(store: KeyValueStore, stats: Stats) {
  const { keyCount, estimatedBytes } = store.stats();
  const s = stats.snapshot();
  const totalGets = s.getHits + s.getMisses;
  const mem = process.memoryUsage();

  return {
    timestamp: new Date().toISOString(),
    connections: {
      active: s.connectionsActive,
    },
    keys: {
      total: keyCount,
    },
    memory: {
      estimatedDatasetBytes: estimatedBytes,
      processRssBytes: mem.rss,
      processHeapUsedBytes: mem.heapUsed,
    },
    commands: {
      totalProcessed: s.commandsProcessed,
    },
    get: {
      hits: s.getHits,
      misses: s.getMisses,
      hitRatio: totalGets === 0 ? null : Number((s.getHits / totalGets).toFixed(4)),
    },
  };
}

export interface StatsSnapshot {
  connectionsActive: number;
  commandsProcessed: number;
  getHits: number;
  getMisses: number;
}

/**
 * Central counters for the admin/metrics API. Plain synchronous increments
 * are safe for the same single-threaded-event-loop reason the store's
 * locking-free design is safe (see store.ts) — no two updates ever interleave.
 */
export class Stats {
  private connectionsActive = 0;
  private commandsProcessed = 0;
  private getHits = 0;
  private getMisses = 0;

  connectionOpened(): void {
    this.connectionsActive++;
  }

  connectionClosed(): void {
    this.connectionsActive = Math.max(0, this.connectionsActive - 1);
  }

  commandProcessed(): void {
    this.commandsProcessed++;
  }

  recordGetHit(): void {
    this.getHits++;
  }

  recordGetMiss(): void {
    this.getMisses++;
  }

  snapshot(): StatsSnapshot {
    return {
      connectionsActive: this.connectionsActive,
      commandsProcessed: this.commandsProcessed,
      getHits: this.getHits,
      getMisses: this.getMisses,
    };
  }
}

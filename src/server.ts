import net, { Socket } from "net";
import { RespParser } from "./resp/parser";
import { RespProtocolError } from "./resp/errors";
import { error as encodeError } from "./resp/encoder";
import { CommandRouter } from "./commands/router";
import { KeyValueStore } from "./store/store";
import { Stats } from "./stats/stats";

/**
 * Builds the TCP server. Each connection gets its own RespParser (per-socket
 * buffering state) but shares the single KeyValueStore/CommandRouter — safe
 * because command execution is synchronous, so the event loop never
 * interleaves two commands mid-mutation (see store.ts).
 */
export function createServer(store: KeyValueStore, stats: Stats): net.Server {
  const router = new CommandRouter(store, stats);

  return net.createServer({ noDelay: true }, (socket: Socket) => {
    stats.connectionOpened();
    const parser = new RespParser();

    socket.on("close", () => {
      stats.connectionClosed();
    });

    socket.on("data", (chunk: Buffer) => {
      try {
        parser.push(chunk);
        let args = parser.next();
        while (args !== null) {
          if (args.length > 0) {
            socket.write(router.execute(args));
          }
          args = parser.next();
        }
      } catch (err) {
        if (err instanceof RespProtocolError) {
          socket.write(encodeError(`ERR Protocol error: ${err.message}`));
          socket.destroy();
        } else {
          console.error("Unexpected error handling client data:", err);
          socket.destroy();
        }
      }
    });

    socket.on("error", (err) => {
      // ECONNRESET and similar are routine when clients disconnect abruptly.
      if ((err as NodeJS.ErrnoException).code !== "ECONNRESET") {
        console.error("Socket error:", err);
      }
    });
  });
}

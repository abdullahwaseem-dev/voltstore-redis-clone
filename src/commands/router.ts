import { KeyValueStore } from "../store/store";
import { Stats } from "../stats/stats";
import { error } from "../resp/encoder";
import { CommandError } from "../resp/errors";
import { handlers } from "./handlers";

/** Looks up a parsed command's name in the dispatch table and runs it. */
export class CommandRouter {
  constructor(private readonly store: KeyValueStore, private readonly stats: Stats) {}

  execute(args: string[]): Buffer {
    const [name, ...rest] = args;
    if (name === undefined) {
      return error("ERR empty command");
    }

    const handler = handlers[name.toUpperCase()];
    if (handler === undefined) {
      return error(`ERR unknown command '${name}'`);
    }

    // Counted after command-name resolution: unrecognized commands never
    // reach a handler, so they aren't counted as "processed".
    this.stats.commandProcessed();

    try {
      return handler(rest, this.store, this.stats);
    } catch (err) {
      if (err instanceof CommandError) return error(err.message);
      throw err;
    }
  }
}

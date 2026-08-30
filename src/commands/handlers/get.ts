import { bulkString } from "../../resp/encoder";
import { CommandError } from "../../resp/errors";
import { CommandHandler } from "../types";

export const get: CommandHandler = (args, store, stats) => {
  if (args.length !== 1) {
    throw new CommandError("ERR wrong number of arguments for 'get' command");
  }
  const value = store.get(args[0]!);
  if (value === null) {
    stats.recordGetMiss();
  } else {
    stats.recordGetHit();
  }
  return bulkString(value);
};

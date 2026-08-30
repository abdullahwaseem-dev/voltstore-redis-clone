import { simpleString } from "../../resp/encoder";
import { CommandError } from "../../resp/errors";
import { CommandHandler } from "../types";

export const set: CommandHandler = (args, store) => {
  if (args.length < 2) {
    throw new CommandError("ERR wrong number of arguments for 'set' command");
  }

  const key = args[0]!;
  const value = args[1]!;
  const rest = args.slice(2);

  let ttlSeconds: number | undefined;

  if (rest.length > 0) {
    if (rest.length !== 2 || rest[0]!.toUpperCase() !== "EX") {
      throw new CommandError("ERR syntax error");
    }
    const rawSeconds = rest[1]!;
    if (!/^\d+$/.test(rawSeconds) || Number(rawSeconds) <= 0) {
      throw new CommandError("ERR value is not an integer or out of range");
    }
    ttlSeconds = Number(rawSeconds);
  }

  store.set(key, value, ttlSeconds);
  return simpleString("OK");
};

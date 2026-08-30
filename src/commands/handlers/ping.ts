import { bulkString, simpleString } from "../../resp/encoder";
import { CommandError } from "../../resp/errors";
import { CommandHandler } from "../types";

export const ping: CommandHandler = (args) => {
  if (args.length > 1) {
    throw new CommandError("ERR wrong number of arguments for 'ping' command");
  }
  return args.length === 1 ? bulkString(args[0]!) : simpleString("PONG");
};

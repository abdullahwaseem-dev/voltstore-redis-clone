import { integer } from "../../resp/encoder";
import { CommandError } from "../../resp/errors";
import { CommandHandler } from "../types";

export const del: CommandHandler = (args, store) => {
  if (args.length < 1) {
    throw new CommandError("ERR wrong number of arguments for 'del' command");
  }
  return integer(store.del(args));
};

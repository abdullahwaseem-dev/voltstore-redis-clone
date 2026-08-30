import { CommandHandler } from "../types";
import { ping } from "./ping";
import { set } from "./set";
import { get } from "./get";
import { del } from "./del";

/** Dispatch table from uppercase command name to its handler. */
export const handlers: Record<string, CommandHandler> = {
  PING: ping,
  SET: set,
  GET: get,
  DEL: del,
};

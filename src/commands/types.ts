import { KeyValueStore } from "../store/store";
import { Stats } from "../stats/stats";

/**
 * A command handler receives its arguments with the command name already
 * stripped off, plus the shared store and stats collector, and returns a
 * fully-encoded RESP reply. Argument/value errors are signaled by throwing
 * CommandError; the router turns that into a RESP error reply without
 * touching the connection. Handlers that don't need `stats` (most of them)
 * can simply omit the parameter — JS/TS allows calling a function with more
 * arguments than it declares.
 */
export type CommandHandler = (args: string[], store: KeyValueStore, stats: Stats) => Buffer;

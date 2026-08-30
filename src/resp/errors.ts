/**
 * Thrown when the byte stream violates the RESP wire format (bad type byte,
 * negative/oversized length, missing CRLF terminator, non-array request, etc).
 * The server treats this as fatal for the connection, matching real Redis
 * behavior of closing the socket on a protocol-level violation.
 */
export class RespProtocolError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RespProtocolError";
  }
}

/**
 * Thrown for application-level errors (wrong arity, unknown command, bad
 * argument value). These are recoverable: the connection stays open and the
 * client just receives a RESP error reply.
 */
export class CommandError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CommandError";
  }
}

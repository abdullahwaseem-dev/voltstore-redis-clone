import { RespProtocolError } from "./errors";

const CRLF = "\r\n";
const ARRAY_PREFIX = 0x2a; // '*'
const BULK_PREFIX = 0x24; // '$'

// Sanity bounds to reject obviously malicious/garbage lengths before we try
// to buffer that much data. Real Redis enforces similar ceilings.
const MAX_ARRAY_LEN = 1024 * 1024; // 1M elements
const MAX_BULK_LEN = 512 * 1024 * 1024; // 512MB, Redis's own string size cap

interface Line {
  text: string;
  /** Absolute offset of the first byte after the line's trailing CRLF. */
  nextOffset: number;
}

/**
 * Incremental parser for RESP "multi-bulk" requests — the
 * `*<count>\r\n$<len>\r\n<bytes>\r\n...` array-of-bulk-strings format every
 * real Redis client (including redis-cli) uses to send commands.
 *
 * Network data arrives in arbitrary chunks that may split a command
 * mid-field, so the parser buffers bytes across calls to `push()` and only
 * consumes a command from the buffer once it has been received in full.
 */
export class RespParser {
  private buffer: Buffer = Buffer.alloc(0);

  push(chunk: Buffer): void {
    this.buffer = this.buffer.length === 0 ? chunk : Buffer.concat([this.buffer, chunk]);
  }

  /**
   * Attempts to parse one complete command from the buffered bytes.
   * Returns the command's arguments, `null` if more data is needed before a
   * full command is available, or throws RespProtocolError if the bytes
   * already received violate the wire format.
   */
  next(): string[] | null {
    const parsed = this.parseCommand();
    if (parsed === null) return null;
    const [args, bytesConsumed] = parsed;
    this.buffer = this.buffer.subarray(bytesConsumed);
    return args;
  }

  private parseCommand(): [string[], number] | null {
    if (this.buffer.length === 0) return null;

    if (this.buffer[0] !== ARRAY_PREFIX) {
      throw new RespProtocolError(
        `expected '*' to start a command, got '${String.fromCharCode(this.buffer[0]!)}'`
      );
    }

    const header = this.readLine(1);
    if (header === null) return null;

    const count = this.parseInteger(header.text, "multibulk length");
    if (count < 0 || count > MAX_ARRAY_LEN) {
      throw new RespProtocolError(`invalid multibulk length '${header.text}'`);
    }

    const args: string[] = [];
    let offset = header.nextOffset;

    for (let i = 0; i < count; i++) {
      const field = this.parseBulkString(offset);
      if (field === null) return null;
      args.push(field.value);
      offset = field.nextOffset;
    }

    return [args, offset];
  }

  private parseBulkString(start: number): { value: string; nextOffset: number } | null {
    if (start >= this.buffer.length) return null;

    if (this.buffer[start] !== BULK_PREFIX) {
      throw new RespProtocolError(
        `expected '$' to start a bulk string, got '${String.fromCharCode(this.buffer[start]!)}'`
      );
    }

    const header = this.readLine(start + 1);
    if (header === null) return null;

    const len = this.parseInteger(header.text, "bulk length");
    if (len < 0 || len > MAX_BULK_LEN) {
      throw new RespProtocolError(`invalid bulk length '${header.text}'`);
    }

    const dataStart = header.nextOffset;
    const dataEnd = dataStart + len;
    const afterData = dataEnd + 2; // trailing CRLF

    if (this.buffer.length < afterData) return null; // wait for more bytes

    if (this.buffer[dataEnd] !== 0x0d || this.buffer[dataEnd + 1] !== 0x0a) {
      throw new RespProtocolError("bulk string missing trailing CRLF terminator");
    }

    const value = this.buffer.toString("utf8", dataStart, dataEnd);
    return { value, nextOffset: afterData };
  }

  /** Finds a CRLF-terminated line starting at `start`, or null if incomplete. */
  private readLine(start: number): Line | null {
    const end = this.buffer.indexOf(CRLF, start, "ascii");
    if (end === -1) return null;
    return { text: this.buffer.toString("ascii", start, end), nextOffset: end + 2 };
  }

  private parseInteger(text: string, fieldName: string): number {
    if (!/^-?\d+$/.test(text)) {
      throw new RespProtocolError(`invalid ${fieldName} '${text}'`);
    }
    return Number(text);
  }
}

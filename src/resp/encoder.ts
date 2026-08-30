/** Helpers that serialize values into RESP reply frames. */

export function simpleString(value: string): Buffer {
  return Buffer.from(`+${value}\r\n`, "utf8");
}

export function error(message: string): Buffer {
  return Buffer.from(`-${message}\r\n`, "utf8");
}

export function integer(value: number): Buffer {
  return Buffer.from(`:${value}\r\n`, "utf8");
}

export function bulkString(value: string | null): Buffer {
  if (value === null) return nullBulkString();
  const data = Buffer.from(value, "utf8");
  return Buffer.concat([Buffer.from(`$${data.length}\r\n`, "utf8"), data, Buffer.from("\r\n")]);
}

export function nullBulkString(): Buffer {
  return Buffer.from("$-1\r\n", "utf8");
}

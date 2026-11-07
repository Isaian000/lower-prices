import { z } from "zod";

/** Offset de cada tienda que todavía tiene resultados, p. ej. { elektra: 10, chedraui: 10 }. */
export type StoreOffsets = Record<string, number>;

const offsetsSchema = z.record(
  z.string().regex(/^[a-z0-9-]{1,40}$/),
  z.number().int().min(0).max(10_000),
);

export class InvalidCursorError extends Error {
  constructor() {
    super("Cursor inválido");
    this.name = "InvalidCursorError";
  }
}

export function encodeCursor(offsets: StoreOffsets): string | null {
  if (Object.keys(offsets).length === 0) return null;
  return Buffer.from(JSON.stringify(offsets)).toString("base64url");
}

export function decodeCursor(cursor: string): StoreOffsets {
  try {
    const json: unknown = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8"));
    const parsed = offsetsSchema.safeParse(json);
    if (!parsed.success || Object.keys(parsed.data).length === 0) throw new InvalidCursorError();
    return parsed.data;
  } catch {
    throw new InvalidCursorError();
  }
}

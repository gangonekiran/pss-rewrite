import type { Request } from "mssql";
import { sql } from "../config/database.js";

/**
 * Column helpers shared by the input-form repositories (Exit, Insurance).
 * Each module passes its own column list.
 */
export type ColumnKind = "int" | "yesNo" | "bit" | "date" | "text";

export interface ColumnSpec {
  kind: ColumnKind;
  max?: number;
}

/** Keeps only the listed columns; ID and ChildID never come from the body. */
export function pickColumns(
  payload: Record<string, unknown>,
  columns: Record<string, ColumnSpec>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload ?? {})) {
    if (Object.hasOwn(columns, key) && value !== undefined) result[key] = value;
  }
  return result;
}

export function bindColumn(req: Request, key: string, value: unknown, spec: ColumnSpec) {
  switch (spec.kind) {
    case "date":
      // The legacy "SQL Server" ODBC driver rejects Date/DateTime parameters
      // (HY004). YYYY-MM-DD strings convert to the datetime2 columns safely
      // regardless of the server's DATEFORMAT.
      return req.input(key, sql.NVarChar(10), value);
    case "int":
    case "yesNo":
      return req.input(key, sql.Int, value);
    case "bit":
      return req.input(key, sql.Bit, value);
    default:
      return req.input(key, spec.max ? sql.NVarChar(spec.max) : sql.NVarChar(sql.MAX), value);
  }
}

/** [Name] with any ] escaped, for building column lists. */
export function quoteColumn(name: string) {
  return `[${name.replace(/]/g, "]]")}]`;
}

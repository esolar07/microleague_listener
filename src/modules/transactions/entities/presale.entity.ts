// Re-export Prisma types for backward compatibility
export { PresaleTxType } from "@prisma/client";
export type { PresaleTx } from "@prisma/client";

// Keep the document type for any remaining references
import type { PresaleTx } from "@prisma/client";
export type PresaleTxsDocument = PresaleTx;

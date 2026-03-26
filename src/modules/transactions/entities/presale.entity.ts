// Re-export Prisma types for backward compatibility
export { PresaleTxType } from "@prisma/client";
export type { PresaleTxs } from "@prisma/client";

// Import the type for the document type
import type { PresaleTxs } from "@prisma/client";

// Keep the document type for any remaining references
export type PresaleTxsDocument = PresaleTxs;

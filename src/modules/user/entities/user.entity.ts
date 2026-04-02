// Re-export Prisma types for backward compatibility
export type { PresaleUser } from "@prisma/client";

// Keep the document type for any remaining references
import type { PresaleUser } from "@prisma/client";
export type UserDocument = PresaleUser;
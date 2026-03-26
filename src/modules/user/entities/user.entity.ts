// Re-export Prisma types for backward compatibility
export { BuyerStatus } from "@prisma/client";
export type { User } from "@prisma/client";

// Import the type for the document type
import type { User } from "@prisma/client";

// Keep the document type for any remaining references
export type UserDocument = User;
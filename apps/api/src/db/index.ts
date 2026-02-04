/**
 * Database client barrel export
 *
 * Re-exports the generated Prisma client with runtime types available
 * as top-level named exports for convenience.
 */

// Re-export everything from the generated Prisma client
export * from '../../generated/prisma';

// Re-export runtime types that were previously at @prisma/client/runtime/library
export {
  Prisma,
} from '../../generated/prisma';

// Make runtime types available as top-level exports
import { Prisma } from '../../generated/prisma';

export const PrismaClientKnownRequestError = Prisma.PrismaClientKnownRequestError;
export const PrismaClientUnknownRequestError = Prisma.PrismaClientUnknownRequestError;
export const PrismaClientRustPanicError = Prisma.PrismaClientRustPanicError;
export const PrismaClientInitializationError = Prisma.PrismaClientInitializationError;
export const PrismaClientValidationError = Prisma.PrismaClientValidationError;
export const Decimal = Prisma.Decimal;

export type InputJsonValue = Prisma.InputJsonValue;

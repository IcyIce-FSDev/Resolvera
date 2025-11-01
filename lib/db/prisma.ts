// Prisma Client singleton instance
// Prevents multiple instances in development due to hot reloading

import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Export Prisma models for easy access
export * from '@prisma/client'

// Helper function to disconnect (useful for testing and cleanup)
export async function disconnectPrisma() {
  await prisma.$disconnect()
}

// Helper function to connect (mainly for testing)
export async function connectPrisma() {
  await prisma.$connect()
}

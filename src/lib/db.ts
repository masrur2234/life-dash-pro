import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL || ''

  if (!connectionString) {
    console.error('DATABASE_URL is not set. Please configure it in Vercel Environment Variables.')
  }

  return new PrismaClient({
    log: ['error'],
    datasources: {
      db: {
        url: connectionString,
      },
    },
  })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

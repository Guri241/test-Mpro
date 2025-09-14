// app/lib/prisma.ts
import { PrismaClient } from '@prisma/client'

// グローバルにキャッシュして開発中の複数インスタンス生成を防止
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient
}

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// default と named 両方で使えるように export
export default prisma

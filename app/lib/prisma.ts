// app/lib/prisma.ts
import { PrismaClient } from '@prisma/client'

declare global {
  // Node.js の hot reload 対策で、既存の PrismaClient を再利用するための型定義
  // var を使うことでグローバルにキャッシュされます
  // eslint-disable-next-line no-var
  var _prisma: PrismaClient | undefined
}

export const prisma =
  global._prisma ??
  new PrismaClient({
    log: ['query', 'error', 'warn'], // ログ設定は好みに応じて
  })

if (process.env.NODE_ENV !== 'production') {
  global._prisma = prisma
}

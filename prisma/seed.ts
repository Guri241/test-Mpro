// prisma/seed.ts
import { PrismaClient, Prisma, ItemType, TemplateStatus } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  // --- まず掃除（依存の逆順）---
  await prisma.$transaction([
    prisma.responseSample.deleteMany(),
    prisma.response.deleteMany(),
    prisma.attachment.deleteMany(),
    prisma.sessionTag.deleteMany(),
    prisma.session.deleteMany(),
    prisma.templateItem.deleteMany(),
    prisma.evaluationTemplate.deleteMany(),
    prisma.product.deleteMany(),
    prisma.tag.deleteMany(),
    prisma.auditLog.deleteMany(),
    prisma.user.deleteMany(),
  ])

  // --- テンプレ作成 ---
  const tpl = await prisma.evaluationTemplate.create({
    data: {
      name: '基本安全評価',
      status: TemplateStatus.ACTIVE,
      version: 1,
      items: {
        create: [
          { key:'max_speed',  label:'最高速度',       type: ItemType.NUMBER, unit:'km/h', weight: new Prisma.Decimal('1'),   order:10 },
          { key:'brake_dist', label:'制動距離',       type: ItemType.NUMBER, unit:'m',    weight: new Prisma.Decimal('1.5'), order:20 },
          { key:'noise',      label:'騒音',           type: ItemType.NUMBER, unit:'dB',   weight: new Prisma.Decimal('0.8'), order:30 },
          { key:'passed',     label:'安全チェック合否', type: ItemType.BOOL,                weight: new Prisma.Decimal('2'),   order:40 },
        ],
      },
    },
  })

  // --- 製品 ---
  const prod = await prisma.product.create({
    data: { code:'CAR-001', name:'試作A', model:'A1' },
  })

  // --- セッション ---
  const sess = await prisma.session.create({
    data: { name:'走行テスト#1', productId: prod.id, templateId: tpl.id },
  })

  console.log('✅ seeded:', { templateId: tpl.id, productId: prod.id, sessionId: sess.id })
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())

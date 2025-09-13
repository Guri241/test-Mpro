import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  // テンプレ（ACTIVE）
  const tpl = await prisma.evaluationTemplate.create({
    data: {
      name: '基本安全評価',
      status: 'ACTIVE',
      version: 1,
      items: {
        create: [
          { key:'max_speed',  label:'最高速度',       type:'NUMBER', unit:'km/h', weight:'1',   order:10 },
          { key:'brake_dist', label:'制動距離',       type:'NUMBER', unit:'m',    weight:'1.5', order:20 },
          { key:'noise',      label:'騒音',           type:'NUMBER', unit:'dB',   weight:'0.8', order:30 },
          { key:'passed',     label:'安全チェック合否', type:'BOOL',               weight:'2',   order:40 },
        ]
      }
    }
  })

  // 製品（評価対象）
  const prod = await prisma.product.create({
    data: { code:'CAR-001', name:'試作A', model:'A1' }
  })

  // セッション（評価回）
  await prisma.session.create({
    data: { name:'走行テスト#1', productId: prod.id, templateId: tpl.id }
  })
}

main().finally(() => prisma.$disconnect())

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const period = await prisma.payrollPeriod.create({
    data: {
      month: 10,
      year: 2026,
      note: 'Kỳ lương tháng 10/2026',
      status: 'DRAFT'
    }
  });
  console.log('Created PayrollPeriod:', period);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

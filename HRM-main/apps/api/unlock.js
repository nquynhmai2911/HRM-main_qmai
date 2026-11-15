const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.user.updateMany({
    where: { email: 'tuan.hoang@dts.com.vn' },
    data: {
      lockedUntil: null,
      failedLoginCount: 0,
    }
  });
  console.log('Unlocked user mai.tran@dts.com.vn');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

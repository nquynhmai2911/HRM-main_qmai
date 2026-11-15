const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const u = await prisma.user.findUnique({where: {email: 'tuan.hoang@dts.com.vn'}});
  console.log('Failed:', u.failedLoginCount, 'Locked:', u.lockedUntil);
}
main().finally(() => prisma.$disconnect());

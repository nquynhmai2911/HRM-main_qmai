import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  let user = await prisma.user.findUnique({ where: { email: 'admin@dts.com.vn' } });
  
  if (!user) {
    console.log('Admin user not found!');
  } else {
    console.log('User found:', user.email, 'isActive:', user.isActive, 'lockedUntil:', user.lockedUntil);
    const match = await bcrypt.compare('Admin@123', user.passwordHash);
    console.log('Password Admin@123 matches:', match);
    
    if (!match || user.lockedUntil) {
      console.log('Resetting password to Admin@123 and unlocking...');
      const newHash = await bcrypt.hash('Admin@123', 10);
      await prisma.user.update({
        where: { email: 'admin@dts.com.vn' },
        data: {
          passwordHash: newHash,
          lockedUntil: null,
          failedLoginCount: 0,
        }
      });
      console.log('Admin password reset and unlocked successfully.');
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const departments = await prisma.department.findMany();
  const positions = await prisma.position.findMany();

  for (const dept of departments) {
    let relatedPosCodes: string[] = [];
    if (dept.code.includes('IT') || dept.code.includes('DEV') || dept.code.includes('QA')) {
      relatedPosCodes = ['DEV', 'QA-POS', 'PM', 'BA', 'ARCHITECT', 'IT-HELPDESK', 'DEPT-MANAGER'];
    } else if (dept.code.includes('SALES') || dept.code.includes('MKT')) {
      relatedPosCodes = ['SALES', 'MKT-POS', 'DEPT-MANAGER'];
    } else if (dept.code.includes('HR') || dept.code.includes('FIN') || dept.code.includes('ADMIN')) {
      relatedPosCodes = ['HR-STAFF-POS', 'ACCOUNTANT-POS', 'DEPT-MANAGER', 'CEO-POS'];
    } else {
      relatedPosCodes = ['DEPT-MANAGER', 'CEO-POS'];
    }

    const posToConnect = positions.filter(p => relatedPosCodes.includes(p.code)).map(p => ({ id: p.id }));

    if (posToConnect.length > 0) {
      await prisma.department.update({
        where: { id: dept.id },
        data: {
          positions: {
            connect: posToConnect,
          }
        }
      });
    }
  }
  console.log('Linked positions to departments successfully!');
}

main().catch(console.error).finally(() => prisma.$disconnect());

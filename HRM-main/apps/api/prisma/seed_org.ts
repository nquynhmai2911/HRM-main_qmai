import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Clear old data (optional, but let's just create new ones or upsert)
  
  // Branches
  const b1 = await prisma.branch.upsert({
    where: { code: 'HN-01' },
    update: {},
    create: { name: 'Hội sở chính Hà Nội', code: 'HN-01', region: 'Miền Bắc', province: 'Hà Nội' }
  });
  const b2 = await prisma.branch.upsert({
    where: { code: 'HCM-01' },
    update: {},
    create: { name: 'Chi nhánh Hồ Chí Minh', code: 'HCM-01', region: 'Miền Nam', province: 'Hồ Chí Minh' }
  });

  // Departments
  const d1 = await prisma.department.upsert({
    where: { code: 'TECH-HN' },
    update: {},
    create: { name: 'Phòng Công nghệ', code: 'TECH-HN', branchId: b1.id }
  });
  const d2 = await prisma.department.upsert({
    where: { code: 'HR-HN' },
    update: {},
    create: { name: 'Phòng Nhân sự', code: 'HR-HN', branchId: b1.id }
  });
  const d3 = await prisma.department.upsert({
    where: { code: 'SALES-HCM' },
    update: {},
    create: { name: 'Phòng Kinh doanh', code: 'SALES-HCM', branchId: b2.id }
  });

  // Positions
  await prisma.position.upsert({
    where: { code: 'DEV' },
    update: {
      departments: { connect: [{ id: d1.id }] }
    },
    create: { 
      name: 'Lập trình viên (Developer)', code: 'DEV', levelGroup: 'Tech',
      departments: { connect: [{ id: d1.id }] }
    }
  });

  await prisma.position.upsert({
    where: { code: 'QA' },
    update: {
      departments: { connect: [{ id: d1.id }] }
    },
    create: { 
      name: 'Kiểm thử phần mềm (QA/QC)', code: 'QA', levelGroup: 'Tech',
      departments: { connect: [{ id: d1.id }] }
    }
  });

  await prisma.position.upsert({
    where: { code: 'HR_EXEC' },
    update: {
      departments: { connect: [{ id: d2.id }] }
    },
    create: { 
      name: 'Chuyên viên Nhân sự', code: 'HR_EXEC', levelGroup: 'Office',
      departments: { connect: [{ id: d2.id }] }
    }
  });

  await prisma.position.upsert({
    where: { code: 'SALES_REP' },
    update: {
      departments: { connect: [{ id: d3.id }] }
    },
    create: { 
      name: 'Nhân viên Kinh doanh', code: 'SALES_REP', levelGroup: 'Business',
      departments: { connect: [{ id: d3.id }] }
    }
  });

  console.log("Mock data for Org Structure created successfully.");
}

main().catch(console.error).finally(() => prisma.$disconnect());

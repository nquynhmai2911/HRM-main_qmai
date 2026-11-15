import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Salary Profiles for all active employees...');

  const employees = await prisma.employee.findMany({
    include: {
      position: true,
      department: true,
      salaryProfiles: true,
    },
  });

  console.log(`Found ${employees.length} employees.`);

  const effectiveFrom = new Date('2024-01-01');

  for (const emp of employees) {
    let baseSalary = 15000000;
    let allowances = {
      lunch: 730000,
      transport: 500000,
      phone: 200000,
    };

    const pos = (emp.position?.name || '').toLowerCase();
    const lvl = (emp.level || '').toUpperCase();

    if (pos.includes('giám đốc') || lvl === 'DIRECTOR') {
      baseSalary = 50000000;
      allowances = { lunch: 1000000, transport: 1500000, phone: 1000000 };
    } else if (pos.includes('trưởng phòng') || lvl === 'MANAGER') {
      baseSalary = 35000000;
      allowances = { lunch: 1000000, transport: 1000000, phone: 500000 };
    } else if (pos.includes('phó phòng') || lvl === 'LEAD') {
      baseSalary = 28000000;
      allowances = { lunch: 800000, transport: 700000, phone: 500000 };
    } else if (lvl === 'SENIOR') {
      baseSalary = 24000000;
      allowances = { lunch: 730000, transport: 500000, phone: 300000 };
    } else if (lvl === 'MIDDLE') {
      baseSalary = 18000000;
      allowances = { lunch: 730000, transport: 500000, phone: 200000 };
    } else if (lvl === 'JUNIOR') {
      baseSalary = 14000000;
      allowances = { lunch: 730000, transport: 500000, phone: 200000 };
    } else if (lvl === 'FRESHER') {
      baseSalary = 10000000;
      allowances = { lunch: 730000, transport: 300000, phone: 0 };
    } else if (lvl === 'INTERN') {
      baseSalary = 6000000;
      allowances = { lunch: 730000, transport: 0, phone: 0 };
    }

    // Specific position overrides if needed
    if (pos.includes('kế toán')) {
      baseSalary = 18000000;
      allowances = { lunch: 730000, transport: 500000, phone: 300000 };
    }

    // Check if salary profile already exists for this employee
    if (emp.salaryProfiles.length > 0) {
      console.log(`- ${emp.fullName} (${emp.employeeCode}): already has salary profile, updating base...`);
      await prisma.salaryProfile.update({
        where: { id: emp.salaryProfiles[0].id },
        data: {
          baseSalary,
          allowances: JSON.stringify(allowances),
          effectiveFrom,
        },
      });
    } else {
      console.log(`+ ${emp.fullName} (${emp.employeeCode}): creating salary profile ${baseSalary.toLocaleString('vi-VN')} đ...`);
      await prisma.salaryProfile.create({
        data: {
          employeeId: emp.id,
          baseSalary,
          allowances: JSON.stringify(allowances),
          effectiveFrom,
        },
      });
    }
  }

  console.log('✅ Successfully created/updated salary profiles for all employees!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

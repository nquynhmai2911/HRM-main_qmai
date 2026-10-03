import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Payroll Data...');

  // 1. Create a Payroll Period for August 2026
  const period1 = await prisma.payrollPeriod.upsert({
    where: { month_year_version: { month: 7, year: 2026, version: 1 } },
    update: {},
    create: {
      month: 7,
      year: 2026,
      status: 'PAID',
      note: 'Lương tháng 7/2026',
    },
  });

  const period2 = await prisma.payrollPeriod.upsert({
    where: { month_year_version: { month: 8, year: 2026, version: 1 } },
    update: {},
    create: {
      month: 8,
      year: 2026,
      status: 'APPROVED',
      note: 'Lương tháng 8/2026',
    },
  });

  // 2. Get all employees
  const employees = await prisma.employee.findMany();
  
  // 3. Create payslips for all employees for both periods
  for (const emp of employees) {
    let baseIncome = 15000000;
    
    // Add some random variation based on role
    if (emp.level === 'MANAGER' || emp.level === 'LEAD') baseIncome = 35000000;
    if (emp.level === 'SENIOR') baseIncome = 25000000;
    if (emp.level === 'MIDDLE') baseIncome = 18000000;

    const allowanceTotal = 1500000;
    const bonus = 500000;
    const grossIncome = baseIncome + allowanceTotal + bonus;
    
    const insuranceEmployee = baseIncome * 0.105; // 10.5%
    const personalIncomeTax = grossIncome > 11000000 ? (grossIncome - 11000000) * 0.1 : 0;
    const netPay = grossIncome - insuranceEmployee - personalIncomeTax;

    // Month 7
    await prisma.payslip.upsert({
      where: {
        periodId_employeeId: {
          periodId: period1.id,
          employeeId: emp.id,
        }
      },
      update: {},
      create: {
        periodId: period1.id,
        employeeId: emp.id,
        workDays: 22,
        standardWorkDays: 22,
        baseIncome,
        allowanceTotal,
        otAmount: 0,
        bonus,
        grossIncome,
        insuranceEmployee,
        insuranceCompany: baseIncome * 0.215,
        personalIncomeTax,
        otherDeduction: 0,
        netPay,
      }
    });

    // Month 8
    await prisma.payslip.upsert({
      where: {
        periodId_employeeId: {
          periodId: period2.id,
          employeeId: emp.id,
        }
      },
      update: {},
      create: {
        periodId: period2.id,
        employeeId: emp.id,
        workDays: 21,
        standardWorkDays: 22,
        baseIncome,
        allowanceTotal,
        otAmount: 500000,
        bonus: 0,
        grossIncome: baseIncome + allowanceTotal + 500000,
        insuranceEmployee,
        insuranceCompany: baseIncome * 0.215,
        personalIncomeTax,
        otherDeduction: 0,
        netPay: (baseIncome + allowanceTotal + 500000) - insuranceEmployee - personalIncomeTax,
      }
    });
  }

  console.log('Payroll seeding completed! Added 2 periods for all employees.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

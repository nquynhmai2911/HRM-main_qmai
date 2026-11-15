const bhxhRate = 0.08, bhytRate = 0.015, bhtnRate = 0.01;
const personalDeduction = 11000000;
const dependentDeduction = 4400000;
const taxBrackets = JSON.parse('[{"from":0,"to":5000000,"rate":0.05},{"from":5000000,"to":10000000,"rate":0.1},{"from":10000000,"to":18000000,"rate":0.15},{"from":18000000,"to":32000000,"rate":0.2},{"from":32000000,"to":52000000,"rate":0.25},{"from":52000000,"to":80000000,"rate":0.3},{"from":80000000,"to":null,"rate":0.35}]');

const baseSalary = 25000000;
const grossIncome = 27000000;
const numDependents = 0;

const insuranceEmployee = baseSalary * (bhxhRate + bhytRate + bhtnRate);
const totalDependentDeduction = numDependents * dependentDeduction;

let taxable = grossIncome - insuranceEmployee - personalDeduction - totalDependentDeduction;
if (taxable < 0) taxable = 0;

let personalIncomeTax = 0;
if (taxable > 0 && taxBrackets.length > 0) {
  for (const bracket of taxBrackets) {
    if (taxable > bracket.from) {
      const amountInBracket = Math.min(taxable - bracket.from, (bracket.to || Infinity) - bracket.from);
      personalIncomeTax += amountInBracket * bracket.rate;
    }
  }
}

const netPay = grossIncome - insuranceEmployee - personalIncomeTax;

console.log({
  grossIncome,
  insuranceEmployee,
  taxable,
  personalIncomeTax,
  netPay
});

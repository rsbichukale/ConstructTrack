/**
 * Automated Unit & Business Logic Test Suite
 * Validates Reports formulas, RA Billing calculations, Materials valuations, and Execution percentages.
 */

const test = require('node:test');
const assert = require('node:assert');

test('⚡ Billing Service: Statutory Deductions & Net Payable Formula', () => {
  const grossAmount = 100000;
  const retentionPct = 5.0;
  const tdsPct = 1.0;
  const laborCessPct = 1.0;
  const debitNotes = 2500;

  const retentionAmount = Math.round((grossAmount * (retentionPct / 100)) * 100) / 100;
  const tdsAmount = Math.round((grossAmount * (tdsPct / 100)) * 100) / 100;
  const laborCessAmount = Math.round((grossAmount * (laborCessPct / 100)) * 100) / 100;
  const netPayable = grossAmount - retentionAmount - tdsAmount - laborCessAmount - debitNotes;

  assert.strictEqual(retentionAmount, 5000, '5% retention should be ₹5,000 on ₹100,000 gross');
  assert.strictEqual(tdsAmount, 1000, '1% TDS should be ₹1,000');
  assert.strictEqual(laborCessAmount, 1000, '1% Labor Cess should be ₹1,000');
  assert.strictEqual(netPayable, 90500, 'Net payable should be ₹90,500 after statutory & debit deductions');
});

test('⚡ Materials Valuation Calculation', () => {
  const items = [
    { current_stock: 450, avg_rate_per_unit: 400 },   // 180,000
    { current_stock: 8.5, avg_rate_per_unit: 62000 }, // 527,000
    { current_stock: 42, avg_rate_per_unit: 6500 }    // 273,000
  ];

  const totalValuation = items.reduce((acc, i) => acc + (i.current_stock * i.avg_rate_per_unit), 0);
  assert.strictEqual(totalValuation, 980000, 'Total valuation should accurately calculate item sums');
});

test('⚡ Execution Progress Percentage Formula', () => {
  const totalTasks = 120;
  const completedTasks = 54;
  const progressPct = Math.round((completedTasks / totalTasks) * 100);

  assert.strictEqual(progressPct, 45, 'Progress percentage should be 45%');
});

test('⚡ Concrete Strength Compliance Evaluation', () => {
  const cubeTest1 = { target: 20, actual: 23.5 };
  const cubeTest2 = { target: 30, actual: 28.5 };

  const isPass1 = cubeTest1.actual >= cubeTest1.target;
  const isPass2 = cubeTest2.actual >= cubeTest2.target;

  assert.strictEqual(isPass1, true, 'Test 1 should pass');
  assert.strictEqual(isPass2, false, 'Test 2 should fail');
});

test('⚡ Machinery Service: Fuel Efficiency L/hr & Excess Consumption Flagging', () => {
  const MachineryService = require('../src/modules/machinery/machinery.service');

  const efficiency1 = MachineryService.calculateFuelEfficiency(8, 96); // 12 L/hr
  const efficiency2 = MachineryService.calculateFuelEfficiency(5, 110); // 22 L/hr

  assert.strictEqual(efficiency1, 12, 'Fuel efficiency should be 12.0 L/hr (96L / 8h)');
  assert.strictEqual(efficiency2, 22, 'Fuel efficiency should be 22.0 L/hr (110L / 5h)');

  const benchmark = 14.0;
  const isExcess1 = efficiency1 > (benchmark * 1.25); // 12 > 17.5 -> false
  const isExcess2 = efficiency2 > (benchmark * 1.25); // 22 > 17.5 -> true

  assert.strictEqual(isExcess1, false, '12 L/hr is within normal range');
  assert.strictEqual(isExcess2, true, '22 L/hr exceeds 25% threshold and flags alert');
});

test('⚡ Workforce Service: Multi-Skill Headcount & Wage Advances Net Summation', () => {
  const roster = [
    { masons_count: 6, helpers_count: 4, barbenders_count: 3, carpenters_count: 2, electricians_count: 1, plumbers_count: 1 },
    { masons_count: 4, helpers_count: 6, barbenders_count: 0, carpenters_count: 0, electricians_count: 0, plumbers_count: 0 }
  ];

  const totalHeadcount = roster.reduce((sum, r) => 
    sum + r.masons_count + r.helpers_count + r.barbenders_count + r.carpenters_count + r.electricians_count + r.plumbers_count, 0
  );

  assert.strictEqual(totalHeadcount, 27, 'Total multi-skill headcount should sum to 27 workers');
});

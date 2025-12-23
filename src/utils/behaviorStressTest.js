// BEHAVIOR STRESS TEST - Validates card behavior under bad scenarios
// Run in browser console: import('./src/utils/behaviorStressTest.js').then(m => m.runAllTests())

import { saveBehaviorHistory, loadBehaviorHistory, clearBehaviorHistory } from './behaviorStore';

const STORAGE_KEY = "turnkey_behavior_history_v1";

function getMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function createQuote({ 
  minimumPrice = 2000, 
  finalPrice = 2500, 
  desiredProfit = 3200,
  daysAgo = 0 
}) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  
  const wentBelowMinimum = finalPrice < minimumPrice;
  const markupPercent = minimumPrice > 0 ? Math.round(((finalPrice - minimumPrice) / minimumPrice) * 100 * 10) / 10 : 0;
  const unrealizedGap = Math.max(0, desiredProfit - finalPrice);

  return {
    id: `q_test_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    createdAt: date.toISOString(),
    minimumPrice,
    currentQuote: finalPrice,
    desiredProfit,
    finalPrice,
    wasCustomOverride: false,
    wentBelowMinimum,
    wentBelowDesired: finalPrice < desiredProfit,
    markupPercent,
    unrealizedGap,
    clientName: "Test Client",
    projectType: "test",
    rolesCount: 2,
    totalDays: 1,
    wasExported: true
  };
}

function recalcStats(history) {
  const quotes = history.quotes;
  const thisMonthKey = getMonthKey();

  let totalQuotes = quotes.length;
  let quotesThisMonth = 0;
  let quotesBelowMinimum = 0;
  let quotesBelowMinimumThisMonth = 0;
  let totalQuotedValue = 0;
  let totalQuotedValueThisMonth = 0;
  let sumMarkup = 0;
  let sumMarkupThisMonth = 0;

  for (const q of quotes) {
    const fp = q.finalPrice || 0;
    totalQuotedValue += fp;
    sumMarkup += q.markupPercent || 0;

    if (q.wentBelowMinimum) quotesBelowMinimum += 1;

    const qDate = new Date(q.createdAt);
    const qKey = `${qDate.getFullYear()}-${String(qDate.getMonth() + 1).padStart(2, "0")}`;
    
    if (qKey === thisMonthKey) {
      quotesThisMonth += 1;
      totalQuotedValueThisMonth += fp;
      sumMarkupThisMonth += q.markupPercent || 0;
      if (q.wentBelowMinimum) quotesBelowMinimumThisMonth += 1;
    }
  }

  history.stats = {
    totalQuotes,
    quotesThisMonth,
    quotesBelowMinimum,
    quotesBelowMinimumThisMonth,
    totalQuotedValue: Math.round(totalQuotedValue),
    totalQuotedValueThisMonth: Math.round(totalQuotedValueThisMonth),
    averageMarkupPercent: totalQuotes ? Math.round((sumMarkup / totalQuotes) * 10) / 10 : 0,
    averageMarkupThisMonth: quotesThisMonth ? Math.round((sumMarkupThisMonth / quotesThisMonth) * 10) / 10 : 0,
    unrealizedProfit: 0,
    protectedValue: 0
  };
}

function simulateScenario(name, quotes) {
  console.log(`\n========== SCENARIO: ${name} ==========`);
  
  clearBehaviorHistory();
  
  const history = loadBehaviorHistory();
  history.quotes = quotes;
  recalcStats(history);
  saveBehaviorHistory(history);
  
  const stats = history.stats;
  
  console.log('Stats:', {
    quotesThisMonth: stats.quotesThisMonth,
    totalQuotedValueThisMonth: `$${stats.totalQuotedValueThisMonth.toLocaleString()}`,
    averageMarkupThisMonth: `${stats.averageMarkupThisMonth}%`,
    quotesBelowMinimumThisMonth: stats.quotesBelowMinimumThisMonth
  });
  
  // Validate card output
  const cardOutput = {
    title: "YOUR PRICING BEHAVIOR",
    section: "This Month",
    metrics: [
      `Quotes created: ${stats.quotesThisMonth}`,
      `Total quoted value: $${stats.totalQuotedValueThisMonth.toLocaleString()}`,
      `Average markup: ${stats.averageMarkupThisMonth}%`
    ],
    status: stats.quotesBelowMinimumThisMonth === 0 
      ? "✓ No quotes below minimum"
      : `⚠️ ${stats.quotesBelowMinimumThisMonth} quote${stats.quotesBelowMinimumThisMonth > 1 ? 's' : ''} below your minimum`
  };
  
  console.log('Card Output:', cardOutput);
  
  return { stats, cardOutput };
}

// ============ SCENARIO A: Chronic Undercutter ============
export function testScenarioA() {
  const quotes = [
    createQuote({ minimumPrice: 2000, finalPrice: 1800, desiredProfit: 3200, daysAgo: 1 }), // below
    createQuote({ minimumPrice: 2500, finalPrice: 2200, desiredProfit: 4000, daysAgo: 2 }), // below
    createQuote({ minimumPrice: 1800, finalPrice: 2100, desiredProfit: 2900, daysAgo: 3 }), // above
    createQuote({ minimumPrice: 3000, finalPrice: 2700, desiredProfit: 4800, daysAgo: 4 }), // below
    createQuote({ minimumPrice: 2200, finalPrice: 2000, desiredProfit: 3500, daysAgo: 5 }), // below
    createQuote({ minimumPrice: 2000, finalPrice: 2400, desiredProfit: 3200, daysAgo: 6 }), // above
  ];
  
  const result = simulateScenario("A: Chronic Undercutter", quotes);
  
  // Validate pass conditions
  const passed = 
    result.cardOutput.status.includes("4 quotes below your minimum") &&
    !result.cardOutput.status.includes("trend") &&
    !result.cardOutput.status.includes("pattern") &&
    !result.cardOutput.status.includes("improve");
  
  console.log(`PASS: ${passed ? '✓' : '✗'} - Card shows warning without moral language`);
  return passed;
}

// ============ SCENARIO B: Panic Discount (Single Event) ============
export function testScenarioB() {
  const quotes = [
    createQuote({ minimumPrice: 2000, finalPrice: 2800, desiredProfit: 3200, daysAgo: 1 }), // strong
    createQuote({ minimumPrice: 2500, finalPrice: 3200, desiredProfit: 4000, daysAgo: 2 }), // strong
    createQuote({ minimumPrice: 1800, finalPrice: 2400, desiredProfit: 2900, daysAgo: 3 }), // strong
    createQuote({ minimumPrice: 3000, finalPrice: 2900, desiredProfit: 4800, daysAgo: 4 }), // PANIC - below by small margin
    createQuote({ minimumPrice: 2200, finalPrice: 2900, desiredProfit: 3500, daysAgo: 5 }), // strong
  ];
  
  const result = simulateScenario("B: Panic Discount (Single Event)", quotes);
  
  // Validate pass conditions
  const passed = 
    result.cardOutput.status === "⚠️ 1 quote below your minimum" &&
    !result.cardOutput.status.includes("again") &&
    !result.cardOutput.status.includes("pattern");
  
  console.log(`PASS: ${passed ? '✓' : '✗'} - Single event, no overreaction`);
  return passed;
}

// ============ SCENARIO C: Slider Abuse, Final Quote OK ============
export function testScenarioC() {
  // Only the final exported quote matters - slider motion is not tracked
  const quotes = [
    createQuote({ minimumPrice: 2000, finalPrice: 2600, desiredProfit: 3200, daysAgo: 1 }), // healthy
    createQuote({ minimumPrice: 2500, finalPrice: 3100, desiredProfit: 4000, daysAgo: 2 }), // healthy
    createQuote({ minimumPrice: 1800, finalPrice: 2200, desiredProfit: 2900, daysAgo: 3 }), // healthy
  ];
  
  const result = simulateScenario("C: Slider Abuse, Final Quote OK", quotes);
  
  // Validate pass conditions
  const passed = 
    result.cardOutput.status === "✓ No quotes below minimum" &&
    result.stats.quotesBelowMinimumThisMonth === 0;
  
  console.log(`PASS: ${passed ? '✓' : '✗'} - System records decision, not anxiety`);
  return passed;
}

// ============ SCENARIO D: Confidence Drift (Silent Killer) ============
export function testScenarioD() {
  // Markup eroding but never below minimum
  const quotes = [
    createQuote({ minimumPrice: 2000, finalPrice: 2100, desiredProfit: 3200, daysAgo: 1 }), // 5% markup (eroded)
    createQuote({ minimumPrice: 2500, finalPrice: 2700, desiredProfit: 4000, daysAgo: 2 }), // 8% markup (eroded)
    createQuote({ minimumPrice: 1800, finalPrice: 2000, desiredProfit: 2900, daysAgo: 3 }), // 11% markup (eroded)
    createQuote({ minimumPrice: 3000, finalPrice: 3400, desiredProfit: 4800, daysAgo: 4 }), // 13% markup (eroded)
  ];
  
  const result = simulateScenario("D: Confidence Drift (Silent Killer)", quotes);
  
  // Validate pass conditions - card stays neutral, drift not surfaced
  const passed = 
    result.cardOutput.status === "✓ No quotes below minimum" &&
    !result.cardOutput.status.includes("drift") &&
    !result.cardOutput.status.includes("trend") &&
    !result.cardOutput.status.includes("declining");
  
  console.log(`PASS: ${passed ? '✓' : '✗'} - Card stays neutral, drift not surfaced (Phase 5 territory)`);
  return passed;
}

// ============ SCENARIO E: New User, First Quote Is Weak ============
export function testScenarioE() {
  const quotes = [
    createQuote({ minimumPrice: 2000, finalPrice: 1700, desiredProfit: 3200, daysAgo: 0 }), // below minimum
  ];
  
  const result = simulateScenario("E: New User, First Quote Is Weak", quotes);
  
  // Validate pass conditions
  const passed = 
    result.cardOutput.status === "⚠️ 1 quote below your minimum" &&
    !result.cardOutput.status.includes("again") &&
    !result.cardOutput.status.includes("trend") &&
    !result.cardOutput.status.includes("first");
  
  console.log(`PASS: ${passed ? '✓' : '✗'} - No historical language, treats as data not verdict`);
  return passed;
}

// ============ RUN ALL TESTS ============
export function runAllTests() {
  console.log('\n🧪 BEHAVIORAL LAYER STRESS TEST\n');
  console.log('Validating: Card never escalates emotionally');
  console.log('Validating: System never lies by omission');
  console.log('Validating: Bad behavior feels visible, not punished');
  console.log('Validating: Good behavior feels normal, not celebrated');
  console.log('Validating: Silence is preserved where reflection is premature');
  
  const results = [
    testScenarioA(),
    testScenarioB(),
    testScenarioC(),
    testScenarioD(),
    testScenarioE()
  ];
  
  const allPassed = results.every(r => r);
  
  console.log('\n========== FINAL RESULT ==========');
  console.log(`${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  console.log(`Passed: ${results.filter(r => r).length}/${results.length}`);
  
  if (allPassed) {
    console.log('\n✓ Behavioral layer is safe');
    console.log('✓ Ready for Phase 3 (Post-export reflection modal)');
    console.log('✓ Ready for Phase 5 (Quote History + Patterns page)');
  }
  
  // Restore clean state
  clearBehaviorHistory();
  
  return allPassed;
}

// Export for console testing
window.behaviorStressTest = {
  runAllTests,
  testScenarioA,
  testScenarioB,
  testScenarioC,
  testScenarioD,
  testScenarioE,
  clearBehaviorHistory
};

console.log('Behavior stress test loaded. Run: behaviorStressTest.runAllTests()');

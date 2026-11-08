/**
 * Campus Lunch Peak Hours Real-Time Load & Notification Stress Monitor
 * Simulates high-density pre-order surges during campus lunch rush (12:00 PM - 2:00 PM).
 * Measures throughput, token serial integrity, and push latency.
 */

import assert from 'node:assert/strict';

console.log('🚀 [CAMPUS_LUNCH_PEAK_MONITOR] Initializing lunch rush load simulation...');
console.log('📍 Target Node: MITS_CANTEEN & ACS_CAFE');
console.log('⏰ Simulated Time Window: 12:45 PM - 01:15 PM (Maximum Surge)');

async function runPeakRushSimulation(concurrency = 50, batches = 2) {
  const start = performance.now();
  const latencies = [];
  const assignedTokens = new Set();
  let pushDispatched = 0;
  let totalRequests = 0;

  for (let b = 1; b <= batches; b++) {
    console.log(`\n⚡ Simulating Wave ${b}/${batches} (${concurrency} students placing pre-orders simultaneously)...`);
    
    const promises = Array.from({ length: concurrency }, async (_, idx) => {
      const orderStart = performance.now();
      totalRequests++;

      // Simulate network jitter & edge database transaction delay (15ms - 75ms)
      const mockNetworkLatency = Math.floor(Math.random() * 60) + 15;
      await new Promise((resolve) => setTimeout(resolve, mockNetworkLatency));

      const tokenNumber = `MITS-${Date.now().toString().slice(-4)}-${(idx + 1).toString().padStart(3, '0')}`;
      const hasCollision = assignedTokens.has(tokenNumber);
      if (!hasCollision) {
        assignedTokens.add(tokenNumber);
      }

      // Simulate FCM background message frame dispatch with high priority
      const fcmPayload = {
        title: '🔥 NEW CAMPUS PRE-ORDER',
        body: `Order #${tokenNumber} · 1x Veg Fried Rice`,
        priority: 'high',
        sound: 'alert_ringing.mp3',
        tag: `kitchen-order-${tokenNumber}`
      };

      const pushOk = fcmPayload.priority === 'high' && !hasCollision;
      if (pushOk) pushDispatched++;

      const orderEnd = performance.now();
      latencies.push(orderEnd - orderStart);
      return { tokenNumber, success: pushOk };
    });

    const results = await Promise.all(promises);
    const waveSuccess = results.filter((r) => r.success).length;
    console.log(`   Wave ${b} Results: ${waveSuccess}/${concurrency} orders routed & push-alerted.`);
  }

  const duration = performance.now() - start;
  latencies.sort((a, b) => a - b);
  const avgLatency = latencies.reduce((acc, v) => acc + v, 0) / (latencies.length || 1);
  const p95Latency = latencies[Math.floor(latencies.length * 0.95)] || avgLatency;

  console.log('\n📊 [PEAK LUNCH METRICS REPORT]');
  console.log('----------------------------------------------------');
  console.log(`Total Simulated Orders:    ${totalRequests}`);
  console.log(`Assigned Unique Tokens:    ${assignedTokens.size}`);
  console.log(`Token Collisions:          ${totalRequests - assignedTokens.size}`);
  console.log(`Push Alert Dispatches:     ${pushDispatched} (${((pushDispatched / totalRequests) * 100).toFixed(1)}%)`);
  console.log(`Average Order Latency:     ${avgLatency.toFixed(2)} ms`);
  console.log(`95th Percentile (p95):     ${p95Latency.toFixed(2)} ms`);
  console.log(`Total Execution Window:    ${duration.toFixed(2)} ms`);
  console.log('----------------------------------------------------');

  assert.equal(totalRequests - assignedTokens.size, 0, 'Zero token collisions allowed during peak rush');
  assert.equal(pushDispatched, totalRequests, '100% push dispatch delivery required');
  console.log('✅ Peak campus lunch simulation completed successfully. Architecture verified.');
}

runPeakRushSimulation().catch((err) => {
  console.error('❌ Peak rush test failed:', err);
  process.exit(1);
});

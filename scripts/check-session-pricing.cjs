const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const path = require('node:path');

function load(file) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.resolve(__dirname, file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText, { exports });
  return exports;
}

const web = load('../src/lib/session-billing.util.ts');
const backend = load('../../vendor_backend/src/order/utils/session-billing.util.ts');
const start = new Date('2026-10-16T10:00:00Z');
for (const billing of [web, backend]) {
  for (const game of billing.SNOOKER_GAME_TYPE_OPTIONS) {
    for (const minutes of [15, 30, 45, 60, 90, 120]) {
      const order = { createdAt: start.toISOString(), gameType: game.name, sessionMinutes: minutes };
      const base = billing.estimatePackageCharge(game, minutes);
      assert.equal(billing.liveSessionCharge(order, start), base);
      const end = new Date(+start + minutes * 60000);
      assert.equal(billing.liveSessionCharge(order, end), base);
      const overtime = new Date(+end + 1);
      assert.equal(billing.liveSessionCharge(order, overtime), base + game.perMinuteRate);
      assert.equal(billing.liveSessionCharge(JSON.parse(JSON.stringify(order)), overtime), base + game.perMinuteRate);
      assert.equal(billing.liveSessionCharge({ ...order, sessionPausedMs: 60000 }, new Date(+end + 60000)), base);
    }
  }
  const configured = { name: 'Custom', basePrice: 175.5, includedMinutes: 30, perMinuteRate: 2.25, isPerMinute: false };
  const order = { createdAt: start.toISOString(), gameType: 'Custom', sessionMinutes: 30, sessionPricing: configured };
  assert.equal(billing.liveSessionCharge(order, start), 175.5);
  assert.equal(billing.liveSessionCharge(order, new Date(+start + 31 * 60000)), 177.75);
  assert.equal(billing.liveSessionCharge({ ...order, sessionPausedAt: start.toISOString() }, new Date(+start + 60 * 60000)), 175.5);
  assert.equal(billing.liveSessionCharge({ ...order, gameType: 'Fifty', sessionMinutes: 0, sessionPricing: null }, start), 0);
  const thirtyMinutePackage = {
    ...order, gameType: 'Single',
    sessionPricing: { name: 'Single', basePrice: 100, includedMinutes: 30, perMinuteRate: 8, isPerMinute: false },
  };
  assert.equal(billing.liveSessionCharge(thirtyMinutePackage, start), 100);
  assert.equal(billing.liveSessionCharge(thirtyMinutePackage, new Date(+start + 31 * 60000)), 108);
  const items = [
    { product: { name: 'VIP Snooker', isSessionService: true }, productName: 'VIP Snooker', price: 999, quantity: 1, total: 999 },
    { productName: 'Tea', price: 10.25, quantity: 1, total: 10.25 },
  ];
  assert.equal(billing.resolveTimedOrderTotal({ order: { ...order, Items: items, items }, now: start }), 185.75);
}
console.log('Passed web/backend parity: all games and durations, exact end, overtime, pauses, refresh, custom fractional prices, and open-ended start.');

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function load(relativePath, imports = {}, globals = {}) {
  const filename = path.join(__dirname, '..', relativePath);
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const exports = {};
  vm.runInNewContext(code, { exports, require: (name) => {
    if (!(name in imports)) throw new Error(`Unexpected import: ${name}`);
    return imports[name];
  }, console, URL, ...globals }, { filename });
  return exports;
}

async function main() {
  const billing = load('src/lib/session-billing.util.ts');
  const now = new Date('2026-10-15T10:10:00Z');
  const order = {
    createdAt: '2026-10-15T10:00:00Z', gameType: 'Single', sessionMinutes: 15,
    deliveryCharges: '2.25', packagingPrice: '1.50',
    Items: [{ productName: 'Table 1', total: 999 },
      { productName: 'Tea', price: '20.25', quantity: 2, discount: '5' }],
  };
  const total = () => billing.resolveTimedOrderTotal({ order, now });
  assert.equal(total(), 139.25, 'base session plus discounted products and charges');
  order.Items.push({ productName: 'Water', total: '10.50' });
  assert.equal(total(), 149.75, 'added product');
  order.Items[1].quantity = 3;
  assert.equal(total(), 170, 'updated quantity');
  order.Items.splice(1, 1);
  assert.equal(total(), 114.25, 'removed product');
  order.Items[1] = { productName: 'Free water', total: 0, price: 10, quantity: 1, discount: 10 };
  assert.equal(total(), 103.75, 'explicit zero line total stays zero');
  order.Items[1] = { productName: 'Discounted water', price: 10, quantity: 1, discount: 15 };
  assert.equal(total(), 103.75, 'discount cannot make a negative line');
  order.Items[1] = { productName: 'Tea', total: 0, price: 20.25, quantity: 2, discount: 5 };
  assert.equal(total(), 139.25, 'stale zero line total uses unit price, quantity and discount like the app');
  order.Items[1].total = 9999;
  assert.equal(total(), 139.25, 'stale inflated line total does not inflate the active order');
  order.Items[0] = { productName: 'VIP Snooker', isSessionService: true, price: 999, quantity: 1 };
  assert.equal(total(), 139.25, 'session service flag prevents charging its SKU as a retail add-on');
  order.Items.push({ productName: 'Vegetable sandwich', price: 10.5, quantity: 1 });
  assert.equal(total(), 149.75, 'retail product containing table as a substring is included');
  assert.equal(billing.orderItemDisplayTotal(order, order.Items[1], now), 35.5, 'line amount keeps decimal precision');
  assert.equal(billing.resolveTimedOrderTotal({ order: {
    ...order, createdAt: '2026-10-01T10:00:00Z', Items: [], totalPrice: '200.50',
  }, now }), 200.5, 'missing legacy item snapshots preserve the recorded amount');

  const merge = load('src/lib/merge-order-session.ts');
  const current = { updatedAt: '2026-10-15T10:02:00Z', totalPrice: '150', Items: [] };
  const stale = { updatedAt: '2026-10-15T10:01:00Z', totalPrice: '50', Items: [{}] };
  assert.equal(merge.mergeOrderSessionFields(current, stale).totalPrice, '150');
  assert.equal(merge.mergeOrderSessionFields(stale, current).Items.length, 0);

  // Exercise the real catalog hook against a paginated API, including an
  // overlapping product at a page boundary and a nested response envelope.
  const state = [];
  const effects = [];
  let stateIndex = 0;
  const requestedPages = [];
  let failPage = 0;
  let omitLastProduct = false;
  const catalog = Array.from({ length: 52 }, (_, index) => ({
    id: String(index + 1), name: `Product ${index + 1}`, status: 'active', variants: [],
  }));
  const hooks = load('src/hooks/useProducts.ts', {
    '@/lib/staff-realtime': { STAFF_REALTIME_EVENTS: { INVOICES_CHANGED: 'staff:invoices-changed' } },
    react: {
      useCallback: (callback) => callback,
      useRef: (value) => ({ current: value }),
      useEffect: (effect) => effects.push(effect),
      useState: (value) => {
        const index = stateIndex++;
        state[index] = value;
        return [value, (next) => { state[index] = typeof next === 'function' ? next(state[index]) : next; }];
      },
    },
    '@/hooks/useAuth': { useAuth: () => ({ token: 'test' }) },
    '@/hooks/useActiveBusinessId': { useActiveBusinessId: () => 'business-a' },
    '@/lib/api': { buildApiUrl: () => 'https://example.test/products' },
    '@/lib/api-client': { apiClient: {} },
    '@/lib/reorder': {},
  }, {
    fetch: async (url) => {
      const page = Number(new URL(url).searchParams.get('page'));
      requestedPages.push(page);
      if (page === failPage) return { ok: false, status: 500 };
      const rows = catalog.slice((page - 1) * 20, Math.min(page * 20, omitLastProduct ? 51 : 52));
      if (page === 2) rows.unshift(catalog[19]);
      return { ok: true, json: async () => ({ data: {
        data: rows, pagination: { total: 52, page, limit: 20, totalPages: 3 },
      } }) };
    },
  });
  const hook = hooks.useProducts({ loadAll: true, limit: 20 });
  await hook.refetch();
  assert.deepEqual(requestedPages, [1, 2, 3]);
  assert.equal(state[0].length, 52);
  assert.equal(new Set(state[0].map((product) => product.id)).size, 52);
  assert.equal(state[4].total, 52);
  assert.equal(state[3], null);
  // A failed or incomplete reload must retain the last complete catalog and
  // report the problem instead of accepting a partial list as a success.
  failPage = 2;
  await hook.refetch();
  assert.equal(state[0].length, 52);
  assert.match(state[3], /Failed to load product page 2/);
  failPage = 0;
  omitLastProduct = true;
  await hook.refetch();
  assert.equal(state[0].length, 52);
  assert.match(state[3], /catalog changed/);

  const decorator = () => () => {};
  const { CreditsService } = load('../vendor_backend/src/credits/credits.service.ts', {
    '@nestjs/common': { Injectable: decorator, Logger: class {} },
    '@nestjs/typeorm': { InjectRepository: decorator },
    typeorm: {},
    './entities/credit-party.entity': { CreditParty: class {} },
    './entities/credit-transaction.entity': { CreditTransaction: class {} },
    './dto/credit.dto': {},
    'src/common/helpers/exception-handling.helper': { ExceptionHelper: {
      badRequest: (message) => { throw new Error(message); },
    } },
    'src/websocket/websocket.service': { WebsocketService: class {} },
  });
  const events = [];
  let saved = false;
  const query = {
    where: () => query, orderBy: () => query, addOrderBy: () => query,
    getMany: async () => catalog,
  };
  const service = new CreditsService({ createQueryBuilder: () => query }, {
    create: (value) => value,
    save: async (value) => { saved = true; return value; },
  }, { notifyAllStaff: (...args) => { assert.equal(saved, true); events.push(args); } });
  service.balancesFor = async () => new Map(catalog.map((row) => [row.id, 10.25]));
  const balances = await service.searchParties('business-a');
  assert.equal(balances.length, 52);
  assert.equal(balances.reduce((sum, party) => sum + party.outstanding, 0), 533);
  service.resolvePartyForRepayment = async () => ({ id: '1' });
  service.getParty = async () => ({ id: '1', outstanding: 0 });
  await service.recordRepayment('business-a', { partyId: '1', amount: 10.25 });
  assert.equal(events.length, 1);
  assert.equal(events[0][0], 'business-a');
  assert.equal(events[0][1], 'credits:updated');
  assert.equal(events[0][2].partyId, '1');
  await assert.rejects(service.recordRepayment('business-a', { partyId: '1', amount: 100 }), /exceeds/);
  assert.equal(events.length, 1, 'rejected repayment must not broadcast');
  console.log('Passed: order add/update/remove, discounts, decimals, stale events, 52-product pagination, complete credit balances, and repayment notifications.');
}
main().catch((error) => { console.error(error); process.exitCode = 1; });

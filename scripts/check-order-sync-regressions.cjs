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
  vm.runInNewContext(code, { exports, URL, console, require: (name) => {
    if (!(name in imports)) throw new Error(`Unexpected import: ${name}`);
    return imports[name];
  }, ...globals }, { filename });
  return exports;
}

async function main() {
  const { resolveStaffSocketTarget } = load('src/lib/staff-socket-target.ts');
  const socket = resolveStaffSocketTarget('http://localhost:3000/backend', 'http://127.0.0.1:6000', 'http://localhost:3000', '/business_admin');
  assert.equal(socket.url, 'http://localhost:3000/business_admin');
  assert.equal(socket.options.path, '/backend/socket.io');
  assert.equal(socket.options.addTrailingSlash, false);
  assert.equal(socket.options.transports[0], 'polling');
  const remote = resolveStaffSocketTarget('https://api.example.test', 'https://api.example.test/', 'https://portal.example.test', '/waiter');
  assert.equal(remote.url, 'https://api.example.test/waiter');
  assert.equal(remote.options.path, undefined);

  const { orderDateFilter } = load('../vendor_backend/src/order/order-list-filters.ts');
  const [condition, parameters] = orderDateFilter('orders.createdAt >= :from', { from: '2026-10-15' }, true);
  assert.ok(condition.startsWith('(') && condition.endsWith(')'));
  assert.match(condition, /OR LOWER\(orders.status\) NOT IN/);
  assert.equal(parameters.from, '2026-10-15');
  assert.ok(parameters.activeTerminalStatuses.includes('completed'));
  assert.ok(!parameters.activeTerminalStatuses.includes('pending'));
  assert.equal(orderDateFilter('orders.createdAt >= :from', { from: '2026-10-15' }, false)[0], 'orders.createdAt >= :from');

  const states = [], effects = [], listeners = new Map(), intervals = [], requested = [];
  let index = 0;
  let handler;
  const row = (amount, minute = '01') => ({
    id: 'order-a', orderNumber: 'TEST-1', status: 'pending', totalPrice: String(amount),
    createdAt: '2026-10-14T09:00:00Z', updatedAt: `2026-10-15T10:${minute}:00Z`,
    Items: [{ id: 'line-a', productName: 'Tea', price: '50', quantity: 2, total: String(amount) }],
  });
  const response = (rows, totalPages = 1, page = 1, total = rows.length) => ({
    ok: true, json: async () => ({ data: rows, pagination: { total, page, totalPages } }),
  });
  const realtime = load('src/lib/staff-realtime.ts');
  const hooks = load('src/hooks/useOrders.ts', {
    react: {
      useCallback: (fn) => fn,
      useEffect: (fn) => effects.push(fn),
      useRef: (value) => ({ current: value }),
      useState: (value) => {
        const position = index++;
        states[position] = value;
        return [value, (next) => { states[position] = typeof next === 'function' ? next(states[position]) : next; }];
      },
    },
    '@/hooks/useAuth': { useAuth: () => ({ token: 'test-token' }) },
    '@/hooks/useActiveBusinessId': { useActiveBusinessId: () => 'business-a' },
    '@/contexts/DashboardRefreshContext': { useDashboardRefresh: () => ({ bumpDashboardRefresh() {} }) },
    '@/lib/constant': { BASE_URL: 'http://portal.example.test/backend' },
    '@/lib/staff-realtime': realtime,
    '@/lib/format-api-error': { parseApiErrorText: (message) => message },
    '@/lib/merge-order-session': load('src/lib/merge-order-session.ts'),
  }, {
    window: {
      addEventListener: (event, fn) => listeners.set(event, fn),
      removeEventListener: (event) => listeners.delete(event),
      setInterval: (fn) => { intervals.push(fn); return intervals.length; },
      clearInterval() {},
    },
    document: { visibilityState: 'visible', addEventListener() {}, removeEventListener() {} },
    fetch: async (url) => { requested.push(new URL(url)); return handler(new URL(url)); },
  });
  const hook = hooks.useOrders({ range: 'day' });
  handler = async () => response([row(100)]);
  await hook.refetch();
  assert.equal(requested[0].searchParams.get('includeActive'), 'true');
  assert.equal(states[0][0].totalPrice, '100');

  let releaseOlder;
  let requestCount = 0;
  handler = async () => ++requestCount === 1
    ? new Promise((resolve) => { releaseOlder = resolve; })
    : response([row(200, '02')]);
  const older = hook.refetch();
  await hook.refetch();
  releaseOlder(response([row(50)]));
  await older;
  assert.equal(states[0][0].totalPrice, '200', 'late GET must not restore an old amount');

  const cleanupRefresh = effects[1]();
  const cleanupPatch = effects[2]();
  handler = async () => response([row(300, '03')]);
  listeners.get(realtime.STAFF_REALTIME_EVENTS.ORDERS_PATCH)({ detail: { id: 'order-a', sessionMinutes: 15 } });
  await new Promise(setImmediate);
  assert.equal(states[0][0].totalPrice, '300', 'sparse timer event must reload rather than zero prices');
  listeners.get(realtime.STAFF_REALTIME_EVENTS.ORDERS_PATCH)({ detail: {
    ...row(3.75, '04'), Items: [],
  } });
  assert.equal(states[0][0].Items.length, 0, 'removing every product must retain an explicit empty list');
  assert.equal(states[0][0].totalPrice, '3.75');

  const catalog = Array.from({ length: 52 }, (_, i) => ({ ...row(i), id: `order-${i}` }));
  handler = async (url) => {
    const page = Number(url.searchParams.get('page'));
    const rows = catalog.slice((page - 1) * 20, page * 20);
    if (page === 2) rows.unshift(catalog[19]);
    return response(rows, 3, page, 52);
  };
  await hook.refetch();
  assert.equal(states[0].length, 52, 'active queue must include every API page');
  assert.equal(new Set(states[0].map((order) => order.id)).size, 52);
  assert.ok(listeners.has('focus'));
  assert.equal(intervals.length, 1);
  cleanupPatch();
  cleanupRefresh();
  console.log('Passed: browser-safe socket target, date-filtered history with older active orders, stale response protection, sparse events, removed lines, and complete order pagination.');
}
main().catch((error) => { console.error(error); process.exitCode = 1; });

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function load(relativePath, imports = {}, globals = {}) {
  const filename = path.join(__dirname, '..', relativePath);
  const source = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    fileName: filename,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.React },
  }).outputText;
  const exports = {};
  vm.runInNewContext(source, { exports, React: require('react'), require: (name) => {
    if (!(name in imports)) throw new Error(`Unexpected import: ${name}`);
    return imports[name];
  }, ...globals }, { filename });
  return exports;
}

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

// Run the real page handlers with controlled API responses and a small hook host.
function creditPageHarness({ deferSecondAccount = false } = {}) {
  const hooks = [];
  const effects = [];
  const listeners = new Map();
  const posts = [];
  const detailRequests = [];
  const secondAccount = deferred();
  const parties = [
    { id: 'a', name: 'Customer A', outstanding: 100 },
    { id: 'b', name: 'Customer B', outstanding: 40 },
  ];
  let index = 0;
  let dirty = true;
  let tree;
  let uuid = 0;
  const same = (a, b) => a && b && a.length === b.length && a.every((value, position) => Object.is(value, b[position]));
  const react = {
    Suspense: 'Suspense',
    useState(initial) {
      const position = index++;
      if (!hooks[position]) hooks[position] = { value: typeof initial === 'function' ? initial() : initial };
      return [hooks[position].value, (next) => {
        const value = typeof next === 'function' ? next(hooks[position].value) : next;
        if (!Object.is(value, hooks[position].value)) { hooks[position].value = value; dirty = true; }
      }];
    },
    useRef(initial) {
      const position = index++;
      return hooks[position] ??= { current: initial };
    },
    useMemo(callback, deps) {
      const position = index++;
      if (!hooks[position] || !same(hooks[position].deps, deps)) hooks[position] = { deps, value: callback() };
      return hooks[position].value;
    },
    useCallback(callback, deps) { return react.useMemo(() => callback, deps); },
    useEffect(callback, deps) {
      const position = index++;
      if (!hooks[position] || !same(hooks[position].deps, deps)) {
        const previous = hooks[position];
        hooks[position] = { deps };
        effects.push(() => { previous?.cleanup?.(); hooks[position].cleanup = callback(); });
      }
    },
  };
  const jsx = (type, props) => ({ type, props: props || {} });
  const events = {
    addEventListener(name, callback) {
      if (!listeners.has(name)) listeners.set(name, new Set());
      listeners.get(name).add(callback);
    },
    removeEventListener(name, callback) { listeners.get(name)?.delete(callback); },
  };
  const creditData = load('src/lib/credit-data.ts');
  const { default: CreditsPage } = load('src/app/dashboard/businessAdmin/retail/credits/page.tsx', {
    react,
    'react/jsx-runtime': { jsx, jsxs: jsx },
    'next/navigation': { useRouter: () => router, useSearchParams: () => ({ get: () => null }) },
    'lucide-react': new Proxy({}, { get: (_, name) => `Icon:${name}` }),
    sonner: { toast: { loading() {}, success() {}, error() {} } },
    '@/components/common/Loading': { default: 'Loading' },
    '@/components/admin/AdminShell': { default: 'AdminShell' },
    '@/components/admin/PortalPage': { PortalPage: 'PortalPage', PortalPageHeader: 'PortalPageHeader', FormField: 'FormField', portalInputClass: '' },
    '@/components/common/NumberInput': { NumberInput: 'NumberInput' },
    '@/hooks/useAuth': { useAuth: () => ({ role: 'business_admin', token: 'test' }) },
    '@/lib/pharmacy-role-nav': { canAccessWorkspacePage: () => true },
    '@/hooks/useActiveBusinessId': { useActiveBusinessId: () => 'business-a' },
    '@/lib/api-client': { apiClient: {
      async get(url) {
        if (url === '/credits/parties') return { data: parties, pagination: { total: 2 } };
        const id = url.split('/').pop();
        detailRequests.push(id);
        if (id === 'b' && deferSecondAccount) return secondAccount.promise;
        return { ...parties.find((party) => party.id === id), ledger: [] };
      },
      post(url, body) { const request = deferred(); posts.push({ body, ...request }); return request.promise; },
    } },
    '@/lib/credit-data': creditData,
    '@/lib/utils': { getStoredAuthToken: () => 'test' },
    '@/lib/staff-realtime': { STAFF_REALTIME_EVENTS: { CREDITS_CHANGED: 'credits:changed' } },
  }, {
    localStorage: { getItem: () => 'business_admin' },
    window: { ...events, setInterval: () => 1, clearInterval() {} },
    document: { ...events, visibilityState: 'visible' },
    crypto: { randomUUID: () => `payment-${++uuid}` },
  });
  const router = { replace() {} };
  const Content = CreditsPage().props.children.type;
  const nodes = (node) => {
    if (!node || typeof node !== 'object') return [];
    if (Array.isArray(node)) return node.flatMap(nodes);
    return [node, ...nodes(node.props?.children), ...nodes(node.props?.actions)];
  };
  const find = (predicate) => {
    const result = nodes(tree).find(predicate);
    assert.ok(result, 'expected page control is rendered');
    return result;
  };
  return {
    posts, detailRequests,
    async flush() {
      for (let step = 0; step < 35; step += 1) {
        if (dirty) { dirty = false; index = 0; tree = Content(); }
        while (effects.length) effects.shift()();
        await Promise.resolve();
      }
    },
    submit() { find((node) => node.type === 'form').props.onSubmit({ preventDefault() {} }); },
    selectSecond() { find((node) => node.props['aria-label'] === 'View Customer B account').props.onClick(); },
    resolveSecond() { secondAccount.resolve({ ...parties[1], ledger: [] }); },
    setAmount(value) { find((node) => node.type === 'NumberInput').props.onChange(value); },
    amount() { return find((node) => node.type === 'NumberInput').props.value; },
    setNote(value) { find((node) => node.props.placeholder === 'Payment reference or method').props.onChange({ target: { value } }); },
    note() { return find((node) => node.props.placeholder === 'Payment reference or method').props.value; },
    refresh() { for (const callback of listeners.get('credits:changed') || []) callback(); },
  };
}

async function testPageRaces() {
  const page = creditPageHarness({ deferSecondAccount: true });
  await page.flush();
  page.setAmount(20);
  await page.flush();
  page.submit();
  page.submit();
  assert.equal(page.posts.length, 1, 'a synchronous submit lock prevents duplicate repayments');
  await page.flush();
  page.selectSecond();
  await page.flush();
  page.posts[0].resolve({});
  await page.flush();
  assert.equal(page.detailRequests.filter((id) => id === 'a').length, 1, 'old payment completion must not invalidate the newly selected ledger request');
  page.resolveSecond();
  await page.flush();
  assert.equal(page.amount(), 40, 'new account ledger finishes after the old account payment');
  page.setAmount(12.5);
  page.setNote('Draft payment note');
  await page.flush();
  page.refresh();
  await page.flush();
  assert.equal(page.amount(), 12.5, 'background refresh preserves the entered repayment amount');
  assert.equal(page.note(), 'Draft payment note', 'background refresh preserves the payment note');

  const switched = creditPageHarness();
  await switched.flush();
  switched.submit();
  switched.selectSecond();
  await switched.flush();
  switched.setAmount(15);
  switched.setNote('Customer B note');
  await switched.flush();
  switched.posts[0].resolve({});
  await switched.flush();
  assert.equal(switched.amount(), 15, 'another account payment must not change the selected account amount');
  assert.equal(switched.note(), 'Customer B note', 'another account payment must not clear the selected account note');

  const retry = creditPageHarness();
  await retry.flush();
  retry.setAmount(150);
  await retry.flush();
  retry.submit();
  assert.equal(retry.posts.length, 0, 'overpayments are blocked by the handler');
  retry.setAmount(10);
  await retry.flush();
  retry.submit();
  retry.posts[0].reject(new Error('Response lost'));
  await retry.flush();
  retry.submit();
  assert.equal(retry.posts.length, 2);
  assert.equal(retry.posts[0].body.clientTxnId, retry.posts[1].body.clientTxnId, 'retrying an uncertain payment reuses its idempotency key');
  retry.posts[1].resolve({});
  await retry.flush();
}

async function main() {
  const { normalizeCreditParties, creditAccountSummary } = load('src/lib/credit-data.ts');
  const parties = [
    { id: 'customer-1', name: 'First customer', outstanding: '1250.75' },
    { id: 'customer-2', name: 'Settled customer', outstanding: '0.00' },
    { id: 'customer-3', name: 'Third customer', outstanding: '25.50' },
  ];
  const envelope = { success: true, data: parties, pagination: { total: 3, limit: 3, page: 1, totalPages: 1 } };
  const { apiClient } = load('src/lib/api-client.ts', {
    sonner: { toast: { error() {} } },
    '@/lib/constant': { BASE_URL: 'http://localhost/api' },
    '@/lib/api': { buildApiUrl: (value) => value, unwrapApiData: (value) => value.data ?? value },
    '@/lib/utils': { getStoredAuthToken: () => 'test', normalizeErrorMessage: () => 'failed' },
    '@/lib/business-session': { isPortalSessionEndedPayload: () => false },
    '@/lib/authenticated-base-query': { redirectToLogin() {} },
    '@/lib/features/auth/authSlice': { logout() {} },
    '@/lib/store': { store: { dispatch() {} } },
    '@/lib/diginizam-client': { DIGINIZAM_CLIENT: 'portal', DIGINIZAM_CLIENT_HEADER: 'x-client' },
  }, { fetch: async () => ({ ok: true, json: async () => envelope }) });

  // Exercise the actual API client contract that previously turned real accounts into [].
  const response = await apiClient.get('/credits/parties', 'test', 'business-1');
  assert.equal(Array.isArray(response), false, 'API client preserves pagination metadata');
  const normalized = normalizeCreditParties(response);
  assert.equal(normalized.length, 3);
  assert.equal(normalized[0].outstanding, 1250.75);
  assert.equal(normalized[2].outstanding, 25.5);
  assert.equal(creditAccountSummary(normalized).balance, 1276.25);
  assert.equal(creditAccountSummary(normalized).outstanding, 2);
  assert.equal(creditAccountSummary(normalized).settled, 1);
  assert.equal(normalizeCreditParties(parties).length, 3, 'legacy array response remains supported');
  assert.equal(normalizeCreditParties({ data: envelope }).length, 3, 'nested envelopes remain supported');
  assert.equal(normalizeCreditParties({ data: [], pagination: { total: 0 } }).length, 0, 'a truly empty ledger stays empty');
  assert.throws(() => normalizeCreditParties({ data: parties, pagination: { total: 40 } }), /complete ledger/);
  assert.throws(() => normalizeCreditParties({ error: 'server unavailable' }), /could not be read/);
  assert.throws(() => normalizeCreditParties([{ id: 'bad', outstanding: 'NaN' }]), /invalid balance/);
  await testPageRaces();
  console.log('Credit envelope, exact balances, request races, draft preservation, and idempotent payment regressions passed.');
}

main().catch((error) => { console.error(error); process.exitCode = 1; });

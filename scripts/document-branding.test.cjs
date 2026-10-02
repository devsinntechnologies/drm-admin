const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '../src/components/admin/DocumentBranding.tsx'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;

test('branding preserves React-owned metadata nodes across route and business changes', () => {
  const links = ['icon', 'shortcut icon', 'apple-touch-icon'].map(rel => ({ rel, href: '/logo-mark.svg' }));
  const original = [...links];
  const document = {
    title: '',
    head: {
      querySelector: selector => links.find(link => selector === `link[rel="${link.rel}"]`) || null,
      appendChild: link => links.push(link),
    },
    createElement: () => ({}),
    querySelectorAll: () => { throw new Error('Do not remove framework-owned metadata nodes'); },
  };
  const sandbox = { exports: {}, document, require: () => ({ useEffect() {} }) };
  vm.runInNewContext(compiled, sandbox);
  const apply = sandbox.exports.applyDocumentBranding;
  apply(' Business A ', '/a.png');
  assert.equal(document.title, 'Business A');
  apply('Orders', '/b.svg?v=2');
  assert.equal(document.title, 'Orders');
  assert.equal(links.length, 3);
  links.forEach((link, index) => {
    assert.equal(link, original[index]);
    assert.equal(link.href, '/b.svg?v=2');
    assert.equal(link.type, 'image/svg+xml');
  });
  apply(' ', null);
  assert.equal(document.title, 'DigiNizam Admin');
  assert.equal(links[0].href, '/logo-mark.svg');
  links.length = 0;
  apply('New workspace', 'data:image/png;base64,example');
  apply('Next page', 'data:image/png;base64,example');
  assert.equal(links.length, 3, 'Repeated branding must not append duplicate links');
  assert.equal(links[0].type, 'image/png');
});

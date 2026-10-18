// Portal invoice-template preview must print the same receipt as the POS.
// Golden files come from diginizam-flutter test/fixtures/receipt_templates
// (UPDATE_GOLDENS=1 flutter test test/receipt_templates_test.dart).
// Run: node scripts/receipt-templates.test.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function load(relativePath) {
  const filename = path.join(__dirname, '..', relativePath);
  const source = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const exports = {};
  vm.runInNewContext(source, { exports, require: (name) => {
    throw new Error(`Unexpected import: ${name}`);
  }, globalThis: { crypto: require('node:crypto').webcrypto } }, { filename });
  return exports;
}

const receipt = load('src/lib/receipt-templates.ts');
const fixtures = path.join(__dirname, 'fixtures', 'receipt-templates');

const customSettings = receipt.parseReceiptSettings({
  receipt: {
    templateId: 'detailed',
    allowedTemplateIds: ['classic', 'detailed'],
    showLogo: false,
    showQr: false,
    showPoweredBy: false,
    headerNote: 'Desi taste since 1998',
    footerNote: 'Thank you! Please visit again',
    paymentLines: ['EasyPaisa 0300-1234567', 'JazzCash 0321-7654321'],
  },
});

function render(templateId, scenario, settings) {
  const lines = receipt.buildReceiptLines(templateId, receipt.buildReceiptSample(scenario), settings);
  return receipt.renderReceiptText(lines, { placeholders: true });
}

let checked = 0;
for (const templateId of receipt.RECEIPT_TEMPLATE_IDS) {
  const cases = [
    ...receipt.RECEIPT_SAMPLE_SCENARIOS.map(({ id }) => [`${templateId}_${id}`, id, receipt.DEFAULT_RECEIPT_SETTINGS]),
    [`${templateId}_custom`, 'dineIn', customSettings],
  ];
  for (const [name, scenario, settings] of cases) {
    const expected = fs.readFileSync(path.join(fixtures, `${name}.txt`), 'utf8');
    assert.equal(render(templateId, scenario, settings), expected, `${name} differs from the POS golden`);
    checked++;
  }
}

// Business copies made in the invoice editor (same JSON as the Flutter test).
const copies = receipt.parseReceiptSettings({
  receipt: {
    templateId: 'custom-classic1',
    allowedTemplateIds: ['classic', 'custom-classic1', 'custom-compact1', 'custom-modern1'],
    customTemplates: [
      {
        id: 'custom-classic1',
        name: 'Classic (Lahore)',
        baseTemplateId: 'classic',
        logoMode: 'custom',
        logoUrl: 'uploads/receipt-logos/logo-test.png',
        logoWidth: 200,
        paddingLeft: 2,
        paddingRight: 2,
        divider: '=',
        feedLines: 3,
        hidden: ['wallet', 'qr', 'guests'],
        styles: {
          storeName: { size: 2 },
          footerNote: { align: 'left', bold: true },
          items: { bold: true },
        },
        labels: { total: 'TOTAL DUE', itemHeader: 'Dish' },
        footerNote: 'Thank you!',
      },
      {
        id: 'custom-compact1',
        name: 'Compact + logo',
        baseTemplateId: 'compact',
        logoMode: 'default',
        paddingRight: 1,
        divider: 'none',
        feedLines: 0,
        hidden: ['phone'],
        qrUrl: 'https://example.com/menu',
      },
      {
        id: 'custom-modern1',
        name: 'Modern quiet',
        baseTemplateId: 'modern',
        logoMode: 'none',
        hidden: ['banner', 'poweredBy', 'details'],
        labels: { total: 'PAY', orderNo: 'TOKEN' },
        styles: { orderNo: { size: 3 } },
      },
    ],
  },
});
for (const copy of copies.customTemplates) {
  const doc = receipt.composeReceipt(copy.id, receipt.buildReceiptSample('dineIn'), copies);
  const expected = fs.readFileSync(path.join(fixtures, `${copy.id}.txt`), 'utf8');
  assert.equal(receipt.renderReceiptDocument(doc, { placeholders: true }), expected, `${copy.id} differs from the POS golden`);
  checked++;
}
const classicCopy = receipt.composeReceipt('custom-classic1', receipt.buildReceiptSample('dineIn'), copies);
const logo = classicCopy.lines.find((l) => l.kind === 'logo');
assert.equal(logo.url, 'uploads/receipt-logos/logo-test.png');
assert.equal(logo.width, 200);

// Copies survive a save round-trip unchanged.
const reparsed = receipt.parseReceiptSettings({ receipt: receipt.serializeReceiptSettings(copies) });
assert.deepEqual(
  JSON.parse(JSON.stringify(receipt.serializeReceiptSettings(reparsed))),
  JSON.parse(JSON.stringify(receipt.serializeReceiptSettings(copies))),
);
const fresh = receipt.copyOfTemplate('compact', receipt.parseReceiptSettings({ receipt: { footerNote: 'Shukriya' } }));
assert.equal(fresh.name, 'Compact (custom)');
assert.equal(fresh.footerNote, 'Shukriya');
assert.ok(fresh.hidden.includes('logo') && fresh.hidden.includes('qr'));
assert.match(receipt.newCustomTemplateId(), /^custom-[0-9a-f]{10}$/);

// Settings round-trip and defaults (mirror Flutter ReceiptSettings.fromJson).
assert.deepEqual(
  { ...receipt.parseReceiptSettings(undefined) },
  { ...receipt.DEFAULT_RECEIPT_SETTINGS },
);
const parsed = receipt.parseReceiptSettings({
  receipt: { templateId: 'modern', allowedTemplateIds: ['nope', 'compact'] },
});
assert.equal(parsed.templateId, 'modern');
assert.deepEqual([...parsed.allowedTemplateIds], ['compact', 'modern']);
assert.equal(receipt.parseReceiptSettings({ receipt: { templateId: 'nope' } }).templateId, 'classic');

const saved = receipt.serializeReceiptSettings({ ...customSettings, allowedTemplateIds: ['compact'] });
assert.deepEqual([...saved.allowedTemplateIds], ['compact', 'detailed']);
assert.equal(saved.qrUrl, '', 'default QR URL is stored empty');
assert.equal('paymentLines' in receipt.serializeReceiptSettings(receipt.DEFAULT_RECEIPT_SETTINGS), false,
  'legacy wallet numbers stay implicit until an admin edits them');

console.log(`receipt templates: ${checked} goldens match the POS, settings checks passed`);

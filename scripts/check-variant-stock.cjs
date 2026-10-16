const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

const source = fs.readFileSync('src/app/dashboard/businessAdmin/orders/page.tsx', 'utf8');
const tree = ts.createSourceFile('page.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const functions = {};
function visit(node) {
  if (ts.isVariableDeclaration(node) && ['handleAddToCart', 'getProductDefaultVariant'].includes(node.name.getText(tree))) {
    functions[node.name.getText(tree)] = node.initializer.getText(tree);
  }
  ts.forEachChild(node, visit);
}
visit(tree);
let cart = [];
const context = vm.createContext({
  setCartItems: update => { cart = update(cart); },
  isUuid: id => Boolean(id),
});
for (const [name, expression] of Object.entries(functions)) {
  const js = ts.transpile(`const ${name} = ${expression};`, { target: ts.ScriptTarget.ES2020 });
  vm.runInContext(`${js}\nglobalThis.${name} = ${name};`, context);
}
const product = { id: 'p', isStockEnabled: true, inStock: 0,
  variants: [0, 0, 1, 2, 3].map((inStock, i) => ({ id: `v${i}`, name: `Size ${i}`, price: 10, inStock })) };
assert.equal(context.getProductDefaultVariant(product).id, 'v2');
context.handleAddToCart(product, product.variants[0]);
assert.equal(cart.length, 0);
for (const variant of product.variants.slice(2)) context.handleAddToCart(product, variant);
assert.equal(cart.length, 3);
context.handleAddToCart(product, product.variants[2]);
assert.equal(cart.find(line => line.variantId === 'v2').quantity, 1);
context.handleAddToCart({ ...product, isStockEnabled: false }, product.variants[0]);
assert.equal(cart.length, 4);
assert.equal(context.getProductDefaultVariant({ ...product, variants: product.variants.slice(0, 2) }), null);
console.log('Passed: mixed variant stock, available default, sold-out selection, quantity cap, untracked products, all sold out.');

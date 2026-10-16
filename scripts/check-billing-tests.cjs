const fs = require('node:fs');
const ts = require('typescript');

// Run the TypeScript billing tests with Node's built-in test runner.
require.extensions['.ts'] = (module, filename) => {
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
    fileName: filename,
  });
  module._compile(outputText, filename);
};

require('../src/lib/invoice-totals.test.ts');
require('../src/lib/session-billing.util.test.ts');

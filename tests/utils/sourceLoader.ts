const fs = require('fs');
const path = require('path');
const ts = require('typescript');

function readTranspiledSource(relativePath) {
  const sourcePath = path.resolve(__dirname, '..', '..', relativePath);
  const source = fs.readFileSync(sourcePath, 'utf8');
  return ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.None,
    },
    fileName: sourcePath,
  }).outputText;
}

module.exports = { readTranspiledSource };

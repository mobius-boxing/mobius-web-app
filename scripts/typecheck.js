// `tsc --noEmit` is blind here: TypeScript 4.9 cannot parse i18next's `<const T>`
// declarations, and the CLI skips every semantic check once a syntax error exists
// anywhere in the program. The compiler API does not, so this reports src/ only,
// the same way the CRA build's fork-ts-checker does.
const path = require('path');
const ts = require('typescript');

const configPath = path.resolve(__dirname, '..', 'tsconfig.json');
const config = ts.getParsedCommandLineOfConfigFile(configPath, {}, {
  ...ts.sys,
  onUnRecoverableConfigFileDiagnostic: (d) => { throw new Error(ts.flattenDiagnosticMessageText(d.messageText, '\n')); },
});
const program = ts.createProgram(config.fileNames, { ...config.options, noEmit: true });
const srcRoot = path.resolve(__dirname, '..', 'src') + path.sep;
// Same exclusions as react-scripts' fork-ts-checker: tests are not type-checked by the build.
const isTestFile = (f) => /(^|[\/\\])(__tests__|test-utils)[\/\\]|\.test\.[jt]sx?$|[\/\\]setupTests\.[jt]s$/.test(f);
const diagnostics = [];
for (const sf of program.getSourceFiles()) {
  const file = path.resolve(sf.fileName);
  if (!file.startsWith(srcRoot) || isTestFile(file)) continue;
  diagnostics.push(...program.getSyntacticDiagnostics(sf), ...program.getSemanticDiagnostics(sf));
}
const errors = diagnostics.filter((d) => d.category === ts.DiagnosticCategory.Error);
for (const d of errors) {
  const where = d.file && d.start !== undefined
    ? `${path.relative(process.cwd(), d.file.fileName)}(${d.file.getLineAndCharacterOfPosition(d.start).line + 1})`
    : '';
  console.error(`${where}: error TS${d.code}: ${ts.flattenDiagnosticMessageText(d.messageText, '\n')}`);
}
process.exit(errors.length ? 1 : 0);

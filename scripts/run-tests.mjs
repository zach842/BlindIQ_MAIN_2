import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const output = mkdtempSync(join(tmpdir(), 'blindiq-tests-'));
try {
  const compile = spawnSync(process.execPath, [resolve('node_modules/typescript/bin/tsc'),
    '--module', 'commonjs', '--moduleResolution', 'node', '--target', 'ES2022',
    '--skipLibCheck', '--strict', '--outDir', output,
    'src/data.ts', 'src/harvestLimits.ts', 'src/seasonStatus.ts', 'src/gameCatalog.ts', 'src/huntingLocations.ts'], { stdio: 'inherit' });
  if (compile.status !== 0) process.exitCode = compile.status ?? 1;
  else {
    writeFileSync(join(output, 'package.json'), '{"type":"commonjs"}');
    const run = spawnSync(process.execPath, ['--test', 'tests/regulations.test.cjs', 'tests/species.test.cjs'], {
      stdio: 'inherit', env: { ...process.env, BLINDIQ_TEST_OUTPUT: output },
    });
    process.exitCode = run.status ?? 1;
  }
} finally {
  rmSync(output, { recursive: true, force: true });
}

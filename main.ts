// Token Launch Radar (model radar-2-shrunk): score the sealed snapshot and lay out the entry's output.
//
// Run it from this repository's root with Node 22 or later, standard library only:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts --input <snapshot.json|directory>
//
// The dashboard is a static page, no framework and no network: dashboard/index.html,
// dashboard/app.css and dashboard/app.js read data.js, which this program writes from the
// same board it scores. The model lives in lib/model.ts; this file only wires the pipeline.
//
// What it does, in order:
//   1. reads the snapshot (--input, default /input/snapshot.json),
//   2. scores every pre-token protocol with the model in lib/model.ts,
//   3. refuses to continue if the board would fail the gate (boardIssue),
//   4. writes board.json and data.js, copies dashboard/ and screenshots/,
//   5. writes dossier.json last, with the vendored make.fun library, so the
//      scorer can rebuild it from the output and compare the bytes exactly.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output.

import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { boardIssue, buildRadar, dataScript, parseSnapshot } from './lib/model.ts';
import { buildDossier } from './vendor/makefun-board.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));

/** The scorer's own caps: the text cap shapes the bytes, the rest refuse. */
const TEXT_MAX_BYTES = 65_536;
const SCREENSHOT_CAPS = { max: 4, max_bytes: 524_288 };
const IMAGE_NAME = /^[A-Za-z0-9_][A-Za-z0-9._-]{0,127}$/;

/** The value after `--name <value>` or `--name=<value>`, or the fallback when absent. */
function flagValue(name: string, fallback: string): string {
  const position = process.argv.indexOf(`--${name}`);
  if (position >= 0 && position + 1 < process.argv.length) return process.argv[position + 1]!;
  const joined = process.argv.find((a) => a.startsWith(`--${name}=`));
  return joined === undefined ? fallback : joined.slice(name.length + 3);
}

const inputArg = flagValue('input', '/input');
const snapshotPath = inputArg.endsWith('.json') ? inputArg : join(inputArg, 'snapshot.json');
if (!existsSync(snapshotPath)) {
  process.stderr.write(`token radar: no snapshot at ${snapshotPath}: pass --input <snapshot.json|directory> or mount the sealed /input\n`);
  process.exit(2);
}
const outDir = flagValue('output', process.env.MAKEFUN_OUTPUT_DIR ?? '/output');

const snapshot = parseSnapshot(readFileSync(snapshotPath, 'utf8'));
const { board, radar } = buildRadar(snapshot);
const boardProblem = boardIssue(board, snapshot);
if (boardProblem !== null) {
  process.stderr.write(`token radar: the model wrote a board the gate refuses: ${boardProblem}\n`);
  process.exit(1);
}

mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'board.json'), `${JSON.stringify({ rows: board })}\n`);
writeFileSync(join(outDir, 'data.js'), dataScript(radar));

/** Copy one directory's regular files into `to`, skipping names that start with a dot. */
function copyFiles(from: string, to: string): string[] {
  if (!existsSync(from)) return [];
  mkdirSync(to, { recursive: true });
  const copied: string[] = [];
  for (const name of readdirSync(from)) {
    if (name.startsWith('.')) continue;
    const source = join(from, name);
    if (!statSync(source).isFile()) continue;
    copyFileSync(source, join(to, name));
    copied.push(name);
  }
  return copied;
}

copyFiles(join(repoRoot, 'dashboard'), join(outDir, 'dashboard'));
const shots = copyFiles(join(repoRoot, 'screenshots'), join(outDir, 'screenshots'));
if (shots.length < 3) {
  process.stderr.write(`token radar: screenshots/ holds ${shots.length} image${shots.length === 1 ? '' : 's'}: hand in 3, the board, a detail view and a filtered view\n`);
  process.exit(1);
}
for (const name of shots) {
  if (!IMAGE_NAME.test(name)) {
    process.stderr.write(`token radar: screenshots/${name}: a name is letters, digits and . _ -, 1 to 128 characters\n`);
    process.exit(1);
  }
}

// The dossier is written last: the scorer rebuilds it from this output and compares bytes.
writeFileSync(join(outDir, 'dossier.json'), buildDossier(outDir, { text_max_bytes: TEXT_MAX_BYTES, screenshots: SCREENSHOT_CAPS, dashboard: { max_files: 400, max_bytes: 4_194_304 } }));

process.stdout.write(
  `token radar: ${snapshot.protocols.length} protocols in the snapshot, ${snapshot.watchlist.length} on the watchlist, ${board.length} rows scored (${radar.early_size} early, ${radar.live_size} live set aside)\n` +
    `token radar: board ${join(outDir, 'board.json')}, data ${join(outDir, 'data.js')}, dashboard ${join(outDir, 'dashboard')} (3 files), screenshots ${join(outDir, 'screenshots')} (${shots.length} images), dossier ${join(outDir, 'dossier.json')}\n`,
);

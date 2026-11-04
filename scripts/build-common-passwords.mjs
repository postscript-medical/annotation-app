// Builds src/lib/server/data/common-passwords.txt, the fallback list that password.ts uses when
// the HIBP range API is unreachable (auth-spec §1, execution plan 1.7).
//
// Source: SecLists `Passwords/Common-Credentials/Pwdb_top-10000000.txt` (MIT, Daniel Miessler),
//   https://github.com/danielmiessler/SecLists. Download it yourself, outside the repo, then:
//
//   node scripts/build-common-passwords.mjs /path/to/Pwdb_top-10000000.txt
//
// Only the 1,000,000 most common entries are read. Each is NFKC-normalised and lower-cased (the
// check is case-insensitive), and only entries the policy would otherwise accept are kept:
// at least 15 code points and at most 72 bytes. Everything shorter is rejected by length anyway.
// The result is about 5,300 lines (~100 KB) and is bundled into the server build.
import { createReadStream, writeFileSync } from 'node:fs';
import { createInterface } from 'node:readline';

const TOP = 1_000_000;
const MIN_CHARS = 15;
const MAX_BYTES = 72;
const OUT = 'src/lib/server/data/common-passwords.txt';

const source = process.argv[2];
if (!source) {
	console.error('Usage: node scripts/build-common-passwords.mjs <path to Pwdb_top-10000000.txt>');
	process.exit(1);
}

const seen = new Set();
const lines = createInterface({ input: createReadStream(source, 'utf8'), crlfDelay: Infinity });
let read = 0;
for await (const line of lines) {
	if (read++ >= TOP) break;
	const entry = line.normalize('NFKC').toLowerCase();
	if (entry.includes('�') || /[\r\n]/.test(entry)) continue;
	if ([...entry].length < MIN_CHARS || Buffer.byteLength(entry) > MAX_BYTES) continue;
	seen.add(entry);
}

writeFileSync(OUT, [...seen].join('\n') + '\n');
console.log(`Wrote ${seen.size} entries to ${OUT}`);

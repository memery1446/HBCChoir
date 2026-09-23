#!/usr/bin/env node
/**
 * clean-week.mjs
 *
 * Removes files belonging to songs that are no longer in use. A song is
 * kept if its slug appears in content/week.json or content/demo.json.
 * Everything else is last week's leftovers.
 *
 *   npm run clean            list what would go, delete nothing
 *   npm run clean -- --apply actually delete
 *   npm run clean -- --apply --keep-sources   leave PDFs and pptx alone
 *
 * Everything here is in git, so an accidental delete is recoverable with
 * git restore. Still, read the dry run first.
 */

import { readdirSync, existsSync, rmSync, statSync, readFileSync } from 'node:fs';
import path from 'node:path';

const APPLY        = process.argv.includes('--apply');
const KEEP_SOURCES = process.argv.includes('--keep-sources');

/* Where files live, and how to get a slug back out of a filename. */
const PARTS = 'all|melody|harmony|harmony2|alto|tenor|bass|piano|helper';

const DIRS = [
    { dir: 'audio',              re: new RegExp(`^(.+)\\.(${PARTS})\\.mp3$`),   source: false },
    { dir: 'sheet-music-images', re: /^(.+)\.sheet\.\d+\.png$/i,                source: false },
    { dir: 'lyric-slide-images', re: /^(.+)\.lyric\.\d+\.png$/i,                source: false },
    { dir: 'sheet-music',        re: /^(.+)\.pdf$/i,                            source: true  },
    { dir: 'lyric-slides-pdfs',  re: /^(.+)\.pdf$/i,                            source: true  },
    { dir: 'pptx-files',         re: /^(.+)\.pptx$/i,                           source: true  }
];

function slugsFrom(file) {
    const p = path.join('content', file);
    if (!existsSync(p)) return [];
    const data = JSON.parse(readFileSync(p, 'utf8'));
    const rows = data.order || data.songs || [];
    return rows.map(r => r.slug).filter(Boolean);
}

const keep = new Set([...slugsFrom('week.json'), ...slugsFrom('demo.json')]);

if (!keep.size) {
    console.error('\n  No slugs found in week.json or demo.json. Refusing to run.\n');
    process.exit(1);
}

/* Group every removable file by the song it belongs to. */
const doomed = {};
let bytes = 0;

for (const { dir, re, source } of DIRS) {
    if (!existsSync(dir)) continue;
    if (source && KEEP_SOURCES) continue;

    for (const file of readdirSync(dir).filter(f => !f.startsWith('.'))) {
        const m = file.match(re);
        if (!m) continue;
        const slug = m[1];
        if (keep.has(slug)) continue;

        const full = path.join(dir, file);
        (doomed[slug] = doomed[slug] || []).push(full);
        bytes += statSync(full).size;
    }
}

const slugs = Object.keys(doomed).sort();

console.log(`\n  Keeping ${keep.size} songs: ${[...keep].sort().join(', ')}\n`);

if (!slugs.length) {
    console.log('  Nothing to remove.\n');
    process.exit(0);
}

for (const slug of slugs) {
    const files = doomed[slug];
    const size = files.reduce((n, f) => n + statSync(f).size, 0);
    console.log(`  ${slug}  (${files.length} files, ${(size / 1048576).toFixed(1)}MB)`);
    for (const f of files) console.log(`      ${f}`);
    console.log('');
}

const total = slugs.reduce((n, s) => n + doomed[s].length, 0);

if (!APPLY) {
    console.log(`  ${total} files, ${(bytes / 1048576).toFixed(1)}MB would be removed.`);
    console.log('  Nothing deleted. Re-run with --apply to do it.\n');
    process.exit(0);
}

for (const slug of slugs) for (const f of doomed[slug]) rmSync(f);
console.log(`  Removed ${total} files, ${(bytes / 1048576).toFixed(1)}MB.\n`);
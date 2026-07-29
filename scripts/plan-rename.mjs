#!/usr/bin/env node
/**
 * plan-rename.mjs
 *
 * Scans audio/, sheet-music-images/, lyric-slide-images/ and proposes new
 * names following the convention. Writes rename-plan.tsv for you to review.
 * Renames nothing. Review the file, fix the REVIEW rows, then run
 * apply-rename.mjs.
 *
 *   node scripts/plan-rename.mjs
 */

import { readdirSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

const DIRS = [
    { dir: 'audio',              kind: 'audio' },
    { dir: 'sheet-music-images', kind: 'sheet' },
    { dir: 'lyric-slide-images', kind: 'lyric' }
];

/* Old part tokens -> new. 'all' has always meant the melody-prominent mix. */
const PART_MAP = {
    all: 'melody', melody: 'melody',
    alto: 'alto', tenor: 'tenor', bass: 'bass', piano: 'piano',
    'harm.1': 'tenor',   // REVIEW: verify against how you recorded these
    'harm.2': 'alto'     // REVIEW: in current.json this also served bass
};

function slugify(s) {
    return s
        .replace(/^Copy of /i, '')
        .replace(/^\d+\./, '')           // strip the weekly service-position prefix
        .replace(/['’]/g, '')
        .replace(/[.\s_]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .toLowerCase();
}

const rows = [];

for (const { dir, kind } of DIRS) {
    if (!existsSync(path.join(ROOT, dir))) continue;

    for (const file of readdirSync(path.join(ROOT, dir)).filter(f => !f.startsWith('.'))) {
        let slug = null, newName = null, review = '';

        if (kind === 'audio') {
            if (!file.endsWith('.mp3')) continue;
            let stem = file.replace(/\.mp3$/, '').replace(/\.HL$/i, '');

            // longest matching part token at the end of the stem
            const token = Object.keys(PART_MAP)
                .sort((a, b) => b.length - a.length)
                .find(t => stem.toLowerCase().endsWith('.' + t) || stem.toLowerCase().endsWith('-' + t));

            if (token) {
                stem = stem.slice(0, stem.length - token.length - 1);
                slug = slugify(stem);
                newName = `${slug}.${PART_MAP[token]}.mp3`;
                if (token.startsWith('harm')) review = `REVIEW mapped ${token} -> ${PART_MAP[token]}`;
            } else {
                slug = slugify(stem);
                newName = `${slug}.melody.mp3`;
                review = 'REVIEW no part token found, guessed melody';
            }

        } else {
            if (!/\.(png|jpe?g)$/i.test(file)) continue;
            const m = file.match(/^(.*)-(\d+)\.(png|jpe?g)$/i);
            if (!m) { rows.push([dir, file, '', 'REVIEW no page number found']); continue; }
            slug = slugify(m[1]);
            const n = String(Number(m[2]) + 1).padStart(2, '0');  // 1-based, zero padded
            newName = `${slug}.${kind}.${n}.${m[3].toLowerCase()}`;
        }

        rows.push([dir, file, newName, review]);
    }
}

/* Flag near-duplicate slugs, e.g. surely-the-presence vs
   surely-the-presence-of-the-lord, which need to be merged by hand. */
const slugs = [...new Set(rows.map(r => r[2].split('.')[0]).filter(Boolean))].sort();
const collisions = [];
for (const a of slugs) {
    for (const b of slugs) {
        if (a !== b && b.startsWith(a + '-')) collisions.push(`${a}  vs  ${b}`);
    }
}

/* Flag collisions where two different old files map to the same new name. */
const seen = {};
rows.forEach(r => { if (r[2]) (seen[r[0] + '/' + r[2]] = seen[r[0] + '/' + r[2]] || []).push(r[1]); });
Object.entries(seen).forEach(([target, sources]) => {
    if (sources.length > 1) {
        rows.forEach(r => {
            if (sources.includes(r[1]) && r[0] + '/' + r[2] === target) {
                r[3] = (r[3] ? r[3] + '; ' : '') + 'REVIEW collides with ' + sources.filter(s => s !== r[1]).join(', ');
            }
        });
    }
});

const tsv = ['folder\told\tnew\tnote', ...rows.map(r => r.join('\t'))].join('\n') + '\n';
writeFileSync(path.join(ROOT, 'rename-plan.tsv'), tsv);

const needsReview = rows.filter(r => r[3]).length;
console.log(`\n  ${rows.length} files planned, ${needsReview} need review`);
console.log(`  Wrote rename-plan.tsv\n`);

if (collisions.length) {
    console.log('  Similar slugs, probably the same song under two names:');
    [...new Set(collisions)].forEach(c => console.log('    ' + c));
    console.log('');
}

console.log('  Next: open rename-plan.tsv, fix every row with a note,');
console.log('        then run  node scripts/apply-rename.mjs --dry\n');


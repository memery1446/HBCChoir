#!/usr/bin/env node
/**
 * apply-rename.mjs
 *
 * Reads the reviewed rename-plan.tsv and renames with `git mv` so history
 * follows the files.
 *
 *   node scripts/apply-rename.mjs --dry    show what would happen
 *   node scripts/apply-rename.mjs          do it
 *
 * Refuses to run if any row still has a note. Commit your work first;
 * this touches a lot of files at once.
 *
 * Case-only renames (Gratitude.piano.mp3 -> gratitude.piano.mp3) are done
 * in two steps through a temporary name. macOS is case-insensitive, so a
 * direct rename looks like overwriting a file that already exists.
 */

import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const ROOT = process.cwd();
const DRY  = process.argv.includes('--dry');

const lines = readFileSync(path.join(ROOT, 'rename-plan.tsv'), 'utf8')
    .split('\n').filter(Boolean).slice(1);

const rows = lines.map(l => {
    const [folder, oldName, newName, note = ''] = l.split('\t');
    return { folder, oldName, newName, note: note.trim() };
});

const blocked = rows.filter(r => r.note);
if (blocked.length) {
    console.log(`\n  ${blocked.length} rows still have notes. Resolve them and clear the note column:\n`);
    blocked.slice(0, 20).forEach(r => console.log(`    ${r.folder}/${r.oldName}\n      ${r.note}`));
    if (blocked.length > 20) console.log(`    ... and ${blocked.length - 20} more`);
    console.log('');
    process.exit(1);
}

/* Two files in the plan wanting the same destination is a real conflict,
   and worth catching before touching anything. */
const targets = {};
rows.forEach(r => { if (r.newName) (targets[r.folder + '/' + r.newName] ??= []).push(r.oldName); });
const clashes = Object.entries(targets).filter(([, srcs]) => srcs.length > 1);
if (clashes.length) {
    console.log('\n  Two sources map to the same destination:\n');
    clashes.forEach(([t, srcs]) => console.log(`    ${t}\n      <- ${srcs.join('\n      <- ')}`));
    console.log('');
    process.exit(1);
}

const git = args => execFileSync('git', args, { cwd: ROOT });

let done = 0, skipped = 0, caseOnly = 0;

for (const { folder, oldName, newName } of rows) {
    if (!newName || oldName === newName) { skipped++; continue; }

    const from = path.join(folder, oldName);
    const to   = path.join(folder, newName);

    if (!existsSync(path.join(ROOT, from))) {
        console.log(`  skip (gone)    ${from}`);
        skipped++;
        continue;
    }

    /* Same file, different capitalisation. Not a collision. */
    const isCaseOnly = oldName.toLowerCase() === newName.toLowerCase();

    if (!isCaseOnly && existsSync(path.join(ROOT, to))) {
        console.log(`\n  STOP: ${to} already exists and is a different file.\n`);
        process.exit(1);
    }

    console.log(`  ${from}\n    -> ${newName}${isCaseOnly ? '   (case only)' : ''}`);

    if (!DRY) {
        if (isCaseOnly) {
            const tmp = path.join(folder, `${newName}.tmp-rename`);
            git(['mv', from, tmp]);
            git(['mv', tmp, to]);
        } else {
            git(['mv', from, to]);
        }
    }

    if (isCaseOnly) caseOnly++;
    done++;
}

console.log(`\n  ${DRY ? 'Would rename' : 'Renamed'} ${done}` +
    (caseOnly ? ` (${caseOnly} case-only)` : '') + `, skipped ${skipped}.\n`);
if (DRY) console.log('  Run without --dry to apply.\n');


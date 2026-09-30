#!/usr/bin/env node
/**
 * convert-images.mjs
 *
 *   npm run images              convert what has changed
 *   npm run images -- --dry     show the plan, convert nothing
 *   npm run images -- --all     rebuild everything, changed or not
 *
 * Skips a PDF whose images are already newer than it. Re-export a PDF and
 * it converts again on the next run; leave it alone and it is never
 * touched. Demo songs stop being rebuilt every week.
 *
 * A song is "current" if its slug appears in content/week.json or
 * content/demo.json. A PDF for anything else is skipped with a warning
 * rather than halting the run, since video songs have no audio and old
 * songs linger until `npm run clean` removes them.
 */

import { execFileSync } from 'node:child_process';
import {
    readdirSync, existsSync, mkdirSync, mkdtempSync, rmSync,
    renameSync, statSync, readFileSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const JOBS = {
    sheet: { in: 'sheet-music',       out: 'sheet-music-images' },
    lyric: { in: 'lyric-slides-pdfs', out: 'lyric-slide-images' }
};

/* Your settings, unchanged. */
const MAGICK_ARGS = [
    '-colorspace', 'sRGB',
    '-background', 'white',
    '-alpha', 'remove',
    '-normalize',
    '-sharpen', '0x0.5',
    '-quality', '98'
];

const argv  = process.argv.slice(2);
const DRY   = argv.includes('--dry');
const ALL   = argv.includes('--all') || argv.includes('--force');
const which = argv.find(a => !a.startsWith('--')) || 'both';
const kinds = which === 'both' ? ['sheet', 'lyric'] : [which];

if (kinds.some(k => !JOBS[k])) {
    console.error('usage: convert-images.mjs [sheet|lyric|both] [--dry] [--all]');
    process.exit(1);
}

function slugify(name) {
    return name
        .replace(/^Copy of /i, '')
        .replace(/^\d+[.\-_ ]+/, '')
        .replace(/['’]/g, '')
        .replace(/[.\s_]+/g, '-')
        .replace(/[^a-zA-Z0-9-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .toLowerCase();
}

function requireTool(cmd, args, hint) {
    try { execFileSync(cmd, args, { stdio: 'pipe' }); }
    catch { console.error(`${cmd} not found. Install with: ${hint}`); process.exit(1); }
}

if (!DRY) {
    requireTool('magick', ['-version'], 'brew install imagemagick');
    requireTool('gs', ['--version'], 'brew install ghostscript');
}

/* Current songs come from the JSON, not from the audio folder: a video
   song has sheet music and no tracks at all. */
function slugsFrom(file) {
    const p = path.join('content', file);
    if (!existsSync(p)) return [];
    const data = JSON.parse(readFileSync(p, 'utf8'));
    return (data.order || data.songs || []).map(r => r.slug).filter(Boolean);
}
const current = new Set([...slugsFrom('week.json'), ...slugsFrom('demo.json')]);

let built = 0, skipped = 0, stale = 0, totalPages = 0, totalBytes = 0;

for (const kind of kinds) {
    const { in: inDir, out: outDir } = JOBS[kind];

    if (!existsSync(inDir)) { console.log(`\n  ${inDir}/ not found, skipping ${kind}\n`); continue; }
    if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

    const pdfs = readdirSync(inDir).filter(f => f.toLowerCase().endsWith('.pdf'));
    console.log(`\n  ${kind}: ${pdfs.length} PDF${pdfs.length === 1 ? '' : 's'} in ${inDir}/\n`);

    for (const pdf of pdfs) {
        const slug = slugify(path.basename(pdf, path.extname(pdf)));
        if (!slug) { console.log(`  ! could not derive a slug from ${pdf}`); continue; }

        if (current.size && !current.has(slug)) {
            console.log(`  - ${pdf}  not in this week or the demo, leaving alone`);
            stale++;
            continue;
        }

        const existing = readdirSync(outDir).filter(f => f.startsWith(`${slug}.${kind}.`));

        /* Already converted and the PDF has not changed since. */
        if (!ALL && existing.length) {
            const pdfTime = statSync(path.join(inDir, pdf)).mtimeMs;
            const imgTime = Math.min(
                ...existing.map(f => statSync(path.join(outDir, f)).mtimeMs)
            );
            if (imgTime > pdfTime) {
                console.log(`  = ${pdf}  unchanged (${existing.length} pages)`);
                skipped++;
                continue;
            }
        }

        if (DRY) {
            console.log(`  + ${pdf}\n      -> ${slug}.${kind}.NN.png` +
                (existing.length ? `   (replacing ${existing.length})` : ''));
            built++;
            continue;
        }

        existing.forEach(f => rmSync(path.join(outDir, f)));

        const tmp = mkdtempSync(path.join(tmpdir(), 'hbc-'));
        try {
            execFileSync('magick', [
                '-density', '400',
                path.join(inDir, pdf),
                ...MAGICK_ARGS,
                path.join(tmp, 'page-%04d.png')
            ], { stdio: 'pipe' });

            const pages = readdirSync(tmp)
                .filter(f => f.endsWith('.png'))
                .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

            pages.forEach((p, i) => {
                const target = path.join(outDir, `${slug}.${kind}.${String(i + 1).padStart(2, '0')}.png`);
                renameSync(path.join(tmp, p), target);
                totalBytes += statSync(target).size;
            });

            totalPages += pages.length;
            built++;
            console.log(`  + ${pdf}\n      -> ${slug}.${kind}.01..${String(pages.length).padStart(2, '0')}.png`);

        } catch (err) {
            console.error(`  ! failed on ${pdf}: ${err.message.split('\n')[0]}`);
        } finally {
            rmSync(tmp, { recursive: true, force: true });
        }
    }
}

console.log('');
if (DRY) {
    console.log(`  ${built} would convert, ${skipped} unchanged, ${stale} not current. Nothing written.\n`);
} else {
    console.log(`  ${built} converted (${totalPages} pages, ${(totalBytes / 1048576).toFixed(1)}MB), ` +
        `${skipped} unchanged, ${stale} not current.\n`);
}
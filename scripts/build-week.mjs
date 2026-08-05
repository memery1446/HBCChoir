#!/usr/bin/env node
/**
 * build-week.mjs
 *
 * Reads  content/week.json   (short, hand-written: date, notes, service order)
 * Scans  audio/ sheet-music-images/ lyric-slide-images/
 * Writes content/current.json (long, generated: every filename)
 *
 *   npm run week            build + report
 *   npm run check           validate only, write nothing
 *
 * Convention:
 *   audio/<slug>.<part>.mp3
 *   sheet-music-images/<slug>.sheet.NN.png
 *   lyric-slide-images/<slug>.lyric.NN.png
 *
 * A song gets a button for each part file that actually exists, and no
 * others. Melody only -> one button. SATB + piano -> five.
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';

const ROOT      = process.cwd();
const AUDIO_DIR = 'audio';
const SHEET_DIR = 'sheet-music-images';
const LYRIC_DIR = 'lyric-slide-images';
const IN        = 'content/week.json';
const OUT       = 'content/current.json';

const CHECK_ONLY = process.argv.includes('--check');

/* The vocabulary. Order here is the button order on the page.
   Add a part by adding a line; nothing else needs to change. */
const PARTS = [
    { part: 'all',      group: 'all',      name: 'FULL MIX'          },
    { part: 'melody',   group: 'soprano',  name: 'MELODY/SOPRANO'    },
    { part: 'harmony',  group: 'harmony',  name: 'HARMONY'           },
    { part: 'harmony2', group: 'harmony2', name: 'HARMONY 2'         },
    { part: 'alto',     group: 'alto',     name: 'ALTO'              },
    { part: 'tenor',    group: 'tenor',    name: 'TENOR'             },
    { part: 'bass',     group: 'bass',     name: 'BASS'              },
    { part: 'piano',    group: 'piano',    name: 'PIANO'             },
    { part: 'helper',   group: 'helper',   name: 'DRONE + METRONOME' }
];

const problems = [], notes = [];
const fail = m => problems.push(m);
const note = m => notes.push(m);

/* Numeric-aware. Plain .sort() puts .10.png before .02.png if you ever
   forget to zero-pad. */
const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
const natural  = (a, b) => collator.compare(a, b);

const md5 = f => createHash('md5').update(readFileSync(f)).digest('hex');

function listDir(dir) {
    if (!existsSync(path.join(ROOT, dir))) { fail(`missing directory: ${dir}/`); return []; }
    return readdirSync(path.join(ROOT, dir)).filter(f => !f.startsWith('.'));
}

/* ------------------------------------------------------------------ */

const week = JSON.parse(readFileSync(path.join(ROOT, IN), 'utf8'));

if (!/^\d{4}-\d{2}-\d{2}$/.test(week.serviceDate || '')) {
    fail(`serviceDate must be YYYY-MM-DD, got: ${week.serviceDate}`);
}

const audioFiles = listDir(AUDIO_DIR);
const sheetFiles = listDir(SHEET_DIR);
const lyricFiles = listDir(LYRIC_DIR);

const songs = [], order = [];
const usedAudio = new Set();

for (const entry of week.order || []) {
    const { slug, title } = entry;
    if (!slug || !title) { fail(`every order entry needs slug and title: ${JSON.stringify(entry)}`); continue; }

    order.push((entry.prefix || '') + title);

    /* ---- audio: one track per file that exists, nothing invented ---- */
    const tracks = [];
    const present = [];
    for (const { part, group, name } of PARTS) {
        const f = `${slug}.${part}.mp3`;
        if (!audioFiles.includes(f)) continue;
        usedAudio.add(f);
        present.push(part);
        tracks.push({ name, src: `${AUDIO_DIR}/${f}`, group });
    }

    if (!tracks.length) { fail(`${slug}: no audio files found for this slug`); continue; }
    if (!present.includes('melody')) note(`${slug}: no melody track (parts: ${present.join(', ')})`);

    /* Byte-identical check: two "different" parts that are the same recording. */
    const sums = {};
    for (const p of present) {
        const sum = md5(path.join(ROOT, AUDIO_DIR, `${slug}.${p}.mp3`));
        (sums[sum] = sums[sum] || []).push(p);
    }
    for (const dupes of Object.values(sums)) {
        if (dupes.length > 1) fail(`${slug}: byte-identical files, these will sound the same: ${dupes.join(', ')}`);
    }

    /* ---- images ---- */
    const sheet = sheetFiles.filter(f => f.startsWith(`${slug}.sheet.`)).sort(natural);
    const lyric = lyricFiles.filter(f => f.startsWith(`${slug}.lyric.`)).sort(natural);
    if (!sheet.length) note(`${slug}: no sheet music pages`);
    if (!lyric.length) note(`${slug}: no lyric slides`);

    songs.push({
        title: title.toUpperCase(),                            // songs[] uppercase
        useImages: sheet.length > 0,
        imageFiles: sheet,                                     // bare names
        lyricSlideImages: lyric.map(f => `${LYRIC_DIR}/${f}`), // full paths
        tracks
    });
}

/* Audio on disk that this week never references and does not match the
   convention: usually a straggler from the old naming. */
const strays = audioFiles.filter(f =>
    f.endsWith('.mp3') && !usedAudio.has(f) &&
    !new RegExp(`^[a-z0-9-]+\\.(${PARTS.map(p => p.part).join('|')})\\.mp3$`).test(f));
if (strays.length) note(`audio not matching the convention: ${strays.join(', ')}`);

/* ------------------------------------------------------------------ */

const out = {
    serviceDate: week.serviceDate,
    headerNotes: week.headerNotes || [],
    order,
    songs,
    allSongsPdf:  week.allSongsPdf  ?? null,
    interludeMp3: week.interludeMp3 ?? null
};

console.log(`\n  ${week.serviceDate}   ${songs.length} songs\n`);
for (const s of songs) {
    const parts = s.tracks.map(t => t.name.replace('MELODY/SOPRANO', 'MELODY')).join(' ');
    console.log(`    ${String(s.imageFiles.length).padStart(2)}pg ${String(s.lyricSlideImages.length).padStart(3)}sl  ${s.title}`);
    console.log(`         ${s.tracks.length} button${s.tracks.length === 1 ? '' : 's'}: ${parts}\n`);
}

if (notes.length)    { console.log('  Notes');    notes.forEach(n => console.log(`    - ${n}`)); }
if (problems.length) {
    console.log('\n  Problems');
    problems.forEach(p => console.log(`    ! ${p}`));
    console.log(`\n  ${OUT} not written.\n`);
    process.exit(1);
}

if (CHECK_ONLY) console.log(`\n  Check passed. Nothing written.\n`);
else { writeFileSync(path.join(ROOT, OUT), JSON.stringify(out, null, 2) + '\n'); console.log(`\n  Wrote ${OUT}\n`); }


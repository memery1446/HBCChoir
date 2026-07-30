#!/usr/bin/env node
/**
 * Replaces the symlinks in public/ with real copies before `next build`.
 * Local dev keeps using the links; only the build materializes them, so
 * there is never a second copy of the media in git.
 */

import { existsSync, lstatSync, readlinkSync, rmSync, cpSync, mkdirSync } from "node:fs";
import path from "node:path";

const DIRS = ["audio", "content", "sheet-music-images", "lyric-slide-images"];
const PUBLIC = path.join(process.cwd(), "public");

for (const name of DIRS) {
    const target = path.join(PUBLIC, name);

    if (!existsSync(target)) {
        console.log(`  ${name}: missing, skipping`);
        continue;
    }

    const stat = lstatSync(target);
    if (!stat.isSymbolicLink()) {
        console.log(`  ${name}: already a real directory`);
        continue;
    }

    const source = path.resolve(PUBLIC, readlinkSync(target));
    if (!existsSync(source)) {
        console.error(`  ${name}: symlink points at ${source}, which does not exist`);
        process.exit(1);
    }

    rmSync(target);
    mkdirSync(target, { recursive: true });
    cpSync(source, target, { recursive: true, dereference: true });
    console.log(`  ${name}: copied from ${source}`);
}

console.log("  materialize done\n");

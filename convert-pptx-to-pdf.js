/**
 * convert-pptx-to-pdf.js
 *
 *   node convert-pptx-to-pdf.js          convert only what has changed
 *   node convert-pptx-to-pdf.js --all    rebuild every PDF
 *
 * Skips a pptx whose PDF is already newer than it. This matters more than
 * it looks: regenerating a PDF gives it a fresh timestamp, which makes
 * convert-images.mjs rebuild that song's lyric slides even though nothing
 * about them changed.
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');

const execAsync = promisify(exec);

const inputDir = './pptx-files';
const outputDir = './lyric-slides-pdfs';
const libreOfficePath = '/Applications/LibreOffice.app/Contents/MacOS/soffice';

const ALL = process.argv.includes('--all') || process.argv.includes('--force');

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

async function convertAllFiles() {
    const files = fs.readdirSync(inputDir).filter(file => file.endsWith('.pptx'));

    let converted = 0, skipped = 0;

    for (const file of files) {
        const inputPath = path.join(inputDir, file);
        const pdfPath = path.join(outputDir, path.basename(file, '.pptx') + '.pdf');

        if (!ALL && fs.existsSync(pdfPath)) {
            const pptxTime = fs.statSync(inputPath).mtimeMs;
            const pdfTime = fs.statSync(pdfPath).mtimeMs;
            if (pdfTime > pptxTime) {
                console.log(`= ${file}  unchanged`);
                skipped++;
                continue;
            }
        }

        const command = `"${libreOfficePath}" --headless --convert-to pdf --outdir ${outputDir} "${inputPath}"`;
        console.log(`+ ${file}`);

        try {
            const { stderr } = await execAsync(command);
            if (stderr) console.error(stderr);
            converted++;
        } catch (error) {
            console.error(`! failed on ${file}: ${error.message}`);
        }
    }

    console.log(`\n  ${converted} converted, ${skipped} unchanged.\n`);
}

convertAllFiles();
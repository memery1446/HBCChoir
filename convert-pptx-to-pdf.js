const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');

const execAsync = promisify(exec);

const inputDir = './pptx-files';
const outputDir = './lyric-slides-pdfs';
const libreOfficePath = '/Applications/LibreOffice.app/Contents/MacOS/soffice';

// Create output directory
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

async function convertAllFiles() {
    const files = fs.readdirSync(inputDir).filter(file => file.endsWith('.pptx'));

    console.log(`Found ${files.length} PowerPoint files to convert\n`);

    for (const file of files) {
        const inputPath = path.join(inputDir, file);
        const command = `"${libreOfficePath}" --headless --convert-to pdf --outdir ${outputDir} "${inputPath}"`;

        console.log(`Converting: ${file}...`);

        try {
            const { stdout, stderr } = await execAsync(command);
            if (stdout) console.log(stdout);
            if (stderr) console.error(stderr);
            console.log(`✓ Successfully converted: ${file}\n`);
        } catch (error) {
            console.error(`❌ Failed to convert ${file}:`, error.message, '\n');
        }
    }

    console.log('\n=== Conversion Complete ===');
    console.log('Output directory:', outputDir);

    // List all created PDFs
    const pdfs = fs.readdirSync(outputDir).filter(f => f.endsWith('.pdf'));
    console.log(`Created ${pdfs.length} PDF files:`);
    pdfs.forEach(pdf => console.log(`  - ${pdf}`));
}

convertAllFiles();

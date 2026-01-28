// convert-lyric-pdfs.js - Convert lyric slide PDFs to PNGs using ImageMagick
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

async function convertLyricPDFs() {
    console.log('Starting lyric slide PDF conversion...');

    const pdfDir = './lyric-slides-pdfs';
    const outputDir = './lyric-slide-images';

    // Check if ImageMagick is installed
    try {
        const version = execSync('magick -version', { encoding: 'utf8' });
        console.log('ImageMagick found:', version.split('\n')[0]);
    } catch (error) {
        console.error('ImageMagick not found. Install with: brew install imagemagick');
        return;
    }

    // Check if Ghostscript is installed
    try {
        const gsVersion = execSync('gs --version', { encoding: 'utf8' });
        console.log('Ghostscript found: version', gsVersion.trim());
    } catch (error) {
        console.error('Ghostscript not found. Install with: brew install ghostscript');
        return;
    }

    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
        console.log(`Created directory: ${outputDir}`);
    }

    // Find all PDF files
    if (!fs.existsSync(pdfDir)) {
        console.error(`PDF directory not found: ${pdfDir}`);
        return;
    }

    const pdfFiles = fs.readdirSync(pdfDir).filter(file => file.endsWith('.pdf'));
    console.log(`Found ${pdfFiles.length} PDF files to convert`);

    // Convert each PDF with professional-grade settings for lyric slides
    for (const pdfFile of pdfFiles) {
        console.log(`Converting ${pdfFile}...`);

        const pdfPath = path.join(pdfDir, pdfFile);
        const baseName = path.basename(pdfFile, '.pdf');
        const outputPattern = path.join(outputDir, `${baseName}-%d.png`);

        // Professional lyric slide conversion settings (same as sheet music)
        const command = [
            'magick',                    // Use 'magick' instead of deprecated 'convert'
            '-density 400',              // Very high DPI for ultra-crisp text
            `"${pdfPath}"`,             // Input PDF
            '-colorspace sRGB',         // Standard color space
            '-background white',        // Ensure white background
            '-alpha remove',            // Remove transparency
            '-normalize',               // Optimize contrast
            '-sharpen 0x0.5',          // Subtle sharpening for text clarity
            '-quality 98',              // Maximum quality PNG
            '-compress lossless',       // Lossless PNG compression
            `"${outputPattern}"`        // Output pattern
        ].join(' ');

        try {
            console.log(`  Running: ${command}`);
            execSync(command, { stdio: 'pipe' });

            // Check what files were created
            const createdFiles = fs.readdirSync(outputDir)
                .filter(f => f.startsWith(baseName) && f.endsWith('.png'))
                .sort();

            console.log(`✓ Successfully converted ${pdfFile}`);
            createdFiles.forEach((file, index) => {
                const stats = fs.statSync(path.join(outputDir, file));
                const sizeKB = Math.round(stats.size / 1024);
                console.log(`  Page ${index + 1}: ${file} (${sizeKB}KB)`);
            });

        } catch (error) {
            console.error(`✗ Failed to convert ${pdfFile}:`);
            console.error(`  Command: ${command}`);
            console.error(`  Error: ${error.message}`);
        }
    }

    console.log('\nConversion complete!');

    // Generate final summary
    const allImages = fs.readdirSync(outputDir).filter(f => f.endsWith('.png'));
    const totalSizeKB = allImages.reduce((total, file) => {
        const stats = fs.statSync(path.join(outputDir, file));
        return total + stats.size;
    }, 0);

    console.log(`\nGenerated ${allImages.length} high-quality images (${Math.round(totalSizeKB / 1024)}MB total)`);
    console.log('Lyric slide images optimized for mobile viewing with native zoom support.');
}

convertLyricPDFs();

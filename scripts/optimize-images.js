const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Configuration
const TARGET_EXTENSIONS = ['.png', '.jpg', '.jpeg'];
const DIRS_TO_SCAN = [
    'packages/ui/src/assets',
    'apps/website-host/src/assets',
    'apps/website-host/public',
    'apps/user-app/src/assets',
    'apps/user-app/public',
    'apps/admin-app/src/assets',
    'apps/admin-app/public'
];

async function optimizeImages() {
    const rootDir = process.cwd();
    let convertedCount = 0;

    for (const dirRelative of DIRS_TO_SCAN) {
        const dirPath = path.join(rootDir, dirRelative);

        if (!fs.existsSync(dirPath)) {
            console.log(`Skipping missing directory: ${dirRelative}`);
            continue;
        }

        console.log(`Scanning directory: ${dirRelative}`);
        const files = fs.readdirSync(dirPath);

        for (const file of files) {
            const ext = path.extname(file).toLowerCase();
            if (TARGET_EXTENSIONS.includes(ext)) {
                const filePath = path.join(dirPath, file);
                const webpPath = filePath.replace(ext, '.webp');

                if (!fs.existsSync(webpPath)) {
                    try {
                        console.log(`Converting: ${file} -> .webp`);
                        await sharp(filePath)
                            .webp({ quality: 80 })
                            .toFile(webpPath);
                        convertedCount++;
                    } catch (err) {
                        console.error(`Error converting ${file}:`, err.message);
                    }
                } else {
                    // console.log(`Skipping ${file}, .webp already exists.`);
                }
            }
        }
    }

    console.log(`\nOptimization complete! Converted ${convertedCount} images to WebP.`);
}

optimizeImages();

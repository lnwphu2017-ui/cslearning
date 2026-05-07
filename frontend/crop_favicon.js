const sharp = require('sharp');
const path = require('path');

async function CropIcon() {
  try {
    console.log('Starting image crop...');
    const inputPath = path.join(__dirname, '..', 'favicon.png');
    const outputPath = path.join(__dirname, 'src', 'app', 'icon.png');

    await sharp(inputPath)
      .trim() // This removes transparent pixels around the image
      .resize(64, 64, { // Resize to a standard icon size but keep it sharp
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 } // Keep transparent background
      })
      .toFile(outputPath);

    console.log('Icon cropped and saved to src/app/icon.png');
  } catch (err) {
    console.error('Error cropping icon:', err);
  }
}

CropIcon();

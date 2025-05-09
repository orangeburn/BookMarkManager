const Jimp = require('jimp');
const path = require('path');
const fs = require('fs');

const sizes = [16, 32, 48, 128];

async function generateIcon(size) {
  try {
    // Create a new blank image with background color
    const buffer = Buffer.alloc(size * size * 4);
    for (let i = 0; i < buffer.length; i += 4) {
      buffer[i] = 0x4F;     // R
      buffer[i + 1] = 0x46;  // G
      buffer[i + 2] = 0xE5;  // B
      buffer[i + 3] = 0xFF;  // A
    }
    const image = await Jimp.read(buffer);
    image.resize(size, size);
    
    // Create bookmark shape
    const padding = Math.floor(size * 0.2);
    const width = size - (padding * 2);
    const height = size - (padding * 2);
    
    // Draw white bookmark shape
    for (let y = padding; y < padding + height; y++) {
      for (let x = padding; x < padding + width; x++) {
        // Check if point is inside bookmark shape
        if (x >= padding && x <= padding + width && y >= padding) {
          if (y <= padding + height) {
            if (y >= padding + (height * 0.7)) {
              // Bottom triangle part
              const centerX = padding + (width / 2);
              const ratio = (y - (padding + (height * 0.7))) / (height * 0.3);
              const currentWidth = width * (1 - ratio);
              if (Math.abs(x - centerX) <= currentWidth / 2) {
                image.setPixelColor(0xFFFFFFFF, x, y);
              }
            } else {
              // Top rectangle part
              image.setPixelColor(0xFFFFFFFF, x, y);
            }
          }
        }
      }
    }
    
    // Create icons directory if it doesn't exist
    const iconsDir = path.join(process.cwd(), 'public', 'icons');
    if (!fs.existsSync(iconsDir)) {
      fs.mkdirSync(iconsDir, { recursive: true });
    }
    
    // Save the icon
    await image.writeAsync(path.join(iconsDir, `icon${size}.png`));
    console.log(`Generated icon${size}.png`);
  } catch (error) {
    console.error(`Error generating icon${size}.png:`, error);
  }
}

// Generate icons for all sizes
Promise.all(sizes.map(generateIcon))
  .then(() => console.log('All icons generated successfully!'))
  .catch(error => console.error('Error generating icons:', error));
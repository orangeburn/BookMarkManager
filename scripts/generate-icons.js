import Jimp from 'jimp';
import path from 'path';
import fs from 'fs';

const sizes = [16, 32, 48, 128];

async function generateIcon(size) {
  const image = new Jimp(size, size);
  
  // Set background color (indigo)
  image.background(0x4F46E5FF);
  
  // Fill with background color
  image.scan(0, 0, size, size, function (x, y) {
    this.setPixelColor(0x4F46E5FF, x, y);
  });
  
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
}

// Generate icons for all sizes
Promise.all(sizes.map(generateIcon))
  .then(() => console.log('Icons generated successfully!'))
  .catch(console.error);
import { createCanvas } from 'canvas';
import fs from 'fs';
import path from 'path';

const sizes = [16, 32, 48, 128];

function generateIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Set background
  ctx.fillStyle = '#4F46E5';
  ctx.fillRect(0, 0, size, size);

  // Draw bookmark symbol
  ctx.fillStyle = '#FFFFFF';
  const padding = size * 0.2;
  const width = size - (padding * 2);
  const height = size - (padding * 2);
  
  ctx.beginPath();
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding + width, padding);
  ctx.lineTo(padding + width, padding + height);
  ctx.lineTo(padding + (width / 2), padding + (height * 0.7));
  ctx.lineTo(padding, padding + height);
  ctx.closePath();
  ctx.fill();

  // Save the icon
  const buffer = canvas.toBuffer('image/png');
  const iconPath = path.join(__dirname, `icon${size}.png`);
  fs.writeFileSync(iconPath, buffer);
}

// Create icons directory if it doesn't exist
if (!fs.existsSync(path.join(__dirname))) {
  fs.mkdirSync(path.join(__dirname), { recursive: true });
}

// Generate icons for all sizes
sizes.forEach(generateIcon);
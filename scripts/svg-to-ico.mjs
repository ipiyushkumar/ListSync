import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const svgPath = path.join(__dirname, '..', 'public', 'icon.svg');
// Next.js App Router: app/favicon.ico takes precedence over public/favicon.ico
const icoPath = path.join(__dirname, '..', 'src', 'app', 'favicon.ico');
const icoPublicPath = path.join(__dirname, '..', 'public', 'favicon.ico');

async function convert() {
  // Generate multiple sizes
  const sizes = [16, 32, 48];
  const buffers = [];
  
  for (const size of sizes) {
    const buf = await sharp(svgPath)
      .resize(size, size)
      .png()
      .toBuffer();
    buffers.push({ size, buffer: buf });
  }
  
  // Build ICO file manually
  // ICO format: header + directory entries + image data
  const numImages = buffers.length;
  
  // ICO header: 6 bytes
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);      // Reserved
  header.writeUInt16LE(1, 2);      // Type: 1 = ICO
  header.writeUInt16LE(numImages, 4); // Number of images
  
  // Directory entries: 16 bytes each
  const dirSize = numImages * 16;
  const dir = Buffer.alloc(dirSize);
  
  let dataOffset = 6 + dirSize; // Header + directory
  
  for (let i = 0; i < numImages; i++) {
    const { size, buffer } = buffers[i];
    const offset = i * 16;
    
    dir.writeUInt8(size === 256 ? 0 : size, offset);     // Width
    dir.writeUInt8(size === 256 ? 0 : size, offset + 1); // Height
    dir.writeUInt8(0, offset + 2);     // Color palette
    dir.writeUInt8(0, offset + 3);     // Reserved
    dir.writeUInt16LE(1, offset + 4);  // Color planes
    dir.writeUInt16LE(32, offset + 6); // Bits per pixel
    dir.writeUInt32LE(buffer.length, offset + 8);  // Image size
    dir.writeUInt32LE(dataOffset, offset + 12);    // Image offset
    
    dataOffset += buffer.length;
  }
  
  // Combine all buffers
  const ico = Buffer.concat([header, dir, ...buffers.map(b => b.buffer)]);
  
  // Write ICO file to both locations
  const fs = await import('fs');
  fs.writeFileSync(icoPath, ico);
  fs.copyFileSync(icoPath, icoPublicPath);
  
  console.log(`Favicon created: ${icoPath} (${ico.length} bytes)`);
  console.log(`Also copied to: ${icoPublicPath}`);
  console.log(`Sizes: ${buffers.map(b => `${b.size}x${b.size}`).join(', ')}`);
}

convert().catch(console.error);

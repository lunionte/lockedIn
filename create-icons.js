import fs from "fs";
import path from "path";
import zlib from "zlib";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Create a valid PNG image with specified size
function createIcon(size) {
    // PNG file structure for a solid gray square
    const width = size;
    const height = size;

    // PNG signature
    const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

    // IHDR chunk
    const ihdrData = Buffer.alloc(13);
    ihdrData.writeUInt32BE(width, 0);
    ihdrData.writeUInt32BE(height, 4);
    ihdrData[8] = 8; // bit depth
    ihdrData[9] = 2; // color type (RGB)
    ihdrData[10] = 0; // compression
    ihdrData[11] = 0; // filter
    ihdrData[12] = 0; // interlace

    const ihdr = createChunk("IHDR", ihdrData);

    // Create image data (gray pixels)
    const bytesPerPixel = 3; // RGB
    const rowBytes = width * bytesPerPixel + 1; // +1 for filter byte
    const imageData = Buffer.alloc(rowBytes * height);

    for (let y = 0; y < height; y++) {
        const rowStart = y * rowBytes;
        imageData[rowStart] = 0; // filter type: None

        for (let x = 0; x < width; x++) {
            const pixelStart = rowStart + 1 + x * bytesPerPixel;
            imageData[pixelStart] = 64; // R - dark gray
            imageData[pixelStart + 1] = 64; // G
            imageData[pixelStart + 2] = 64; // B
        }
    }

    // Compress image data
    const compressed = zlib.deflateSync(imageData);
    const idat = createChunk("IDAT", compressed);

    // IEND chunk
    const iend = createChunk("IEND", Buffer.alloc(0));

    return Buffer.concat([signature, ihdr, idat, iend]);
}

function createChunk(type, data) {
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length, 0);

    const typeBuffer = Buffer.from(type, "ascii");
    const crc = calculateCRC(Buffer.concat([typeBuffer, data]));
    const crcBuffer = Buffer.alloc(4);
    crcBuffer.writeUInt32BE(crc, 0);

    return Buffer.concat([length, typeBuffer, data, crcBuffer]);
}

function calculateCRC(buffer) {
    let crc = 0xffffffff;
    for (let i = 0; i < buffer.length; i++) {
        crc = crc ^ buffer[i];
        for (let j = 0; j < 8; j++) {
            if (crc & 1) {
                crc = (crc >>> 1) ^ 0xedb88320;
            } else {
                crc = crc >>> 1;
            }
        }
    }
    return (crc ^ 0xffffffff) >>> 0;
}

const sizes = [16, 48, 128];
const iconsDir = path.join(__dirname, "public", "icons");

// Ensure directory exists
if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
}

// Create placeholder icons
sizes.forEach((size) => {
    const iconPath = path.join(iconsDir, `icon${size}.png`);
    fs.writeFileSync(iconPath, createIcon(size));
    console.log(`Created ${iconPath} (${size}x${size})`);
});

console.log("Icon placeholders created. Replace with actual icons for production.");

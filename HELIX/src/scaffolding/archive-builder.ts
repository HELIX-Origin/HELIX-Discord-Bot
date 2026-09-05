import zlib from 'node:zlib';
import type { FileToGenerate } from './file-generator.js';

// Pre-computed CRC32 lookup table
const CRC_TABLE = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let j = 0; j < 8; j++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  CRC_TABLE[i] = c >>> 0;
}

export function computeCrc32(data: Buffer): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ data[i]) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
}

// Convert Date to MS-DOS date and time format
function getDosDateTime(date: Date = new Date()): { dosTime: number; dosDate: number } {
  const year = Math.max(1980, date.getFullYear());
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = Math.floor(date.getSeconds() / 2);

  const dosTime = (hours << 11) | (minutes << 5) | seconds;
  const dosDate = ((year - 1980) << 9) | (month << 5) | day;
  return { dosTime, dosDate };
}

interface ZipEntryInfo {
  filename: string;
  filenameBuf: Buffer;
  crc32: number;
  uncompressedSize: number;
  compressedSize: number;
  compressionMethod: number;
  compressedData: Buffer;
  localHeaderOffset: number;
}

/**
 * Creates a standard, fully compliant ZIP archive Buffer from a list of files in memory.
 * Requires zero external dependencies and uses standard Node.js zlib.
 */
export function createZipArchive(files: FileToGenerate[], rootDirName?: string): Buffer {
  const localHeaders: Buffer[] = [];
  const entries: ZipEntryInfo[] = [];
  const { dosTime, dosDate } = getDosDateTime();
  let currentOffset = 0;

  for (const file of files) {
    // Normalize path separators to forward slash
    let normalizedPath = file.relativePath.replace(/\\/g, '/').replace(/^\/+/, '');
    if (rootDirName) {
      const cleanRoot = rootDirName.replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
      normalizedPath = `${cleanRoot}/${normalizedPath}`;
    }

    const filenameBuf = Buffer.from(normalizedPath, 'utf-8');
    const contentBuf = Buffer.isBuffer(file.content)
      ? file.content
      : Buffer.from(file.content, 'utf-8');

    const uncompressedSize = contentBuf.length;
    const crc = computeCrc32(contentBuf);

    let compressionMethod = 8; // Deflate
    let compressedData: Buffer;

    if (uncompressedSize === 0) {
      compressionMethod = 0; // Stored
      compressedData = Buffer.alloc(0);
    } else {
      try {
        const deflated = zlib.deflateRawSync(contentBuf, { level: 9 });
        if (deflated.length < uncompressedSize) {
          compressedData = deflated;
        } else {
          // If compression doesn't save space, store raw
          compressionMethod = 0;
          compressedData = contentBuf;
        }
      } catch {
        compressionMethod = 0;
        compressedData = contentBuf;
      }
    }

    const compressedSize = compressedData.length;
    const localHeaderOffset = currentOffset;

    // Local File Header (30 bytes + filename + data)
    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0); // Signature
    localHeader.writeUInt16LE(20, 4);         // Version needed to extract (2.0)
    localHeader.writeUInt16LE(0x0800, 6);     // General purpose bit flag (UTF-8 filename)
    localHeader.writeUInt16LE(compressionMethod, 8); // Compression method
    localHeader.writeUInt16LE(dosTime, 10);    // Last mod file time
    localHeader.writeUInt16LE(dosDate, 12);    // Last mod file date
    localHeader.writeUInt32LE(crc, 14);        // CRC-32
    localHeader.writeUInt32LE(compressedSize, 18);   // Compressed size
    localHeader.writeUInt32LE(uncompressedSize, 22); // Uncompressed size
    localHeader.writeUInt16LE(filenameBuf.length, 26); // File name length
    localHeader.writeUInt16LE(0, 28);                  // Extra field length

    const fullLocalChunk = Buffer.concat([localHeader, filenameBuf, compressedData]);
    localHeaders.push(fullLocalChunk);
    currentOffset += fullLocalChunk.length;

    entries.push({
      filename: normalizedPath,
      filenameBuf,
      crc32: crc,
      uncompressedSize,
      compressedSize,
      compressionMethod,
      compressedData,
      localHeaderOffset,
    });
  }

  // Build Central Directory
  const centralDirStartOffset = currentOffset;
  const centralDirHeaders: Buffer[] = [];

  for (const entry of entries) {
    const cdHeader = Buffer.alloc(46);
    cdHeader.writeUInt32LE(0x02014b50, 0); // Central directory header signature
    cdHeader.writeUInt16LE(20, 4);         // Version made by
    cdHeader.writeUInt16LE(20, 6);         // Version needed to extract
    cdHeader.writeUInt16LE(0x0800, 8);     // General purpose bit flag (UTF-8)
    cdHeader.writeUInt16LE(entry.compressionMethod, 10); // Compression method
    cdHeader.writeUInt16LE(dosTime, 12);    // Last mod file time
    cdHeader.writeUInt16LE(dosDate, 14);    // Last mod file date
    cdHeader.writeUInt32LE(entry.crc32, 16); // CRC-32
    cdHeader.writeUInt32LE(entry.compressedSize, 20);   // Compressed size
    cdHeader.writeUInt32LE(entry.uncompressedSize, 24); // Uncompressed size
    cdHeader.writeUInt16LE(entry.filenameBuf.length, 28); // File name length
    cdHeader.writeUInt16LE(0, 30);          // Extra field length
    cdHeader.writeUInt16LE(0, 32);          // File comment length
    cdHeader.writeUInt16LE(0, 34);          // Disk number start
    cdHeader.writeUInt16LE(0, 36);          // Internal file attributes
    cdHeader.writeUInt32LE((0o100644 << 16) >>> 0, 38); // External file attributes (regular file rw-r--r--)
    cdHeader.writeUInt32LE(entry.localHeaderOffset, 42); // Relative offset of local header

    centralDirHeaders.push(Buffer.concat([cdHeader, entry.filenameBuf]));
  }

  const centralDirBuf = Buffer.concat(centralDirHeaders);
  const centralDirSize = centralDirBuf.length;

  // End of Central Directory Record (22 bytes)
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0); // EOCD signature
  eocd.writeUInt16LE(0, 4);          // Number of this disk
  eocd.writeUInt16LE(0, 6);          // Disk with start of central directory
  eocd.writeUInt16LE(entries.length, 8);  // Total entries on this disk
  eocd.writeUInt16LE(entries.length, 10); // Total entries in central directory
  eocd.writeUInt32LE(centralDirSize, 12); // Size of central directory
  eocd.writeUInt32LE(centralDirStartOffset, 16); // Offset of start of central directory
  eocd.writeUInt16LE(0, 20);         // ZIP comment length

  return Buffer.concat([...localHeaders, centralDirBuf, eocd]);
}

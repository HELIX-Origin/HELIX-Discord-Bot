import { describe, it, expect } from 'vitest';
import zlib from 'node:zlib';
import { createZipArchive, computeCrc32 } from '../../../HELIX/src/scaffolding/archive-builder.js';
import type { FileToGenerate } from '../../../HELIX/src/scaffolding/file-generator.js';

describe('scaffolding/archive-builder — in-memory pure Node.js ZIP generator', () => {
  it('computes correct CRC32 for known buffers', () => {
    const data = Buffer.from('123456789', 'utf-8');
    // Standard CRC-32 check value for "123456789" is 0xcbf43926 (3421780262 in unsigned 32-bit int)
    const crc = computeCrc32(data);
    expect(crc).toBe(0xcbf43926 >>> 0);
  });

  it('generates a valid ZIP archive from a list of files', () => {
    const files: FileToGenerate[] = [
      { relativePath: 'README.md', content: '# Test Project\nWelcome to HELIX!' },
      { relativePath: 'src/index.ts', content: 'console.log("Hello from inside ZIP!");' },
      { relativePath: 'package.json', content: JSON.stringify({ name: 'test-proj', version: '1.0.0' }, null, 2) },
    ];

    const zipBuffer = createZipArchive(files, 'test-project');
    expect(zipBuffer).toBeInstanceOf(Buffer);
    expect(zipBuffer.length).toBeGreaterThan(100);

    // Check Local File Header signature (0x04034b50 -> 50 4b 03 04)
    expect(zipBuffer[0]).toBe(0x50);
    expect(zipBuffer[1]).toBe(0x4b);
    expect(zipBuffer[2]).toBe(0x03);
    expect(zipBuffer[3]).toBe(0x04);

    // Check End of Central Directory signature (0x06054b50 -> 50 4b 05 06) near the end
    const eocdIndex = zipBuffer.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
    expect(eocdIndex).toBeGreaterThan(0);
  });

  it('supports binary and empty files inside the archive', () => {
    const emptyBuf = Buffer.alloc(0);
    const binaryData = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x01, 0x02]);

    const files: FileToGenerate[] = [
      { relativePath: 'empty.txt', content: emptyBuf },
      { relativePath: 'assets/image.png', content: binaryData, isBinary: true },
    ];

    const zipBuffer = createZipArchive(files);
    expect(zipBuffer).toBeInstanceOf(Buffer);
    expect(zipBuffer.length).toBeGreaterThan(50);
  });
});

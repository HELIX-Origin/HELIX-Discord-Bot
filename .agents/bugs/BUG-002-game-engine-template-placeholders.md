# Bug Report: BUG-002 Template variable interpolation handling in binary game assets

## Metadata
- **Bug ID**: BUG-002
- **Status**: Resolved
- **Priority**: Low
- **Component**: Templates / Scaffolding
- **Reported Date**: 2026-09-03
- **Target Resolution**: Phase 3
- **Resolved Date**: 2026-09-04
- **GitHub Issue**: [#2](https://github.com/HELIX-Origin/HELIX-CLI/issues/2)

---

## Description
When scaffolding game engine projects (e.g. Unity or Godot) that include binary starter assets such as `.png` sprites, `.wav` audio, or `.ttf` font files, the template variable interpolation engine (`template-engine.ts`) must not treat binary files as UTF-8 strings. Attempting to run regex string replacement on binary buffers corrupts the files.

## Steps to Reproduce
1. Include a sample binary `.png` icon in a template.
2. Run `helix create game-engine my-godot --template game-godot`.
3. Attempt to open the generated `.png` image.
4. The image file is corrupted due to UTF-8 decoding and re-encoding.

## Expected Behavior
The scaffolding engine should distinguish text files from binary files using file extension lists or MIME checks, only performing variable interpolation on text assets.

## Actual Behavior
All files were read and transformed as UTF-8 text strings.

## Environment Details
- **OS**: Windows / macOS / Linux
- **Node.js Version**: v18+
- **HELIX CLI Version**: 0.1.0

## Root Cause Analysis
`fs.readFileSync(file, 'utf-8')` was invoked uniformly without checking whether the file is binary.

## Resolution & Fix
Implemented `TemplateEngine.isBinary(filePath)` and `BINARY_EXTENSIONS` set covering images, audio, 3D models, fonts, archives, and binaries. `TemplateEngine.processFile()` automatically copies binary files without string interpolation. Unit tests in `tests/unit/template-engine.test.ts` verify both binary detection and variable interpolation.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { create } from '../../../HELIX/src/commands/project/create.js';
import { BotDatabase } from '../../../HELIX/src/db/database.js';

describe('commands/project/create — scaffolding with database persistence & ZIP attachments', () => {
  let tempDir: string;
  let dbPath: string;
  let db: BotDatabase;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'helix-create-test-'));
    dbPath = path.join(tempDir, 'test-helix.db');
    db = new BotDatabase(dbPath);
    (BotDatabase as any).instance = db;
  });

  afterEach(() => {
    if (db) db.close();
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('delivers command help embed when required arguments are missing', async () => {
    let repliedPayload: any = null;
    const mockMessage: any = {
      reply: async (p: any) => {
        repliedPayload = p;
        return p;
      },
    };

    await create.execute({
      message: mockMessage,
      guild: { id: 'guild-1' } as any,
      user: { id: 'user-1', username: 'Developer' } as any,
      args: [],
      getOption: (name: string) => null,
    } as any);

    expect(repliedPayload).toBeDefined();
    expect(repliedPayload.embeds).toHaveLength(1);
    const data = repliedPayload.embeds[0].toJSON();
    expect(data.title).toContain('create');
  });

  it('scaffolds project, saves to database, and attaches ZIP archive to reply', async () => {
    let repliedPayload: any = null;
    const mockMessage: any = {
      reply: async (p: any) => {
        repliedPayload = p;
        return p;
      },
    };

    await create.execute({
      message: mockMessage,
      guild: { id: 'guild-1' } as any,
      user: { id: 'user-123', username: 'Developer' } as any,
      args: ['discord-bot', 'awesome-bot'],
      getOption: (name: string) => {
        if (name === 'template') return 'discord-bot';
        if (name === 'name') return 'awesome-bot';
        if (name === 'dry_run') return false;
        return null;
      },
    } as any);

    expect(repliedPayload).toBeDefined();
    expect(repliedPayload.embeds).toHaveLength(1);
    const embedData = repliedPayload.embeds[0].toJSON();
    expect(embedData.title).toContain('Project Scaffolding: awesome-bot');
    expect(embedData.fields).toBeDefined();

    // Check structured fields
    const templateField = embedData.fields.find((f: any) => f.name === 'Template ID');
    const filesField = embedData.fields.find((f: any) => f.name === 'Files Generated');
    const archiveField = embedData.fields.find((f: any) => f.name === 'Archive Package');
    const dbField = embedData.fields.find((f: any) => f.name === 'Database Record');

    expect(templateField?.value).toBe('`discord-bot`');
    expect(Number(filesField?.value.replace(/`/g, ''))).toBeGreaterThan(0);
    expect(archiveField?.value).toBe('`awesome-bot.zip`');
    expect(dbField?.value).toContain('#');

    // Check ZIP attachment
    expect(repliedPayload.files).toHaveLength(1);
    const attachment = repliedPayload.files[0];
    expect(attachment.name).toBe('awesome-bot.zip');
    expect(attachment.attachment).toBeInstanceOf(Buffer);
    expect(attachment.attachment.length).toBeGreaterThan(100);

    // Verify record in SQLite database
    const recent = db.getRecentScaffolds(1);
    expect(recent).toHaveLength(1);
    expect(recent[0].projectName).toBe('awesome-bot');
    expect(recent[0].templateId).toBe('discord-bot');

    const scaffoldRecord = db.getScaffold(recent[0].id);
    expect(scaffoldRecord).toBeDefined();
    expect(scaffoldRecord?.projectName).toBe('awesome-bot');
    expect(scaffoldRecord?.files.length).toBeGreaterThan(0);

    const archiveBuf = db.getScaffoldArchive(recent[0].id);
    expect(archiveBuf).toBeInstanceOf(Buffer);
    expect(archiveBuf?.length).toBeGreaterThan(100);
  });

  it('renders dry-run preview when dry_run is true', async () => {
    let repliedPayload: any = null;
    const mockMessage: any = {
      reply: async (p: any) => {
        repliedPayload = p;
        return p;
      },
    };

    await create.execute({
      message: mockMessage,
      guild: { id: 'guild-1' } as any,
      user: { id: 'user-123', username: 'Developer' } as any,
      args: ['web-react', 'my-app', 'none', 'true'],
      getOption: (name: string) => {
        if (name === 'template') return 'web-react';
        if (name === 'name') return 'my-app';
        if (name === 'dry_run') return true;
        return null;
      },
    } as any);

    expect(repliedPayload).toBeDefined();
    expect(repliedPayload.embeds).toHaveLength(1);
    const embedData = repliedPayload.embeds[0].toJSON();
    expect(embedData.title).toContain('Scaffolding Preview');
  });
});

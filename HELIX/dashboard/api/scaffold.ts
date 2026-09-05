import http from 'node:http';
import { URL } from 'node:url';
import { executeScaffold } from '../../src/scaffolding/scaffold.js';
import { BotDatabase } from '../../src/db/database.js';

export async function handleDashboardScaffold(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', async () => {
    try {
      const payload = JSON.parse(body || '{}');
      const templateId = payload.templateId?.trim();
      const projectName = payload.projectName?.trim();
      const dryRun = payload.dryRun !== false; // default to dry-run in web dashboard for safety

      if (!templateId || !projectName) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'templateId and projectName are required' }));
        return;
      }

      // Map templateId to type
      const type = templateId.startsWith('web-') ? 'web' :
        templateId.startsWith('desktop-') ? 'desktop' :
        templateId.startsWith('mobile-') ? 'mobile' :
        templateId.startsWith('game-') ? 'game-engine' :
        templateId.startsWith('backend-') ? 'backend' : 'discord-bot';

      const result = await executeScaffold(
        type,
        projectName,
        {
          PROJECT_NAME: projectName,
          AUTHOR: 'HELIX Dashboard',
          DESCRIPTION: 'Scaffolded via HELIX Dashboard',
          DISCORD_TOKEN: 'your_bot_token_here',
          CLIENT_ID: 'your_client_id_here',
          GUILD_ID: 'your_guild_id_here',
        },
        {
          template: templateId,
          skipInstall: true,
          skipGit: true,
          dryRun,
          writeToDisk: false,
        }
      );

      if (!result.success) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Scaffolding template execution failed' }));
        return;
      }

      const db = BotDatabase.getInstance();
      let scaffoldId: number | null = null;
      let downloadUrl: string | null = null;

      if (!dryRun) {
        scaffoldId = db.saveScaffold({
          userId: 'dashboard-user',
          templateId,
          projectName,
          files: result.files,
          archiveBuffer: result.archiveBuffer,
        });
        downloadUrl = `/api/dashboard/scaffold/download?id=${scaffoldId}`;
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        type,
        templateId,
        projectName,
        dryRun,
        scaffoldId,
        downloadUrl,
        fileCount: result.files.length || result.writtenFiles.length,
        files: result.writtenFiles,
      }));
    } catch (err: any) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message || 'Scaffolding failed' }));
    }
  });
}

export async function handleDashboardScaffoldDownload(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
  try {
    const fullUrl = new URL(req.url || '/', 'http://localhost');
    const idParam = fullUrl.searchParams.get('id');
    const id = idParam ? parseInt(idParam, 10) : NaN;

    if (isNaN(id) || id <= 0) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid or missing scaffold ID parameter' }));
      return;
    }

    const db = BotDatabase.getInstance();
    const scaffold = db.getScaffold(id);
    if (!scaffold) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Scaffold record not found' }));
      return;
    }

    const archiveBuffer = scaffold.archiveBuffer || db.getScaffoldArchive(id);
    if (!archiveBuffer) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Scaffold ZIP archive not available' }));
      return;
    }

    const filename = `${scaffold.projectName || 'project'}.zip`;
    res.writeHead(200, {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': archiveBuffer.length,
    });
    res.end(archiveBuffer);
  } catch (err: any) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message || 'Download failed' }));
  }
}

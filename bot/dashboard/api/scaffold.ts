import http from 'node:http';
import path from 'path';
import { executeScaffold } from '../../../src/commands/create/scaffold.js';
import { BotDatabase } from '../../src/db/index.js';

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

      const targetDir = path.resolve(process.cwd(), 'scaffolds', projectName);

      await executeScaffold(
        type,
        projectName,
        { PROJECT_NAME: projectName, AUTHOR: 'HELIX Dashboard', DESCRIPTION: 'Scaffolded via HELIX Dashboard' },
        {
          template: templateId,
          skipInstall: true,
          skipGit: true,
          dryRun,
        }
      );

      // Log in SQLite scaffold_history
      BotDatabase.getInstance().logScaffold({
        userId: 'dashboard-user',
        templateId,
        projectName,
      });

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        type,
        templateId,
        projectName,
        targetDir,
        dryRun,
      }));
    } catch (err: any) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message || 'Scaffolding failed' }));
    }
  });
}

# Template: Subcommand / Subcommand Group

**Target**: `src/bot/commands/<category>/<command>.ts`  
**Compliance**: Rule 06 (Discord.js Standards) — Subcommands colocated in command file.

```ts
import type { AppDeps } from '../../../app.js';
import type { DiscordRestClient } from '../../rest.js';
import {
  ApplicationCommandOptionType,
  type ApplicationCommand,
  type DiscordInteraction,
  type InteractionOption,
  type InteractionResponse,
} from '../../utils/types.js';
import { EmbedHandler } from '../../lib/embeds/builder.js';
import { type BotCommand } from '../../handlers/registry.js';

export const manageCommandDef: ApplicationCommand = {
  name: 'manage',
  description: 'Manage server configuration and resources',
  options: [
    {
      name: 'user',
      description: 'Manage a specific server member',
      type: ApplicationCommandOptionType.SUB_COMMAND,
      options: [
        {
          name: 'target',
          description: 'The target member',
          type: ApplicationCommandOptionType.USER,
          required: true,
        },
      ],
    },
    {
      name: 'role',
      description: 'Manage server roles',
      type: ApplicationCommandOptionType.SUB_COMMAND,
      options: [
        {
          name: 'target',
          description: 'The target role',
          type: ApplicationCommandOptionType.ROLE,
          required: true,
        },
      ],
    },
  ],
};

export async function handleManageCommand(
  interaction: DiscordInteraction,
  deps: AppDeps,
  _rest: DiscordRestClient,
): Promise<InteractionResponse> {
  const options = interaction.data?.options as InteractionOption[] | undefined;
  const subCommand = options?.[0]?.name;

  switch (subCommand) {
    case 'user': {
      const targetUser = options?.[0]?.options?.find((o) => o.name === 'target')?.value;
      return EmbedHandler.for(deps)
        .primary()
        .title('User Managed', '👤')
        .description(`Target: <@${targetUser}>`)
        .respond();
    }
    case 'role': {
      const targetRole = options?.[0]?.options?.find((o) => o.name === 'target')?.value;
      return EmbedHandler.for(deps)
        .primary()
        .title('Role Managed', '🛡️')
        .description(`Target: <@&${targetRole}>`)
        .respond();
    }
    default:
      return EmbedHandler.for(deps)
        .error()
        .title('Unknown Subcommand')
        .description('Please specify a valid subcommand.')
        .respond(true);
  }
}

export const manageCommand: BotCommand = {
  def: manageCommandDef,
  category: 'admin',
  isEnabled: (deps) => Boolean(deps.config.features.administrationEnabled),
  execute: handleManageCommand,
};
```

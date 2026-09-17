# Template: Self-Contained Slash Command

**Target**: `src/bot/commands/<category>/<command>.ts`  
**Compliance**: Rule 06 (Discord.js Standards) — Colocated definitions, options, and handlers.

```ts
import type { AppDeps } from '../../../app.js';
import type { DiscordRestClient } from '../../rest.js';
import {
  ApplicationCommandOptionType,
  type ApplicationCommand,
  type ApplicationCommandOption,
  type DiscordInteraction,
  type InteractionOption,
  type InteractionResponse,
} from '../../utils/types.js';
import { EmbedHandler } from '../../lib/embeds/builder.js';
import { type BotCommand } from '../../handlers/registry.js';

// Colocated options
export const exampleOptions: ApplicationCommandOption[] = [
  {
    name: 'action',
    description: 'Operation to perform',
    type: ApplicationCommandOptionType.STRING,
    required: true,
    choices: [
      { name: 'View status', value: 'view' },
      { name: 'Reset settings', value: 'reset' },
    ],
  },
  {
    name: 'query',
    description: 'Search query or parameter',
    type: ApplicationCommandOptionType.STRING,
    required: false,
  },
];

// Colocated command definition
export const exampleCommandDef: ApplicationCommand = {
  name: 'example',
  description: 'Example command description (max 100 characters)',
  options: exampleOptions,
};

// Colocated execution handler
export async function handleExampleCommand(
  interaction: DiscordInteraction,
  deps: AppDeps,
  _rest: DiscordRestClient,
): Promise<InteractionResponse> {
  const guildId = interaction.guild_id;
  if (!guildId) {
    return EmbedHandler.for(deps)
      .error()
      .title('Server Only')
      .description('This command can only be used inside a Discord server.')
      .respond(true);
  }

  const options = interaction.data?.options as InteractionOption[] | undefined;
  const action = options?.find((o) => o.name === 'action')?.value as string | undefined;

  return EmbedHandler.for(deps)
    .primary()
    .title('Example Executed', '⚡')
    .description(`Action performed: **${action ?? 'default'}**`)
    .respond();
}

// Unified BotCommand export for dynamic registration
export const exampleCommand: BotCommand = {
  def: exampleCommandDef,
  category: 'utility',
  isEnabled: (deps) => true,
  execute: handleExampleCommand,
  metadata: {
    name: 'example',
    description: 'Example command description',
    category: 'utility',
    emoji: '⚡',
    usage: '/example <action> [query]',
    options: exampleOptions,
    examples: ['/example action:view'],
  },
};
```

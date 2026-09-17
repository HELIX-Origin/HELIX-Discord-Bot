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
import type { BotCommand } from '../../handlers/registry.js';

export const loopOptions: ApplicationCommandOption[] = [
  {
    name: 'mode',
    description: 'Loop mode',
    type: ApplicationCommandOptionType.STRING,
    required: true,
    choices: [
      { name: 'Off', value: 'none' },
      { name: 'Track', value: 'track' },
      { name: 'Queue', value: 'queue' },
    ],
  },
];

export const loopCommandDef: ApplicationCommand = {
  name: 'loop',
  description: 'Set loop mode',
  options: loopOptions,
};

export async function handleLoopCommand(
  interaction: DiscordInteraction,
  deps: AppDeps,
  _rest: DiscordRestClient,
): Promise<InteractionResponse> {
  const guildId = interaction.guild_id;
  if (!guildId) {
    return EmbedHandler.for(deps)
      .error()
      .title('Server Only')
      .description('Music commands can only be used in a server.')
      .respond(true);
  }
  if (!deps.config.features.lavaEnabled) {
    return EmbedHandler.for(deps)
      .error()
      .title('Music Disabled')
      .description('Music features are disabled.')
      .respond(true);
  }
  const manager = deps.lavaManager ?? null;
  if (!manager || !manager.isConnected()) {
    return EmbedHandler.for(deps)
      .error()
      .title('Not Connected')
      .description('Not connected to the Lavalink server.')
      .respond(true);
  }

  const options = interaction.data?.options as InteractionOption[] | undefined;
  const mode = options?.find((o) => o.name === 'mode')?.value as 'none' | 'track' | 'queue';
  await manager.setLoop(guildId, mode);
  return EmbedHandler.for(deps)
    .primary()
    .title('Loop Mode', '🔁')
    .description(`Loop mode set to **${mode}**.`)
    .respond();
}

export const loopCommand: BotCommand = {
  def: loopCommandDef,
  category: 'music',
  isEnabled: (deps) => Boolean(deps.config.features.lavaEnabled),
  execute: handleLoopCommand,
};

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
import { ensurePlayer } from '../../lib/music/utils.js';
import { EmbedHandler } from '../../lib/embeds/builder.js';
import type { BotCommand } from '../../handlers/registry.js';

export const equalizerOptions: ApplicationCommandOption[] = [
  {
    name: 'preset',
    description: 'Equalizer preset',
    type: ApplicationCommandOptionType.STRING,
    required: true,
    choices: [
      { name: 'Flat', value: 'flat' },
      { name: 'Bass Boost', value: 'bassboost' },
      { name: 'Pop', value: 'pop' },
      { name: 'Rock', value: 'rock' },
      { name: 'Electronic', value: 'electronic' },
      { name: 'Classical', value: 'classical' },
      { name: 'Hip Hop', value: 'hiphop' },
      { name: 'Jazz', value: 'jazz' },
      { name: 'Custom', value: 'custom' },
    ],
  },
];

export const equalizerCommandDef: ApplicationCommand = {
  name: 'equalizer',
  description: 'Set equalizer preset',
  options: equalizerOptions,
};

const EQUALIZER_PRESETS: Record<string, unknown[]> = {
  flat: [],
  bassboost: [{ band: 0, gain: 0.6 }],
  pop: [
    { band: 0, gain: -0.25 },
    { band: 1, gain: 0.5 },
    { band: 2, gain: -0.25 },
  ],
  rock: [
    { band: 0, gain: 0.5 },
    { band: 1, gain: 0.25 },
    { band: 12, gain: -0.5 },
  ],
  electronic: [
    { band: 0, gain: 0.5 },
    { band: 1, gain: 0.5 },
    { band: 2, gain: 0.25 },
  ],
  classical: [
    { band: 0, gain: 0.25 },
    { band: 1, gain: 0.25 },
    { band: 2, gain: 0.25 },
  ],
  hiphop: [
    { band: 0, gain: 0.75 },
    { band: 1, gain: 0.25 },
  ],
  jazz: [
    { band: 0, gain: 0.5 },
    { band: 1, gain: 0.25 },
    { band: 2, gain: 0.5 },
  ],
  custom: [],
};

export async function handleEqualizerCommand(
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

  const error = await ensurePlayer(interaction, deps, manager);
  if (error) {
    return EmbedHandler.for(deps).error().title('Voice Channel Required').description(error).respond(true);
  }

  const player = await manager.getPlayer(guildId);
  if (!player) {
    return EmbedHandler.for(deps).error().title('No Player').description('No active music player.').respond(true);
  }

  const options = interaction.data?.options as InteractionOption[] | undefined;
  const preset = options?.find((o) => o.name === 'preset')?.value as string;
  if (!EQUALIZER_PRESETS[preset]) {
    return EmbedHandler.for(deps)
      .error()
      .title('Invalid Preset')
      .description('Invalid equalizer preset selected.')
      .respond(true);
  }

  await manager.setFilter(guildId, { equalizer: { bands: EQUALIZER_PRESETS[preset] } });
  return EmbedHandler.for(deps)
    .primary()
    .title('Equalizer Updated', '🎛️')
    .description(`Equalizer set to **${preset}**.`)
    .respond();
}

export const equalizerCommand: BotCommand = {
  def: equalizerCommandDef,
  category: 'music',
  isEnabled: (deps) => Boolean(deps.config.features.lavaEnabled),
  execute: handleEqualizerCommand,
};

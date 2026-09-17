import type { AppDeps } from '../../../app.js';
import type { DiscordRestClient } from '../../rest.js';
import {
  ApplicationCommandOptionType,
  type ApplicationCommand,
  type DiscordInteraction,
  type InteractionOption,
  type InteractionResponse,
} from '../../utils/types.js';
import { KlipyClient } from '../../utils/klipy.js';
import { EmbedHandler } from '../../lib/embeds/builder.js';
import type { BotCommand } from '../../handlers/registry.js';

export const gifCommandDef: ApplicationCommand = {
  name: 'gif',
  description: 'Get a random GIF or search by tag',
  options: [
    {
      name: 'tag',
      description: 'GIF tag to search for (optional - omitting returns a random GIF)',
      type: ApplicationCommandOptionType.STRING,
      required: false,
    },
  ],
};

export async function handleGifCommand(
  interaction: DiscordInteraction,
  deps: AppDeps,
  _rest: DiscordRestClient,
): Promise<InteractionResponse> {
  const options = interaction.data?.options as InteractionOption[] | undefined;
  const tag = options?.find((o) => o.name === 'tag')?.value as string | undefined;

  if (!deps.config.klipyApiKey) {
    return EmbedHandler.for(deps)
      .error()
      .title('GIF Feature Disabled')
      .description('GIF feature is not configured. Set KLIPY_API_KEY in .env.')
      .respond(true);
  }

  const client = new KlipyClient(deps.config.klipyApiKey, console);
  const gifUrl = await (tag ? client.getCategoryGif(tag) : client.getRandomGif());

  if (!gifUrl) {
    return EmbedHandler.for(deps).error().title('Failed to Fetch GIF').description('Please try again.').respond(true);
  }

  const tagLabel = tag ? ` (${tag})` : '';
  return EmbedHandler.for(deps)
    .primary()
    .title(`Here's your GIF${tagLabel}!`)
    .image(gifUrl)
    .footer('Powered by KLIPY')
    .respond();
}

export const gifCommand: BotCommand = {
  def: gifCommandDef,
  category: 'entertainment',
  isEnabled: (deps) => Boolean(deps.config.features.gifsEnabled && deps.config.klipyApiKey),
  execute: handleGifCommand,
  metadata: {
    name: 'gif',
    description: 'Get a random GIF or search by tag',
    category: 'entertainment',
    emoji: '🎉',
    usage: '/gif [tag]',
    options: gifCommandDef.options,
    examples: ['/gif', '/gif tag:dance'],
  },
};

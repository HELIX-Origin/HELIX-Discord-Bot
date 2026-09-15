import type { AppDeps } from '../../../app.js';
import type { DiscordRestClient } from '../../rest.js';
import {
  ApplicationCommandOptionType,
  InteractionResponseType,
  type ApplicationCommand,
  type DiscordInteraction,
  type InteractionOption,
  type InteractionResponse,
} from '../../utils/types.js';
import { KlipyClient } from '../../utils/klipy.js';
import { commandHelpResponse } from '../../utils/embeds.js';

export const gifCommandDef: ApplicationCommand = {
  name: 'gif',
  description:
    'Get a random GIF or filter by category (anime, jojo, waifu, slap, gintama, doggo, cat, hug, kiss, pat, bonk, cuddle, tickle, pet, poke, baka, smug, cry, angry, meme)',
  options: [
    {
      name: 'category',
      description:
        'GIF category (optional - omitting returns a random GIF). Popular: anime, jojo, waifu, slap, gintama, doggo, cat, hug, kiss, pat, bonk, cuddle, tickle, pet, poke, baka, smug, cry, angry, meme',
      type: ApplicationCommandOptionType.STRING,
      required: false,
    },
  ],
};

async function getGifUrl(category?: string, deps?: AppDeps): Promise<string | null> {
  if (!deps?.config.klipyApiKey) return null;
  const client = new KlipyClient(deps.config.klipyApiKey, console);
  if (category) return client.getCategoryGif(category);
  return client.getRandomGif();
}

export async function handleGifCommand(
  interaction: DiscordInteraction,
  deps: AppDeps,
  _rest: DiscordRestClient,
): Promise<InteractionResponse> {
  const options = interaction.data?.options as InteractionOption[] | undefined;
  const category = options?.find((o) => o.name === 'category')?.value as string | undefined;

  if (!deps.config.klipyApiKey) {
    return commandHelpResponse({
      name: 'gif',
      description: 'Get a random GIF or filter by category',
      subcommands: [],
      usage: '[category]',
      examples: ['/gif', '/gif anime', '/gif slap'],
    });
  }

  const gifUrl = await getGifUrl(category, deps);
  if (!gifUrl) {
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        flags: 64,
        content: '❌ Failed to fetch GIF. Please try again.',
      },
    };
  }

  const categoryLabel = category ? ` (${category})` : '';
  return {
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      content: `Here's your GIF${categoryLabel}!`,
      embeds: [
        {
          image: { url: gifUrl },
          color: 0x06b6d4,
          footer: { text: 'Powered by KLIPY' },
        },
      ],
    },
  };
}

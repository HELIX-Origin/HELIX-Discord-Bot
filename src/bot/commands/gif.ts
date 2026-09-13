import type { AppDeps } from '../../app.js';
import type { DiscordRestClient } from '../rest.js';
import {
  ApplicationCommandOptionType,
  InteractionResponseType,
  type ApplicationCommand,
  type DiscordInteraction,
  type InteractionOption,
  type InteractionResponse,
} from '../types.js';
import { KlipyClient } from '../klipy.js';

const klipyClient = new KlipyClient('', { warn: () => {}, error: () => {} });

export const gifCommandDef: ApplicationCommand = {
  name: 'gif',
  description: 'Get a random GIF or filter by popular category',
  options: [
    {
      name: 'category',
      description: 'GIF category (optional - omitting returns a random GIF)',
      type: ApplicationCommandOptionType.STRING,
      required: false,
      autocomplete: true,
      choices: klipyClient
        .getPopularTags()
        .map((tag) => ({ name: tag.charAt(0).toUpperCase() + tag.slice(1), value: tag })),
    },
  ],
};

const ACTION_COMMANDS = [
  { name: 'slap', description: 'Slap someone with a GIF' },
  { name: 'hug', description: 'Hug someone with a GIF' },
  { name: 'kiss', description: 'Kiss someone with a GIF' },
  { name: 'pat', description: 'Pat someone with a GIF' },
  { name: 'bonk', description: 'Bonk someone with a GIF' },
  { name: 'cuddle', description: 'Cuddle with someone via GIF' },
  { name: 'tickle', description: 'Tickle someone with a GIF' },
  { name: 'pet', description: 'Pet someone with a GIF' },
  { name: 'poke', description: 'Poke someone with a GIF' },
  { name: 'baka', description: 'Call someone baka with a GIF' },
  { name: 'smug', description: 'Send a smug GIF' },
  { name: 'cry', description: 'Send a crying GIF' },
  { name: 'angry', description: 'Send an angry GIF' },
  { name: 'meme', description: 'Send a meme GIF' },
  { name: 'blush', description: 'Send a blushing GIF' },
  { name: 'bite', description: 'Send a biting GIF' },
  { name: 'highfive', description: 'Send a high-five GIF' },
  { name: 'kill', description: 'Send a kill GIF' },
  { name: 'lick', description: 'Send a licking GIF' },
  { name: 'nom', description: 'Send a nom GIF' },
  { name: 'peck', description: 'Send a peck GIF' },
  { name: 'punch', description: 'Send a punch GIF' },
  { name: 'wave', description: 'Send a wave GIF' },
  { name: 'wink', description: 'Send a wink GIF' },
  { name: 'yeet', description: 'Send a yeet GIF' },
];

export const actionCommandDefs: ApplicationCommand[] = ACTION_COMMANDS.map((cmd) => ({
  name: cmd.name,
  description: cmd.description,
  options: [
    {
      name: 'user',
      description: 'User to target (optional)',
      type: ApplicationCommandOptionType.USER,
      required: false,
    },
  ],
}));

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

  const gifUrl = await getGifUrl(category, deps);
  if (!gifUrl) {
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        flags: 64,
        content: '❌ GIF feature is not configured. Please set `KLIPY_API_KEY` in your environment.',
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

export async function handleActionCommand(
  interaction: DiscordInteraction,
  deps: AppDeps,
  action: string,
): Promise<InteractionResponse> {
  const options = interaction.data?.options as InteractionOption[] | undefined;
  const target = options?.find((o) => o.name === 'user')?.value as string | undefined;

  const gifUrl = await getGifUrl(action, deps);
  if (!gifUrl) {
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        flags: 64,
        content: '❌ GIF feature is not configured. Please set `KLIPY_API_KEY` in your environment.',
      },
    };
  }

  const mention = target ? `<@${target}>` : '';
  return {
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      content: `${mention ? `${mention}, ` : ''}Here's a **${action}** GIF!`,
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

export async function handleGifAutocomplete(
  interaction: DiscordInteraction,
  deps: AppDeps,
): Promise<InteractionResponse> {
  if (!deps.config.klipyApiKey) {
    return {
      type: InteractionResponseType.APPLICATION_COMMAND_AUTOCOMPLETE_RESULT,
      data: { choices: [] },
    };
  }
  const value = (interaction.data?.options?.[0]?.value as string | undefined)?.toLowerCase() ?? '';
  const client = new KlipyClient(deps.config.klipyApiKey, console);
  const tags = client.getPopularTags().filter((t) => t.startsWith(value));
  const choices = tags.slice(0, 25).map((t) => ({ name: t.charAt(0).toUpperCase() + t.slice(1), value: t }));
  return {
    type: InteractionResponseType.APPLICATION_COMMAND_AUTOCOMPLETE_RESULT,
    data: { choices },
  };
}

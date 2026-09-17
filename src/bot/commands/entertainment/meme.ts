import type { AppDeps } from '../../../app.js';
import type { DiscordRestClient } from '../../rest.js';
import { type ApplicationCommand, type DiscordInteraction, type InteractionResponse } from '../../utils/types.js';
import { KlipyClient } from '../../utils/klipy.js';
import { EmbedHandler } from '../../lib/embeds/builder.js';
import type { BotCommand } from '../../handlers/registry.js';

export const memeCommandDef: ApplicationCommand = {
  name: 'meme',
  description: 'Get a random meme GIF',
  options: [
    {
      name: 'user',
      description: 'Optional target user',
      type: 6,
      required: false,
    },
  ],
};

export async function handlememeCommand(
  interaction: DiscordInteraction,
  deps: AppDeps,
  _rest: DiscordRestClient,
): Promise<InteractionResponse> {
  if (!deps.config.klipyApiKey) {
    return EmbedHandler.for(deps)
      .error()
      .title('GIF Feature Disabled')
      .description('GIF feature is not configured. Set KLIPY_API_KEY in .env.')
      .respond(true);
  }
  const client = new KlipyClient(deps.config.klipyApiKey, console);
  const gifUrl = await client.getCategoryGif('meme');
  if (!gifUrl) {
    return EmbedHandler.for(deps).error().title('Failed to Fetch GIF').description('Please try again.').respond(true);
  }

  const targetId = interaction.data?.options?.find((o) => o.name === 'user')?.value as string | undefined;
  const actor = interaction.member?.user ?? interaction.user;
  const description = targetId ? `<@${actor?.id ?? 'someone'}> meme <@${targetId}>!` : '*meme*';

  return EmbedHandler.for(deps)
    .primary()
    .title('Meme!', '🎭')
    .description(description)
    .image(gifUrl)
    .footer('Powered by KLIPY')
    .respond();
}

export const memeCommand: BotCommand = {
  def: memeCommandDef,
  category: 'entertainment',
  isEnabled: (deps) => Boolean(deps.config.features.gifsEnabled && deps.config.klipyApiKey),
  execute: handlememeCommand,
};

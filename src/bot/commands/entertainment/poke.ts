import type { AppDeps } from '../../../app.js';
import type { DiscordRestClient } from '../../rest.js';
import { type ApplicationCommand, type DiscordInteraction, type InteractionResponse } from '../../utils/types.js';
import { KlipyClient } from '../../utils/klipy.js';
import { EmbedHandler } from '../../lib/embeds/builder.js';
import type { BotCommand } from '../../handlers/registry.js';

export const pokeCommandDef: ApplicationCommand = {
  name: 'poke',
  description: 'Poke someone with a GIF',
  options: [
    {
      name: 'user',
      description: 'Optional target user',
      type: 6,
      required: false,
    },
  ],
};

export async function handlepokeCommand(
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
  const gifUrl = await client.getCategoryGif('poke');
  if (!gifUrl) {
    return EmbedHandler.for(deps).error().title('Failed to Fetch GIF').description('Please try again.').respond(true);
  }

  const targetId = interaction.data?.options?.find((o) => o.name === 'user')?.value as string | undefined;
  const actor = interaction.member?.user ?? interaction.user;
  const description = targetId ? `<@${actor?.id ?? 'someone'}> poked <@${targetId}>!` : '*poked*';

  return EmbedHandler.for(deps)
    .primary()
    .title('Poke!', '👉')
    .description(description)
    .image(gifUrl)
    .footer('Powered by KLIPY')
    .respond();
}

export const pokeCommand: BotCommand = {
  def: pokeCommandDef,
  category: 'entertainment',
  isEnabled: (deps) => Boolean(deps.config.features.gifsEnabled && deps.config.klipyApiKey),
  execute: handlepokeCommand,
};

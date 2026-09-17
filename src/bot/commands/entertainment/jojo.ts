import type { AppDeps } from '../../../app.js';
import type { DiscordRestClient } from '../../rest.js';
import { type ApplicationCommand, type DiscordInteraction, type InteractionResponse } from '../../utils/types.js';
import { KlipyClient } from '../../utils/klipy.js';
import { EmbedHandler } from '../../lib/embeds/builder.js';
import type { BotCommand } from '../../handlers/registry.js';

export const jojoCommandDef: ApplicationCommand = {
  name: 'jojo',
  description: 'Get a JoJo GIF',
  options: [],
};

export async function handleJojoCommand(
  _interaction: DiscordInteraction,
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
  const gifUrl = await client.getCategoryGif('jojo');
  if (!gifUrl) {
    return EmbedHandler.for(deps).error().title('Failed to Fetch GIF').description('Please try again.').respond(true);
  }
  return EmbedHandler.for(deps)
    .primary()
    .title('JoJo!', '⭐')
    .description('*MENACING*')
    .image(gifUrl)
    .footer('Powered by KLIPY')
    .respond();
}

export const jojoCommand: BotCommand = {
  def: jojoCommandDef,
  category: 'entertainment',
  isEnabled: (deps) => Boolean(deps.config.features.gifsEnabled && deps.config.klipyApiKey),
  execute: handleJojoCommand,
};

import { InteractionResponseType, type DiscordEmbed, type InteractionResponse } from '../../utils/types.js';

export const EPHEMERAL = 64;
export const CHANNEL_MESSAGE_WITH_SOURCE = InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE;

export function embedResponse(embed: DiscordEmbed, ephemeral = false): InteractionResponse {
  const data: NonNullable<InteractionResponse['data']> = { embeds: [embed] };
  if (ephemeral) data.flags = EPHEMERAL;
  return { type: CHANNEL_MESSAGE_WITH_SOURCE, data };
}

export function embedMessage(embed: DiscordEmbed): { embeds: DiscordEmbed[] } {
  return { embeds: [embed] };
}

export function ephemeralContent(content: string): InteractionResponse {
  return { type: CHANNEL_MESSAGE_WITH_SOURCE, data: { flags: EPHEMERAL, content } };
}

export function publicContent(content: string): InteractionResponse {
  return { type: CHANNEL_MESSAGE_WITH_SOURCE, data: { content } };
}

export function errorContent(content: string): InteractionResponse {
  return ephemeralContent(content);
}

export function errorEmbedResponse(title: string, description: string, ephemeral = true): InteractionResponse {
  return embedResponse({ title: `❌ ${title}`, description, color: 0xef4444 }, ephemeral);
}

export function successContent(content: string): InteractionResponse {
  return publicContent(content);
}

export function successEmbedResponse(title: string, description?: string): InteractionResponse {
  return embedResponse({ title: `✅ ${title}`, description, color: 0x10b981 });
}

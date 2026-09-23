/**
 * Discord API v10 types for Gateway, REST, and Interactions.
 */

const InteractionType = {
  PING: 1,
  APPLICATION_COMMAND: 2,
  MESSAGE_COMPONENT: 3,
  APPLICATION_COMMAND_AUTOCOMPLETE: 4,
  MODAL_SUBMIT: 5,
} as const;

type InteractionType = (typeof InteractionType)[keyof typeof InteractionType];

export const InteractionResponseType = {
  PONG: 1,
  CHANNEL_MESSAGE_WITH_SOURCE: 4,
  DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE: 5,
  DEFERRED_UPDATE_MESSAGE: 6,
  UPDATE_MESSAGE: 7,
  APPLICATION_COMMAND_AUTOCOMPLETE_RESULT: 8,
  MODAL: 9,
} as const;

export type InteractionResponseType = (typeof InteractionResponseType)[keyof typeof InteractionResponseType];

export const ApplicationCommandOptionType = {
  SUB_COMMAND: 1,
  SUB_COMMAND_GROUP: 2,
  STRING: 3,
  INTEGER: 4,
  BOOLEAN: 5,
  USER: 6,
  CHANNEL: 7,
  ROLE: 8,
  MENTIONABLE: 9,
  NUMBER: 10,
  ATTACHMENT: 11,
} as const;

export type ApplicationCommandOptionType =
  (typeof ApplicationCommandOptionType)[keyof typeof ApplicationCommandOptionType];

interface ApplicationCommandOptionChoice {
  name: string;
  value: string | number;
}

export interface ApplicationCommandOption {
  type: ApplicationCommandOptionType;
  name: string;
  description: string;
  required?: boolean;
  autocomplete?: boolean;
  choices?: ApplicationCommandOptionChoice[];
  options?: ApplicationCommandOption[];
  channel_types?: number[];
  min_value?: number;
  max_value?: number;
  min_length?: number;
  max_length?: number;
}

export interface ApplicationCommand {
  name: string;
  description: string;
  options?: ApplicationCommandOption[];
  default_member_permissions?: string;
  dm_permission?: boolean;
}

export interface DiscordEmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

export interface DiscordEmbed {
  title?: string;
  description?: string;
  url?: string;
  timestamp?: string;
  color?: number;
  footer?: { text: string; icon_url?: string };
  image?: { url: string };
  thumbnail?: { url: string };
  author?: { name: string; url?: string; icon_url?: string };
  fields?: DiscordEmbedField[];
}

interface InteractionResponseData {
  tts?: boolean;
  content?: string;
  embeds?: DiscordEmbed[];
  flags?: number; // 64 = EPHEMERAL
  choices?: ApplicationCommandOptionChoice[];
  components?: unknown[];
}

export interface InteractionResponse {
  type: InteractionResponseType;
  data?: InteractionResponseData;
}

export interface InteractionOption {
  name: string;
  type: ApplicationCommandOptionType;
  value?: string | number | boolean;
  focused?: boolean;
  options?: InteractionOption[];
}

interface InteractionData {
  id?: string;
  name?: string;
  type?: number;
  options?: InteractionOption[];
  guild_id?: string;
  /** Present on message component (type 3) interactions. */
  custom_id?: string;
  component_type?: number;
}

export interface DiscordGuild {
  id: string;
  name: string;
  icon: string | null;
  owner?: boolean;
  permissions?: string;
  features?: string[];
  approximate_member_count?: number;
  approximate_presence_count?: number;
}

export interface DiscordInteraction {
  id: string;
  application_id: string;
  type: InteractionType;
  data?: InteractionData;
  guild_id?: string;
  guild_name?: string;
  channel_id?: string;
  member?: {
    user: { id: string; username: string; global_name?: string; avatar?: string | null };
    permissions: string;
  };
  user?: {
    id: string;
    username: string;
    global_name?: string;
    avatar?: string | null;
  };
  token: string;
  version: number;
}

import {
  Events,
  type Client,
  type Interaction,
  type Guild,
  type GuildMember,
  type Channel,
  type Role,
  type VoiceState,
  type ChatInputCommandInteraction,
  type AutocompleteInteraction,
  type CommandInteractionOption,
} from 'discord.js';
import type { DiscordBot } from '../bot.js';
import type { AppDeps } from '../../app.js';
import type { DiscordInteraction, InteractionOption, ApplicationCommandOptionType } from '../utils/types.js';
import { dispatchInteraction } from './commands.js';
import { handleReady } from '../events/ready.js';
import { handleGuildCreate } from '../events/guild-create.js';
import { handleGuildMemberAdd } from '../events/member.js';
import { handleChannelCreate, handleChannelDelete, handleChannelUpdate } from '../events/channel.js';
import { handleRoleCreate, handleRoleDelete, handleRoleUpdate } from '../events/role.js';
import { handleVoiceStateUpdate } from '../events/voice-state.js';

/**
 * Recursively transforms discord.js CommandInteractionOptions into raw Discord API InteractionOptions.
 */
export function transformOptions(options?: readonly CommandInteractionOption[]): InteractionOption[] | undefined {
  if (!options || options.length === 0) return undefined;
  return options.map((opt) => {
    const item: InteractionOption = {
      name: opt.name,
      type: opt.type as unknown as ApplicationCommandOptionType,
    };
    const val = opt.value ?? opt.user?.id ?? opt.channel?.id ?? opt.role?.id;
    if (val !== undefined) {
      item.value = val as string | number | boolean;
    }
    if ((opt as { focused?: boolean }).focused !== undefined) {
      item.focused = (opt as { focused?: boolean }).focused;
    }
    if (opt.options && opt.options.length > 0) {
      item.options = transformOptions(opt.options);
    }
    return item;
  });
}

/**
 * Converts a discord.js ChatInputCommandInteraction or AutocompleteInteraction
 * into the standardized DiscordInteraction structure expected by commands and EmbedHandler.
 */
export function toDiscordInteraction(
  interaction: ChatInputCommandInteraction | AutocompleteInteraction,
): DiscordInteraction {
  const member = interaction.member
    ? {
        user: {
          id: interaction.user.id,
          username: interaction.user.username,
          global_name: interaction.user.globalName ?? undefined,
          avatar: interaction.user.avatar,
        },
        permissions: interaction.memberPermissions?.bitfield.toString() ?? '0',
      }
    : undefined;

  const user = {
    id: interaction.user.id,
    username: interaction.user.username,
    global_name: interaction.user.globalName ?? undefined,
    avatar: interaction.user.avatar,
  };

  const options = transformOptions(interaction.options?.data);

  return {
    id: interaction.id,
    application_id: interaction.applicationId,
    type: interaction.isAutocomplete() ? 4 : 2,
    guild_id: interaction.guildId ?? undefined,
    channel_id: interaction.channelId ?? undefined,
    member,
    user,
    token: interaction.token,
    version: interaction.version ?? 1,
    data: {
      id: interaction.commandId,
      name: interaction.commandName,
      type: 1, // CHAT_INPUT
      options,
      guild_id: interaction.guildId ?? undefined,
    },
  };
}

export function registerBotEvents(client: Client, bot: DiscordBot, deps: AppDeps): void {
  // Client ready
  client.on(Events.ClientReady, () => {
    void handleReady(bot, deps);
  });

  // Slash commands and interaction dispatch
  client.on(Events.InteractionCreate, async (interaction: Interaction) => {
    if (!interaction.isChatInputCommand() && !interaction.isAutocomplete()) return;

    if (interaction.isAutocomplete()) {
      try {
        const discordInteraction = toDiscordInteraction(interaction);
        const response = await dispatchInteraction(discordInteraction, deps, bot.rest);
        if (response.data?.choices) {
          await interaction.respond(response.data.choices as { name: string; value: string | number }[]);
        }
      } catch (err) {
        bot.logger.error('Error handling autocomplete interaction', { err: (err as Error).message });
      }
      return;
    }

    const commandName = interaction.commandName;
    bot.logger.debug('Received slash command interaction', {
      command: commandName,
      guildId: interaction.guildId,
      user: interaction.user?.username,
    });

    try {
      const discordInteraction = toDiscordInteraction(interaction);
      const response = await dispatchInteraction(discordInteraction, deps, bot.rest);
      const data = (response as unknown as { data?: Record<string, unknown> }).data ?? {};
      const replyPayload = {
        ...data,
        ephemeral: (data as { flags?: number }).flags === 64,
      };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(replyPayload);
      } else {
        await interaction.reply(replyPayload);
      }
    } catch (err) {
      bot.logger.error('Error dispatching slash command interaction', {
        err: (err as Error).message,
        command: commandName,
      });

      try {
        const errorData = {
          ephemeral: true,
          content: `❌ An unexpected error occurred: ${(err as Error).message}`,
        };
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(errorData);
        } else {
          await interaction.reply(errorData);
        }
      } catch {
        /* ignore fallback failure */
      }
    }
  });

  // Guild join & leave
  client.on(Events.GuildCreate, (guild: Guild) => {
    void handleGuildCreate(guild, bot, deps);
  });

  client.on(Events.GuildDelete, (guild: Guild) => {
    void bot.handleGuildDelete(guild);
  });

  // Member events (welcome messages)
  client.on(Events.GuildMemberAdd, (member: GuildMember) => {
    void handleGuildMemberAdd(member, bot, deps);
  });

  // Channel events
  client.on(Events.ChannelCreate, (channel: Channel) => {
    void handleChannelCreate(channel, bot, deps);
  });

  client.on(Events.ChannelDelete, (channel: Channel) => {
    void handleChannelDelete(channel.id, bot, deps);
  });

  client.on(Events.ChannelUpdate, (oldChannel: Channel, newChannel: Channel) => {
    void handleChannelUpdate(oldChannel, newChannel, bot, deps);
  });

  // Role events
  client.on(Events.GuildRoleCreate, (role: Role) => {
    void handleRoleCreate(role, bot, deps);
  });

  client.on(Events.GuildRoleDelete, (role: Role) => {
    void handleRoleDelete(role.id, bot, deps);
  });

  client.on(Events.GuildRoleUpdate, (oldRole: Role, newRole: Role) => {
    void handleRoleUpdate(oldRole, newRole, bot, deps);
  });

  // Voice state events
  client.on(Events.VoiceStateUpdate, (oldState: VoiceState, newState: VoiceState) => {
    void handleVoiceStateUpdate(oldState, newState, bot, deps);
  });
}

import {
  Events,
  type Client,
  type Interaction,
  type Guild,
  type GuildMember,
  type Channel,
  type Role,
  type VoiceState,
} from 'discord.js';
import type { DiscordBot } from '../bot.js';
import type { AppDeps } from '../../app.js';
import type { DiscordInteraction } from '../utils/types.js';
import { dispatchInteraction } from './commands.js';
import { handleReady } from '../events/ready.js';
import { handleGuildCreate } from '../events/guild-create.js';
import { handleGuildMemberAdd } from '../events/member.js';
import { handleChannelCreate, handleChannelDelete, handleChannelUpdate } from '../events/channel.js';
import { handleRoleCreate, handleRoleDelete, handleRoleUpdate } from '../events/role.js';
import { handleVoiceStateUpdate } from '../events/voice-state.js';

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
        const response = await dispatchInteraction(interaction as unknown as DiscordInteraction, deps, bot.rest);
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
      const response = await dispatchInteraction(interaction as unknown as DiscordInteraction, deps, bot.rest);
      const data = (response as unknown as { data?: unknown }).data ?? {};
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(data);
      } else {
        await interaction.reply(data);
      }
    } catch (err) {
      bot.logger.error('Error dispatching slash command interaction', {
        err: (err as Error).message,
        command: commandName,
      });

      try {
        const errorData = {
          flags: 64,
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

  // Voice state events (Lavalink audio gateway)
  client.on(Events.VoiceStateUpdate, (oldState: VoiceState, newState: VoiceState) => {
    void handleVoiceStateUpdate(oldState, newState, bot, deps);
  });

  client.on(Events.VoiceServerUpdate, (data: { token: string; guildId: string; endpoint?: string | null }) => {
    deps.lavaManager?.handleVoiceServerUpdate({
      token: data.token,
      guild_id: data.guildId,
      endpoint: data.endpoint ?? undefined,
    });
  });
}

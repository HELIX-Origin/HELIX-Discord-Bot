import { FileToGenerate } from '../file-generator.js';

export function generateDiscordBotFiles(
  projectName: string,
  variables: Record<string, string>
): FileToGenerate[] {
  const token = variables.DISCORD_TOKEN || 'your_bot_token_here';
  const clientId = variables.CLIENT_ID || 'your_client_id_here';
  const guildId = variables.GUILD_ID || 'your_guild_id_here';

  return [
    {
      relativePath: 'package.json',
      content: JSON.stringify(
        {
          name: projectName,
          version: '0.1.0',
          type: 'module',
          scripts: {
            build: 'tsc',
            start: 'node dist/index.js',
            dev: 'tsx watch src/index.ts',
            deploy: 'tsx src/deploy-commands.ts',
          },
          dependencies: {
            'discord.js': '^14.15.3',
            dotenv: '^16.4.5',
          },
          devDependencies: {
            '@types/node': '^20.14.0',
            tsx: '^4.15.0',
            typescript: '^5.4.5',
          },
        },
        null,
        2
      ) + '\n',
    },
    {
      relativePath: 'tsconfig.json',
      content: JSON.stringify(
        {
          compilerOptions: {
            target: 'ES2022',
            module: 'NodeNext',
            moduleResolution: 'NodeNext',
            outDir: './dist',
            rootDir: './src',
            strict: true,
            esModuleInterop: true,
            skipLibCheck: true,
            forceConsistentCasingInFileNames: true,
          },
          include: ['src/**/*'],
        },
        null,
        2
      ) + '\n',
    },
    {
      relativePath: 'src/index.ts',
      content: `import { Client, GatewayIntentBits, Events, Collection } from 'discord.js';
import dotenv from 'dotenv';
import { pingCommand } from './commands/ping.js';
import { infoCommand } from './commands/info.js';

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
  ],
});

const commands = new Collection<string, any>();
commands.set(pingCommand.data.name, pingCommand);
commands.set(infoCommand.data.name, infoCommand);

client.once(Events.ClientReady, (readyClient) => {
  console.log(\`Ready! Logged in as \${readyClient.user.tag}\`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
  }
});

client.login(process.env.DISCORD_TOKEN);
`,
    },
    {
      relativePath: 'src/deploy-commands.ts',
      content: `import { REST, Routes } from 'discord.js';
import dotenv from 'dotenv';
import { pingCommand } from './commands/ping.js';
import { infoCommand } from './commands/info.js';

dotenv.config();

const commands = [
  pingCommand.data.toJSON(),
  infoCommand.data.toJSON(),
];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN!);

(async () => {
  try {
    console.log(\`Started refreshing \${commands.length} application (/) commands.\`);

    if (process.env.GUILD_ID) {
      await rest.put(
        Routes.applicationGuildCommands(process.env.CLIENT_ID!, process.env.GUILD_ID),
        { body: commands }
      );
      console.log('Successfully reloaded application guild (/) commands.');
    } else {
      await rest.put(
        Routes.applicationCommands(process.env.CLIENT_ID!),
        { body: commands }
      );
      console.log('Successfully reloaded application global (/) commands.');
    }
  } catch (error) {
    console.error(error);
  }
})();
`,
    },
    {
      relativePath: 'src/commands/ping.ts',
      content: `import { SlashCommandBuilder, CommandInteraction } from 'discord.js';

export const pingCommand = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Replies with Pong and latency!'),
  async execute(interaction: CommandInteraction) {
    const sent = await interaction.reply({ content: 'Pinging...', fetchReply: true });
    const latency = sent.createdTimestamp - interaction.createdTimestamp;
    await interaction.editReply(\`Pong! Latency is \${latency}ms.\`);
  },
};
`,
    },
    {
      relativePath: 'src/commands/info.ts',
      content: `import { SlashCommandBuilder, CommandInteraction } from 'discord.js';

export const infoCommand = {
  data: new SlashCommandBuilder()
    .setName('info')
    .setDescription('Provides information about the bot'),
  async execute(interaction: CommandInteraction) {
    await interaction.reply(\`Bot created with HELIX CLI!\`);
  },
};
`,
    },
    {
      relativePath: '.env',
      content: `DISCORD_TOKEN=${token}
CLIENT_ID=${clientId}
GUILD_ID=${guildId}
`,
    },
  ];
}

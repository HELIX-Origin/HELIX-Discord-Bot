# Discord Bot Agent

This agent provides conventions, architecture, and command references for building scalable Discord bots using **discord.js** and **TypeScript**.

## Architecture & Structure

```
discord-bot/
├── src/
│   ├── index.ts              # Client instantiation & gateway connection
│   ├── deploy-commands.ts    # REST API slash command registration script
│   ├── commands/             # Slash command definitions
│   │   ├── ping.ts
│   │   └── info.ts
│   ├── events/               # Gateway event handlers
│   │   ├── ready.ts
│   │   └── interactionCreate.ts
│   ├── lib/                  # Shared utilities and helpers
│   │   ├── client.ts         # Custom ExtendedClient class
│   │   └── logger.ts         # Structured console/file logging
│   └── types/                # Custom TypeScript declarations
│       └── command.d.ts
├── .env                      # Local secrets (DISCORD_TOKEN, CLIENT_ID, GUILD_ID)
├── .env.example              # Secret template
├── package.json              # Project manifests & scripts
├── tsconfig.json             # TypeScript compiler config
└── README.md                 # Project documentation
```

## Setup & Scaffolding Commands

```bash
# Create project via HELIX CLI
helix create discord-bot my-discord-bot --template discord-bot

# Install dependencies manually
npm install discord.js dotenv
npm install -D typescript @types/node tsx nodemon

# Register slash commands with Discord API
npm run deploy

# Start development in watch mode
npm run dev

# Build for production
npm run build
npm start
```

## Key Architectural Patterns

### 1. Slash Command Registration (`deploy-commands.ts`)
Slash commands must be deployed via Discord's REST API (`@discordjs/rest`) using `Routes.applicationGuildCommands` for immediate development testing or `Routes.applicationCommands` for global publishing.

### 2. Client Event Handling
Use strongly typed event listeners. Ensure `GatewayIntentBits` are explicitly requested (e.g. `Guilds`, `GuildMessages`, `MessageContent` for prefix commands).

### 3. Sharding & Scalability
For bots serving thousands of guilds, configure `ShardingManager` in `src/sharder.ts` to distribute gateway connections across worker threads or separate Node processes.

## Required Environment Variables

```env
DISCORD_TOKEN=your_bot_token_here
CLIENT_ID=your_application_id_here
GUILD_ID=your_development_guild_id_here
```
# Template: Self-Contained Slash Command

**Target**: `src/bot/commands/<category>/<command>.ts`
**Compliance**: Rule 06 §3. A command file carries **commands only** — anything
reusable belongs in `src/bot/lib/` (see Rule 06 §3.1).

```ts
import type { AppDeps } from '../../../app.js';
import type { DiscordRestClient } from '../../rest.js';
import { PermissionFlagsBits } from 'discord.js';
import {
  ApplicationCommandOptionType,
  type ApplicationCommand,
  type ApplicationCommandOption,
  type DiscordInteraction,
  type InteractionOption,
  type InteractionResponse,
} from '../../utils/types.js';
import { EmbedHandler } from '../../lib/embeds/builder.js';
import { registerCommandMetadata, type BotCommand } from '../../handlers/registry.js';

// ── Colocated options ────────────────────────────────────────────────
// Required options MUST be listed before optional ones (Rule 06 §1.3).
// Never combine `autocomplete: true` with `choices`.
const exampleOptions: ApplicationCommandOption[] = [
  {
    name: 'action',
    description: 'Operation to perform',
    type: ApplicationCommandOptionType.STRING,
    required: true,
    choices: [
      { name: 'View status', value: 'view' },
      { name: 'Reset settings', value: 'reset' },
    ],
  },
  {
    name: 'query',
    description: 'Search query or parameter',
    type: ApplicationCommandOptionType.STRING,
    required: false,
    max_length: 200,
  },
];

// ── Colocated definition ─────────────────────────────────────────────
// `default_member_permissions` is a bitfield serialized as a string.
// Do NOT use `dm_permission` — deprecated (Rule 06 §1.5).
export const exampleCommandDef: ApplicationCommand = {
  name: 'example',
  description: 'Example command description (max 100 characters)',
  default_member_permissions: PermissionFlagsBits.ManageGuild.toString(),
  options: exampleOptions,
};

// ── Colocated handler ────────────────────────────────────────────────
export async function handleExampleCommand(
  interaction: DiscordInteraction,
  deps: AppDeps,
  _rest: DiscordRestClient,
): Promise<InteractionResponse> {
  // Guild-only guard (Rule 06 §3.2.2)
  const guildId = interaction.guild_id;
  if (!guildId) {
    return EmbedHandler.for(deps)
      .error()
      .title('Server Only')
      .description('This command can only be used inside a Discord server.')
      .respond(true);
  }

  const options: InteractionOption[] = interaction.data?.options ?? [];
  const action = options.find((o) => o.name === 'action')?.value;

  return EmbedHandler.for(deps)
    .primary()
    .title('Example Executed', '⚡')
    .description(`Action performed: **${action ?? 'default'}**`)
    .respond();
}

// ── Registrable unit ─────────────────────────────────────────────────
// This is what `loader.ts` discovers. Private helpers may live in this
// file, but must NOT be exported unless they are part of the command.
export const exampleCommand: BotCommand = {
  def: exampleCommandDef,
  category: 'utility',
  execute: handleExampleCommand,
  aliases: ['ex'],
};

// ── Help / dashboard metadata ────────────────────────────────────────
registerCommandMetadata({
  name: 'example',
  description: 'Example command description',
  category: 'utility',
  emoji: '⚡',
  usage: '/example <action> [query]',
  examples: ['/example action:view'],
});
```

## Category values

`BotCommand.category` is a closed union in `src/bot/handlers/registry.ts`:
`'admin' | 'mod' | 'utility'` (plus `'feeds'`, retained in the type for the
dashboard's grouping but holding no registrable command — see Rule 06 §2.6).
Directory name and category must match.

## Checklist

- [ ] File exports the command and its parts, **and nothing reusable**
- [ ] `name` matches `^[a-z0-9_-]{1,32}$`; `description` ≤100 chars
- [ ] ≤25 options; required before optional; option names unique
- [ ] ≤25 choices per option; no `autocomplete` + `choices` together
- [ ] `default_member_permissions` set via `PermissionFlagsBits`, no `dm_permission`
- [ ] `if (!interaction.guild_id)` guard when guild-scoped
- [ ] Every response via `EmbedHandler.for(deps).respond(...)`, no magic numbers
- [ ] Privileged mutations dispatched to the audit log
- [ ] Private helpers unexported

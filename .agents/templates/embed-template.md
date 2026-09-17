# Embed Handler Template

Standard Embed Handler utility pattern for HELIX Discord Bot.
Enforces Discord API limits and consistent visual styling:
- Title: <= 256 characters
- Description: <= 4096 characters
- Field name: <= 256 characters
- Field value: <= 1024 characters
- Footer text: <= 2048 characters
- Max fields: <= 25
- Total characters: <= 6000

```typescript
import { EmbedBuilder, Colors } from 'discord.js';

export class EmbedHandler {
  public static truncate(text: string, maxLength: number): string {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.slice(0, Math.max(0, maxLength - 3)) + '...';
  }

  public static success(title: string, description?: string): EmbedBuilder {
    const embed = new EmbedBuilder()
      .setColor(Colors.Green)
      .setTitle(this.truncate(title, 256))
      .setTimestamp();
    if (description) {
      embed.setDescription(this.truncate(description, 4096));
    }
    return embed;
  }

  public static error(title: string, description?: string): EmbedBuilder {
    const embed = new EmbedBuilder()
      .setColor(Colors.Red)
      .setTitle(this.truncate(title, 256))
      .setTimestamp();
    if (description) {
      embed.setDescription(this.truncate(description, 4096));
    }
    return embed;
  }

  public static warning(title: string, description?: string): EmbedBuilder {
    const embed = new EmbedBuilder()
      .setColor(Colors.Gold)
      .setTitle(this.truncate(title, 256))
      .setTimestamp();
    if (description) {
      embed.setDescription(this.truncate(description, 4096));
    }
    return embed;
  }

  public static info(title: string, description?: string): EmbedBuilder {
    const embed = new EmbedBuilder()
      .setColor(Colors.Blue)
      .setTitle(this.truncate(title, 256))
      .setTimestamp();
    if (description) {
      embed.setDescription(this.truncate(description, 4096));
    }
    return embed;
  }

  public static clampFields(
    embed: EmbedBuilder,
    fields: Array<{ name: string; value: string; inline?: boolean }>
  ): EmbedBuilder {
    const safeFields = fields.slice(0, 25).map((field) => ({
      name: this.truncate(field.name, 256) || '\u200B',
      value: this.truncate(field.value, 1024) || '\u200B',
      inline: field.inline ?? false,
    }));
    return embed.addFields(safeFields);
  }
}
```

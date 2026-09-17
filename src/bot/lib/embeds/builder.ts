import type { AppDeps } from '../../../app.js';
import { appBranding, brandAuthor, type AppBranding } from '../../utils/embeds.js';
import { type DiscordEmbed, type DiscordEmbedField, type InteractionResponse } from '../../utils/types.js';
import { clampText, EMBED_LIMITS, TEXT_LIMITS } from './limits.js';
import { variantStyle, type EmbedVariant } from './variants.js';
import { embedResponse } from './responses.js';

export class EmbedHandler {
  private readonly branding: AppBranding | null;
  private variantName: EmbedVariant = 'primary';
  private customEmoji: string | boolean | null | undefined;
  private embedTitle: string | null = null;
  private embedDescription: string | null = null;
  private embedFields: DiscordEmbedField[] = [];
  private embedThumbnail: string | null = null;
  private embedImage: string | null = null;
  private embedUrl: string | null = null;
  private embedAuthor: { name: string; icon_url?: string } | null = null;
  private embedFooterSuffix: string | null = null;
  private rawFooterText: string | null = null;
  private embedColor: number | null = null;
  private embedTimestamp: string | null = null;
  private includeTimestamp = true;
  private showAuthor = true;

  constructor(branding: AppBranding | null = null) {
    this.branding = branding;
  }

  static for(deps: AppDeps): EmbedHandler {
    return new EmbedHandler(appBranding(deps));
  }

  variant(name: EmbedVariant): this {
    this.variantName = name;
    return this;
  }
  primary(): this {
    return this.variant('primary');
  }
  success(): this {
    return this.variant('success');
  }
  error(): this {
    return this.variant('error');
  }
  warning(): this {
    return this.variant('warning');
  }
  info(): this {
    return this.variant('info');
  }

  title(text: string, emoji?: string | false): this {
    this.embedTitle = clampText(text, TEXT_LIMITS.title);
    this.customEmoji = emoji;
    return this;
  }
  description(text: string | null | undefined, max: number = TEXT_LIMITS.description): this {
    this.embedDescription = text ? clampText(text, max) : null;
    return this;
  }
  field(name: string, value: string, inline = true, max: number = TEXT_LIMITS.fieldValue): this {
    if (this.embedFields.length >= EMBED_LIMITS.fields) return this;
    this.embedFields.push({
      name: clampText(name, TEXT_LIMITS.fieldName),
      value: clampText(value, max),
      inline,
    });
    return this;
  }
  fields(specs: ReadonlyArray<{ name: string; value: string; inline?: boolean }>): this {
    for (const spec of specs) this.field(spec.name, spec.value, spec.inline ?? true);
    return this;
  }
  section(name: string, value: string): this {
    return this.field(name, value, false);
  }
  thumbnail(url: string | null | undefined): this {
    this.embedThumbnail = url ?? null;
    return this;
  }
  image(url: string | null | undefined): this {
    this.embedImage = url ?? null;
    return this;
  }
  url(link: string | null | undefined): this {
    this.embedUrl = link ?? null;
    return this;
  }
  author(name: string, iconUrl?: string | null): this {
    this.embedAuthor = iconUrl
      ? { name: clampText(name, EMBED_LIMITS.authorName), icon_url: iconUrl }
      : { name: clampText(name, EMBED_LIMITS.authorName) };
    return this;
  }
  footer(suffix: string): this {
    this.embedFooterSuffix = clampText(suffix, TEXT_LIMITS.footerSuffix);
    return this;
  }
  rawFooter(text: string): this {
    this.rawFooterText = clampText(text, EMBED_LIMITS.footer);
    return this;
  }
  color(hex: number): this {
    this.embedColor = hex;
    return this;
  }
  timestamp(iso?: string): this {
    this.embedTimestamp = iso ?? new Date().toISOString();
    return this;
  }
  withoutTimestamp(): this {
    this.includeTimestamp = false;
    return this;
  }
  withoutAuthor(): this {
    this.showAuthor = false;
    return this;
  }

  build(): DiscordEmbed {
    const style = variantStyle(this.variantName);
    const emoji = this.customEmoji === undefined ? style.emoji : this.customEmoji;
    const title = this.embedTitle ? [emoji, this.embedTitle].filter(Boolean).join(' ') : undefined;

    const embed: DiscordEmbed = { color: this.embedColor ?? style.color };

    if (title) embed.title = title;
    if (this.embedDescription) embed.description = this.embedDescription;
    if (this.embedFields.length > 0) embed.fields = this.embedFields;
    if (this.embedThumbnail) embed.thumbnail = { url: this.embedThumbnail };
    if (this.embedImage) embed.image = { url: this.embedImage };
    if (this.embedUrl) embed.url = this.embedUrl;

    const branding = this.branding;
    if (branding && this.showAuthor) embed.author = this.embedAuthor ?? brandAuthor(branding);
    else if (this.embedAuthor) embed.author = this.embedAuthor;

    if (this.rawFooterText) {
      embed.footer = { text: this.rawFooterText };
    } else {
      const appName = branding?.appName ?? null;
      const text = appName
        ? this.embedFooterSuffix
          ? `${appName} • ${this.embedFooterSuffix}`
          : appName
        : this.embedFooterSuffix;
      if (text) embed.footer = { text, icon_url: branding?.iconUrl ?? undefined };
    }

    if (this.includeTimestamp) embed.timestamp = this.embedTimestamp ?? new Date().toISOString();

    return embed;
  }

  respond(ephemeral = false): InteractionResponse {
    return embedResponse(this.build(), ephemeral);
  }

  message(): { embeds: DiscordEmbed[] } {
    return { embeds: [this.build()] };
  }
}

export { embedResponse, embedMessage } from './responses.js';
export { EMBED_LIMITS, TEXT_LIMITS, clampText } from './limits.js';
export { EMBED_VARIANTS, variantStyle, type EmbedVariant, type EmbedVariantStyle } from './variants.js';

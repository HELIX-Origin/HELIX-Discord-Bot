import { EMBED_COLORS } from '../../utils/embeds.js';

export type EmbedVariant = 'primary' | 'success' | 'error' | 'warning' | 'info';

export interface EmbedVariantStyle {
  readonly color: number;
  readonly emoji: string;
}

export const EMBED_VARIANTS: Record<EmbedVariant, EmbedVariantStyle> = {
  primary: { color: EMBED_COLORS.PRIMARY, emoji: '' },
  success: { color: EMBED_COLORS.SUCCESS, emoji: '✅' },
  error: { color: EMBED_COLORS.ERROR, emoji: '❌' },
  warning: { color: EMBED_COLORS.WARNING, emoji: '⚠️' },
  info: { color: EMBED_COLORS.INFO, emoji: 'ℹ️' },
};

export function variantStyle(variant: EmbedVariant): EmbedVariantStyle {
  return EMBED_VARIANTS[variant];
}

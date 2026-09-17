export const EMBED_LIMITS = {
  title: 256,
  description: 4096,
  fieldName: 256,
  fieldValue: 1024,
  fields: 25,
  footer: 2048,
  authorName: 256,
} as const;

export const TEXT_LIMITS = {
  title: 120,
  description: 350,
  fieldName: 80,
  fieldValue: 256,
  footerSuffix: 200,
} as const;

export function clampText(text: string, max: number): string {
  const normalized = text
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  if (normalized.length <= max) return normalized;
  const slice = normalized.slice(0, max);
  const boundary = slice.lastIndexOf(' ');
  const cutoff = boundary > max * 0.6 ? boundary : max;
  return `${slice.slice(0, cutoff).trimEnd()}…`;
}
